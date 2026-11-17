-- Create orders and customers tables for the Ganapati storefront.
-- Orders are placed by guests at checkout; customers hold profile, addresses and cloud cart.

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  customer_name text NOT NULL DEFAULT 'Customer',
  customer_phone text NOT NULL DEFAULT '',
  customer_email text DEFAULT '',
  delivery_method text DEFAULT 'pickup',
  delivery_address jsonb DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'cod',
  channel text DEFAULT 'website',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  full_name text,
  email text,
  address text,
  city text,
  gps_lat double precision,
  gps_lng double precision,
  addresses jsonb DEFAULT '[]'::jsonb,
  cart jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Guests may only insert; order reads go through SECURITY DEFINER functions.
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can do everything" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Customers can create profile" ON public.customers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can do everything" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Explicit grants: Supabase no longer auto-grants on new tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders, public.customers TO authenticated;
GRANT INSERT ON public.orders, public.customers TO anon;
