/**
 * GET /api/generations - 查询用户的生成记录
 * 用途：
 * 1. 网络错误后恢复 - 查询最近的生成记录 (?since=<timestamp>)
 * 2. 云端历史同步 - 获取用户所有生成记录 (?limit=50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// 强制动态渲染 (使用了 cookies)
export const dynamic = 'force-dynamic';

// 获取 Supabase Admin 客户端 (用于生成 Signed URL)
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

export async function GET(request: NextRequest) {
    try {
        // 1. 验证用户身份
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. 解析查询参数
        const { searchParams } = new URL(request.url);
        const sinceParam = searchParams.get('since'); // ISO timestamp or Unix ms
        const limitParam = searchParams.get('limit');

        const limit = Math.min(parseInt(limitParam || '10', 10), 100); // Max 100 records

        // 3. 构建查询
        let query = supabase
            .from('generations')
            .select('id, result_image_url, original_image_url, app_mode, generation_params, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        // 如果指定了 since 参数，只返回该时间之后的记录 (用于恢复)
        if (sinceParam) {
            // 支持 ISO 字符串或 Unix 毫秒时间戳
            const sinceDate = isNaN(Number(sinceParam))
                ? new Date(sinceParam)
                : new Date(parseInt(sinceParam, 10));

            if (!isNaN(sinceDate.getTime())) {
                query = query.gt('created_at', sinceDate.toISOString());
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching generations:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch generations' },
                { status: 500 }
            );
        }

        // 4. 处理图片 URL：为过期的 Signed URL 重新生成
        // 关键修复：同时处理 original_image_url 和 result_image_url
        const adminSupabase = getSupabaseAdmin();
        const processedData = await Promise.all(
            (data || []).map(async (record: any) => {
                let originalImageUrl = record.original_image_url;
                let resultImageUrl = record.result_image_url;

                // ========== 处理 original_image_url (原图) ==========
                // 检查是否是 storage path (格式: raw_uploads/userId/filename.jpg)
                // 或者是旧的已过期 Signed URL (格式: https://xxx.supabase.co/storage/v1/object/sign/raw_uploads/xxx?token=...)
                if (originalImageUrl) {
                    let storagePath: string | null = null;

                    // Case 1: 新格式 - 直接存储的 storage path
                    if (originalImageUrl.startsWith('raw_uploads/')) {
                        storagePath = originalImageUrl.replace('raw_uploads/', '');
                    }
                    // Case 2: 旧格式 - 已过期的 Signed URL，需要提取 path
                    else if (originalImageUrl.includes('/storage/v1/object/sign/raw_uploads/')) {
                        try {
                            const url = new URL(originalImageUrl);
                            const match = url.pathname.match(/\/raw_uploads\/(.+)$/);
                            if (match) {
                                storagePath = match[1];
                            }
                        } catch {
                            // URL 解析失败，保持为 null
                        }
                    }

                    // 如果成功提取到 storage path，生成新的 Signed URL
                    if (storagePath) {
                        try {
                            // 生成新的 Signed URL (有效期 7 天)
                            const { data: signedData, error: signedError } = await adminSupabase.storage
                                .from('raw_uploads')
                                .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

                            if (signedData?.signedUrl && !signedError) {
                                originalImageUrl = signedData.signedUrl;
                            } else {
                                console.warn(`Failed to generate signed URL for raw_uploads path ${storagePath}:`, signedError);
                                originalImageUrl = null;
                            }
                        } catch (err) {
                            console.error('Error generating signed URL for original:', err);
                            originalImageUrl = null;
                        }
                    } else if (originalImageUrl.includes('supabase.co/storage')) {
                        // 如果是 Supabase URL 但无法解析 path，说明格式异常，返回 null
                        console.warn(`Could not parse storage path from original: ${originalImageUrl}`);
                        originalImageUrl = null;
                    }
                    // 其他情况（如外部 URL 或 null）保持不变
                }

                // ========== 处理 result_image_url (AI 生成图) ==========
                // 关键：result_image_url 也是 24 小时有效的 Signed URL，需要刷新！
                // 格式: https://xxx.supabase.co/storage/v1/object/sign/generated_results/{userId}/{timestamp}_result.jpg?token=...
                if (resultImageUrl && resultImageUrl.includes('/storage/v1/object/sign/generated_results/')) {
                    try {
                        const url = new URL(resultImageUrl);
                        // 提取 path: generated_results/{userId}/{filename}
                        const match = url.pathname.match(/\/generated_results\/(.+)$/);
                        if (match) {
                            const storagePath = match[1];
                            // 生成新的 Signed URL (有效期 7 天)
                            const { data: signedData, error: signedError } = await adminSupabase.storage
                                .from('generated_results')
                                .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

                            if (signedData?.signedUrl && !signedError) {
                                resultImageUrl = signedData.signedUrl;
                                console.log(`[Sync] Refreshed result_image_url for record ${record.id}`);
                            } else {
                                console.warn(`Failed to generate signed URL for generated_results path ${storagePath}:`, signedError);
                                // 保留原 URL，即使过期也比 null 好
                            }
                        }
                    } catch (err) {
                        console.error('Error generating signed URL for result:', err);
                        // 保留原 URL
                    }
                }

                return {
                    ...record,
                    original_image_url: originalImageUrl,
                    result_image_url: resultImageUrl,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: processedData,
            count: processedData.length,
        });
    } catch (error) {
        console.error('Generations API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
