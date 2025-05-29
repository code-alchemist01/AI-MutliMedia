
import { MAX_FILE_SIZE_BYTES } from '../constants';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        reject(new Error(`File is too large. Max size is ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB.`));
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:mime/type;base64,ActualBase64String"
      // We need to extract just "ActualBase64String"
      const base64String = result.split(',')[1];
      if (!base64String) {
        reject(new Error("Failed to extract base64 string from file."));
        return;
      }
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeType = (file: File, allowedTypes: string[]): string | null => {
    if (allowedTypes.includes(file.type)) {
        return file.type;
    }
    // Fallback for some specific cases if browser doesn't set type correctly, e.g. .mov might be video/quicktime
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'mov' && allowedTypes.includes('video/quicktime')) return 'video/quicktime';
    
    console.warn(`Unsupported file type: ${file.type} for file ${file.name}. Allowed: ${allowedTypes.join(', ')}`);
    return null; 
};
    