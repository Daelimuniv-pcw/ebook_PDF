import type { WorkspaceView } from '../types/album';

interface TopBarProps {
  hasPhotos: boolean;
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  onTriggerUpload: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export function TopBar({
  hasPhotos,
  activeView,
  onChangeView,
  onTriggerUpload,
  onOpenSettings,
  onOpenExport,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F4F3EF]/95 backdrop-blur-sm border-b border-[#E2E0D8]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text wordmark */}
        <button
          type="button"
          onClick={() => onChangeView('viewer')}
          className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-sm"
        >
          모노그래프
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="앨범 작업 메뉴"
          className="flex items-center gap-4 sm:gap-7 text-sm font-medium text-[#52524C] overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            onClick={() => onChangeView('viewer')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
              activeView === 'viewer'
                ? 'text-[#18181B] border-[#18181B]'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            한 장씩 보기
          </button>
          <button
            type="button"
            onClick={() => onChangeView('grid')}
            disabled={!hasPhotos}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed ${
              activeView === 'grid'
                ? 'text-[#18181B] border-[#18181B]'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            전체 모아보기
          </button>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 border-transparent hover:text-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            사진 추가
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 border-transparent hover:text-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            앨범 설정
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenExport}
            disabled={!hasPhotos}
            className="px-4 py-2 text-sm font-medium text-white bg-[#18181B] hover:bg-[#2563EB] disabled:bg-[#D4D3CC] disabled:text-[#787770] disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            PDF로 저장
          </button>
        </div>
      </div>
    </header>
  );
}
