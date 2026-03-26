create extension if not exists pgcrypto;

create table if not exists public.app_requests (
    id uuid primary key default gen_random_uuid(),
    external_id text not null unique default ('REQ-' || lpad(((random() * 90000)::int + 10000)::text, 5, '0')),
    requestor_name text not null,
    requestor_email text not null,
    requestor_id text not null default '',
    request_type text not null check (request_type in ('Access', 'Issue', 'Information', 'Change', 'Other')),
    source_channel text not null check (source_channel in ('Email', 'Portal', 'Chat')),
    priority text not null check (priority in ('Low', 'Medium', 'High')),
    status text not null default 'Draft' check (status in ('Draft', 'Reviewed', 'Approved', 'Finalized')),
    raw_description text not null,
    ai_notes jsonb,
    tags text[] not null default '{}',
    due_date date not null,
    follow_ups jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_app_requests_status on public.app_requests (status);
create index if not exists idx_app_requests_due_date on public.app_requests (due_date);
create index if not exists idx_app_requests_created_at on public.app_requests (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_touch_updated_at on public.app_requests;
create trigger trg_touch_updated_at
before update on public.app_requests
for each row
execute function public.touch_updated_at();

create or replace function public.toggle_follow_up(request_id uuid, follow_up_id uuid)
returns boolean
language plpgsql
as $$
declare
    updated_rows integer;
begin
    update public.app_requests r
    set follow_ups = (
        select jsonb_agg(
            case
                when item->>'id' = follow_up_id::text then
                    jsonb_set(
                        jsonb_set(item, '{completed}', to_jsonb(not coalesce((item->>'completed')::boolean, false))),
                        '{completedAt}',
                        case
                            when coalesce((item->>'completed')::boolean, false)
                                then 'null'::jsonb
                            else to_jsonb(timezone('utc'::text, now()))
                        end
                    )
                else item
            end
        )
        from jsonb_array_elements(r.follow_ups) as item
    )
    where r.id = request_id;

    get diagnostics updated_rows = row_count;
    return updated_rows > 0;
end;
$$;

alter table public.app_requests enable row level security;

drop policy if exists "allow authenticated read" on public.app_requests;
create policy "allow authenticated read"
on public.app_requests
for select
to authenticated
using (true);

drop policy if exists "allow service role full access" on public.app_requests;
create policy "allow service role full access"
on public.app_requests
for all
to service_role
using (true)
with check (true);
