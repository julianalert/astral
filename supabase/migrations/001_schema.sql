-- ── Profiles (extends auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  onboarding_completed boolean default false,
  subscription_status text default 'trial' check (subscription_status in ('trial', 'active', 'cancelled', 'expired')),
  subscription_tier text,
  trial_ends_at timestamptz default (now() + interval '3 days'),
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- ── Natal Charts ────────────────────────────────────────────────────────────
create table if not exists public.natal_charts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  birth_date date not null,
  birth_time time,
  birth_location text,
  birth_lat decimal(9,6),
  birth_lng decimal(9,6),
  birth_timezone text,
  chart_data jsonb,
  chart_summary text,
  created_at timestamptz default now(),
  unique (user_id)
);

-- ── Conversations ───────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text,
  relationship_profile_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Messages ────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  transit_context jsonb,
  created_at timestamptz default now()
);

-- ── Memories ────────────────────────────────────────────────────────────────
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  category text check (category in ('life_event', 'relationship', 'theme', 'trait')),
  source_conversation_id uuid references public.conversations on delete set null,
  created_at timestamptz default now()
);

-- ── Relationship Profiles ───────────────────────────────────────────────────
create table if not exists public.relationship_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  birth_date date,
  birth_time time,
  birth_location text,
  chart_data jsonb,
  created_at timestamptz default now()
);

-- ── Daily Briefings ─────────────────────────────────────────────────────────
create table if not exists public.daily_briefings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  content text,
  transits_used jsonb,
  read_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.natal_charts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.relationship_profiles enable row level security;
alter table public.daily_briefings enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Natal charts
create policy "Users can manage own charts" on public.natal_charts using (auth.uid() = user_id);

-- Conversations
create policy "Users can manage own conversations" on public.conversations using (auth.uid() = user_id);

-- Messages (through conversation ownership)
create policy "Users can manage messages in own conversations" on public.messages
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- Memories
create policy "Users can manage own memories" on public.memories using (auth.uid() = user_id);

-- Relationship profiles
create policy "Users can manage own relationships" on public.relationship_profiles using (auth.uid() = user_id);

-- Daily briefings
create policy "Users can manage own briefings" on public.daily_briefings using (auth.uid() = user_id);

-- ── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Update conversations.updated_at on new message ─────────────────────────
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.update_conversation_timestamp();
