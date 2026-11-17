-- Customer and order helper functions. All SECURITY DEFINER so guests can use
-- them through the anon key without direct SELECT access to orders/customers.

CREATE OR REPLACE FUNCTION public.get_orders_by_phone(p_phone text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders WHERE customer_phone = p_phone ORDER BY created_at DESC LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.upsert_customer(
  p_phone text,
  p_full_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_gps_lat double precision DEFAULT NULL,
  p_gps_lng double precision DEFAULT NULL,
  p_addresses jsonb DEFAULT NULL,
  p_cart jsonb DEFAULT NULL
)
RETURNS public.customers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.customers%ROWTYPE;
BEGIN
  INSERT INTO customers (phone, full_name, email, address, city, gps_lat, gps_lng, addresses, cart)
  VALUES (p_phone, p_full_name, p_email, p_address, p_city, p_gps_lat, p_gps_lng, COALESCE(p_addresses, '[]'::jsonb), COALESCE(p_cart, '[]'::jsonb))
  ON CONFLICT (phone) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
    email = COALESCE(EXCLUDED.email, customers.email),
    address = COALESCE(EXCLUDED.address, customers.address),
    city = COALESCE(EXCLUDED.city, customers.city),
    gps_lat = COALESCE(EXCLUDED.gps_lat, customers.gps_lat),
    gps_lng = COALESCE(EXCLUDED.gps_lng, customers.gps_lng),
    addresses = CASE WHEN p_addresses IS NULL THEN customers.addresses ELSE EXCLUDED.addresses END,
    cart = CASE WHEN p_cart IS NULL THEN customers.cart ELSE EXCLUDED.cart END,
    updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id text, p_qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - GREATEST(p_qty, 0), 0), stock = GREATEST(COALESCE(stock, 0) - GREATEST(p_qty, 0), 0), updated_at = now() WHERE id = p_product_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_orders_by_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_customer(text, text, text, text, text, double precision, double precision, jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(text, integer) TO anon, authenticated;
