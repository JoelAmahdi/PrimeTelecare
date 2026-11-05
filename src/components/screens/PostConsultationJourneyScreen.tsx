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
} from 'lucide-react';
import { ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

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
  doctorName = 'Dr. Sarah Johnson',
  doctorId = 'doc-anya',
  patientName = 'Ada Okonkwo',
}) => {
  const [currentStage, setCurrentStage] = useState<JourneyStage>('consultation-completed');

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

        {/* Vertical Timeline */}
        <div className="relative pl-4 space-y-6">
          {/* Vertical connecting line */}
          <div className="absolute top-8 bottom-8 left-[35px] w-0.5 bg-slate-200"></div>
          
          <div className="absolute top-8 left-[35px] w-0.5 bg-emerald-500 transition-all duration-700 ease-in-out" 
               style={{ height: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}></div>

          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isUpcoming = index > currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className={`relative flex items-start space-x-5 transition-all duration-500 ${isUpcoming ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                
                {/* Timeline Node */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-[#f4f8fb] transition-colors duration-500 ${
                  isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-[#022434] animate-pulse' : 'bg-slate-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className={`w-5 h-5 ${isCurrent ? 'text-emerald-400' : 'text-slate-500'}`} />
                  )}
                </div>

                {/* Content Card */}
                <div className={`flex-1 bg-white p-4 rounded-2xl border transition-all duration-500 ${
                  isCurrent ? 'border-[#022434] shadow-md transform scale-[1.02]' : 'border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center space-x-3 mb-1">
                    <div className={`p-1.5 rounded-lg ${stage.bg}`}>
                      <Icon className={`w-4 h-4 ${stage.color}`} />
                    </div>
                    <h3 className={`font-bold font-outfit text-sm ${isCurrent ? 'text-[#022434]' : 'text-slate-700'}`}>
                      {stage.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 pl-[38px]">
                    {stage.desc}
                  </p>
                  
                  {isCurrent && stage.id === 'care-journey-packing' && (
                    <div className="mt-3 pl-[38px]">
                      <div className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Packing from Care Journey • Estimated: 2 hrs</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
            {currentStage === 'follow-up' ? 'All recovery steps activated' : 'Live journey in progress'}
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
    </div>
  );
};

