-- Phase 87 — Scalable public opportunity search (server-side filtering + pagination)
-- كل الدوال تقرأ حصراً من العرضين المنقّحين public_jobs / public_shifts.

create or replace function public.search_public_jobs(
  _q text default null,
  _country text default null,
  _city text default null,
  _specialty_id uuid default null,
  _specialty_ids uuid[] default null,
  _type text default null,
  _pref_specialty_id uuid default null,
  _pref_country text default null,
  _sort text default 'new',
  _exclude_ids uuid[] default null,
  _limit integer default 20,
  _offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  specialty_id uuid,
  specialty_name_ar text,
  specialty_name_en text,
  employment_type public.employment_type,
  country text,
  city text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  min_experience integer,
  required_license text,
  created_at timestamptz,
  expires_at timestamptz,
  is_featured boolean,
  facility_verified boolean,
  applications_count integer,
  vacancies integer,
  facility_id uuid,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      nullif(btrim(coalesce(_q, '')), '') as q,
      least(greatest(coalesce(_limit, 20), 1), 50) as lim,
      greatest(coalesce(_offset, 0), 0) as off
  ),
  base as (
    select j.*
    from public.public_jobs j, params p
    where (_country is null or j.country = _country)
      and (_city is null or j.city = _city)
      and (_specialty_id is null or j.specialty_id = _specialty_id)
      and (_specialty_ids is null or j.specialty_id = any(_specialty_ids))
      and (_type is null or j.employment_type::text = _type)
      and (_exclude_ids is null or not (j.id = any(_exclude_ids)))
      and (
        p.q is null
        or j.title ilike '%' || left(p.q, 80) || '%'
        or j.city ilike '%' || left(p.q, 80) || '%'
        or j.country ilike '%' || left(p.q, 80) || '%'
        or coalesce(j.specialty_name_ar, '') ilike '%' || left(p.q, 80) || '%'
        or coalesce(j.specialty_name_en, '') ilike '%' || left(p.q, 80) || '%'
      )
  ),
  scored as (
    select b.*,
      (case when _pref_specialty_id is not null and b.specialty_id = _pref_specialty_id then 2 else 0 end)
      + (case when _pref_country is not null and b.country = _pref_country then 1 else 0 end) as score,
      count(*) over () as total_count
    from base b
  )
  select s.id, s.slug, s.title, s.description, s.specialty_id, s.specialty_name_ar, s.specialty_name_en,
         s.employment_type, s.country, s.city, s.salary_min, s.salary_max, s.currency, s.min_experience,
         s.required_license, s.created_at, s.expires_at, s.is_featured, s.facility_verified,
         s.applications_count, s.vacancies, s.facility_id, s.total_count
  from scored s, params p
  order by
    case when _sort = 'match' then s.score else 0 end desc,
    s.created_at desc,
    s.id
  limit (select lim from params) offset (select off from params);
$$;

create or replace function public.search_public_shifts(
  _q text default null,
  _country text default null,
  _city text default null,
  _specialty_id uuid default null,
  _specialty_ids uuid[] default null,
  _pref_specialty_id uuid default null,
  _pref_country text default null,
  _sort text default 'new',
  _limit integer default 20,
  _offset integer default 0
)
returns table (
  id uuid,
  title text,
  notes text,
  specialty_id uuid,
  specialty_name_ar text,
  specialty_name_en text,
  starts_at timestamptz,
  ends_at timestamptz,
  hourly_rate numeric,
  currency text,
  country text,
  city text,
  status public.shift_status,
  is_urgent boolean,
  facility_verified boolean,
  applications_count integer,
  created_at timestamptz,
  facility_id uuid,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      nullif(btrim(coalesce(_q, '')), '') as q,
      least(greatest(coalesce(_limit, 20), 1), 50) as lim,
      greatest(coalesce(_offset, 0), 0) as off
  ),
  base as (
    select sh.*
    from public.public_shifts sh, params p
    where (_country is null or sh.country = _country)
      and (_city is null or sh.city = _city)
      and (_specialty_id is null or sh.specialty_id = _specialty_id)
      and (_specialty_ids is null or sh.specialty_id = any(_specialty_ids))
      and (
        p.q is null
        or sh.title ilike '%' || left(p.q, 80) || '%'
        or coalesce(sh.notes, '') ilike '%' || left(p.q, 80) || '%'
        or sh.city ilike '%' || left(p.q, 80) || '%'
        or sh.country ilike '%' || left(p.q, 80) || '%'
        or coalesce(sh.specialty_name_ar, '') ilike '%' || left(p.q, 80) || '%'
        or coalesce(sh.specialty_name_en, '') ilike '%' || left(p.q, 80) || '%'
      )
  ),
  scored as (
    select b.*,
      (case when _pref_specialty_id is not null and b.specialty_id = _pref_specialty_id then 2 else 0 end)
      + (case when _pref_country is not null and b.country = _pref_country then 1 else 0 end) as score,
      count(*) over () as total_count
    from base b
  )
  select s.id, s.title, s.notes, s.specialty_id, s.specialty_name_ar, s.specialty_name_en,
         s.starts_at, s.ends_at, s.hourly_rate, s.currency, s.country, s.city, s.status,
         s.is_urgent, s.facility_verified, s.applications_count, s.created_at, s.facility_id,
         s.total_count
  from scored s
  order by
    case when _sort = 'match' then s.score else 0 end desc,
    s.starts_at asc,
    s.id
  limit (select lim from params) offset (select off from params);
$$;

-- قوائم التصفية (الدول/المدن) من نفس المصدر العام، بلا كشف أي بيانات إضافية.
create or replace function public.public_listing_places()
returns table (country text, city text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct country, city from (
    select country, city from public.public_jobs
    union all
    select country, city from public.public_shifts
  ) t
  where country is not null
  order by country, city;
$$;

revoke all on function public.search_public_jobs(text, text, text, uuid, uuid[], text, uuid, text, text, uuid[], integer, integer) from public;
revoke all on function public.search_public_shifts(text, text, text, uuid, uuid[], uuid, text, text, integer, integer) from public;
revoke all on function public.public_listing_places() from public;

grant execute on function public.search_public_jobs(text, text, text, uuid, uuid[], text, uuid, text, text, uuid[], integer, integer) to anon, authenticated, service_role;
grant execute on function public.search_public_shifts(text, text, text, uuid, uuid[], uuid, text, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.public_listing_places() to anon, authenticated, service_role;