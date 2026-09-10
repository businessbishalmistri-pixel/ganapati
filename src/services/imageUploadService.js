/**
 * imageUploadService.js
 * Uploads compressed image files directly to Supabase Storage.
 * Generates and returns a permanent public Supabase CDN URL.
 */
import { supabase } from './supabase';

const BUCKET_NAME = 'product-images';

/**
 * Uploads an image file/blob to Supabase Storage
 * @param {File|Blob} fileOrBlob 
 * @param {string} customFileName 
 * @returns {Promise<string>} publicUrl
 */
export async function uploadImageToSupabase(fileOrBlob, customFileName = '') {
  if (!fileOrBlob) throw new Error('No file provided for upload');

  const fileExt = fileOrBlob.type === 'image/webp' ? 'webp' : (fileOrBlob.name?.split('.').pop() || 'jpg');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const fileName = customFileName 
    ? `${customFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}.${fileExt}`
    : `prod_${timestamp}_${randomStr}.${fileExt}`;
  
  const filePath = `products/${fileName}`;

  // 1. Try uploading to 'product-images' bucket
  let uploadResult = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileOrBlob, {
      cacheControl: '31536000',
      upsert: true,
      contentType: fileOrBlob.type || 'image/webp'
    });

  // 2. If bucket not found error, try fallback 'public' bucket
  if (uploadResult.error) {
    console.warn(`Upload to ${BUCKET_NAME} failed, trying fallback 'public' bucket:`, uploadResult.error);
    
    uploadResult = await supabase.storage
      .from('public')
      .upload(filePath, fileOrBlob, {
        cacheControl: '31536000',
        upsert: true,
        contentType: fileOrBlob.type || 'image/webp'
      });

    if (!uploadResult.error) {
      const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    }

    // If both failed, throw error with helpful details
    throw new Error(uploadResult.error.message || 'Failed to upload image to Supabase Storage');
  }

  // 3. Get Public URL
  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  if (!publicUrlData?.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded image');
  }

  return publicUrlData.publicUrl;
}
