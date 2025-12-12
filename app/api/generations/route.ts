/**
 * GET /api/generations - 查询用户的生成记录
 * 用途：
 * 1. 网络错误后恢复 - 查询最近的生成记录 (?since=<timestamp>)
 * 2. 云端历史同步 - 获取用户所有生成记录 (?limit=50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

        return NextResponse.json({
            success: true,
            data: data || [],
            count: data?.length || 0,
        });
    } catch (error) {
        console.error('Generations API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
