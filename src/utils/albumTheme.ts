import type { AlbumFont, AlbumMood } from '../types/album';

export interface AlbumThemeTokens {
  id: AlbumMood;
  label: string;
  swatchHex: string;
  pageBg: string;
  matBg: string;
  border: string;
  innerBorder: string;
  divider: string;
  strongDivider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
}

export const ALBUM_THEMES: Record<AlbumMood, AlbumThemeTokens> = {
  white: {
    id: 'white',
    label: '흰색(깔끔)',
    swatchHex: '#FFFFFF',
    pageBg: '#FFFFFF',
    matBg: '#FAF9F6',
    border: '#E2E0D8',
    innerBorder: '#ECEAE3',
    divider: '#D6D5CE',
    strongDivider: '#18181B',
    textPrimary: '#18181B',
    textSecondary: '#52524C',
    textMuted: '#71706A',
    placeholder: '#B5B3AA',
  },
  beige: {
    id: 'beige',
    label: '베이지(따뜻한 종이)',
    swatchHex: '#F6EFE2',
    pageBg: '#F6EFE2',
    matBg: '#EDE4D3',
    border: '#DFD3BF',
    innerBorder: '#E5DAC7',
    divider: '#D2C5AF',
    strongDivider: '#3D332B',
    textPrimary: '#29221C',
    textSecondary: '#5C5046',
    textMuted: '#786B5E',
    placeholder: '#A89B8C',
  },
  navy: {
    id: 'navy',
    label: '네이비(차분함)',
    swatchHex: '#142136',
    pageBg: '#142136',
    matBg: '#1B2B45',
    border: '#2A3C59',
    innerBorder: '#243550',
    divider: '#33486B',
    strongDivider: '#D8E0EB',
    textPrimary: '#F5F6F8',
    textSecondary: '#CBD4E1',
    textMuted: '#96A5BC',
    placeholder: '#70829E',
  },
};

export const ALBUM_MOOD_ORDER: AlbumMood[] = ['white', 'beige', 'navy'];

export interface AlbumFontTokens {
  id: AlbumFont;
  label: string;
  fontFamily: string;
  canvasScale: number;
  titleWeight: string;
}

export const ALBUM_FONTS: Record<AlbumFont, AlbumFontTokens> = {
  gothic: {
    id: 'gothic',
    label: '고딕',
    fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", -apple-system, sans-serif',
    canvasScale: 1,
    titleWeight: '700',
  },
  serif: {
    id: 'serif',
    label: '명조',
    fontFamily: '"Playfair Display", "Noto Serif KR", Georgia, serif',
    canvasScale: 1,
    titleWeight: '700',
  },
  handwriting: {
    id: 'handwriting',
    label: '손글씨',
    fontFamily: '"Nanum Pen Script", "Noto Sans KR", cursive',
    canvasScale: 1.24,
    titleWeight: '400',
  },
};

export const ALBUM_FONT_ORDER: AlbumFont[] = ['gothic', 'serif', 'handwriting'];

export async function ensureAlbumFontLoaded(font: AlbumFont): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) {
    return;
  }

  const loaders: Promise<FontFace[]>[] = [];
  if (font === 'handwriting') {
    loaders.push(document.fonts.load('400 32px "Nanum Pen Script"'));
    loaders.push(document.fonts.load('400 24px "Noto Sans KR"'));
  } else if (font === 'serif') {
    loaders.push(document.fonts.load('400 28px "Noto Serif KR"'));
    loaders.push(document.fonts.load('700 42px "Noto Serif KR"'));
    loaders.push(document.fonts.load('700 42px "Playfair Display"'));
  } else {
    loaders.push(document.fonts.load('400 28px "Noto Sans KR"'));
    loaders.push(document.fonts.load('700 42px "Noto Sans KR"'));
    loaders.push(document.fonts.load('700 42px "Plus Jakarta Sans"'));
  }

  try {
    await Promise.all(loaders);
  } catch {
    // Ignore individual font load errors and wait on fonts.ready
  }
  await document.fonts.ready;
}
