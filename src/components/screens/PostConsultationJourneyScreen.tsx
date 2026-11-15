import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  TestTube,
  Upload,
  FileText,
  Pill,
  Package,
  ShoppingBag,
  Bell,
  Clock,
  ChevronRight,
  ShieldCheck,
  Star,
  MessageSquare,
  Sparkles,
  Send,
  ThumbsUp,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ScreenId, CareJourneyPlan } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  getStoredCareJourneyPlan,
  toggleStoredCareJourneyTask,
} from '../../utils/careJourney';
import { CareJourneyPlanModal } from '../common/CareJourneyPlanModal';

interface PostConsultationJourneyScreenProps {
  onNavigate: (screen: ScreenId) => void;
  doctorName?: string;
  doctorId?: string;
  patientName?: string;
}

type JourneyStage = 
  | 'consultation-completed'
  | 'lab-request'
  | 'results-upload'
  | 'doctor-review'
  | 'prescription-issued'
  | 'care-journey-packing'
  | 'follow-up';

export const PostConsultationJourneyScreen: React.FC<PostConsultationJourneyScreenProps> = ({
  onNavigate,
  doctorName = 'Attending Physician',
  doctorId = 'doc-attending',
  patientName = 'Patient',
}) => {
  const [plan, setPlan] = useState<CareJourneyPlan | null>(() => getStoredCareJourneyPlan());
  const [isDoctorPlanModalOpen, setIsDoctorPlanModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) setPlan(e.detail);
      else setPlan(getStoredCareJourneyPlan());
    };
    window.addEventListener('care-journey-updated', handleUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'prime_telecare_care_journey_plan') {
        setPlan(getStoredCareJourneyPlan());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('care-journey-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleToggleTask = (itemId: string) => {
    triggerHaptic('medium');
    const updated = toggleStoredCareJourneyTask(itemId);
    if (updated) {
      setPlan(updated);
      const target = updated.items.find((i) => i.id === itemId);
      if (target?.completedByPatient) {
        showToast('Recovery task marked as complete!', 'success');
      }
    }
  };

  // 5-Star Rating and Quality Comment State
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [qualityTags, setQualityTags] = useState<string[]>([]);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState<boolean>(false);
  const [submittedRatingData, setSubmittedRatingData] = useState<{
    rating: number;
    comment: string;
    tags: string[];
    date: string;
  } | null>(null);

  // Check if previously rated in this session or stored
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`consultation_rating_${doctorId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubmittedRatingData(parsed);
        setRating(parsed.rating || 5);
        setComment(parsed.comment || '');
        setQualityTags(parsed.tags || []);
        setIsRatingSubmitted(true);
      }
    } catch {
      // ignore
    }
  }, [doctorId]);

  // Quick feedback tag pills
  const availableTags = [
    'Thorough Explanation',
    'Compassionate & Attentive',
    'Clear Medication Guidance',
    'Minimal Wait Time',
    'Audio/Video Clarity',
  ];

  const toggleTag = (tag: string) => {
    triggerHaptic('selection');
    setQualityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitRating = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (rating === 0) {
      showToast('Please select a star rating (1 to 5 stars)', 'info');
      triggerHaptic('light');
      return;
    }

    triggerHaptic('success');
    const submission = {
      rating,
      comment: comment.trim(),
      tags: qualityTags,
      doctorName,
      patientName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    try {
      localStorage.setItem(`consultation_rating_${doctorId}`, JSON.stringify(submission));
    } catch {
      // ignore
    }

    setSubmittedRatingData(submission);
    setIsRatingSubmitted(true);
    showToast('Thank you! Your rating and feedback were submitted successfully.', 'success');
  };

  // Automatically progress stages for demonstration purposes
  useEffect(() => {
    let timeoutId: number;
    
    const progressStage = () => {
      triggerHaptic('light');
      setCurrentStage((prev) => {
        switch (prev) {
          case 'consultation-completed': return 'lab-request';
          case 'lab-request': return 'results-upload';
          case 'results-upload': return 'doctor-review';
          case 'doctor-review': return 'prescription-issued';
          case 'prescription-issued': return 'care-journey-packing';
          case 'care-journey-packing': return 'follow-up';
          default: return prev;
        }
      });
    };

    if (currentStage !== 'follow-up') {
      timeoutId = window.setTimeout(progressStage, 4000); // Progress every 4 seconds
    }

    return () => window.clearTimeout(timeoutId);
  }, [currentStage]);

  const stages = [
    {
      id: 'consultation-completed',
      title: 'Consultation Completed',
      desc: `Initial clinical assessment with ${doctorName} concluded.`,
      icon: Stethoscope,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      id: 'lab-request',
      title: 'Laboratory Request Issued',
      desc: 'Doctor has ordered a Full Blood Count (FBC) test.',
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      id: 'results-upload',
      title: 'Lab Results Uploaded',
      desc: 'Pathology lab has securely uploaded your results.',
      icon: Upload,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      id: 'doctor-review',
      title: 'Doctor Reviewing Results',
      desc: `${doctorName} is analyzing your lab reports.`,
      icon: TestTube,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      id: 'prescription-issued',
      title: 'E-Prescription Issued',
      desc: 'Medication plan has been digitally generated.',
      icon: Pill,
      color: 'text-teal-500',
      bg: 'bg-teal-50',
    },
    {
      id: 'care-journey-packing',
      title: 'Drugs Being Packed',
      desc: 'Prescribed medications are being prepared and packed from your care journey.',
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      id: 'follow-up',
      title: 'Follow-Up Scheduled',
      desc: 'Reminder set for a quick check-in next week.',
      icon: Bell,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5: return 'Excellent — Outstanding care!';
      case 4: return 'Very Good — High quality service';
      case 3: return 'Good — Met expectations';
      case 2: return 'Fair — Could be improved';
      case 1: return 'Poor — Unsatisfactory experience';
      default: return 'Tap a star to rate your experience';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col font-nunito text-[#171c1f]">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => {
            triggerHaptic('light');
            onNavigate('patient-home');
          }}
          className="p-2 -ml-2 text-slate-500 hover:text-[#022434] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold font-outfit text-[#022434] text-lg text-center flex-1 pr-6">
          Care Journey Tracker
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-2xl mx-auto space-y-6 pb-28">
        
        {/* Continuous Care Banner */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-extrabold font-outfit text-[#022434] text-base">Continuous Care Activated</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your video consultation with <strong className="text-slate-800 font-semibold">{doctorName}</strong> has concluded. We are now orchestrating the next steps of your diagnostic and recovery journey.
            </p>
          </div>
        </div>

        {/* Care Journey Recovery To-Do List */}
        {!plan || plan.status !== 'approved_by_doctor' ? (
          <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                  Care Journey Plan: Pending Doctor Decision
                </h3>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                  Physician Review in Progress
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-nunito">
              Your attending physician ({doctorName}) is evaluating your consultation notes and selecting the recovery to-do tasks and milestones that apply to you. Once your doctor checks and approves the plan, your personalized recovery checklist will appear here and on your dashboard.
            </p>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsDoctorPlanModalOpen(true);
              }}
              className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#006c44] font-extrabold font-outfit text-xs sm:text-sm rounded-2xl shadow-2xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Decide & Approve Care Plan (Doctor Sign-off)</span>
            </button>
          </div>
        ) : (
          /* Doctor has approved the plan */
          <div className="bg-white rounded-3xl p-6 border border-emerald-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#006c44] flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                      Personalized Care Journey
                    </h3>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006c44] text-[10px] font-extrabold border border-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Doctor Approved</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5">
                    Decided by <span className="font-bold text-slate-800">{plan.doctorName}</span> • Patient Recovery Checklist
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsDoctorPlanModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-outfit rounded-xl transition-all self-start sm:self-center cursor-pointer"
              >
                Modify Plan (Doctor)
              </button>
            </div>

            {/* Completion Progress Bar */}
            {(() => {
              const activeItems = plan.items.filter((i) => i.checkedByDoctor);
              const completedCount = activeItems.filter((i) => i.completedByPatient).length;
              const percent = activeItems.length > 0 ? Math.round((completedCount / activeItems.length) * 100) : 0;
              return (
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#022434] font-outfit">Recovery Tasks Progress</span>
                    <span className="text-[#006c44] font-mono">
                      {completedCount} of {activeItems.length} completed ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#006c44] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Checklist */}
            <div className="space-y-2.5">
              {plan.items
                .filter((item) => item.checkedByDoctor)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleTask(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                      item.completedByPatient
                        ? 'bg-slate-50/80 border-slate-200 opacity-70'
                        : 'bg-white hover:bg-emerald-50/30 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-[#006c44] shrink-0"
                      aria-label={item.completedByPatient ? 'Mark task as incomplete' : 'Mark task as complete'}
                    >
                      {item.completedByPatient ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-bold font-outfit ${
                          item.completedByPatient ? 'line-through text-slate-400' : 'text-[#022434]'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.completedByPatient && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 self-center">
                        Done
                      </span>
                    )}
                  </div>
                ))}
            </div>

            {/* Doctor Note */}
            {plan.doctorNotes && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-1">
                <span className="font-bold text-[#022434] block">Attending Doctor's Advice:</span>
                <p className="italic">{plan.doctorNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* 5-STAR RATING & SERVICE QUALITY COMMENT COMPONENT */}
        <div className="pt-2">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-500 border border-amber-100">
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold font-outfit text-base text-[#022434] flex items-center space-x-1.5">
                    <span>Rate Your Consultation</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-[#006c44] px-2 py-0.5 rounded-full">
                      Service Quality
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5">
                    How was your telehealth experience with {doctorName}?
                  </p>
                </div>
              </div>

              {isRatingSubmitted && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006c44]" />
                  <span>Submitted</span>
                </span>
              )}
            </div>

            {/* Submitted State Display */}
            {isRatingSubmitted && submittedRatingData ? (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={'star-' + star}
                        className={`w-5 h-5 ${
                          star <= submittedRatingData.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-extrabold font-outfit text-[#022434] ml-2">
                      {submittedRatingData.rating}.0 / 5.0
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                    {submittedRatingData.date}
                  </span>
                </div>

                {submittedRatingData.comment && (
                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 text-xs text-slate-700 italic">
                    "{submittedRatingData.comment}"
                  </div>
                )}

                {submittedRatingData.tags && submittedRatingData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {submittedRatingData.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 bg-white text-emerald-900 border border-emerald-200 text-[10px] font-bold rounded-full font-outfit"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-nunito">
                    Your verified feedback directly helps us improve medical quality & standards.
                  </span>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsRatingSubmitted(false);
                    }}
                    className="text-xs font-bold text-[#006c44] hover:underline shrink-0 ml-2"
                  >
                    Edit Feedback
                  </button>
                </div>
              </div>
            ) : (
              /* Active Rating & Comment Form */
              <form onSubmit={handleSubmitRating} className="space-y-4">
                {/* 5-Star Interactive Rating */}
                <div className="flex flex-col items-center justify-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const activeScore = hoverRating || rating;
                      const isFilled = star <= activeScore;
                      return (
                        <button
                          key={'rate-star-' + star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => {
                            triggerHaptic('medium');
                            setRating(star);
                          }}
                          className="p-1.5 hover:scale-125 transform transition-all duration-150 focus:outline-none"
                          aria-label={`Rate ${star} out of 5 stars`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                                : 'text-slate-300 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-bold font-outfit text-[#022434] transition-all">
                    {getRatingLabel(hoverRating || rating)}
                  </p>
                </div>

                {/* Quick Quality Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-outfit text-slate-600 flex items-center space-x-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>What stood out most? (Optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = qualityTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-bold font-outfit transition-all ${
                            isSelected
                              ? 'bg-[#022434] text-[#77daa4] shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-outfit text-slate-600 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share your comments or suggestions</span>
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the doctor's communication, diagnosis explanation, or any improvements you'd suggest..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#022434] placeholder:text-slate-400 focus:outline-none focus:border-[#006c44] focus:bg-white resize-none transition-all"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 font-nunito">
                    <span>Constructive feedback empowers verified clinical quality standards.</span>
                    <span>{comment.length} / 500 chars</span>
                  </div>
                </div>

                {/* Submit Feedback Button */}
                <button
                  type="submit"
                  disabled={rating === 0}
                  className={`w-full py-3 px-4 font-extrabold font-outfit text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2 ${
                    rating > 0
                      ? 'bg-[#006c44] hover:bg-[#022434] text-white active:scale-98 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Rating & Quality Feedback</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-white/95 backdrop-blur-md border-t border-slate-200 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block text-xs font-nunito text-slate-500 truncate">
            {plan?.status === 'approved_by_doctor' ? 'Recovery plan active & approved by clinician' : 'Awaiting clinician sign-off'}
          </div>
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onNavigate('patient-home');
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#022434] hover:bg-slate-800 text-white font-extrabold font-outfit text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Return to Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Doctor Care Journey Plan Decision Modal */}
      <CareJourneyPlanModal
        isOpen={isDoctorPlanModalOpen}
        onClose={() => setIsDoctorPlanModalOpen(false)}
        doctorName={doctorName}
        patientName={patientName}
        onPlanPublished={(newPlan) => setPlan(newPlan)}
      />
    </div>
  );
};

