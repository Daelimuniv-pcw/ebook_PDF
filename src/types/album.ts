export type PageOrientation = 'landscape' | 'portrait';

export type PageLayoutStyle = 'classic' | 'editorial' | 'minimal';

export type AlbumMood = 'white' | 'beige' | 'navy';

export type AlbumFont = 'gothic' | 'serif' | 'handwriting';

export type WorkspaceView = 'viewer' | 'grid';

export interface PhotoPage {
  id: string;
  src: string;
  fileName: string;
  title: string;
  description: string;
  aspectRatio: number;
  isObjectUrl?: boolean;
}

export interface AlbumSettings {
  albumTitle: string;
  subtitle: string;
  authorName: string;
  albumDate: string;
  coverPhotoId?: string;
  includeClosing: boolean;
  closingMessage: string;
  mood: AlbumMood;
  fontStyle: AlbumFont;
  orientation: PageOrientation;
  layoutStyle: PageLayoutStyle;
  includeCover: boolean;
  showPageNumbers: boolean;
}
