import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Calendar, Clock, ChevronRight, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  SlotAlert,
  getActiveTriggeredSlotAlert,
  dismissTriggeredSlotAlert,
} from '../../utils/slotAlerts';
import { ScreenId } from '../../types';

interface SlotOpeningPushNotificationBannerProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctorSlot?: (doctorId: string, dateFormatted: string, slotTime: string) => void;
}

export const SlotOpeningPushNotificationBanner: React.FC<SlotOpeningPushNotificationBannerProps> = ({
  onNavigate,
  onSelectDoctorSlot,
}) => {
  const [triggeredAlert, setTriggeredAlert] = useState<SlotAlert | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkAlerts = () => {
    const alert = getActiveTriggeredSlotAlert();
    if (alert && !isDismissed) {
      setTriggeredAlert(alert);
    } else {
      setTriggeredAlert(null);
    }
  };

  useEffect(() => {
    checkAlerts();

    const handleUpdate = () => checkAlerts();
    window.addEventListener('slot-alerts-updated', handleUpdate);
    const interval = setInterval(checkAlerts, 8000);

    return () => {
      window.removeEventListener('slot-alerts-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (!triggeredAlert) return null;

  const handleBookNow = () => {
    triggerHaptic('heavy');
    dismissTriggeredSlotAlert(triggeredAlert.id);
    setIsDismissed(true);

    if (onSelectDoctorSlot) {
      onSelectDoctorSlot(triggeredAlert.doctorId, triggeredAlert.dateFormatted, triggeredAlert.timeSlot);
    }
    onNavigate('book-consultation');
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissTriggeredSlotAlert(triggeredAlert.id);
    setIsDismissed(true);
  };

  return (
    <div className="fixed top-2 inset-x-2 z-50 max-w-lg mx-auto font-nunito animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#022434] text-white p-4 rounded-3xl shadow-2xl border-2 border-[#77daa4] backdrop-blur-xl flex flex-col space-y-3">
        {/* Banner Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-[#77daa4] rounded-2xl border border-emerald-400/40 relative shrink-0">
              <Bell className="w-5 h-5 fill-[#77daa4] animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#022434]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider text-[#77daa4] bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Doctor Schedule Update
                </span>
                <span className="text-[10px] text-slate-300 font-mono">Just Now</span>
              </div>
              <h4 className="font-extrabold font-outfit text-xs text-white mt-0.5">
                Slot Available for {triggeredAlert.doctorName}!
              </h4>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs space-y-1">
          <p className="text-slate-100 leading-snug">
            A previously booked slot has just opened up due to a doctor schedule change!
          </p>
          <div className="flex items-center space-x-3 pt-1 text-[11px] font-bold text-[#77daa4] font-outfit">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{triggeredAlert.dateFormatted}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{triggeredAlert.timeSlot}</span>
            </div>
            <span className="bg-emerald-900/80 text-white px-2 py-0.5 rounded-md text-[10px]">
              {triggeredAlert.consultType} Consult
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-0.5">
          <button
            onClick={handleBookNow}
            className="flex-1 py-2.5 bg-[#77daa4] hover:bg-emerald-300 active:scale-[0.98] text-[#022434] font-extrabold font-outfit text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Book This Slot Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#022434]" />
          </button>

          <button
            onClick={handleDismiss}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold font-outfit rounded-xl border border-slate-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
