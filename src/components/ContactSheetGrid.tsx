import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react';
import type { PhotoPage } from '../types/album';

interface ContactSheetGridProps {
  pages: PhotoPage[];
  currentIndex: number;
  onOpenPage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onDeletePage: (id: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
}

export function ContactSheetGrid({
  pages,
  currentIndex,
  onOpenPage,
  onMovePage,
  onDeletePage,
  onAddFiles,
}: ContactSheetGridProps) {
  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-5 border-b border-[#E2E0D8]">
        <div>
          <p className="font-mono text-xs text-[#6B6B65] tabular-nums mb-1">
            총 {pages.length}페이지
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
            전체 사진 모아보기
          </h1>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#18181B] hover:bg-[#2563EB] rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0">
          <ImagePlus className="w-4 h-4" />
          <span>사진 여러 장 추가</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={page.id}
              className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden ${
                isCurrent
                  ? 'border-[#18181B] shadow-[0_6px_20px_rgba(24,24,27,0.08)]'
                  : 'border-[#E2E0D8] hover:border-[#B8B6AD]'
              }`}
            >
              <button
                type="button"
                onClick={() => onOpenPage(idx)}
                className="aspect-[4/3] w-full bg-[#FAF9F6] border-b border-[#EFECE6] overflow-hidden flex items-center justify-center p-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <img
                  src={page.src}
                  alt={page.title || page.fileName}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              </button>

              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#6B6B65] mb-1.5">
                    <span className="font-mono tabular-nums">
                      {String(idx + 1).padStart(2, '0')}쪽
                    </span>
                    <span className="truncate max-w-[160px]">{page.fileName}</span>
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-[#18181B] truncate">
                    {page.title.trim() || '제목 없음'}
                  </h2>
                  <p className="text-sm text-[#52524C] line-clamp-2 mt-1 min-h-[40px]">
                    {page.description.trim() || '아직 작성된 설명이 없습니다.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F1F0EB] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenPage(idx)}
                    className="text-xs font-medium text-[#18181B] hover:text-[#2563EB] underline underline-offset-4 transition-colors whitespace-nowrap"
                  >
                    이 페이지 편집하기
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMovePage(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label="앞으로 이동"
                      className="p-1.5 text-[#52524C] hover:text-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMovePage(idx, idx + 1)}
                      disabled={idx === pages.length - 1}
                      aria-label="뒤로 이동"
                      className="p-1.5 text-[#52524C] hover:text-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePage(page.id)}
                      aria-label="사진 삭제"
                      className="p-1.5 text-[#6B6B65] hover:text-[#DC2626] rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
