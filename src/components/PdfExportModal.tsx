import { useState } from 'react';
import { Download, CheckCircle2, X, AlertCircle, ImageDown } from 'lucide-react';
import type { AlbumSettings, PhotoPage } from '../types/album';
import { ALBUM_FONTS, ALBUM_THEMES } from '../utils/albumTheme';
import { exportAlbumToPdf, exportAllPagesToPng } from '../utils/pdfGenerator';

interface PdfExportModalProps {
  isOpen: boolean;
  pages: PhotoPage[];
  settings: AlbumSettings;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<AlbumSettings>) => void;
}

const LAYOUT_LABEL: Record<AlbumSettings['layoutStyle'], string> = {
  classic: '클래식 프레임',
  editorial: '에디토리얼 분할',
  minimal: '미니멀 풀프레임',
};

export function PdfExportModal({
  isOpen,
  pages,
  settings,
  onClose,
  onUpdateSettings,
}: PdfExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [doneFormat, setDoneFormat] = useState<'pdf' | 'png' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const totalPdfPages =
    pages.length +
    (settings.includeCover ? 1 : 0) +
    (settings.includeClosing ? 1 : 0);

  const handleExport = async (format: 'pdf' | 'png') => {
    setIsExporting(true);
    setExportFormat(format);
    setDoneFormat(null);
    setErrorMsg(null);
    setProgress({ current: 0, total: totalPdfPages });

    try {
      if (format === 'pdf') {
        await exportAlbumToPdf(pages, settings, (current, total) => {
          setProgress({ current, total });
        });
      } else {
        await exportAllPagesToPng(pages, settings, (current, total) => {
          setProgress({ current, total });
        });
      }
      setDoneFormat(format);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '파일을 생성하는 중 오류가 발생했습니다.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (isExporting) {
      return;
    }
    setDoneFormat(null);
    setErrorMsg(null);
    setProgress(null);
    onClose();
  };

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const compositionParts = [
    settings.includeCover ? '표지 1쪽' : null,
    `사진 ${pages.length}쪽`,
    settings.includeClosing ? '마무리 1쪽' : null,
  ]
    .filter(Boolean)
    .join(' + ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-export-title"
    >
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl border border-[#E2E0D8] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EFECE6] flex items-center justify-between">
          <h2 id="pdf-export-title" className="font-serif text-xl font-semibold text-[#18181B]">
            앨범 저장 (PDF · PNG)
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            aria-label="닫기"
            className="p-1.5 text-[#52524C] hover:text-[#18181B] disabled:opacity-40 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div>
            <label
              htmlFor="export-album-title"
              className="block text-xs font-medium text-[#52524C] mb-1.5"
            >
              저장할 앨범 제목 (파일명)
            </label>
            <input
              id="export-album-title"
              type="text"
              disabled={isExporting}
              value={settings.albumTitle}
              onChange={(e) => onUpdateSettings({ albumTitle: e.target.value })}
              placeholder="나의 포토 앨범"
              className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-[#FAF9F6] border border-[#E2E0D8] rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="border-t border-b border-[#EFECE6] py-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#6B6B65] shrink-0">구성</span>
              <span className="font-medium text-[#18181B] tabular-nums text-right">
                {compositionParts} (총 {totalPdfPages}페이지)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B65]">용지 규격</span>
              <span className="font-medium text-[#18181B]">
                {settings.orientation === 'landscape' ? 'A4 가로형' : 'A4 세로형'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B65]">레이아웃</span>
              <span className="font-medium text-[#18181B]">
                {LAYOUT_LABEL[settings.layoutStyle]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B65]">색 분위기</span>
              <span className="font-medium text-[#18181B]">
                {ALBUM_THEMES[settings.mood].label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B65]">글꼴</span>
              <span className="font-medium text-[#18181B]">
                {ALBUM_FONTS[settings.fontStyle].label}
              </span>
            </div>
          </div>

          {isExporting && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#52524C]">
                <span>
                  {exportFormat === 'pdf' ? 'PDF 페이지 변환 중...' : 'PNG 이미지 저장 중...'}
                </span>
                <span className="font-mono tabular-nums">
                  {progress.current} / {progress.total} ({percent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all duration-150"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {doneFormat && !isExporting && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-sm text-[#166534]">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {doneFormat === 'pdf'
                    ? 'PDF 파일 저장이 완료되었습니다.'
                    : 'PNG 이미지 저장이 완료되었습니다.'}
                </p>
                <p className="text-xs mt-0.5 text-[#15803D]">
                  브라우저 다운로드 폴더에서 확인하실 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#EFECE6] flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className="px-3 py-2 text-sm font-medium text-[#52524C] hover:text-[#18181B] disabled:opacity-40 rounded-lg transition-colors"
          >
            {doneFormat ? '닫기' : '취소'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('png')}
              disabled={isExporting || pages.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#18181B] bg-white hover:bg-[#F4F3EF] border border-[#E2E0D8] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <ImageDown className="w-4 h-4" />
              <span>전체 PNG</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting || pages.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#18181B] hover:bg-[#2563EB] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting && exportFormat === 'pdf'
                  ? 'PDF 생성 중...'
                  : 'PDF 다운로드'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
