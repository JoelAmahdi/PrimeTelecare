import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  SlotAlert,
  addSlotAlert,
  getStoredSlotAlerts,
  removeSlotAlert,
} from '../../utils/slotAlerts';

interface SlotAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    avatarUrl: string;
  };
  initialDate?: string;
  initialTimeSlot?: string;
  consultType?: 'Video' | 'Voice' | 'Chat';
}

export const SlotAlertModal: React.FC<SlotAlertModalProps> = ({
  isOpen,
  onClose,
  doctor,
  initialDate = 'Wed, Oct 22',
  initialTimeSlot = '10:30 AM',
  consultType = 'Video',
}) => {
  if (!isOpen) return null;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState(initialTimeSlot);
  const [selectedConsultType, setSelectedConsultType] = useState<'Video' | 'Voice' | 'Chat'>(consultType);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const existingAlerts = getStoredSlotAlerts().filter(
    (a) => a.doctorId === doctor.id && a.status === 'active'
  );

  const handleSubscribe = () => {
    triggerHaptic('success');
    addSlotAlert({
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar: doctor.avatarUrl,
      dateFormatted: selectedDate,
      timeSlot: selectedSlot,
      consultType: selectedConsultType,
    });
    setIsSuccess(true);
  };

  const handleRemoveExisting = (id: string) => {
    triggerHaptic('light');
    removeSlotAlert(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-md flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#022434] via-[#006c44] to-[#022434] p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-400/20 rounded-2xl border border-emerald-400/40 text-[#77daa4]">
              <Bell className="w-5 h-5 fill-[#77daa4] animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold font-outfit uppercase tracking-widest text-[#77daa4] bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Schedule Change Watchlist
              </span>
              <h3 className="text-base font-extrabold font-outfit text-white leading-tight">
                Alert Me for Slot Openings
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!isSuccess ? (
            <>
              {/* Doctor Info Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-3">
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#006c44]"
                />
                <div>
                  <h4 className="font-extrabold font-outfit text-sm text-[#022434]">
                    {doctor.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{doctor.specialty}</p>
                  <span className="text-[10px] font-bold text-[#006c44] bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Schedule Change Instant Push Alerts
                  </span>
                </div>
              </div>

              {/* Informational Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-950">
                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-snug">
                  If another patient reschedules or {doctor.name} extends their clinical hours, you'll receive an instant high-priority push notification to lock in the open slot before anyone else!
                </p>
              </div>

              {/* Selected Slot Configuration */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-extrabold font-outfit text-slate-700 uppercase tracking-wider block">
                  1. Target Consultation Slot
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Date</span>
                    <div className="flex items-center space-x-1.5 text-xs font-extrabold font-outfit text-[#022434] mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#006c44]" />
                      <span>{selectedDate}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Time Slot</span>
                    <div className="flex items-center space-x-1.5 text-xs font-extrabold font-outfit text-[#022434] mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#006c44]" />
                      <span>{selectedSlot}</span>
                    </div>
                  </div>
                </div>

                {/* Consultation Type Selector */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Preferred Consultation Mode:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Video', 'Voice', 'Chat'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedConsultType(type);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold font-outfit border transition-all flex items-center justify-center space-x-1 ${
                          selectedConsultType === type
                            ? 'bg-[#022434] text-white border-[#022434]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type === 'Video' && <Video className="w-3 h-3 text-[#77daa4]" />}
                        {type === 'Voice' && <Phone className="w-3 h-3 text-[#77daa4]" />}
                        {type === 'Chat' && <MessageSquare className="w-3 h-3 text-[#77daa4]" />}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-xs font-extrabold font-outfit text-slate-700 uppercase tracking-wider block">
                  2. Alert Channels
                </span>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                    <div className="flex items-center space-x-2.5">
                      <Bell className="w-4 h-4 text-[#006c44]" />
                      <div>
                        <span className="font-bold text-xs text-[#022434] block">In-App Push Notification</span>
                        <span className="text-[10px] text-slate-500">Instant audio & visual banner pop-up</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyPush}
                      onChange={(e) => setNotifyPush(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006c44] accent-[#006c44]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-[#006c44]" />
                      <div>
                        <span className="font-bold text-xs text-[#022434] block">Direct SMS Alert</span>
                        <span className="text-[10px] text-slate-500">GSM mobile phone text message</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifySms}
                      onChange={(e) => setNotifySms(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006c44] accent-[#006c44]"
                    />
                  </label>
                </div>
              </div>

              {/* Active Alerts List for this Doctor */}
              {existingAlerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold font-outfit text-slate-500 uppercase tracking-wider block">
                    Active Watchlist for {doctor.name} ({existingAlerts.length})
                  </span>
                  <div className="space-y-1.5">
                    {existingAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <Bell className="w-3.5 h-3.5 text-[#006c44]" />
                          <span className="font-bold text-[#022434]">
                            {alert.dateFormatted} • {alert.timeSlot} ({alert.consultType})
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveExisting(alert.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Cancel Alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubscribe}
                  className="w-full py-3.5 bg-[#006c44] hover:bg-[#022434] active:scale-[0.98] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Bell className="w-4 h-4 text-[#77daa4]" />
                  <span>Activate Push Alert for {doctor.name}</span>
                </button>
              </div>
            </>
          ) : (
            /* Success View */
            <div className="text-center py-6 space-y-4 font-nunito animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c44] border-2 border-emerald-300 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider text-[#006c44] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Alert Active in Background
                </span>
                <h3 className="text-xl font-extrabold font-outfit text-[#022434]">
                  Schedule Watchlist Activated!
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  We are actively monitoring <strong>{doctor.name}</strong>'s schedule for <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong>. You'll receive a push notification the moment a slot opens up!
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-[#022434]">{doctor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Time:</span>
                  <span className="font-mono font-bold text-[#006c44]">{selectedDate} ({selectedSlot})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Notification:</span>
                  <span className="font-semibold text-slate-700">Push Banner + SMS</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-[#022434] hover:bg-[#1c3a4a] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-md transition-all"
                >
                  Done & Return to Schedule
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-nunito flex items-center justify-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-[#006c44]" />
          <span>Prime Telecare Automated Schedule Dispatch Engine</span>
        </div>
      </div>
    </div>
  );
};
