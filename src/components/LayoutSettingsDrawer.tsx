import { X } from 'lucide-react';
import type { AlbumSettings, PageLayoutStyle, PageOrientation } from '../types/album';
import {
  ALBUM_FONTS,
  ALBUM_FONT_ORDER,
  ALBUM_MOOD_ORDER,
  ALBUM_THEMES,
} from '../utils/albumTheme';

interface LayoutSettingsDrawerProps {
  isOpen: boolean;
  settings: AlbumSettings;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<AlbumSettings>) => void;
}

const LAYOUT_OPTIONS: Array<{
  value: PageLayoutStyle;
  label: string;
  desc: string;
}> = [
  {
    value: 'classic',
    label: '클래식 프레임',
    desc: '사진을 중앙에 두고 아래에 제목과 설명을 정갈하게 배치합니다.',
  },
  {
    value: 'editorial',
    label: '에디토리얼 분할',
    desc: '가로형에서는 사진과 글이 좌우로 나뉘어 화보처럼 보입니다.',
  },
  {
    value: 'minimal',
    label: '미니멀 풀프레임',
    desc: '사진 크기를 가장 크게 강조하고 하단에 간결한 캡션을 둡니다.',
  },
];

export function LayoutSettingsDrawer({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}: LayoutSettingsDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#18181B]/30 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-drawer-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-md bg-white h-full border-l border-[#E2E0D8] shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-[#E2E0D8] flex items-center justify-between">
          <h2 id="settings-drawer-title" className="font-serif text-xl font-semibold text-[#18181B]">
            앨범 &amp; 페이지 설정
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="설정 닫기"
            className="p-2 text-[#52524C] hover:text-[#18181B] rounded-lg hover:bg-[#F4F3EF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Album Color Mood */}
          <div>
            <h3 className="text-sm font-semibold text-[#18181B] mb-3">앨범 색 분위기</h3>
            <div className="grid grid-cols-1 gap-2">
              {ALBUM_MOOD_ORDER.map((moodKey) => {
                const opt = ALBUM_THEMES[moodKey];
                const isSelected = settings.mood === moodKey;
                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => onUpdateSettings({ mood: moodKey })}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                      isSelected
                        ? 'border-[#18181B] bg-[#FAF9F6] font-semibold text-[#18181B]'
                        : 'border-[#E2E0D8] hover:border-[#C9C7BE] bg-white text-[#52524C]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: opt.swatchHex }}
                        aria-hidden="true"
                      />
                      <span>{opt.label}</span>
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#18181B]' : 'border-[#C9C7BE]'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#18181B]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Album Font Style */}
          <div className="pt-6 border-t border-[#EFECE6]">
            <h3 className="text-sm font-semibold text-[#18181B] mb-3">제목 · 설명 글꼴</h3>
            <div className="grid grid-cols-3 gap-2">
              {ALBUM_FONT_ORDER.map((fontKey) => {
                const opt = ALBUM_FONTS[fontKey];
                const isSelected = settings.fontStyle === fontKey;
                return (
                  <button
                    key={fontKey}
                    type="button"
                    onClick={() => onUpdateSettings({ fontStyle: fontKey })}
                    style={{ fontFamily: opt.fontFamily }}
                    className={`py-2.5 px-3 rounded-xl border text-sm transition-colors ${
                      isSelected
                        ? 'border-[#18181B] bg-[#FAF9F6] font-semibold text-[#18181B]'
                        : 'border-[#E2E0D8] hover:border-[#C9C7BE] bg-white text-[#52524C]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Album Title, Subtitle, Author, Date */}
          <div className="pt-6 border-t border-[#EFECE6] space-y-4">
            <h3 className="text-sm font-semibold text-[#18181B]">표지 &amp; 앨범 정보</h3>
            <div>
              <label
                htmlFor="album-title-input"
                className="block text-xs font-medium text-[#52524C] mb-1.5"
              >
                앨범 제목 (표지 및 PDF 파일명)
              </label>
              <input
                id="album-title-input"
                type="text"
                value={settings.albumTitle}
                onChange={(e) => onUpdateSettings({ albumTitle: e.target.value })}
                placeholder="예: 2026 가을 여행 기록"
                className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-[#FAF9F6] border border-[#E2E0D8] rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label
                htmlFor="album-subtitle-input"
                className="block text-xs font-medium text-[#52524C] mb-1.5"
              >
                부제 (선택)
              </label>
              <input
                id="album-subtitle-input"
                type="text"
                value={settings.subtitle}
                onChange={(e) => onUpdateSettings({ subtitle: e.target.value })}
                placeholder="예: 사진과 함께 남긴 짧은 메모"
                className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-[#FAF9F6] border border-[#E2E0D8] rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="album-author-input"
                  className="block text-xs font-medium text-[#52524C] mb-1.5"
                >
                  이름
                </label>
                <input
                  id="album-author-input"
                  type="text"
                  value={settings.authorName}
                  onChange={(e) => onUpdateSettings({ authorName: e.target.value })}
                  placeholder="작성자 이름"
                  className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-[#FAF9F6] border border-[#E2E0D8] rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label
                  htmlFor="album-date-input"
                  className="block text-xs font-medium text-[#52524C] mb-1.5"
                >
                  날짜
                </label>
                <input
                  id="album-date-input"
                  type="text"
                  value={settings.albumDate}
                  onChange={(e) => onUpdateSettings({ albumDate: e.target.value })}
                  placeholder="2026. 11. 26"
                  className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-[#FAF9F6] border border-[#E2E0D8] rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Orientation */}
          <div className="pt-6 border-t border-[#EFECE6]">
            <h3 className="text-sm font-semibold text-[#18181B] mb-3">용지 방향 (A4)</h3>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F3EF] rounded-lg">
              {(
                [
                  { value: 'landscape', label: '가로형 (Landscape)' },
                  { value: 'portrait', label: '세로형 (Portrait)' },
                ] as Array<{ value: PageOrientation; label: string }>
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSettings({ orientation: opt.value })}
                  className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    settings.orientation === opt.value
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-[#52524C] hover:text-[#18181B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page Layout Style */}
          <div className="pt-6 border-t border-[#EFECE6]">
            <h3 className="text-sm font-semibold text-[#18181B] mb-3">사진 페이지 레이아웃</h3>
            <div className="space-y-2.5">
              {LAYOUT_OPTIONS.map((opt) => {
                const selected = settings.layoutStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSettings({ layoutStyle: opt.value })}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                      selected
                        ? 'border-[#18181B] bg-[#FAF9F6]'
                        : 'border-[#E2E0D8] hover:border-[#C9C7BE] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#18181B]">{opt.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          selected ? 'border-[#18181B]' : 'border-[#C9C7BE]'
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-[#18181B]" />}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B65] mt-1 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover, Closing & Page Numbers */}
          <div className="pt-6 border-t border-[#EFECE6] space-y-4">
            <h3 className="text-sm font-semibold text-[#18181B]">PDF 구성 옵션</h3>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#18181B]">첫 쪽 표지 포함</p>
                <p className="text-xs text-[#6B6B65]">앨범 첫 장에 제목·부제·이름·날짜 표지를 둡니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.includeCover}
                onChange={(e) => onUpdateSettings({ includeCover: e.target.checked })}
                className="w-4 h-4 accent-[#18181B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#18181B]">마지막 쪽 마무리 포함</p>
                <p className="text-xs text-[#6B6B65]">앨범 마지막 장에 마무리 문구 페이지를 둡니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.includeClosing}
                onChange={(e) => onUpdateSettings({ includeClosing: e.target.checked })}
                className="w-4 h-4 accent-[#18181B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#18181B]">쪽 번호 표시</p>
                <p className="text-xs text-[#6B6B65]">사진 페이지 하단에 앨범 이름과 쪽 번호를 표시합니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showPageNumbers}
                onChange={(e) => onUpdateSettings({ showPageNumbers: e.target.checked })}
                className="w-4 h-4 accent-[#18181B] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E2E0D8] bg-[#FAF9F6]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-white bg-[#18181B] hover:bg-[#2563EB] rounded-lg transition-colors"
          >
            설정 적용하기
          </button>
        </div>
      </aside>
    </div>
  );
}
