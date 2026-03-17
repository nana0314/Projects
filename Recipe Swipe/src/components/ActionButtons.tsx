'use client';

interface ActionButtonsProps {
  onSkip: () => void;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function ActionButtons({ onSkip, onSave, onUndo, canUndo }: ActionButtonsProps) {
  return (
    <div className="hidden md:flex items-center justify-center gap-6 mt-6" data-testid="action-buttons">
      <button
        onClick={onSkip}
        className="w-14 h-14 rounded-full bg-white border-2 border-red-300 text-red-400 flex items-center justify-center shadow-md hover:bg-red-50 hover:scale-110 active:scale-95 transition-all"
        title="Skip"
        data-testid="btn-skip"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        onClick={onSave}
        className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all"
        title="Save to Meal Pack"
        data-testid="btn-save"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-14 h-14 rounded-full bg-white border-2 border-green-300 text-green-400 flex items-center justify-center shadow-md hover:bg-green-50 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        title="Undo"
        data-testid="btn-undo"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M3 10h10a5 5 0 015 5v2M3 10l6 6M3 10l6-6" />
        </svg>
      </button>
    </div>
  );
}
