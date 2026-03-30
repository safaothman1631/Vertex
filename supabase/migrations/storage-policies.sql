-- ============================================
-- Supabase Storage Policies for 'images' bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- Allow authenticated users to upload images
CREATE POLICY "auth_upload_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow anyone to view images (public bucket)
CREATE POLICY "public_read_images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'images');

-- Allow authenticated users to update their uploads
CREATE POLICY "auth_update_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images');

-- Allow authenticated users to delete images
CREATE POLICY "auth_delete_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images');
