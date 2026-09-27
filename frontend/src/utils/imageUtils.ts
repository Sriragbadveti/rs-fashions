import heic2any from "heic2any";

/**
 * Checks whether a given file is in HEIC or HEIF format.
 */
export function isHeicFile(file: File | Blob, filename?: string): boolean {
  if (!file) return false;
  const name = filename || ("name" in file ? (file as File).name : "");
  const lowerName = name.toLowerCase();
  const lowerType = (file.type || "").toLowerCase();

  return (
    lowerName.endsWith(".heic") ||
    lowerName.endsWith(".heif") ||
    lowerType === "image/heic" ||
    lowerType === "image/heif" ||
    lowerType === "image/heic-sequence" ||
    lowerType === "image/heif-sequence"
  );
}

/**
 * Converts a HEIC / HEIF file to standard JPEG blob.
 * If file is not HEIC, returns the original blob as-is.
 */
export async function convertHeicToJpegBlob(file: File | Blob): Promise<Blob> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.88,
    });

    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (err) {
    console.warn("[imageUtils] heic2any client conversion error, returning raw file:", err);
    return file;
  }
}

/**
 * Processes an uploaded image file into a browser-renderable Base64 Data URL.
 * Automatically converts HEIC/HEIF images to standard JPEG so that
 * all browsers (Chrome, Firefox, Safari, Edge, Android, iOS) can render them immediately.
 */
export async function processImageFileToDataUrl(file: File): Promise<string> {
  const processedBlob = await convertHeicToJpegBlob(file);

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(processedBlob);
  });
}
