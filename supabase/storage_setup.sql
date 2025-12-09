-- ==============================================================================
-- 1. 创建 Buckets
-- ==============================================================================

-- 1.1 创建 'raw_uploads' (存储用户上传的临时图片)
-- 该 Bucket 设置 public: false (私有)，必须通过 Signed URL 或 RLS 访问
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('raw_uploads', 'raw_uploads', false, 52428800, '{"image/*"}') 
on conflict (id) do nothing;

-- 1.2 创建 'generated_results' (存储 AI 生成的结果图)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('generated_results', 'generated_results', false, 52428800, '{"image/*"}')
on conflict (id) do nothing;


-- ==============================================================================
-- 2. 设置 Security Policies (RLS)
-- ==============================================================================

-- 2.1 raw_uploads 策略
-- 允许认证用户上传自己的文件
create policy "Users can upload their own images" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'raw_uploads' and auth.uid()::text = (storage.foldername(name))[1] );

-- 允许认证用户查看自己的文件
create policy "Users can view their own images" 
on storage.objects for select 
to authenticated 
using ( bucket_id = 'raw_uploads' and auth.uid()::text = (storage.foldername(name))[1] );

-- 2.2 generated_results 策略
-- 仅允许 Service Role (后端) 上传 (Dashboard设置即可，SQL默认 Service Role 有全权)
-- 允许认证用户读取结果图 (为了安全，我们也可以限制 owner，但这里暂设为 Authenticated 可读)
create policy "Authenticated users can view generated results"
on storage.objects for select
to authenticated
using ( bucket_id = 'generated_results' );

-- ==============================================================================
-- 3. （可选）设置生命周期 Lifecycle (需 Supabase Pro 或手动 cron)
-- Supabase 免费版暂不支持 SQL 直接配置 Lifecycle，建议在 Dashboard -> Storage -> Settings 开启 "Expiration"
-- ==============================================================================
