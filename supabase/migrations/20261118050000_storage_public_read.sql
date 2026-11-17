-- Public read access on the product-images bucket (storage.objects).
--
-- The bucket is public, but storage.objects had no SELECT policy at all:
-- only INSERT / UPDATE / DELETE policies existed. That broke uploads with
-- upsert enabled (the app's imageUploadService uploads with upsert: true):
-- the Storage API checks whether the object already exists before the
-- upsert, and with no SELECT policy that check fails the whole upload with
-- "new row violates row-level security policy". Plain uploads without
-- upsert worked; uploads with upsert always failed. This policy matches
-- the bucket's public intent and makes upsert work for anon and
-- authenticated users alike.

CREATE POLICY "Public read on product-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
