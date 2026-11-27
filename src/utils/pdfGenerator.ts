import { jsPDF } from 'jspdf';
import type { AlbumSettings, PhotoPage } from '../types/album';
import {
  ALBUM_FONTS,
  ALBUM_THEMES,
  ensureAlbumFontLoaded,
} from './albumTheme';
import { loadImageElement } from './imageLoader';

const MONO_FONT = '"JetBrains Mono", monospace';

export type ExportableSlot =
  | { kind: 'cover' }
  | { kind: 'closing' }
  | { kind: 'photo'; photoIndex: number; page: PhotoPage };

interface WrappedLineResult {
  lines: string[];
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): WrappedLineResult {
  const normalized = text.trim();
  if (!normalized) {
    return { lines: [] };
  }

  const paragraphs = normalized.split(/\r?\n/);
  const lines: string[] = [];

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx].trim();
    if (!paragraph) {
      if (lines.length < maxLines) {
        lines.push('');
      }
      continue;
    }

    let currentLine = '';
    const words = paragraph.split(' ');

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          if (lines.length >= maxLines) {
            return { lines };
          }
          currentLine = '';
        }

        if (ctx.measureText(word).width > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            const nextChunk = chunk + ch;
            if (ctx.measureText(nextChunk).width > maxWidth && chunk) {
              lines.push(chunk);
              if (lines.length >= maxLines) {
                return { lines };
              }
              chunk = ch;
            } else {
              chunk = nextChunk;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  return { lines };
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  borderColor: string | null = '#E4E4E0'
) {
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const boxRatio = boxW / Math.max(1, boxH);

  let drawW = boxW;
  let drawH = boxH;

  if (imgRatio > boxRatio) {
    drawW = boxW;
    drawH = boxW / imgRatio;
  } else {
    drawH = boxH;
    drawW = boxH * imgRatio;
  }

  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

async function renderCoverCanvas(
  pages: PhotoPage[],
  settings: AlbumSettings,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  }

  const theme = ALBUM_THEMES[settings.mood];
  const font = ALBUM_FONTS[settings.fontStyle];
  const s = font.canvasScale;

  ctx.fillStyle = theme.pageBg;
  ctx.fillRect(0, 0, width, height);

  const outerInset = 82;
  const innerInset = 98;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    outerInset,
    outerInset,
    width - outerInset * 2,
    height - outerInset * 2
  );
  ctx.strokeStyle = theme.innerBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    innerInset,
    innerInset,
    width - innerInset * 2,
    height - innerInset * 2
  );

  const isLandscape = settings.orientation === 'landscape';
  const coverPhoto =
    pages.find((p) => p.id === settings.coverPhotoId) ?? pages[0] ?? null;

  let coverImg: HTMLImageElement | null = null;
  if (coverPhoto) {
    try {
      coverImg = await loadImageElement(coverPhoto.src);
    } catch {
      coverImg = null;
    }
  }

  const titleText = settings.albumTitle.trim() || '나의 포토 앨범';
  const subText = settings.subtitle.trim();
  const authorText = settings.authorName.trim();
  const dateText = settings.albumDate.trim();
  const hasMeta = Boolean(authorText || dateText);

  const areaX = innerInset + 72;
  const areaY = innerInset + 72;
  const areaW = width - (innerInset + 72) * 2;
  const areaH = height - (innerInset + 72) * 2 - 48;

  if (isLandscape) {
    const photoW = coverImg ? areaW * 0.45 : 0;
    const gap = coverImg ? areaW * 0.055 : 0;
    const textX = coverImg ? areaX + photoW + gap : width / 2;
    const textW = coverImg ? areaW - photoW - gap : width * 0.72;
    const textAlign: CanvasTextAlign = coverImg ? 'left' : 'center';

    if (coverImg) {
      ctx.fillStyle = theme.matBg;
      ctx.fillRect(areaX, areaY, photoW, areaH);
      ctx.strokeStyle = theme.innerBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(areaX, areaY, photoW, areaH);

      const pad = 28;
      drawContainedImage(
        ctx,
        coverImg,
        areaX + pad,
        areaY + pad,
        photoW - pad * 2,
        areaH - pad * 2,
        theme.border
      );
    }

    const titleSize = Math.round(78 * s);
    const titleLineH = Math.round(98 * Math.max(1, s * 0.94));
    const subSize = Math.round(32 * s);
    const subLineH = Math.round(46 * Math.max(1, s * 0.94));
    const metaSize = Math.round(32 * s);

    ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
    const titleLines = wrapText(ctx, titleText, textW, 3).lines;

    ctx.font = `400 ${subSize}px ${font.fontFamily}`;
    const subLines = subText ? wrapText(ctx, subText, textW, 2).lines : [];

    const totalBlockH =
      titleLines.length * titleLineH +
      (subLines.length > 0 ? 26 + subLines.length * subLineH : 0) +
      (hasMeta ? 88 + 40 : 0);

    let cursorY = areaY + Math.max(0, (areaH - totalBlockH) / 2);

    ctx.textAlign = textAlign;
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
    titleLines.forEach((line) => {
      ctx.fillText(line, textX, cursorY);
      cursorY += titleLineH;
    });

    if (subLines.length > 0) {
      cursorY += 26;
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `400 ${subSize}px ${font.fontFamily}`;
      subLines.forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += subLineH;
      });
    }

    if (hasMeta) {
      cursorY += 48;
      ctx.strokeStyle = theme.strongDivider;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (textAlign === 'center') {
        ctx.moveTo(textX - 44, cursorY);
        ctx.lineTo(textX + 44, cursorY);
      } else {
        ctx.moveTo(textX, cursorY);
        ctx.lineTo(textX + 84, cursorY);
      }
      ctx.stroke();

      cursorY += 38;
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `${font.id === 'handwriting' ? '400' : '600'} ${metaSize}px ${font.fontFamily}`;
      const metaLabel = [authorText, dateText].filter(Boolean).join('   ·   ');
      ctx.fillText(metaLabel, textX, cursorY);
    }
  } else {
    const centerX = width / 2;
    const textW = areaW * 0.92;
    let textStartY = areaY + 40;

    if (coverImg) {
      const photoH = areaH * 0.46;
      ctx.fillStyle = theme.matBg;
      ctx.fillRect(areaX, areaY, areaW, photoH);
      ctx.strokeStyle = theme.innerBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(areaX, areaY, areaW, photoH);

      const pad = 28;
      drawContainedImage(
        ctx,
        coverImg,
        areaX + pad,
        areaY + pad,
        areaW - pad * 2,
        photoH - pad * 2,
        theme.border
      );
      textStartY = areaY + photoH + 64;
    }

    const titleSize = Math.round(74 * s);
    const titleLineH = Math.round(94 * Math.max(1, s * 0.94));
    const subSize = Math.round(32 * s);
    const subLineH = Math.round(46 * Math.max(1, s * 0.94));
    const metaSize = Math.round(32 * s);

    ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
    const titleLines = wrapText(ctx, titleText, textW, 3).lines;

    ctx.font = `400 ${subSize}px ${font.fontFamily}`;
    const subLines = subText ? wrapText(ctx, subText, textW, 2).lines : [];

    const remainingH = areaY + areaH - textStartY;
    const totalBlockH =
      titleLines.length * titleLineH +
      (subLines.length > 0 ? 24 + subLines.length * subLineH : 0) +
      (hasMeta ? 84 + 38 : 0);

    let cursorY = textStartY + Math.max(0, (remainingH - totalBlockH) / 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
    titleLines.forEach((line) => {
      ctx.fillText(line, centerX, cursorY);
      cursorY += titleLineH;
    });

    if (subLines.length > 0) {
      cursorY += 24;
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `400 ${subSize}px ${font.fontFamily}`;
      subLines.forEach((line) => {
        ctx.fillText(line, centerX, cursorY);
        cursorY += subLineH;
      });
    }

    if (hasMeta) {
      cursorY += 44;
      ctx.strokeStyle = theme.strongDivider;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 44, cursorY);
      ctx.lineTo(centerX + 44, cursorY);
      ctx.stroke();

      cursorY += 36;
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `${font.id === 'handwriting' ? '400' : '600'} ${metaSize}px ${font.fontFamily}`;
      const metaLabel = [authorText, dateText].filter(Boolean).join('   ·   ');
      ctx.fillText(metaLabel, centerX, cursorY);
    }
  }

  ctx.fillStyle = theme.textMuted;
  ctx.font = `400 22px ${MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `${String(pages.length).padStart(2, '0')} PHOTOGRAPHS`,
    width / 2,
    height - innerInset - 36
  );

  return canvas;
}

async function renderClosingCanvas(
  settings: AlbumSettings,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  }

  const theme = ALBUM_THEMES[settings.mood];
  const font = ALBUM_FONTS[settings.fontStyle];
  const s = font.canvasScale;

  ctx.fillStyle = theme.pageBg;
  ctx.fillRect(0, 0, width, height);

  const outerInset = 82;
  ctx.strokeStyle = theme.innerBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    outerInset,
    outerInset,
    width - outerInset * 2,
    height - outerInset * 2
  );

  const isLandscape = settings.orientation === 'landscape';
  const centerX = width / 2;
  const maxTextW = width * 0.66;

  const message = settings.closingMessage.trim();
  const authorText = settings.authorName.trim();
  const dateText = settings.albumDate.trim();
  const colophon = [authorText, dateText].filter(Boolean).join(' · ');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const msgSize = Math.round((isLandscape ? 42 : 40) * s);
  const lineH = Math.round((isLandscape ? 68 : 64) * Math.max(1, s * 0.94));
  const colophonSize = Math.round(26 * s);

  if (message) {
    ctx.font = `400 ${msgSize}px ${font.fontFamily}`;
    const msgLines = wrapText(ctx, message, maxTextW, 10).lines;
    const totalH = msgLines.length * lineH + (colophon ? 96 : 0);
    let cursorY = Math.max(outerInset + 140, (height - totalH) / 2);

    ctx.fillStyle = theme.textPrimary;
    msgLines.forEach((line) => {
      ctx.fillText(line, centerX, cursorY);
      cursorY += lineH;
    });

    if (colophon) {
      cursorY += 44;
      ctx.strokeStyle = theme.divider;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 36, cursorY);
      ctx.lineTo(centerX + 36, cursorY);
      ctx.stroke();

      cursorY += 32;
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `400 ${colophonSize}px ${font.fontFamily}`;
      ctx.fillText(colophon, centerX, cursorY);
    }
  } else if (colophon) {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `400 ${Math.round(28 * s)}px ${font.fontFamily}`;
    ctx.fillText(colophon, centerX, height / 2 - 14);
  }

  if (settings.albumTitle.trim()) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = `400 ${Math.round(22 * Math.max(1, s * 0.92))}px ${font.fontFamily}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(settings.albumTitle.trim(), centerX, height - outerInset - 44);
  }

  return canvas;
}

async function renderPageCanvas(
  page: PhotoPage,
  pageIndex: number,
  totalPages: number,
  settings: AlbumSettings,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  }

  const theme = ALBUM_THEMES[settings.mood];
  const font = ALBUM_FONTS[settings.fontStyle];
  const s = font.canvasScale;

  ctx.fillStyle = theme.pageBg;
  ctx.fillRect(0, 0, width, height);

  const isLandscape = settings.orientation === 'landscape';
  const marginX = isLandscape ? 130 : 115;
  const marginTop = isLandscape ? 110 : 120;
  const footerReserved = settings.showPageNumbers ? 95 : 70;
  const contentW = width - marginX * 2;
  const contentH = height - marginTop - footerReserved;

  let img: HTMLImageElement | null = null;
  try {
    img = await loadImageElement(page.src);
  } catch {
    img = null;
  }

  const title = page.title.trim();
  const description = page.description.trim();

  if (settings.layoutStyle === 'editorial' && isLandscape) {
    const photoW = contentW * 0.62;
    const gap = contentW * 0.05;
    const textX = marginX + photoW + gap;
    const textW = contentW - photoW - gap;

    if (img) {
      drawContainedImage(ctx, img, marginX, marginTop, photoW, contentH, theme.border);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const titleSize = Math.round(44 * s);
    const titleLineH = Math.round(58 * Math.max(1, s * 0.94));
    const descSize = Math.round(25 * s);
    const descLineH = Math.round(40 * Math.max(1, s * 0.94));

    ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
    const titleLines = title ? wrapText(ctx, title, textW, 3).lines : [];

    ctx.font = `400 ${descSize}px ${font.fontFamily}`;
    const descLines = description ? wrapText(ctx, description, textW, 12).lines : [];

    const titleBlockH = titleLines.length * titleLineH;
    const dividerH = titleLines.length > 0 && descLines.length > 0 ? 36 : 0;
    const descBlockH = descLines.length * descLineH;
    const totalTextH = titleBlockH + dividerH + descBlockH;
    let cursorY = marginTop + Math.max(0, (contentH - totalTextH) / 2);

    if (titleLines.length > 0) {
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
      titleLines.forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += titleLineH;
      });
    }

    if (dividerH > 0) {
      ctx.strokeStyle = theme.divider;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(textX, cursorY + 14);
      ctx.lineTo(textX + 56, cursorY + 14);
      ctx.stroke();
      cursorY += dividerH;
    }

    if (descLines.length > 0) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `400 ${descSize}px ${font.fontFamily}`;
      descLines.forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += descLineH;
      });
    }
  } else if (settings.layoutStyle === 'minimal') {
    const hasCaption = Boolean(title || description);
    const captionAreaH = hasCaption ? (isLandscape ? 195 : 260) : 0;
    const photoH = contentH - captionAreaH;

    if (img) {
      drawContainedImage(ctx, img, marginX, marginTop, contentW, photoH, null);
    }

    if (hasCaption) {
      let cursorY = marginTop + photoH + 34;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const titleSize = Math.round(34 * s);
      const titleLineH = Math.round(46 * Math.max(1, s * 0.94));
      const descSize = Math.round(23 * s);
      const descLineH = Math.round(35 * Math.max(1, s * 0.94));

      if (title) {
        ctx.fillStyle = theme.textPrimary;
        ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
        const tLines = wrapText(ctx, title, contentW, 1).lines;
        tLines.forEach((line) => {
          ctx.fillText(line, marginX, cursorY);
          cursorY += titleLineH;
        });
      }

      if (description) {
        ctx.fillStyle = theme.textSecondary;
        ctx.font = `400 ${descSize}px ${font.fontFamily}`;
        const dLines = wrapText(ctx, description, contentW, isLandscape ? 3 : 4).lines;
        dLines.forEach((line) => {
          ctx.fillText(line, marginX, cursorY);
          cursorY += descLineH;
        });
      }
    }
  } else {
    const hasText = Boolean(title || description);
    const textAreaH = hasText ? (isLandscape ? 285 : 430) : 0;
    const photoGap = hasText ? 44 : 0;
    const photoH = contentH - textAreaH - photoGap;

    if (img) {
      drawContainedImage(ctx, img, marginX, marginTop, contentW, photoH, theme.border);
    }

    if (hasText) {
      const isCentered = settings.layoutStyle === 'classic';
      const textX = isCentered ? width / 2 : marginX;
      ctx.textAlign = isCentered ? 'center' : 'left';
      ctx.textBaseline = 'top';
      let cursorY = marginTop + photoH + photoGap;
      const maxTextW = isCentered ? contentW * 0.82 : contentW;

      const titleSize = Math.round((isLandscape ? 38 : 40) * s);
      const titleLineH = Math.round(50 * Math.max(1, s * 0.94));
      const descSize = Math.round(24 * s);
      const descLineH = Math.round(37 * Math.max(1, s * 0.94));

      if (title) {
        ctx.fillStyle = theme.textPrimary;
        ctx.font = `${font.titleWeight} ${titleSize}px ${font.fontFamily}`;
        const tLines = wrapText(ctx, title, maxTextW, 2).lines;
        tLines.forEach((line) => {
          ctx.fillText(line, textX, cursorY);
          cursorY += titleLineH;
        });
        cursorY += 10;
      }

      if (description) {
        ctx.fillStyle = theme.textSecondary;
        ctx.font = `400 ${descSize}px ${font.fontFamily}`;
        const maxDescLines = isLandscape ? 4 : 7;
        const dLines = wrapText(ctx, description, maxTextW, maxDescLines).lines;
        dLines.forEach((line) => {
          ctx.fillText(line, textX, cursorY);
          cursorY += descLineH;
        });
      }
    }
  }

  if (settings.showPageNumbers) {
    const footerY = height - 48;
    ctx.fillStyle = theme.textMuted;
    ctx.textBaseline = 'bottom';

    if (settings.albumTitle.trim()) {
      ctx.textAlign = 'left';
      ctx.font = `400 ${Math.round(20 * Math.max(1, s * 0.92))}px ${font.fontFamily}`;
      ctx.fillText(settings.albumTitle.trim(), marginX, footerY);
    }

    ctx.textAlign = 'right';
    ctx.font = `500 20px ${MONO_FONT}`;
    const pageStr = `${String(pageIndex + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;
    ctx.fillText(pageStr, width - marginX, footerY);
  }

  return canvas;
}

function downloadCanvasAsPng(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG 이미지를 생성할 수 없습니다.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, 'image/png');
  });
}

function sanitizeFileName(raw: string): string {
  return raw.replace(/[\\/:*?"<>|]/g, '-');
}

export async function exportSingleSlotToPng(
  slot: ExportableSlot,
  pages: PhotoPage[],
  settings: AlbumSettings
): Promise<void> {
  await ensureAlbumFontLoaded(settings.fontStyle);

  const isLandscape = settings.orientation === 'landscape';
  const canvasW = isLandscape ? 2338 : 1654;
  const canvasH = isLandscape ? 1654 : 2338;
  const baseName = sanitizeFileName(settings.albumTitle.trim() || '모노그래프-포토앨범');

  let canvas: HTMLCanvasElement;
  let suffix: string;

  if (slot.kind === 'cover') {
    canvas = await renderCoverCanvas(pages, settings, canvasW, canvasH);
    suffix = '표지';
  } else if (slot.kind === 'closing') {
    canvas = await renderClosingCanvas(settings, canvasW, canvasH);
    suffix = '마무리';
  } else {
    canvas = await renderPageCanvas(
      slot.page,
      slot.photoIndex,
      pages.length,
      settings,
      canvasW,
      canvasH
    );
    suffix = `${String(slot.photoIndex + 1).padStart(2, '0')}쪽`;
  }

  await downloadCanvasAsPng(canvas, `${baseName}_${suffix}.png`);
}

export async function exportAllPagesToPng(
  pages: PhotoPage[],
  settings: AlbumSettings,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (pages.length === 0) {
    throw new Error('PNG로 저장할 사진이 없습니다.');
  }

  await ensureAlbumFontLoaded(settings.fontStyle);

  const isLandscape = settings.orientation === 'landscape';
  const canvasW = isLandscape ? 2338 : 1654;
  const canvasH = isLandscape ? 1654 : 2338;
  const baseName = sanitizeFileName(settings.albumTitle.trim() || '모노그래프-포토앨범');

  const totalSteps =
    pages.length +
    (settings.includeCover ? 1 : 0) +
    (settings.includeClosing ? 1 : 0);
  let completed = 0;

  if (settings.includeCover) {
    const coverCanvas = await renderCoverCanvas(pages, settings, canvasW, canvasH);
    await downloadCanvasAsPng(coverCanvas, `${baseName}_00_표지.png`);
    completed += 1;
    onProgress?.(completed, totalSteps);
    await new Promise((resolve) => setTimeout(resolve, 180));
  }

  for (let i = 0; i < pages.length; i++) {
    const pageCanvas = await renderPageCanvas(
      pages[i],
      i,
      pages.length,
      settings,
      canvasW,
      canvasH
    );
    await downloadCanvasAsPng(
      pageCanvas,
      `${baseName}_${String(i + 1).padStart(2, '0')}.png`
    );
    completed += 1;
    onProgress?.(completed, totalSteps);
    await new Promise((resolve) => setTimeout(resolve, 180));
  }

  if (settings.includeClosing) {
    const closingCanvas = await renderClosingCanvas(settings, canvasW, canvasH);
    await downloadCanvasAsPng(
      closingCanvas,
      `${baseName}_${String(pages.length + 1).padStart(2, '0')}_마무리.png`
    );
    completed += 1;
    onProgress?.(completed, totalSteps);
  }
}

export async function exportAlbumToPdf(
  pages: PhotoPage[],
  settings: AlbumSettings,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (pages.length === 0) {
    throw new Error('PDF로 저장할 사진이 없습니다.');
  }

  await ensureAlbumFontLoaded(settings.fontStyle);

  const isLandscape = settings.orientation === 'landscape';
  const canvasW = isLandscape ? 2338 : 1654; // A4 @ 200 DPI
  const canvasH = isLandscape ? 1654 : 2338;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  const totalSteps =
    pages.length +
    (settings.includeCover ? 1 : 0) +
    (settings.includeClosing ? 1 : 0);
  let completed = 0;

  if (settings.includeCover) {
    const coverCanvas = await renderCoverCanvas(pages, settings, canvasW, canvasH);
    const coverData = coverCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(coverData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    completed += 1;
    onProgress?.(completed, totalSteps);
  }

  for (let i = 0; i < pages.length; i++) {
    if (i > 0 || settings.includeCover) {
      pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }

    const pageCanvas = await renderPageCanvas(
      pages[i],
      i,
      pages.length,
      settings,
      canvasW,
      canvasH
    );
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');

    completed += 1;
    onProgress?.(completed, totalSteps);

    await new Promise((resolve) => setTimeout(resolve, 12));
  }

  if (settings.includeClosing) {
    pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    const closingCanvas = await renderClosingCanvas(settings, canvasW, canvasH);
    const closingData = closingCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(closingData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    completed += 1;
    onProgress?.(completed, totalSteps);
  }

  const safeFileName = sanitizeFileName(
    settings.albumTitle.trim() || '모노그래프-포토앨범'
  );
  pdf.save(`${safeFileName}.pdf`);
}
