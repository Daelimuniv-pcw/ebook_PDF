import { useState, type DragEvent } from 'react';
import { ImagePlus, ArrowRight } from 'lucide-react';

interface UploadStageProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
}

export function UploadStage({
  onFilesSelected,
  onLoadSample,
  isProcessing,
}: UploadStageProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <section className="max-w-[1040px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <p className="text-xs sm:text-sm text-[#6B6B65] tracking-wide mb-3">
          아카이브 포토북 · 한 쪽에 한 장씩
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-[#18181B] leading-[1.2] [text-wrap:balance] mb-4">
          여러 장의 사진을 한 권의 앨범으로 엮어보세요
        </h1>
        <p className="text-base text-[#52524C] leading-relaxed [text-wrap:balance]">
          사진을 올리면 한 페이지에 한 장씩 정갈하게 배치됩니다. 각 사진마다 제목과 이야기를 쓰고, 이전·다음 버튼으로 넘겨본 뒤 그대로 PDF로 저장할 수 있습니다.
        </p>
      </div>

      {/* Archival Upload Sheet */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white rounded-2xl border transition-all duration-200 px-6 py-14 sm:py-20 text-center shadow-[0_8px_30px_rgba(24,24,27,0.04)] ${
          isDragging
            ? 'border-[#2563EB] bg-[#2563EB]/[0.02] ring-4 ring-[#2563EB]/10'
            : 'border-[#E2E0D8] hover:border-[#C9C7BE]'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-[#F4F3EF] border border-[#E2E0D8] flex items-center justify-center text-[#18181B] mb-6">
            <ImagePlus className="w-6 h-6 stroke-[1.75]" />
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B] mb-2">
            {isDragging ? '여기에 사진을 놓아주세요' : '사진 여러 장을 끌어다 놓거나 선택하세요'}
          </h2>
          <p className="text-sm text-[#6B6B65] mb-8">
            JPG, PNG, WEBP 이미지를 한 번에 여러 장 올릴 수 있습니다
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#18181B] hover:bg-[#2563EB] rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2">
              <input
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                disabled={isProcessing}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onFilesSelected(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <span>{isProcessing ? '사진 불러오는 중...' : '사진 여러 장 선택하기'}</span>
            </label>

            <button
              type="button"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-medium text-[#18181B] bg-[#F4F3EF] hover:bg-[#EAE8E1] border border-[#E2E0D8] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <span>샘플 사진 3장으로 체험하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Editorial 3-step summary without cards-in-cards or pill clutter */}
      <div className="mt-12 pt-8 border-t border-[#E2E0D8] grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <p className="font-mono text-xs text-[#6B6B65] tabular-nums mb-1.5">01. 다중 업로드</p>
          <h3 className="text-base font-semibold text-[#18181B] mb-1">사진 여러 장 한 번에</h3>
          <p className="text-sm text-[#52524C] leading-relaxed">
            원하는 사진들을 한꺼번에 올리면 각 사진이 독립된 한 페이지로 자동 구성됩니다.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs text-[#6B6B65] tabular-nums mb-1.5">02. 기록과 넘김</p>
          <h3 className="text-base font-semibold text-[#18181B] mb-1">제목·설명 작성 및 페이지 이동</h3>
          <p className="text-sm text-[#52524C] leading-relaxed">
            한 쪽씩 보면서 제목과 설명을 적고, 이전·다음 버튼이나 화살표 키로 넘겨볼 수 있습니다.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs text-[#6B6B65] tabular-nums mb-1.5">03. 아카이브 소장</p>
          <h3 className="text-base font-semibold text-[#18181B] mb-1">고화질 PDF 앨범 저장</h3>
          <p className="text-sm text-[#52524C] leading-relaxed">
            편집한 레이아웃과 한글 제목·설명이 담긴 인쇄용 A4 PDF 파일로 즉시 저장합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
