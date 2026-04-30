-- Supabase Schema for Product Information Collector

-- 1. Create the products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  net_weight_g numeric,
  material text,
  title_zh text,
  title_en text,
  selling_points_zh text[],
  selling_points_en text[],
  spec_description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set Row Level Security (RLS) to allow public access for demonstration purposes
alter table public.products enable row level security;

-- Create policies to allow all operations (For a real app, you should restrict this to authenticated users)
create policy "Allow public read access" on public.products for select using (true);
create policy "Allow public insert access" on public.products for insert with check (true);
create policy "Allow public update access" on public.products for update using (true);

-- 2. Create the storage bucket for product images
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Public Access" on storage.objects for select using ( bucket_id = 'product-images' );
create policy "Public Insert" on storage.objects for insert with check ( bucket_id = 'product-images' );
