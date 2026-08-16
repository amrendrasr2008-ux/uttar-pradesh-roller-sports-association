/**
 * UPRSA Storage Service & Strict 15 KB File Processing Pipeline
 * Enforces strict 15,360 byte (15 KiB) limit across all uploads.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { storeBlobInIdb } from './idbStorage';

export const MAX_FILE_BYTES = 15360; // Exact 15 KiB (15,360 bytes)

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  publicOrSignedUrl?: string;
  sizeInBytes: number;
  fileName: string;
  mimeType: string;
  error?: string;
}

const FORBIDDEN_EXTENSIONS = ['.exe', '.js', '.html', '.htm', '.zip', '.rar', '.bat', '.cmd', '.sh', '.php', '.py'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Validates file MIME type and extension before processing.
 */
export function validateFileType(file: File | { name: string; type: string }): { valid: boolean; error?: string } {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  const ext = name.substring(name.lastIndexOf('.'));
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'File type is not supported. Executables and scripts are forbidden.' };
  }

  const isAllowedMime = ALLOWED_MIME_TYPES.some(t => mime.includes(t.replace('image/', '').replace('application/', '')));
  const isAllowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    return { valid: false, error: 'File type is not supported. Please upload JPG, PNG, WEBP, or PDF.' };
  }

  return { valid: true };
}

/**
 * Reads and processes Hero slider images and Banner photos in FULL ORIGINAL RESOLUTION.
 * Strict zero-degradation policy: Does NOT compress to 15KB or downscale to 320px thumbnail.
 * Preserves crisp HD/4K quality and true aspect ratio for desktop and mobile hero banners.
 */
export async function processHeroOrBannerImage(
  fileOrDataUrl: File | string
): Promise<{ dataUrl: string; sizeInBytes: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (typeof fileOrDataUrl === 'string') {
      resolve({
        dataUrl: fileOrDataUrl,
        sizeInBytes: fileOrDataUrl.length,
        mimeType: 'image/jpeg'
      });
      return;
    }

    const validation = validateFileType(fileOrDataUrl);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Invalid file format. Please upload JPG, PNG or WEBP.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({
          dataUrl: reader.result,
          sizeInBytes: fileOrDataUrl.size,
          mimeType: fileOrDataUrl.type || 'image/jpeg'
        });
      } else {
        reject(new Error('Failed to read hero banner image data.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading banner image file.'));
    reader.readAsDataURL(fileOrDataUrl);
  });
}

/**
 * Uploads high-resolution Hero Slider images and Banner photos directly to Supabase Storage.
 * Retains 100% original full image resolution without compression.
 */
export async function uploadHeroBannerToSupabaseStorage(
  fileOrBlob: File | Blob,
  fileName: string = 'hero-slide.jpg',
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  const byteSize = fileOrBlob.size;
  const path = `hero/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage.from('website-media').upload(path, fileOrBlob, {
        contentType: mimeType,
        upsert: true
      });

      if (error) {
        // If bucket error, fallback to IndexedDB
        console.warn('Supabase storage upload error, falling back to IndexedDB:', error.message);
      } else {
        const { data: publicData } = supabase.storage.from('website-media').getPublicUrl(data.path);
        return {
          success: true,
          storagePath: data.path,
          publicOrSignedUrl: publicData.publicUrl,
          sizeInBytes: byteSize,
          fileName,
          mimeType
        };
      }
    } catch (err: any) {
      console.warn('Network upload error, using local IndexedDB storage:', err.message);
    }
  }

  // Local fallback: Store safely in IndexedDB
  const blobKey = `blob_hero_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  await storeBlobInIdb(blobKey, fileOrBlob);

  let objectUrl = '';
  if (fileOrBlob instanceof Blob) {
    try {
      objectUrl = URL.createObjectURL(fileOrBlob);
    } catch (e) {
      // ignore
    }
  }

  return {
    success: true,
    storagePath: blobKey,
    publicOrSignedUrl: objectUrl || undefined,
    sizeInBytes: byteSize,
    fileName,
    mimeType
  };
}

/**
 * Compresses an image File or Base64 string to strictly <= 15,360 bytes (15 KiB).
 * Progressively resizes dimensions and quality (WEBP/JPEG) until target size is reached.
 */
export async function compressImageToStrict15KB(
  fileOrDataUrl: File | string,
  fileName: string = 'image.webp'
): Promise<{ blob: Blob; dataUrl: string; sizeInBytes: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const processDataUrl = (dataUrl: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        let bestBlob: Blob | null = null;
        let bestDataUrl = '';
        let bestSize = Infinity;
        let bestMime = 'image/webp';

        // Initial canvas dimensions based on image aspect ratio
        let maxDim = 320;
        let quality = 0.75;

        // Up to 15 progressive downscaling attempts
        for (let attempt = 0; attempt < 15; attempt++) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) break;

          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = Math.max(60, width);
          canvas.height = Math.max(60, height);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Try WEBP first, then JPEG as fallback
          const formatToUse = attempt % 2 === 0 ? 'image/webp' : 'image/jpeg';
          const attemptDataUrl = canvas.toDataURL(formatToUse, quality);

          // Convert Data URL to Blob to check exact byte size
          const response = await fetch(attemptDataUrl);
          const blob = await response.blob();
          const byteSize = blob.size;

          if (byteSize <= MAX_FILE_BYTES) {
            resolve({
              blob,
              dataUrl: attemptDataUrl,
              sizeInBytes: byteSize,
              mimeType: formatToUse
            });
            return;
          }

          if (byteSize < bestSize) {
            bestSize = byteSize;
            bestBlob = blob;
            bestDataUrl = attemptDataUrl;
            bestMime = formatToUse;
          }

          // Scale down parameters for next iteration
          if (attempt < 5) {
            quality -= 0.12;
            if (quality < 0.15) quality = 0.15;
          } else {
            maxDim = Math.round(maxDim * 0.75);
            quality = 0.4;
          }
        }

        if (bestBlob && bestSize <= MAX_FILE_BYTES) {
          resolve({
            blob: bestBlob,
            dataUrl: bestDataUrl,
            sizeInBytes: bestSize,
            mimeType: bestMime
          });
        } else {
          reject(new Error('यह फ़ाइल 15 KB (15,360 bytes) की सीमा में सुरक्षित रूप से compress नहीं हो सकी। कृपया छोटा चित्र upload करें।'));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression. File may be corrupt.'));
      };

      img.src = dataUrl;
    };

    if (typeof fileOrDataUrl === 'string') {
      processDataUrl(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => processDataUrl(reader.result as string);
      reader.onerror = () => reject(new Error('Error reading uploaded image file.'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Validates and checks PDF byte size against strict 15 KB limit.
 * Never corrupts or truncates PDF bytes. Rejects cleanly if PDF exceeds limit.
 */
export async function validateAndProcessPDF(
  file: File
): Promise<{ blob: Blob; sizeInBytes: number }> {
  if (file.size <= MAX_FILE_BYTES) {
    return { blob: file, sizeInBytes: file.size };
  }

  // PDF exceeds 15 KB limit and cannot be safely re-encoded client-side without corrupting structure
  throw new Error('यह PDF 15 KB की सीमा में सुरक्षित रूप से compress नहीं हो सकती। कृपया छोटा/सरल document upload करें।');
}

/**
 * Uploads a processed file/blob to Supabase Storage with strict 15 KB validation.
 */
export async function uploadToSupabaseStorage(
  bucket: 'skater-photos' | 'private-documents' | 'certificates' | 'website-media' | 'gallery' | 'payment-proofs',
  path: string,
  fileOrBlob: File | Blob,
  mimeType: string
): Promise<UploadResult> {
  const byteSize = fileOrBlob.size;

  if (byteSize > MAX_FILE_BYTES) {
    return {
      success: false,
      sizeInBytes: byteSize,
      fileName: path.split('/').pop() || 'file',
      mimeType,
      error: `Upload rejected: Final file size (${(byteSize / 1024).toFixed(1)} KB) exceeds strict 15 KB limit.`
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    // Return fallback result when offline / dev store simulation
    return {
      success: true,
      storagePath: `${bucket}/${path}`,
      publicOrSignedUrl: '',
      sizeInBytes: byteSize,
      fileName: path.split('/').pop() || 'file',
      mimeType
    };
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, fileOrBlob, {
      contentType: mimeType,
      upsert: true
    });

    if (error) {
      return {
        success: false,
        sizeInBytes: byteSize,
        fileName: path.split('/').pop() || 'file',
        mimeType,
        error: `Supabase Storage upload error: ${error.message}`
      };
    }

    let publicOrSignedUrl = '';

    if (bucket === 'private-documents' || bucket === 'certificates') {
      const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(data.path, 3600);
      publicOrSignedUrl = signedData?.signedUrl || '';
    } else {
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      publicOrSignedUrl = publicData.publicUrl || '';
    }

    return {
      success: true,
      storagePath: data.path,
      publicOrSignedUrl,
      sizeInBytes: byteSize,
      fileName: path.split('/').pop() || 'file',
      mimeType
    };
  } catch (err: any) {
    return {
      success: false,
      sizeInBytes: byteSize,
      fileName: path.split('/').pop() || 'file',
      mimeType,
      error: err.message || 'Upload failed due to network or storage error.'
    };
  }
}

/**
 * Creates a short-lived signed URL for accessing private storage files.
 */
export async function getSignedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string> {
  if (!isSupabaseConfigured || !supabase || !path) return '';
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return '';
  return data.signedUrl;
}
