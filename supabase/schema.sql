-- Supabase schema for case submissions

create extension if not exists "pgcrypto";

do $$
begin
  create type appointment_status as enum ('submitted', 'reviewing', 'completed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('patient', 'doctor')),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  assigned_doctor_id uuid references public.users(id),
  patient_name text not null,
  patient_email text not null,
  body_part text not null,
  chief_complaint text not null,
  preferred_date date not null,
  preferred_time time not null,
  status appointment_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create table if not exists public.case_submissions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  image_urls text[] not null default '{}'::text[],
  audio_url text not null,
  video_url text,
  transcription text,
  ai_summary jsonb,
  model_3d_url text,
  doctor_notes text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_assigned_doctor_id_idx on public.appointments(assigned_doctor_id);
create index if not exists case_submissions_appointment_id_idx on public.case_submissions(appointment_id);

alter table public.users enable row level security;
alter table public.appointments enable row level security;
alter table public.case_submissions enable row level security;

create policy "Users can read own profile" on public.users
  for select
  using (id = auth.uid());

create or replace function public.is_doctor()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'doctor'
  );
$$;

create policy "Doctors can read user profiles" on public.users
  for select
  using (public.is_doctor());

create policy "Users can insert own profile" on public.users
  for insert
  with check (id = auth.uid());

create policy "Users can update own profile" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Patients can create appointments" on public.appointments
  for insert
  with check (patient_id = auth.uid());

create policy "Patients can read own appointments" on public.appointments
  for select
  using (patient_id = auth.uid());

create policy "Doctors can read assigned appointments" on public.appointments
  for select
  using (assigned_doctor_id = auth.uid());

create policy "Patients can update own appointments" on public.appointments
  for update
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy "Doctors can update assigned appointments" on public.appointments
  for update
  using (assigned_doctor_id = auth.uid())
  with check (assigned_doctor_id = auth.uid());

create policy "Patients can submit case for own appointment" on public.case_submissions
  for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = case_submissions.appointment_id
        and a.patient_id = auth.uid()
    )
  );

create policy "Patients can read own case submissions" on public.case_submissions
  for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = case_submissions.appointment_id
        and a.patient_id = auth.uid()
    )
  );

create policy "Doctors can read assigned case submissions" on public.case_submissions
  for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = case_submissions.appointment_id
        and a.assigned_doctor_id = auth.uid()
    )
  );

create policy "Doctors can update assigned case submissions" on public.case_submissions
  for update
  using (
    exists (
      select 1 from public.appointments a
      where a.id = case_submissions.appointment_id
        and a.assigned_doctor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = case_submissions.appointment_id
        and a.assigned_doctor_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('patient-images', 'patient-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('patient-videos', 'patient-videos', false)
on conflict (id) do nothing;

create policy "Patients can upload their images" on storage.objects
  for insert
  with check (
    bucket_id = 'patient-images'
    and exists (
      select 1 from public.appointments a
      where a.id = (storage.foldername(name))[1]::uuid
        and a.patient_id = auth.uid()
    )
  );

create policy "Patients can read their images" on storage.objects
  for select
  using (
    bucket_id = 'patient-images'
    and exists (
      select 1 from public.appointments a
      where a.id = (storage.foldername(name))[1]::uuid
        and (a.patient_id = auth.uid() or a.assigned_doctor_id = auth.uid())
    )
  );

create policy "Patients can upload their voice notes" on storage.objects
  for insert
  with check (
    bucket_id = 'voice-notes'
    and exists (
      select 1 from public.appointments a
      where a.id = (storage.foldername(name))[1]::uuid
        and a.patient_id = auth.uid()
    )
  );

create policy "Patients and doctors can read voice notes" on storage.objects
  for select
  using (
    bucket_id = 'voice-notes'
    and exists (
      select 1 from public.appointments a
      where a.id = (storage.foldername(name))[1]::uuid
        and (a.patient_id = auth.uid() or a.assigned_doctor_id = auth.uid())
    )
  );

create policy "Patients can upload their videos" on storage.objects
  for insert
  with check (
    bucket_id = 'patient-videos'
    and exists (
      select 1 from public.appointments a
      where a.id = (storage.foldername(name))[1]::uuid
        and a.patient_id = auth.uid()
    )
  );

create policy "Patients and doctors can read videos" on storage.objects
  for select
  using (
    bucket_id = 'patient-videos'
    and exists (
      select 1 from public.appointments a
      where a.id = (storage.foldername(name))[1]::uuid
        and (a.patient_id = auth.uid() or a.assigned_doctor_id = auth.uid())
    )
  );
