import React from 'react';
import { ChevronLeft, Bell, Heart, Share2, Filter, Settings, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBell?: boolean;
  bellCount?: number;
  onBellClick?: () => void;
  showLike?: boolean;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  showShare?: boolean;
  onShare?: () => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  showBell = false,
  bellCount = 0,
  onBellClick,
  showLike = false,
  isLiked = false,
  onLikeToggle,
  showShare = false,
  onShare,
  showFilter = false,
  onFilterClick,
  rightElement,
  transparent = false,
}) => {
  return (
    <div
      className={`sticky top-[36px] z-40 flex items-center justify-between px-5 py-3 transition-colors ${
        transparent ? 'bg-transparent text-white' : 'bg-[#f6fafd]/95 backdrop-blur-md text-[#171c1f]'
      }`}
    >
      <div className="flex items-center space-x-2">
        {showBack && (
          <button
            onClick={onBack}
            className={`p-2 rounded-full transition-transform active:scale-90 ${
              transparent ? 'bg-black/20 text-white hover:bg-black/40' : 'hover:bg-slate-200/60 text-[#171c1f]'
            }`}
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {title && (
        <h1
          className={`text-lg font-bold font-outfit tracking-tight truncate max-w-[200px] text-center ${
            transparent ? 'text-white' : 'text-[#171c1f]'
          }`}
        >
          {title}
        </h1>
      )}

      <div className="flex items-center space-x-2">
        {showBell && (
          <button
            onClick={onBellClick}
            className="relative p-2 rounded-full hover:bg-slate-200/60 text-[#171c1f] transition-transform active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6 text-[#171c1f]" />
            {bellCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {bellCount}
              </span>
            )}
          </button>
        )}

        {showLike && (
          <button
            onClick={onLikeToggle}
            className="p-2 rounded-full bg-white/80 shadow-sm text-red-500 transition-transform active:scale-90"
            aria-label="Favorite"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
          </button>
        )}

        {showShare && (
          <button
            onClick={onShare}
            className="p-2 rounded-full hover:bg-slate-200/60 text-[#171c1f] transition-transform active:scale-95"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 text-[#171c1f]" />
          </button>
        )}

        {showFilter && (
          <button
            onClick={onFilterClick}
            className="p-2 rounded-full hover:bg-slate-200/60 text-[#171c1f] transition-transform active:scale-95"
            aria-label="Filter"
          >
            <SlidersHorizontal className="w-5 h-5 text-[#171c1f]" />
          </button>
        )}

        {rightElement}
      </div>
    </div>
  );
};
