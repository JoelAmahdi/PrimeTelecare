import React, { useState, useEffect } from 'react';
import { Bell, Heart, Stethoscope, ChevronRight, X, Clock, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  PostConsultationReminder,
  getActive24HourRecoveryReminder,
  snoozeRecoveryReminder,
  dismissRecoveryReminder,
} from '../../utils/postConsultationReminders';

interface RecoveryPushNotificationBannerProps {
  onOpenRecoveryModal: (reminder: PostConsultationReminder) => void;
}

export const RecoveryPushNotificationBanner: React.FC<RecoveryPushNotificationBannerProps> = ({
  onOpenRecoveryModal,
}) => {
  const [activeReminder, setActiveReminder] = useState<PostConsultationReminder | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkReminders = () => {
    const due = getActive24HourRecoveryReminder();
    if (due && !isDismissed) {
      setActiveReminder(due);
    } else {
      setActiveReminder(null);
    }
  };

  useEffect(() => {
    checkReminders();

    // Listen for custom updates or check every 10 seconds
    const handleUpdate = () => checkReminders();
    window.addEventListener('post-consultation-reminders-updated', handleUpdate);
    const interval = setInterval(checkReminders, 10000);

    return () => {
      window.removeEventListener('post-consultation-reminders-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (!activeReminder) return null;

  return (
    <div className="fixed top-2 inset-x-2 z-50 max-w-lg mx-auto font-nunito animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#022434] text-white p-3.5 rounded-3xl shadow-2xl border-2 border-[#77daa4]/50 backdrop-blur-xl flex flex-col space-y-2.5">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-[#77daa4] rounded-2xl border border-emerald-400/40 relative">
              <Heart className="w-5 h-5 fill-[#77daa4] animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#022434]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider text-[#77daa4] bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  24-Hour Recovery Alert
                </span>
                <span className="text-[10px] text-slate-300 font-mono">Just Now</span>
              </div>
              <h4 className="font-extrabold font-outfit text-xs text-white mt-0.5">
                {activeReminder.doctorName} Recovery Follow-up
              </h4>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setIsDismissed(true);
              dismissRecoveryReminder(activeReminder.id);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <p className="text-[11px] text-slate-200 pl-1 leading-snug">
          "It's been 24 hours since your consultation for <strong>{activeReminder.chiefComplaint}</strong>. Did you follow your treatment plan?"
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onOpenRecoveryModal(activeReminder);
            }}
            className="flex-1 py-2 bg-[#77daa4] hover:bg-emerald-300 text-[#022434] font-extrabold font-outfit text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Recovery Check-in</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsDismissed(true);
              snoozeRecoveryReminder(activeReminder.id, 60);
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold font-outfit rounded-xl border border-slate-700 flex items-center space-x-1"
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Remind 1h</span>
          </button>
        </div>
      </div>
    </div>
  );
};
