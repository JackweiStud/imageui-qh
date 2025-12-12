-- ==============================================================================
-- Generations Table - 记录每次 AI 图片生成的元数据
-- 用途：网络错误恢复、跨设备历史同步
-- ==============================================================================

-- 创建 generations 表
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  
  -- 结果图 URL (Signed URL 或 Storage Path)
  result_image_url text not null,
  
  -- 原图 URL (可选，用于 history 恢复)
  original_image_url text,
  
  -- 生成参数 (JSONB 存储灵活结构)
  app_mode text not null,
  generation_params jsonb default '{}'::jsonb,
  
  -- 时间戳
  created_at timestamptz default now()
);

-- 启用 RLS
alter table public.generations enable row level security;

-- 用户只能查看自己的生成记录
drop policy if exists "Users can view own generations" on public.generations;
create policy "Users can view own generations"
  on public.generations for select
  using ( auth.uid() = user_id );

-- 后端 Service Role 可以插入记录 (不需要额外策略，Service Role 绕过 RLS)

-- 创建索引加速查询
create index if not exists generations_user_created_idx 
  on public.generations(user_id, created_at desc);
