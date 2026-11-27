/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { UploadStage } from './components/UploadStage';
import { AlbumPageViewer } from './components/AlbumPageViewer';
import { ContactSheetGrid } from './components/ContactSheetGrid';
import { LayoutSettingsDrawer } from './components/LayoutSettingsDrawer';
import { PdfExportModal } from './components/PdfExportModal';
import {
  SAMPLE_ALBUM_AUTHOR,
  SAMPLE_ALBUM_DATE,
  SAMPLE_ALBUM_SUBTITLE,
  SAMPLE_ALBUM_TITLE,
  SAMPLE_CLOSING_MESSAGE,
  SAMPLE_PHOTO_PAGES,
} from './data/sampleAlbum';
import type { AlbumSettings, PhotoPage, WorkspaceView } from './types/album';
import { filesToPhotoPages } from './utils/imageLoader';

function getTodayFormatted(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${d}`;
}

const DEFAULT_SETTINGS: AlbumSettings = {
  albumTitle: '나의 사진 앨범',
  subtitle: '',
  authorName: '',
  albumDate: getTodayFormatted(),
  includeClosing: true,
  closingMessage: '',
  mood: 'white',
  fontStyle: 'serif',
  orientation: 'landscape',
  layoutStyle: 'classic',
  includeCover: true,
  showPageNumbers: true,
};

export default function App() {
  const [pages, setPages] = useState<PhotoPage[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [activeView, setActiveView] = useState<WorkspaceView>('viewer');
  const [settings, setSettings] = useState<AlbumSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pagesRef = useRef<PhotoPage[]>(pages);
  pagesRef.current = pages;

  // Revoke any created Object URLs when unmounting
  useEffect(() => {
    return () => {
      pagesRef.current.forEach((p) => {
        if (p.isObjectUrl) {
          URL.revokeObjectURL(p.src);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!noticeMessage) {
      return;
    }
    const timer = window.setTimeout(() => setNoticeMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [noticeMessage]);

  const coverOffset = settings.includeCover ? 1 : 0;

  const handleAddFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setIsProcessingFiles(true);
      try {
        const newPages = await filesToPhotoPages(fileList);
        if (newPages.length === 0) {
          setNoticeMessage('이미지 파일(JPG, PNG, WEBP 등)만 앨범에 추가할 수 있습니다.');
          return;
        }

        setPages((prev) => {
          // If starting from empty album and cover is enabled, show the cover first;
          // if appending to an existing album, jump to the first newly added photo.
          const nextSlot =
            prev.length === 0 ? 0 : coverOffset + prev.length;
          setCurrentSlotIndex(nextSlot);
          return [...prev, ...newPages];
        });
        setActiveView('viewer');
      } finally {
        setIsProcessingFiles(false);
      }
    },
    [coverOffset]
  );

  const handleLoadSample = useCallback(() => {
    setPages(SAMPLE_PHOTO_PAGES.map((p) => ({ ...p })));
    setSettings((prev) => ({
      ...prev,
      albumTitle: SAMPLE_ALBUM_TITLE,
      subtitle: SAMPLE_ALBUM_SUBTITLE,
      authorName: SAMPLE_ALBUM_AUTHOR,
      albumDate: SAMPLE_ALBUM_DATE,
      closingMessage: SAMPLE_CLOSING_MESSAGE,
    }));
    setCurrentSlotIndex(0);
    setActiveView('viewer');
  }, []);

  const handleUpdatePage = useCallback(
    (id: string, patch: Partial<Pick<PhotoPage, 'title' | 'description'>>) => {
      setPages((prev) =>
        prev.map((page) => (page.id === id ? { ...page, ...patch } : page))
      );
    },
    []
  );

  const handleDeletePage = useCallback(
    (id: string) => {
      setPages((prev) => {
        const targetIndex = prev.findIndex((p) => p.id === id);
        if (targetIndex === -1) {
          return prev;
        }
        const target = prev[targetIndex];
        if (target.isObjectUrl) {
          URL.revokeObjectURL(target.src);
        }
        const next = prev.filter((p) => p.id !== id);
        const totalSlotsAfter =
          next.length + coverOffset + (settings.includeClosing ? 1 : 0);
        const deletedSlot = coverOffset + targetIndex;

        setCurrentSlotIndex((curr) => {
          if (next.length === 0) {
            return 0;
          }
          if (curr >= totalSlotsAfter) {
            return Math.max(0, totalSlotsAfter - 1);
          }
          if (deletedSlot < curr) {
            return curr - 1;
          }
          return curr;
        });

        if (next.length === 0) {
          setActiveView('viewer');
        }
        return next;
      });
    },
    [coverOffset, settings.includeClosing]
  );

  const handleMovePage = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPages((prev) => {
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length ||
          fromIndex === toIndex
        ) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
      setCurrentSlotIndex((curr) => {
        if (curr === coverOffset + fromIndex) {
          return coverOffset + toIndex;
        }
        return curr;
      });
    },
    [coverOffset]
  );

  const handleReplacePhoto = useCallback(async (id: string, file: File) => {
    const parsed = await filesToPhotoPages([file]);
    if (parsed.length === 0) {
      setNoticeMessage('올바른 이미지 파일을 선택해 주세요.');
      return;
    }
    const replacement = parsed[0];
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== id) {
          return page;
        }
        if (page.isObjectUrl) {
          URL.revokeObjectURL(page.src);
        }
        return {
          ...page,
          src: replacement.src,
          fileName: replacement.fileName,
          aspectRatio: replacement.aspectRatio,
          isObjectUrl: true,
        };
      })
    );
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<AlbumSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.includeCover !== undefined && patch.includeCover !== prev.includeCover) {
        setCurrentSlotIndex((curr) =>
          patch.includeCover ? curr + 1 : Math.max(0, curr - 1)
        );
      }
      return next;
    });
  }, []);

  const triggerGlobalUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const currentPhotoIndexForGrid = Math.max(
    0,
    Math.min(pages.length - 1, currentSlotIndex - coverOffset)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3EF] text-[#18181B]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleAddFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <TopBar
        hasPhotos={pages.length > 0}
        activeView={activeView}
        onChangeView={setActiveView}
        onTriggerUpload={triggerGlobalUpload}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {noticeMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-lg bg-[#18181B] text-white text-sm shadow-lg"
        >
          {noticeMessage}
        </div>
      )}

      <main className="flex-1">
        {pages.length === 0 ? (
          <UploadStage
            onFilesSelected={handleAddFiles}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessingFiles}
          />
        ) : activeView === 'grid' ? (
          <ContactSheetGrid
            pages={pages}
            currentIndex={currentPhotoIndexForGrid}
            onOpenPage={(photoIndex) => {
              setCurrentSlotIndex(coverOffset + photoIndex);
              setActiveView('viewer');
            }}
            onMovePage={handleMovePage}
            onDeletePage={handleDeletePage}
            onAddFiles={handleAddFiles}
          />
        ) : (
          <AlbumPageViewer
            pages={pages}
            currentSlotIndex={currentSlotIndex}
            settings={settings}
            onSelectSlot={setCurrentSlotIndex}
            onUpdateSettings={handleUpdateSettings}
            onUpdatePage={handleUpdatePage}
            onDeletePage={handleDeletePage}
            onMovePage={handleMovePage}
            onReplacePhoto={handleReplacePhoto}
            onAddFiles={handleAddFiles}
          />
        )}
      </main>

      <LayoutSettingsDrawer
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />

      <PdfExportModal
        isOpen={isExportOpen}
        pages={pages}
        settings={settings}
        onClose={() => setIsExportOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}

