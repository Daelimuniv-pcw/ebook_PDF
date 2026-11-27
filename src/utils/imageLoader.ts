import type { PhotoPage } from '../types/album';

function createUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function deriveTitleFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_-]+/g, ' ').trim();
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지를 불러올 수 없습니다: ${src}`));
    img.src = src;
  });
}

export async function filesToPhotoPages(files: FileList | File[]): Promise<PhotoPage[]> {
  const imageFiles = Array.from(files).filter((file) =>
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(file.name)
  );

  const pages = await Promise.all(
    imageFiles.map(async (file): Promise<PhotoPage> => {
      const objectUrl = URL.createObjectURL(file);
      let aspectRatio = 4 / 3;

      try {
        const img = await loadImageElement(objectUrl);
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          aspectRatio = img.naturalWidth / img.naturalHeight;
        }
      } catch {
        aspectRatio = 4 / 3;
      }

      return {
        id: createUniqueId(),
        src: objectUrl,
        fileName: file.name,
        title: deriveTitleFromFileName(file.name),
        description: '',
        aspectRatio,
        isObjectUrl: true,
      };
    })
  );

  return pages;
}
