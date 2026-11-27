import { useEffect, useMemo, useState, type CSSProperties, type DragEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ImageOff,
  RefreshCw,
  ImageDown,
} from 'lucide-react';
import type { AlbumSettings, PhotoPage } from '../types/album';
import {
  ALBUM_FONTS,
  ALBUM_FONT_ORDER,
  ALBUM_MOOD_ORDER,
  ALBUM_THEMES,
} from '../utils/albumTheme';
import { exportSingleSlotToPng } from '../utils/pdfGenerator';

type AlbumSlot =
  | { kind: 'cover' }
  | { kind: 'photo'; photoIndex: number; page: PhotoPage }
  | { kind: 'closing' };

interface AlbumPageViewerProps {
  pages: PhotoPage[];
  currentSlotIndex: number;
  settings: AlbumSettings;
  onSelectSlot: (slotIndex: number) => void;
  onUpdateSettings: (patch: Partial<AlbumSettings>) => void;
  onUpdatePage: (id: string, patch: Partial<Pick<PhotoPage, 'title' | 'description'>>) => void;
  onDeletePage: (id: string) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onReplacePhoto: (id: string, file: File) => void;
  onAddFiles: (files: FileList | File[]) => void;
}

export function AlbumPageViewer({
  pages,
  currentSlotIndex,
  settings,
  onSelectSlot,
  onUpdateSettings,
  onUpdatePage,
  onDeletePage,
  onMovePage,
  onReplacePhoto,
  onAddFiles,
}: AlbumPageViewerProps) {
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isSavingPng, setIsSavingPng] = useState(false);

  const slots = useMemo<AlbumSlot[]>(() => {
    const list: AlbumSlot[] = [];
    if (settings.includeCover) {
      list.push({ kind: 'cover' });
    }
    pages.forEach((page, idx) => {
      list.push({ kind: 'photo', photoIndex: idx, page });
    });
    if (settings.includeClosing) {
      list.push({ kind: 'closing' });
    }
    return list;
  }, [pages, settings.includeCover, settings.includeClosing]);

  const safeSlotIndex = Math.min(Math.max(0, currentSlotIndex), Math.max(0, slots.length - 1));
  const currentSlot = slots[safeSlotIndex];
  const hasPrev = safeSlotIndex > 0;
  const hasNext = safeSlotIndex < slots.length - 1;

  const theme = ALBUM_THEMES[settings.mood];
  const activeFont = ALBUM_FONTS[settings.fontStyle];
  const isHandwriting = settings.fontStyle === 'handwriting';

  const coverPhoto =
    pages.find((p) => p.id === settings.coverPhotoId) ?? pages[0] ?? null;

  const goPrev = () => {
    if (hasPrev) {
      onSelectSlot(safeSlotIndex - 1);
    }
  };

  const goNext = () => {
    if (hasNext) {
      onSelectSlot(safeSlotIndex + 1);
    }
  };

  const handleSaveCurrentPng = async () => {
    if (!currentSlot || isSavingPng) {
      return;
    }
    setIsSavingPng(true);
    try {
      await exportSingleSlotToPng(currentSlot, pages, settings);
    } finally {
      setIsSavingPng(false);
    }
  };

  // Keyboard arrow navigation when user is not typing inside an input/textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowLeft' && safeSlotIndex > 0) {
        e.preventDefault();
        onSelectSlot(safeSlotIndex - 1);
      } else if (e.key === 'ArrowRight' && safeSlotIndex < slots.length - 1) {
        e.preventDefault();
        onSelectSlot(safeSlotIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeSlotIndex, slots.length, onSelectSlot]);

  if (!currentSlot) {
    return null;
  }

  const isLandscape = settings.orientation === 'landscape';

  const handleDropFiles = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const slotPositionLabel = `${String(safeSlotIndex + 1).padStart(2, '0')} / ${String(
    slots.length
  ).padStart(2, '0')}`;

  const photoPageNumberLabel =
    currentSlot.kind === 'photo'
      ? `${String(currentSlot.photoIndex + 1).padStart(2, '0')} / ${String(
          pages.length
        ).padStart(2, '0')}`
      : '';

  const colophonText = [settings.authorName.trim(), settings.albumDate.trim()]
    .filter(Boolean)
    .join(' · ');

  const sheetCssVars = {
    backgroundColor: theme.pageBg,
    borderColor: theme.border,
    color: theme.textPrimary,
    '--sheet-placeholder': theme.placeholder,
  } as CSSProperties;

  const albumFontStyle: CSSProperties = {
    fontFamily: activeFont.fontFamily,
  };

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={handleDropFiles}
      className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6 sm:py-8"
    >
      {/* Album Color Mood & Font Style Bar + Context Utility Bar */}
      <div className="max-w-[1040px] mx-auto mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E0D8]">
          {/* 3 Mood Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#52524C] mr-0.5 whitespace-nowrap">
              색 분위기
            </span>
            <div
              role="group"
              aria-label="앨범 색 분위기 선택"
              className="inline-flex flex-wrap items-center gap-1.5"
            >
              {ALBUM_MOOD_ORDER.map((moodKey) => {
                const opt = ALBUM_THEMES[moodKey];
                const isActive = settings.mood === moodKey;
                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => onUpdateSettings({ mood: moodKey })}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                      isActive
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-white text-[#18181B] border-[#E2E0D8] hover:border-[#18181B]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: opt.swatchHex }}
                      aria-hidden="true"
                    />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Font Style Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#52524C] mr-0.5 whitespace-nowrap">
              글꼴
            </span>
            <div
              role="group"
              aria-label="앨범 글꼴 선택"
              className="inline-flex items-center gap-1.5"
            >
              {ALBUM_FONT_ORDER.map((fontKey) => {
                const opt = ALBUM_FONTS[fontKey];
                const isActive = settings.fontStyle === fontKey;
                return (
                  <button
                    key={fontKey}
                    type="button"
                    onClick={() => onUpdateSettings({ fontStyle: fontKey })}
                    aria-pressed={isActive}
                    style={{ fontFamily: opt.fontFamily }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                      isActive
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-white text-[#18181B] border-[#E2E0D8] hover:border-[#18181B]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Context Utility Bar for Current Page */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {currentSlot.kind === 'cover' ? (
            <>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#6B6B65] min-w-0">
                <span className="font-mono font-medium text-[#18181B] tabular-nums whitespace-nowrap shrink-0">
                  표지 (첫 쪽)
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">
                  표지 사진과 제목, 부제, 이름, 날짜를 설정하세요
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pages.length > 0 && (
                  <>
                    <label
                      htmlFor="cover-photo-select"
                      className="text-xs font-medium text-[#52524C] whitespace-nowrap"
                    >
                      표지 사진
                    </label>
                    <select
                      id="cover-photo-select"
                      value={coverPhoto?.id ?? ''}
                      onChange={(e) =>
                        onUpdateSettings({ coverPhotoId: e.target.value })
                      }
                      className="px-2.5 py-1.5 text-xs text-[#18181B] bg-white border border-[#E2E0D8] rounded-md focus:outline-none focus:border-[#2563EB] max-w-[180px]"
                    >
                      {pages.map((p, idx) => (
                        <option key={p.id} value={p.id}>
                          {String(idx + 1).padStart(2, '0')}. {p.title.trim() || p.fileName}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleSaveCurrentPng}
                  disabled={isSavingPng}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#18181B] bg-white hover:bg-[#FAF9F6] border border-[#E2E0D8] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <ImageDown className="w-3.5 h-3.5" />
                  <span>{isSavingPng ? '저장 중...' : '이 쪽 PNG 저장'}</span>
                </button>
              </div>
            </>
          ) : currentSlot.kind === 'closing' ? (
            <>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#6B6B65] min-w-0">
                <span className="font-mono font-medium text-[#18181B] tabular-nums whitespace-nowrap shrink-0">
                  마무리 (마지막 쪽)
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">앨범을 맺는 마무리 문구를 적어보세요</span>
              </div>
              <button
                type="button"
                onClick={handleSaveCurrentPng}
                disabled={isSavingPng}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#18181B] bg-white hover:bg-[#FAF9F6] border border-[#E2E0D8] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <ImageDown className="w-3.5 h-3.5" />
                <span>{isSavingPng ? '저장 중...' : '이 쪽 PNG 저장'}</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#6B6B65] min-w-0">
                <span className="font-mono font-medium text-[#18181B] tabular-nums whitespace-nowrap shrink-0">
                  사진 {photoPageNumberLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {currentSlot.page.fileName}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline whitespace-nowrap shrink-0">
                  {isLandscape ? '가로 A4' : '세로 A4'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onMovePage(currentSlot.photoIndex, currentSlot.photoIndex - 1)
                  }
                  disabled={currentSlot.photoIndex === 0}
                  title="이전 순서로 이동"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#52524C] hover:text-[#18181B] hover:bg-white/80 disabled:opacity-35 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">순서 앞</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onMovePage(currentSlot.photoIndex, currentSlot.photoIndex + 1)
                  }
                  disabled={currentSlot.photoIndex === pages.length - 1}
                  title="다음 순서로 이동"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#52524C] hover:text-[#18181B] hover:bg-white/80 disabled:opacity-35 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <span className="hidden md:inline">순서 뒤</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#52524C] hover:text-[#18181B] hover:bg-white/80 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>사진 교체</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onReplacePhoto(currentSlot.page.id, file);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveCurrentPng}
                  disabled={isSavingPng}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#18181B] bg-white hover:bg-[#FAF9F6] border border-[#E2E0D8] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <ImageDown className="w-3.5 h-3.5" />
                  <span>{isSavingPng ? '저장 중...' : 'PNG 저장'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePage(currentSlot.page.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#6B6B65] hover:text-[#DC2626] hover:bg-white/80 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Album Spread Stage with Flanking Previous / Next Buttons */}
      <div className="relative flex items-center justify-center gap-3 sm:gap-6">
        {/* Desktop Flanking Previous Button */}
        <button
          type="button"
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label="이전 페이지"
          className="hidden lg:flex flex-col items-center justify-center w-14 h-24 rounded-xl border border-[#E2E0D8] bg-white/85 hover:bg-white hover:border-[#18181B] text-[#18181B] disabled:opacity-30 disabled:hover:border-[#E2E0D8] disabled:cursor-not-allowed transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-medium mt-1">이전</span>
        </button>

        {/* The Archival Album Sheet */}
        <div
          className={`w-full transition-all duration-200 ${
            isLandscape ? 'max-w-[960px]' : 'max-w-[600px]'
          } ${isDraggingOver ? 'ring-4 ring-[#2563EB]/25 rounded-lg' : ''}`}
        >
          {currentSlot.kind === 'cover' ? (
            /* COVER PAGE (첫 쪽 표지 + 사진) */
            <article
              key="cover-sheet"
              style={sheetCssVars}
              className={`border shadow-[0_14px_44px_rgba(24,24,27,0.10)] flex flex-col transition-colors duration-200 ${
                isLandscape
                  ? 'min-h-[480px] sm:aspect-[297/210] p-5 sm:p-8 md:p-10'
                  : 'min-h-[600px] sm:aspect-[210/297] p-5 sm:p-8'
              }`}
            >
              <div
                className="flex-1 border p-1.5 sm:p-2 flex flex-col"
                style={{ borderColor: theme.border }}
              >
                <div
                  className="flex-1 border px-5 sm:px-10 py-6 sm:py-8 flex flex-col justify-between gap-4"
                  style={{ borderColor: theme.innerBorder }}
                >
                  <div
                    className={`flex-1 min-h-0 ${
                      isLandscape
                        ? 'grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center'
                        : 'flex flex-col justify-between gap-6'
                    }`}
                  >
                    {coverPhoto && (
                      <div
                        className={`${
                          isLandscape
                            ? 'md:col-span-6 h-full max-h-[340px] sm:max-h-[420px]'
                            : 'w-full h-[250px] sm:h-[310px]'
                        } border p-2.5 sm:p-3 flex items-center justify-center overflow-hidden transition-colors duration-200`}
                        style={{
                          backgroundColor: theme.matBg,
                          borderColor: theme.innerBorder,
                        }}
                      >
                        {imgErrorMap[coverPhoto.id] ? (
                          <div
                            className="w-full h-44 flex flex-col items-center justify-center gap-2"
                            style={{ color: theme.textMuted }}
                          >
                            <ImageOff className="w-6 h-6" />
                            <span className="text-xs">{coverPhoto.fileName}</span>
                          </div>
                        ) : (
                          <img
                            src={coverPhoto.src}
                            alt={coverPhoto.title || '표지 사진'}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setImgErrorMap((prev) => ({
                                ...prev,
                                [coverPhoto.id]: true,
                              }))
                            }
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    )}

                    <div
                      className={`${
                        coverPhoto && isLandscape
                          ? 'md:col-span-6 text-left items-start'
                          : 'w-full text-center items-center'
                      } flex flex-col justify-center`}
                    >
                      <label className="sr-only" htmlFor="cover-album-title">
                        앨범 제목
                      </label>
                      <textarea
                        id="cover-album-title"
                        rows={2}
                        value={settings.albumTitle}
                        onChange={(e) =>
                          onUpdateSettings({ albumTitle: e.target.value })
                        }
                        placeholder="앨범 제목을 입력하세요"
                        style={{ ...albumFontStyle, color: theme.textPrimary }}
                        className={`sheet-themed-input w-full tracking-tight bg-transparent border-b border-transparent hover:border-current/20 focus:border-[#2563EB] focus:outline-none pb-2 resize-none leading-tight transition-colors ${
                          isHandwriting
                            ? 'text-4xl sm:text-5xl font-normal'
                            : 'text-3xl sm:text-4xl md:text-[42px] font-bold'
                        } ${coverPhoto && isLandscape ? 'text-left' : 'text-center'}`}
                      />

                      <label className="sr-only" htmlFor="cover-album-subtitle">
                        앨범 부제
                      </label>
                      <input
                        id="cover-album-subtitle"
                        type="text"
                        value={settings.subtitle}
                        onChange={(e) =>
                          onUpdateSettings({ subtitle: e.target.value })
                        }
                        placeholder="부제를 입력하세요 (선택)"
                        style={{ ...albumFontStyle, color: theme.textSecondary }}
                        className={`sheet-themed-input w-full mt-2.5 bg-transparent border-b border-transparent hover:border-current/20 focus:border-[#2563EB] focus:outline-none pb-1.5 transition-colors ${
                          isHandwriting ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                        } ${coverPhoto && isLandscape ? 'text-left' : 'text-center'}`}
                      />

                      <div
                        className="w-12 h-[1.5px] my-5 sm:my-6"
                        style={{ backgroundColor: theme.strongDivider }}
                        aria-hidden="true"
                      />

                      <div
                        className={`w-full flex flex-wrap items-center gap-2.5 sm:gap-4 ${
                          coverPhoto && isLandscape
                            ? 'justify-start'
                            : 'justify-center'
                        }`}
                      >
                        <div className="min-w-[120px] max-w-[200px]">
                          <label className="sr-only" htmlFor="cover-author-name">
                            이름
                          </label>
                          <input
                            id="cover-author-name"
                            type="text"
                            value={settings.authorName}
                            onChange={(e) =>
                              onUpdateSettings({ authorName: e.target.value })
                            }
                            placeholder="이름 입력"
                            style={{
                              ...albumFontStyle,
                              color: theme.textPrimary,
                              borderColor: theme.divider,
                            }}
                            className={`sheet-themed-input w-full bg-transparent border-b border-dashed focus:border-[#2563EB] focus:border-solid focus:outline-none pb-1 transition-colors ${
                              isHandwriting
                                ? 'text-xl sm:text-2xl font-normal'
                                : 'text-base sm:text-lg font-semibold'
                            } ${coverPhoto && isLandscape ? 'text-left' : 'text-center'}`}
                          />
                        </div>

                        <span style={{ color: theme.textMuted }} aria-hidden="true">
                          ·
                        </span>

                        <div className="min-w-[130px] max-w-[200px]">
                          <label className="sr-only" htmlFor="cover-album-date">
                            날짜
                          </label>
                          <input
                            id="cover-album-date"
                            type="text"
                            value={settings.albumDate}
                            onChange={(e) =>
                              onUpdateSettings({ albumDate: e.target.value })
                            }
                            placeholder="날짜 (2026. 11. 26)"
                            style={{
                              ...albumFontStyle,
                              color: theme.textPrimary,
                              borderColor: theme.divider,
                            }}
                            className={`sheet-themed-input w-full bg-transparent border-b border-dashed focus:border-[#2563EB] focus:border-solid focus:outline-none pb-1 transition-colors ${
                              isHandwriting
                                ? 'text-xl sm:text-2xl font-normal'
                                : 'text-base sm:text-lg font-semibold'
                            } ${coverPhoto && isLandscape ? 'text-left' : 'text-center'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    className="font-mono text-xs text-center tabular-nums tracking-wider"
                    style={{ color: theme.textMuted }}
                  >
                    {String(pages.length).padStart(2, '0')} PHOTOGRAPHS
                  </p>
                </div>
              </div>
            </article>
          ) : currentSlot.kind === 'closing' ? (
            /* CLOSING PAGE (마지막 쪽 마무리) */
            <article
              key="closing-sheet"
              style={sheetCssVars}
              className={`border shadow-[0_14px_44px_rgba(24,24,27,0.10)] flex flex-col transition-colors duration-200 ${
                isLandscape
                  ? 'min-h-[480px] sm:aspect-[297/210] p-5 sm:p-8 md:p-10'
                  : 'min-h-[600px] sm:aspect-[210/297] p-5 sm:p-8'
              }`}
            >
              <div
                className="flex-1 border px-5 sm:px-14 py-8 flex flex-col items-center justify-between"
                style={{ borderColor: theme.innerBorder }}
              >
                <div className="h-4" aria-hidden="true" />

                <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
                  <label className="sr-only" htmlFor="closing-message-input">
                    마무리 문구
                  </label>
                  <textarea
                    id="closing-message-input"
                    rows={4}
                    value={settings.closingMessage}
                    onChange={(e) =>
                      onUpdateSettings({ closingMessage: e.target.value })
                    }
                    placeholder="앨범의 마지막을 장식할 마무리 문구를 적어보세요"
                    style={{ ...albumFontStyle, color: theme.textPrimary }}
                    className={`sheet-themed-input w-full leading-relaxed text-center bg-transparent border border-transparent hover:border-current/15 focus:border-[#2563EB] focus:outline-none rounded-lg p-3 resize-none transition-colors ${
                      isHandwriting ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
                    }`}
                  />

                  {colophonText && (
                    <>
                      <div
                        className="w-10 h-px my-6"
                        style={{ backgroundColor: theme.divider }}
                        aria-hidden="true"
                      />
                      <p
                        style={{ ...albumFontStyle, color: theme.textSecondary }}
                        className={isHandwriting ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}
                      >
                        {colophonText}
                      </p>
                    </>
                  )}
                </div>

                <p
                  className="text-xs truncate max-w-full"
                  style={{ ...albumFontStyle, color: theme.textMuted }}
                >
                  {settings.albumTitle.trim() || '모노그래프 앨범'}
                </p>
              </div>
            </article>
          ) : (
            /* PHOTO PAGE (한 쪽에 한 장씩) */
            <article
              key={currentSlot.page.id}
              style={sheetCssVars}
              className={`border shadow-[0_14px_44px_rgba(24,24,27,0.10)] flex flex-col justify-between transition-colors duration-200 ${
                isLandscape
                  ? 'min-h-[480px] sm:aspect-[297/210] p-6 sm:p-10 md:p-12'
                  : 'min-h-[600px] sm:aspect-[210/297] p-6 sm:p-10'
              }`}
            >
              {settings.layoutStyle === 'editorial' && isLandscape ? (
                /* Editorial Landscape: Left Photo + Right Typography */
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center min-h-0">
                  <div
                    className="md:col-span-7 h-full max-h-[380px] sm:max-h-[430px] flex items-center justify-center border p-2 sm:p-3 transition-colors duration-200"
                    style={{
                      backgroundColor: theme.matBg,
                      borderColor: theme.innerBorder,
                    }}
                  >
                    {imgErrorMap[currentSlot.page.id] ? (
                      <div
                        className="w-full h-56 flex flex-col items-center justify-center gap-2"
                        style={{ color: theme.textMuted }}
                      >
                        <ImageOff className="w-6 h-6" />
                        <span className="text-xs">{currentSlot.page.fileName}</span>
                      </div>
                    ) : (
                      <img
                        src={currentSlot.page.src}
                        alt={currentSlot.page.title || currentSlot.page.fileName}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrorMap((prev) => ({
                            ...prev,
                            [currentSlot.page.id]: true,
                          }))
                        }
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-center">
                    <label className="sr-only" htmlFor={`title-${currentSlot.page.id}`}>
                      사진 제목
                    </label>
                    <input
                      id={`title-${currentSlot.page.id}`}
                      type="text"
                      value={currentSlot.page.title}
                      onChange={(e) =>
                        onUpdatePage(currentSlot.page.id, { title: e.target.value })
                      }
                      placeholder="사진 제목을 입력하세요"
                      style={{ ...albumFontStyle, color: theme.textPrimary }}
                      className={`sheet-themed-input w-full bg-transparent border-b border-transparent hover:border-current/20 focus:border-[#2563EB] focus:outline-none pb-2 transition-colors ${
                        isHandwriting
                          ? 'text-2xl sm:text-3xl font-normal'
                          : 'text-xl sm:text-2xl font-semibold'
                      }`}
                    />

                    <div
                      className="w-10 h-px my-4"
                      style={{ backgroundColor: theme.divider }}
                      aria-hidden="true"
                    />

                    <label className="sr-only" htmlFor={`desc-${currentSlot.page.id}`}>
                      사진 설명
                    </label>
                    <textarea
                      id={`desc-${currentSlot.page.id}`}
                      value={currentSlot.page.description}
                      onChange={(e) =>
                        onUpdatePage(currentSlot.page.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="이 사진에 담긴 이야기나 기록을 자유롭게 적어보세요..."
                      rows={6}
                      style={{ ...albumFontStyle, color: theme.textSecondary }}
                      className={`sheet-themed-input w-full leading-relaxed bg-transparent border border-transparent hover:border-current/15 focus:border-[#2563EB] focus:outline-none rounded-md p-1.5 -ml-1.5 resize-none transition-colors ${
                        isHandwriting ? 'text-lg sm:text-xl' : 'text-sm sm:text-[15px]'
                      }`}
                    />
                  </div>
                </div>
              ) : settings.layoutStyle === 'minimal' ? (
                /* Minimal Full-Frame Layout */
                <div className="flex-1 flex flex-col justify-between gap-4 min-h-0">
                  <div className="flex-1 min-h-[240px] flex items-center justify-center overflow-hidden">
                    {imgErrorMap[currentSlot.page.id] ? (
                      <div
                        className="w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-2"
                        style={{
                          backgroundColor: theme.matBg,
                          color: theme.textMuted,
                        }}
                      >
                        <ImageOff className="w-6 h-6" />
                        <span className="text-xs">{currentSlot.page.fileName}</span>
                      </div>
                    ) : (
                      <img
                        src={currentSlot.page.src}
                        alt={currentSlot.page.title || currentSlot.page.fileName}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrorMap((prev) => ({
                            ...prev,
                            [currentSlot.page.id]: true,
                          }))
                        }
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="sr-only" htmlFor={`title-${currentSlot.page.id}`}>
                      사진 제목
                    </label>
                    <input
                      id={`title-${currentSlot.page.id}`}
                      type="text"
                      value={currentSlot.page.title}
                      onChange={(e) =>
                        onUpdatePage(currentSlot.page.id, { title: e.target.value })
                      }
                      placeholder="사진 제목을 입력하세요"
                      style={{ ...albumFontStyle, color: theme.textPrimary }}
                      className={`sheet-themed-input w-full bg-transparent border-b border-transparent hover:border-current/20 focus:border-[#2563EB] focus:outline-none pb-1 transition-colors ${
                        isHandwriting
                          ? 'text-2xl sm:text-3xl font-normal'
                          : 'text-lg sm:text-xl font-semibold'
                      }`}
                    />
                    <label className="sr-only" htmlFor={`desc-${currentSlot.page.id}`}>
                      사진 설명
                    </label>
                    <textarea
                      id={`desc-${currentSlot.page.id}`}
                      value={currentSlot.page.description}
                      onChange={(e) =>
                        onUpdatePage(currentSlot.page.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="짧은 설명이나 촬영 메모를 입력하세요"
                      rows={2}
                      style={{ ...albumFontStyle, color: theme.textSecondary }}
                      className={`sheet-themed-input w-full mt-1 leading-relaxed bg-transparent border border-transparent hover:border-current/15 focus:border-[#2563EB] focus:outline-none rounded-md p-1 -ml-1 resize-none transition-colors ${
                        isHandwriting ? 'text-lg sm:text-xl' : 'text-sm'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                /* Classic Archival Frame (Default) or Portrait Editorial */
                <div className="flex-1 flex flex-col justify-between gap-5 min-h-0">
                  <div
                    className="flex-1 min-h-[220px] flex items-center justify-center border p-2 sm:p-3 overflow-hidden transition-colors duration-200"
                    style={{
                      backgroundColor: theme.matBg,
                      borderColor: theme.innerBorder,
                    }}
                  >
                    {imgErrorMap[currentSlot.page.id] ? (
                      <div
                        className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2"
                        style={{ color: theme.textMuted }}
                      >
                        <ImageOff className="w-6 h-6" />
                        <span className="text-xs">{currentSlot.page.fileName}</span>
                      </div>
                    ) : (
                      <img
                        src={currentSlot.page.src}
                        alt={currentSlot.page.title || currentSlot.page.fileName}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrorMap((prev) => ({
                            ...prev,
                            [currentSlot.page.id]: true,
                          }))
                        }
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>

                  <div
                    className={`pt-1 ${
                      settings.layoutStyle === 'classic'
                        ? 'text-center max-w-xl mx-auto w-full'
                        : 'text-left w-full'
                    }`}
                  >
                    <label className="sr-only" htmlFor={`title-${currentSlot.page.id}`}>
                      사진 제목
                    </label>
                    <input
                      id={`title-${currentSlot.page.id}`}
                      type="text"
                      value={currentSlot.page.title}
                      onChange={(e) =>
                        onUpdatePage(currentSlot.page.id, { title: e.target.value })
                      }
                      placeholder="사진 제목을 입력하세요"
                      style={{ ...albumFontStyle, color: theme.textPrimary }}
                      className={`sheet-themed-input w-full bg-transparent border-b border-transparent hover:border-current/20 focus:border-[#2563EB] focus:outline-none pb-1.5 transition-colors ${
                        isHandwriting
                          ? 'text-2xl sm:text-3xl font-normal'
                          : 'text-xl sm:text-2xl font-semibold'
                      } ${settings.layoutStyle === 'classic' ? 'text-center' : 'text-left'}`}
                    />

                    <label className="sr-only" htmlFor={`desc-${currentSlot.page.id}`}>
                      사진 설명
                    </label>
                    <textarea
                      id={`desc-${currentSlot.page.id}`}
                      value={currentSlot.page.description}
                      onChange={(e) =>
                        onUpdatePage(currentSlot.page.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="이 사진에 담긴 이야기나 설명을 적어보세요"
                      rows={isLandscape ? 2 : 4}
                      style={{ ...albumFontStyle, color: theme.textSecondary }}
                      className={`sheet-themed-input w-full mt-2 leading-relaxed bg-transparent border border-transparent hover:border-current/15 focus:border-[#2563EB] focus:outline-none rounded-md p-1.5 resize-none transition-colors ${
                        isHandwriting ? 'text-lg sm:text-xl' : 'text-sm sm:text-[15px]'
                      } ${settings.layoutStyle === 'classic' ? 'text-center' : 'text-left'}`}
                    />
                  </div>
                </div>
              )}

              {/* Printed Sheet Footer */}
              {settings.showPageNumbers && (
                <footer
                  className="mt-4 pt-3 border-t flex items-center justify-between text-xs"
                  style={{
                    borderColor: theme.innerBorder,
                    color: theme.textMuted,
                  }}
                >
                  <span
                    className="truncate max-w-[70%]"
                    style={albumFontStyle}
                  >
                    {settings.albumTitle.trim() || '모노그래프 앨범'}
                  </span>
                  <span className="font-mono tabular-nums shrink-0">
                    {photoPageNumberLabel}
                  </span>
                </footer>
              )}
            </article>
          )}
        </div>

        {/* Desktop Flanking Next Button */}
        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          aria-label="다음 페이지"
          className="hidden lg:flex flex-col items-center justify-center w-14 h-24 rounded-xl border border-[#E2E0D8] bg-white/85 hover:bg-white hover:border-[#18181B] text-[#18181B] disabled:opacity-30 disabled:hover:border-[#E2E0D8] disabled:cursor-not-allowed transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="text-xs font-medium mt-1">다음</span>
        </button>
      </div>

      {/* Prominent Bottom Previous / Next Bar (Accessible on all screen sizes) */}
      <div className="max-w-[960px] mx-auto mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={!hasPrev}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-[#18181B] bg-white hover:bg-[#FAF9F6] border border-[#E2E0D8] hover:border-[#18181B] disabled:opacity-35 disabled:hover:border-[#E2E0D8] disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전</span>
        </button>

        <div className="flex items-center gap-3 text-sm text-[#52524C]">
          <span className="font-mono font-medium text-[#18181B] tabular-nums">
            {slotPositionLabel}
          </span>
          <span className="hidden sm:inline text-xs text-[#8C8B84]">
            · 키보드 ← → 로 넘길 수 있습니다
          </span>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-[#18181B] bg-white hover:bg-[#FAF9F6] border border-[#E2E0D8] hover:border-[#18181B] disabled:opacity-35 disabled:hover:border-[#E2E0D8] disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <span>다음</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Filmstrip Thumbnail Rail (Cover -> Photos -> Closing) */}
      <div className="max-w-[960px] mx-auto mt-6 pt-5 border-t border-[#E2E0D8]">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {slots.map((slot, slotIdx) => {
            const isActive = slotIdx === safeSlotIndex;

            if (slot.kind === 'cover') {
              return (
                <button
                  key="slot-cover"
                  type="button"
                  onClick={() => onSelectSlot(slotIdx)}
                  className={`relative flex flex-col items-start shrink-0 rounded-lg p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    isActive
                      ? 'bg-white ring-2 ring-[#18181B]'
                      : 'bg-white/60 hover:bg-white border border-[#E2E0D8]'
                  }`}
                >
                  <div
                    className="w-20 h-14 border rounded overflow-hidden flex items-center justify-center p-1 gap-1"
                    style={{
                      backgroundColor: theme.pageBg,
                      borderColor: theme.border,
                    }}
                  >
                    {coverPhoto && (
                      <img
                        src={coverPhoto.src}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-8 h-full object-cover rounded-[2px] shrink-0"
                      />
                    )}
                    <span
                      className="text-[9px] font-semibold line-clamp-2 leading-tight text-left"
                      style={{ ...albumFontStyle, color: theme.textPrimary }}
                    >
                      {settings.albumTitle.trim() || '표지'}
                    </span>
                  </div>
                  <div className="w-20 mt-1 flex items-center justify-between gap-1 px-0.5">
                    <span className="font-mono text-[11px] font-medium text-[#18181B]">
                      표지
                    </span>
                    <span className="text-[11px] text-[#6B6B65] truncate">첫 쪽</span>
                  </div>
                </button>
              );
            }

            if (slot.kind === 'closing') {
              return (
                <button
                  key="slot-closing"
                  type="button"
                  onClick={() => onSelectSlot(slotIdx)}
                  className={`relative flex flex-col items-start shrink-0 rounded-lg p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    isActive
                      ? 'bg-white ring-2 ring-[#18181B]'
                      : 'bg-white/60 hover:bg-white border border-[#E2E0D8]'
                  }`}
                >
                  <div
                    className="w-20 h-14 border rounded flex flex-col items-center justify-center px-1.5 text-center"
                    style={{
                      backgroundColor: theme.pageBg,
                      borderColor: theme.border,
                    }}
                  >
                    <span
                      className="text-[10px] line-clamp-2 leading-tight"
                      style={{ ...albumFontStyle, color: theme.textSecondary }}
                    >
                      {settings.closingMessage.trim() || '마무리 글'}
                    </span>
                  </div>
                  <div className="w-20 mt-1 flex items-center justify-between gap-1 px-0.5">
                    <span className="font-mono text-[11px] font-medium text-[#18181B]">
                      마무리
                    </span>
                    <span className="text-[11px] text-[#6B6B65] truncate">끝 쪽</span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={slot.page.id}
                type="button"
                onClick={() => onSelectSlot(slotIdx)}
                className={`group relative flex flex-col items-start shrink-0 rounded-lg p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  isActive
                    ? 'bg-white ring-2 ring-[#18181B]'
                    : 'bg-white/60 hover:bg-white border border-[#E2E0D8]'
                }`}
              >
                <div className="w-20 h-14 bg-[#F4F3EF] rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={slot.page.src}
                    alt={slot.page.title || `${slot.photoIndex + 1}번 사진`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-20 mt-1 flex items-center justify-between gap-1 px-0.5">
                  <span className="font-mono text-[11px] text-[#6B6B65] tabular-nums">
                    {String(slot.photoIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] text-[#52524C] truncate">
                    {slot.page.title.trim() || '제목 없음'}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Quick Add More Photos Tile */}
          <label className="shrink-0 w-24 h-[78px] rounded-lg border border-dashed border-[#C9C7BE] hover:border-[#18181B] bg-white/40 hover:bg-white flex flex-col items-center justify-center gap-1 text-[#52524C] hover:text-[#18181B] cursor-pointer transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium whitespace-nowrap">사진 추가</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
