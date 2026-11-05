import React, { useState, useEffect } from 'react';
import {
  Heart,
  CheckCircle2,
  AlertCircle,
  X,
  Stethoscope,
  Smile,
  Meh,
  Frown,
  Activity,
  Send,
  Pill,
  ShieldCheck,
  RotateCcw,
  Clock,
  Calendar,
  MessageSquare,
  Sparkles,
  Star,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  PostConsultationReminder,
  submitRecoveryFeedback,
  snoozeRecoveryReminder,
  dismissRecoveryReminder,
} from '../../utils/postConsultationReminders';
import { ScreenId } from '../../types';

interface RecoveryFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: PostConsultationReminder | null;
  onNavigate?: (screen: ScreenId) => void;
}

export const RecoveryFollowUpModal: React.FC<RecoveryFollowUpModalProps> = ({
  isOpen,
  onClose,
  reminder,
  onNavigate,
}) => {
  if (!isOpen || !reminder) return null;

  const [recoveryState, setRecoveryState] = useState<'Fully Recovered' | 'Improving' | 'No Change' | 'Worse'>('Improving');
  const [prescribedItems, setPrescribedItems] = useState(
    reminder.prescribedPlan || [
      { id: '1', label: 'Take Paracetamol Syrup 5ml every 8 hours', category: 'medication', followed: true },
      { id: '2', label: 'Administer Amoxicillin 250mg Suspension', category: 'medication', followed: true },
      { id: '3', label: 'Maintain oral rehydration fluids (1.5L daily)', category: 'lifestyle', followed: true },
    ]
  );
  const [symptomNotes, setSymptomNotes] = useState('');
  const [step, setStep] = useState<'clinical' | 'feedback' | 'confirmation'>('clinical');
  const [serviceRating, setServiceRating] = useState<number>(0);
  const [serviceFeedback, setServiceFeedback] = useState('');

  // Sync prescribedItems when reminder changes
  useEffect(() => {
    if (reminder.prescribedPlan) {
      setPrescribedItems(reminder.prescribedPlan);
    }
  }, [reminder]);

  const toggleItemFollowed = (id: string) => {
    triggerHaptic('light');
    setPrescribedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, followed: !item.followed } : item))
    );
  };

  const handleAllToggle = (followed: boolean) => {
    triggerHaptic('medium');
    setPrescribedItems((prev) => prev.map((item) => ({ ...item, followed })));
  };

  const handleClinicalSubmit = () => {
    triggerHaptic('success');
    setStep('feedback');
  };

  const handleFinalSubmit = () => {
    triggerHaptic('success');
    const followedList = prescribedItems.filter((i) => i.followed).map((i) => i.label);
    const allFollowed = prescribedItems.length > 0 && followedList.length === prescribedItems.length;

    submitRecoveryFeedback(reminder.id, {
      recoveryState,
      planFollowed: allFollowed,
      itemsFollowed: followedList,
      symptomNotes: symptomNotes.trim(),
      submittedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    setStep('confirmation');
  };

  const handleSnooze = () => {
    triggerHaptic('medium');
    snoozeRecoveryReminder(reminder.id, 60);
    onClose();
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissRecoveryReminder(reminder.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-md flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header Alert Bar */}
        <div className="bg-gradient-to-r from-[#006c44] via-[#022434] to-[#1c3a4a] p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-400/20 rounded-2xl border border-emerald-400/40 text-[#77daa4]">
              <Heart className="w-5 h-5 fill-[#77daa4] animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold font-outfit uppercase tracking-widest text-[#77daa4] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                24-Hour Recovery Check-in
              </span>
              <h3 className="text-base font-extrabold font-outfit text-white leading-tight">
                Post-Consultation Follow-up
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {step === 'clinical' && (
            <div className="animate-in fade-in duration-200 space-y-4">
              {/* Doctor Header & Consultation Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={reminder.doctorAvatar}
                    alt={reminder.doctorName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#006c44]"
                  />
                  <div>
                    <h4 className="font-extrabold font-outfit text-sm text-[#022434]">
                      {reminder.doctorName}
                    </h4>
                    <p className="text-[11px] text-slate-500">{reminder.doctorSpecialty}</p>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Consultation Yesterday • {reminder.chiefComplaint}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor Message Quote */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-950">
                <Stethoscope className="w-4 h-4 text-[#006c44] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold font-outfit">Doctor's Recovery Message:</p>
                  <p className="text-[11px] text-emerald-900/90 mt-0.5">
                    "Hello! It has been 24 hours since our session. Please confirm how you are feeling today and verify if you have followed the prescribed care instructions."
                  </p>
                </div>
              </div>

              {/* 1. Recovery Status Rating */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold font-outfit text-slate-700 uppercase tracking-wider block">
                  1. How is the patient feeling today?
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Fully Recovered */}
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setRecoveryState('Fully Recovered');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      recoveryState === 'Fully Recovered'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Smile className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-xs font-outfit text-[#022434]">Fully Recovered</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Symptom free & active</span>
                  </button>

                  {/* Improving */}
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setRecoveryState('Improving');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      recoveryState === 'Improving'
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/30'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-teal-600" />
                      <span className="font-bold text-xs font-outfit text-[#022434]">Improving</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Symptoms reducing</span>
                  </button>

                  {/* No Change */}
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setRecoveryState('No Change');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      recoveryState === 'No Change'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Meh className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-xs font-outfit text-[#022434]">No Change</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Same fever/pain level</span>
                  </button>

                  {/* Feeling Worse */}
                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      setRecoveryState('Worse');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      recoveryState === 'Worse'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/30'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Frown className="w-5 h-5 text-rose-600" />
                      <span className="font-bold text-xs font-outfit text-[#022434]">Feeling Worse</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Requires doctor re-eval</span>
                  </button>
                </div>
              </div>

              {/* 2. Treatment Plan Compliance Checklist */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-outfit text-slate-700 uppercase tracking-wider">
                    2. Prescribed Treatment Compliance
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAllToggle(true)}
                      className="text-[10px] font-bold text-[#006c44] hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {prescribedItems.map((item) => (
                    <label
                      key={item.id}
                      onClick={() => toggleItemFollowed(item.id)}
                      className={`p-3 rounded-2xl border flex items-start space-x-3 cursor-pointer transition-all ${
                        item.followed
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.followed}
                        onChange={() => {}} // handled by container click
                        className="w-4 h-4 rounded text-[#006c44] focus:ring-[#006c44] mt-0.5 accent-[#006c44]"
                      />
                      <div className="flex-1 text-xs font-nunito">
                        <span className={`block font-semibold ${item.followed ? 'text-[#022434]' : 'text-slate-600'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize font-medium">
                          {item.category === 'medication' ? '💊 Medication' : item.category === 'lifestyle' ? '💧 Lifestyle' : '📊 Vitals Log'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Patient Notes & Symptom Update */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-extrabold font-outfit text-slate-700 uppercase tracking-wider block">
                  3. Symptom Notes / Observations (Optional)
                </span>
                <textarea
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  placeholder="e.g. Temperature measured at 36.6°C. Child slept well through the night with no vomiting..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleClinicalSubmit}
                  className="w-full py-3.5 bg-[#006c44] hover:bg-[#022434] active:scale-[0.98] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4 text-[#77daa4]" />
                  <span>Next: Service Feedback</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={handleSnooze}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center space-x-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Remind in 1 Hour</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl border border-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'feedback' && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-xl font-extrabold font-outfit text-[#022434]">How was your experience?</h3>
                <p className="text-xs text-slate-500">
                  Please rate the technical quality and service of your consultation. This is kept separate from your clinical records.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      triggerHaptic('selection');
                      setServiceRating(star);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      serviceRating >= star 
                        ? 'bg-amber-100 text-amber-500 border-2 border-amber-400 scale-110' 
                        : 'bg-slate-50 text-slate-300 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-4">
                <span className="text-xs font-extrabold font-outfit text-slate-700 uppercase tracking-wider block">
                  Service Feedback (Optional)
                </span>
                <textarea
                  value={serviceFeedback}
                  onChange={(e) => setServiceFeedback(e.target.value)}
                  placeholder="Did you experience any video lag or audio issues? Let us know."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFinalSubmit}
                  disabled={serviceRating === 0}
                  className="w-full py-3.5 bg-[#006c44] disabled:bg-slate-300 hover:bg-[#022434] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-lg transition-all"
                >
                  Submit Final Report
                </button>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            /* Confirmation Screen after Submission */
            <div className="text-center py-6 space-y-4 font-nunito animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c44] border-2 border-emerald-300 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider text-[#006c44] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Report Saved to Medical File
                </span>
                <h3 className="text-xl font-extrabold font-outfit text-[#022434]">
                  Recovery Report Submitted!
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Dr. Sarah Johnson has been notified of your recovery status (<strong>{recoveryState}</strong>). Your compliance details have been added to your electronic health record.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left space-y-2 text-blue-950 text-xs my-4">
                <div className="flex items-center space-x-2">
                   <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                   <span className="font-bold font-outfit">Follow-up Appointment Reminder</span>
                </div>
                <p className="text-[11px] text-blue-900">
                   You have a scheduled follow-up check-in tomorrow at 10:00 AM. Please ensure you are available.
                </p>
              </div>

              {recoveryState === 'Worse' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-2 text-rose-950 text-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-rose-100 rounded-bl-lg text-[8px] font-bold text-rose-700 uppercase tracking-widest border-b border-l border-rose-200">
                    Clinical Board Approved Rule
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold font-outfit">Automated Priority Escalation</span>
                  </div>
                  <p className="text-[11px] text-rose-900">
                    Because your symptoms have worsened, this case has been escalated to the priority triage queue. We recommend messaging Dr. Sarah Johnson immediately.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate?.('active-chat');
                    }}
                    className="w-full py-2 mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold font-outfit rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Doctor Consultation Chat</span>
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-[#022434] hover:bg-[#1c3a4a] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-md transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-nunito flex items-center justify-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-[#006c44]" />
          <span>Prime Telecare Automated Post-Consultation Quality Protection</span>
        </div>
      </div>
    </div>
  );
};
