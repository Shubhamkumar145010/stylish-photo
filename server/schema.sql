-- PostgreSQL-oriented MVP schema.
-- Store only verification outcomes, never identity documents or raw provider payloads.
create extension if not exists pgcrypto;

create table app_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  city_area text,
  photo_url text,
  account_role text not null default 'user' check (account_role in ('user','provider','moderator','admin')),
  created_at timestamptz not null default now()
);

create table auth_accounts (
  user_id uuid primary key references app_users(id) on delete cascade,
  email text unique,
  phone_e164 text unique,
  password_hash text,
  last_authenticated_at timestamptz,
  created_at timestamptz not null default now(),
  check (email is not null or phone_e164 is not null)
);

create table verification_status (
  user_id uuid primary key references app_users(id) on delete cascade,
  phone_verified boolean not null default false,
  email_verified boolean not null default false,
  identity_verified boolean not null default false,
  age_verified boolean not null default false,
  provider_verified boolean not null default false,
  verification_provider_reference uuid,
  updated_at timestamptz not null default now()
);

create table professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references app_users(id) on delete cascade,
  category text not null,
  description text not null,
  service_area text not null,
  experience_years smallint,
  availability text,
  pricing_summary text,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references app_users(id) on delete cascade,
  recipient_id uuid not null references app_users(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references app_users(id) on delete cascade,
  subject_user_id uuid not null references app_users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table moderation_audit_events (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references app_users(id) on delete cascade,
  report_id uuid references moderation_reports(id) on delete set null,
  action text not null check (action in ('reviewed','resolved','dismissed','suspended')),
  created_at timestamptz not null default now()
);

create table user_blocks (
  blocker_id uuid not null references app_users(id),
  blocked_id uuid not null references app_users(id),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references app_users(id) on delete cascade,
  recipient_id uuid not null references app_users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index messages_participants_idx on messages(sender_id, recipient_id, created_at);
create index moderation_reports_status_idx on moderation_reports(status, created_at);
create index moderation_audit_events_report_idx on moderation_audit_events(report_id, created_at);
create unique index connection_requests_pair_idx on connection_requests(sender_id, recipient_id);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  plan text not null check (plan in ('pro_profile','local_shop')),
  provider_customer_reference text,
  provider_subscription_reference text unique,
  status text not null default 'pending' check (status in ('pending','active','past_due','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
