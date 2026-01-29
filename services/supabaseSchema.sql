-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('ADMIN', 'RESIDENT')) default 'RESIDENT',
  unit_number text, -- nullable for admins
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: amenities
create table public.amenities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  capacity int default 10,
  image_url text,
  icon_name text default 'Star',
  open_time time not null,
  close_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: reservations
create table public.reservations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amenity_id uuid references public.amenities(id) not null,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  status text check (status in ('CONFIRMED', 'CANCELLED', 'COMPLETED')) default 'CONFIRMED',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: announcements
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  priority text check (priority in ('LOW', 'HIGH')) default 'LOW',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: settings
create table public.app_settings (
  id int primary key default 1,
  booking_anticipation_days int default 1
);

-- ROW LEVEL SECURITY (RLS)

alter table profiles enable row level security;
alter table amenities enable row level security;
alter table reservations enable row level security;
alter table announcements enable row level security;

-- Policies

-- Profiles: Users can view their own, Admin can view all
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Amenities: Read all, Write Admin only
create policy "Amenities are viewable by everyone" on amenities for select using (true);
create policy "Admins can insert amenities" on amenities for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can update amenities" on amenities for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);

-- Reservations:
-- Residents can see their own. Admins can see all.
create policy "View reservations" on reservations for select using (
  auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);
-- Residents can create reservations
create policy "Create reservations" on reservations for insert with check (auth.uid() = user_id);
-- Residents can cancel their own, Admins can manage all
create policy "Update reservations" on reservations for update using (
  auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);

-- Announcements: Read all, Write Admin only
create policy "Read announcements" on announcements for select using (true);
create policy "Manage announcements" on announcements for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);