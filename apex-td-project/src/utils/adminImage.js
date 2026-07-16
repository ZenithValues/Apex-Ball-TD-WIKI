import { supabase } from './supabase';

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read selected image.'));
    };
    image.src = url;
  });
}

/**
 * Upload a unit render to the public `unit-images` Storage bucket and return
 * its public URL. Falls back to a compact data URL ONLY if the upload fails
 * (so a broken storage policy never leaves the editor with no image), but the
 * happy path stores a lightweight URL in the DB instead of a base64 blob.
 */
export async function uploadUnitImage(file, slug, session) {
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '') || 'webp';
  const path = `${slug}.${ext}`;

  if (session) {
    const { error } = await supabase.storage
      .from('unit-images')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/webp' });
    if (!error) {
      const { data } = supabase.storage.from('unit-images').getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
    console.warn('Unit image upload fell back to data URL:', error?.message);
  }

  return fileToUnitRenderDataUrl(file, 512);
}

export async function fileToUnitRenderDataUrl(file, size = 512) {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const scale = Math.min(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, x, y, width, height);

  return canvas.toDataURL('image/webp', 0.9);
}

/** Remove any bucket objects that might exist for a slug (best-effort). */
export async function removeUnitImages(slug) {
  const exts = ['webp', 'png', 'jpg', 'jpeg'];
  await supabase.storage.from('unit-images').remove(exts.map((e) => `${slug}.${e}`)).catch(() => {});
}
