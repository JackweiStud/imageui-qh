-- 1. Create the profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  credits int default 35
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create policies (Allow users to read their own data)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- 4. Create a trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 35);
  return new;
end;
$$ language plpgsql security definer;

-- 5. Attach the trigger to the auth.users table
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Backfill existing users (Run this ONLY if you have existing users)
insert into public.profiles (id, email, credits)
select id, email, 35 from auth.users
on conflict (id) do nothing;

-- 7. Atomic Credit Deduction Function (RPC)
-- Solves concurrency race conditions
create or replace function deduct_credits(
  user_id uuid,
  amount int
) returns void as $$
begin
  update public.profiles
  set credits = credits - amount
  where id = user_id and credits >= amount;
end;
$$ language plpgsql security definer;
