import React from 'react';
import { Signal } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  carrier?: string;
  batteryLevel?: number; // 0 to 100
  className?: string;
  dark?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = '9:41',
  carrier = '5G',
  batteryLevel = 98,
  className = '',
  dark = false,
}) => {
  const textColor = dark ? 'text-white' : 'text-slate-700';
  const badgeBg = dark ? 'bg-white/15' : 'bg-slate-200/70';
  const bgStyle = dark ? 'bg-slate-950/85' : 'bg-[#f6fafd]/90';

  return (
    <div
      className={`sticky top-0 z-50 flex items-center justify-between text-xs font-semibold py-2.5 px-4 sm:px-6 select-none backdrop-blur-md transition-colors ${bgStyle} ${textColor} ${className}`}
    >
      {/* Left Side: Time and Carrier Badge */}
      <div className="flex items-center space-x-2">
        <span className="font-outfit font-bold tracking-tight text-sm">{time}</span>
        {carrier && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeBg} opacity-90 tracking-wider uppercase`}>
            {carrier}
          </span>
        )}
      </div>

      {/* Right Side: Mobile Data Signal & Battery Capsule */}
      <div className="flex items-center space-x-3">
        {/* Mobile Data Signal SVG */}
        <div className="flex items-center opacity-90" title="Mobile Data Signal">
          <Signal className="w-3.5 h-3.5" />
        </div>

        {/* Battery Pill Indicator */}
        <div className="flex items-center space-x-1.5 pl-0.5">
          <span className="text-[11px] font-mono font-medium">{batteryLevel}%</span>
          <div className="relative flex items-center">
            {/* Battery Body Capsule */}
            <div className="w-5 h-2.5 rounded-[3px] border border-current p-[1px] flex items-center relative overflow-hidden">
              <div
                className={`h-full rounded-[1px] transition-all duration-300 ${
                  batteryLevel > 20
                    ? dark
                      ? 'bg-emerald-400'
                      : 'bg-emerald-600'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, batteryLevel))}%` }}
              />
            </div>
            {/* Battery Tip / Nipple */}
            <div className="w-[1.5px] h-1.5 bg-current rounded-r-[1px] ml-[0.5px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
