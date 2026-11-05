import React from 'react';
import { X, Bell, Clock, Volume2, ShieldCheck, CheckCircle2, Heart, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { resetDemoAppointment15Min } from '../../utils/appointmentNotifications';
import { resetDemo24HourRecoveryReminder } from '../../utils/postConsultationReminders';
import { getStoredReminders } from '../../utils/reminders';
import { ScreenId } from '../../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const reminders = getStoredReminders().filter((r) => r.enabled);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl p-5 overflow-y-auto space-y-4 font-nunito flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 text-[#006c44] rounded-xl">
                <Bell className="w-5 h-5 text-[#006c44]" />
              </div>
              <h3 className="font-extrabold font-outfit text-base text-[#022434]">Notifications & Alerts</h3>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Automated 24-Hour Post-Consultation Recovery Check-in */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-start space-x-2.5">
              <div className="p-2 bg-[#006c44] text-white rounded-xl shrink-0 mt-0.5">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-extrabold text-xs text-[#022434] block">24h Recovery Check-In Alert</span>
                  <span className="text-[9px] font-extrabold bg-[#006c44] text-white px-1.5 py-0.2 rounded-full">Automated</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Triggers 24 hours post-consultation to verify patient recovery & treatment plan compliance.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('heavy');
                resetDemo24HourRecoveryReminder();
                onClose();
              }}
              className="w-full py-2.5 bg-[#006c44] hover:bg-[#022434] text-white font-extrabold font-outfit text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#77daa4]" />
              <span>Test 24h Recovery Push Alert Now</span>
            </button>
          </div>

          {/* Active Medication Reminders */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold font-outfit text-slate-500 uppercase tracking-wider">
              Medication & Refill Alerts
            </h4>
            {reminders.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No active medication alerts.</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-1.5 bg-emerald-100 text-[#006c44] rounded-lg shrink-0">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#022434] block truncate">{r.drugName} {r.dosage}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{r.time} ({r.frequency})</span>
                    </div>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('prescription-detail');
                      }}
                      className="text-[11px] font-bold text-[#006c44] bg-emerald-100 px-2 py-0.5 rounded-full shrink-0"
                    >
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Appointment Notification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-start space-x-2.5">
              <div className="p-2 bg-slate-200 text-slate-700 rounded-xl shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#022434] block">Next Appointment Reminder</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  15-minute appointment banner is scheduled for your upcoming video session.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                resetDemoAppointment15Min();
                onClose();
              }}
              className="w-full py-2 bg-slate-800 hover:bg-[#022434] text-white font-bold font-outfit text-xs rounded-xl transition-all shadow-xs"
            >
              Test 15-Min Banner Alert Now
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-full py-3 bg-[#022434] text-white font-bold font-outfit text-xs rounded-2xl hover:bg-[#1c3a4a] transition-colors"
        >
          Close Notifications
        </button>
      </div>
    </div>
  );
};
