-- Graph storage schema for Wikipedia Knowledge Subway

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  summary text not null default '',
  cluster text,
  x double precision not null default 0,
  y double precision not null default 0,
  degree integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  source uuid not null references public.articles(id) on delete cascade,
  target uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint links_source_target_unique unique (source, target),
  constraint links_no_self_reference check (source <> target)
);

create index if not exists idx_articles_title on public.articles(title);
create index if not exists idx_links_source on public.links(source);
create index if not exists idx_links_target on public.links(target);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();
