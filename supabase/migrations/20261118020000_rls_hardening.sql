-- Harden RLS: drop the old permissive policies, then set read-only public
-- catalogue access and admin-only writes on every table.

-- Products: drop old policies.
DROP POLICY IF EXISTS "Allow delete products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;

-- Categories: drop old policies.
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;

-- Store settings: drop old policies.
DROP POLICY IF EXISTS "Allow insert store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow update store settings" ON public.store_settings;

-- Drop the new policy names first so this file does not clash with the
-- policies created in 20261118010000 and is safe to re-run.
DROP POLICY IF EXISTS "Public can read" ON public.products;
DROP POLICY IF EXISTS "Admin can do everything" ON public.products;
DROP POLICY IF EXISTS "Public can read" ON public.categories;
DROP POLICY IF EXISTS "Admin can do everything" ON public.categories;
DROP POLICY IF EXISTS "Public can read" ON public.store_settings;
DROP POLICY IF EXISTS "Admin can do everything" ON public.store_settings;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can do everything" ON public.orders;
DROP POLICY IF EXISTS "Customers can create profile" ON public.customers;
DROP POLICY IF EXISTS "Admin can do everything" ON public.customers;

-- Catalogue tables: anyone can read, only the signed-in admin writes.
CREATE POLICY "Public can read" ON public.products
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can do everything" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can do everything" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read" ON public.store_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can do everything" ON public.store_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders: guests may only insert; no anon SELECT. Admin does everything.
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin can do everything" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers: guests may only insert; no anon SELECT/UPDATE/DELETE. Admin does everything.
CREATE POLICY "Customers can create profile" ON public.customers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin can do everything" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grants: anon loses all writes on the catalogue tables.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.products, public.categories, public.store_settings FROM anon;
-- New tables pick up full anon rights from Supabase default privileges, so
-- revoke everything except INSERT on orders and customers.
REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON public.orders, public.customers FROM anon;
GRANT SELECT ON public.products, public.categories, public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.categories, public.store_settings, public.orders, public.customers TO authenticated;
GRANT INSERT ON public.orders, public.customers TO anon;
