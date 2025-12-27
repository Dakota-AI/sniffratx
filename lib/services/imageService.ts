import { supabase } from '../supabase';

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI from image picker
 * @param bucket - Storage bucket name
 * @param path - Path within the bucket (e.g., 'avatars/user-id.jpg')
 * @returns Public URL of the uploaded image or null on failure
 */
export async function uploadImage(
  uri: string,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Determine content type
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // Convert blob to array buffer
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    // Add cache-busting timestamp to force refresh
    return `${publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error('Image upload failed:', error);
    return null;
  }
}

/**
 * Upload a profile avatar
 */
export async function uploadAvatar(
  uri: string,
  userId: string
): Promise<string | null> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  return uploadImage(uri, 'avatars', path);
}

/**
 * Upload a dog photo
 */
export async function uploadDogPhoto(
  uri: string,
  dogId: string
): Promise<string | null> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${dogId}/photo.${ext}`;
  return uploadImage(uri, 'dogs', path);
}

/**
 * Check if a URI is a local file (not already uploaded)
 */
export function isLocalUri(uri: string | null): boolean {
  if (!uri) return false;
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}
