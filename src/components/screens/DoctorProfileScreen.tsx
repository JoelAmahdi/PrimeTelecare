import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Info,
  Phone,
  Video,
  MessageSquare,
  Star,
  ShieldCheck,
  Award,
  Globe,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  ShieldAlert,
  ChevronRight,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { ScreenId, Doctor, UserRole, BookingSummary } from '../../types';
import { mockDoctors } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { DoctorWeeklyCalendar } from '../common/DoctorWeeklyCalendar';
import { processJoinOrPayConsultation } from '../../utils/consultationPayment';

interface DoctorProfileScreenProps {
  doctorId?: string;
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
  onSaveBookingSummary?: (summary: BookingSummary) => void;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({
  doctorId,
  onNavigate,
  role = 'patient',
  onSaveBookingSummary,
}) => {
  const currentDoctor: Doctor =
    mockDoctors.find((d) => d.id === doctorId) || mockDoctors[0]; // Default to Dr. Anya Sharma

  const [isLiked, setIsLiked] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Today, Oct 24');
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [showFullAbout, setShowFullAbout] = useState(false);

  // Fallbacks for optional fields
  const fullName = currentDoctor.fullNameWithTitle || currentDoctor.name;
  const qualifications = currentDoctor.qualifications || [
    'MBBS (University of Lagos)',
    'FWACP (West African College of Physicians)',
    'MDCN Licensed Medical Practitioner (#MDCN/2018/74920)',
  ];
  const languages = currentDoctor.languagesSpoken || ['English', 'Yoruba', 'Pidgin'];
  const verification = currentDoctor.verification || {
    isVerified: true,
    licenseNumber: 'MDCN/2018/74920',
    boardName: 'Medical and Dental Council of Nigeria (MDCN)',
    verifiedBadgeText: 'Verified MDCN License',
    verificationDate: 'Verified Jan 2024',
  };
  const availability = currentDoctor.availabilityStatus || {
    isOnline: currentDoctor.isOnline,
    statusText: 'Online & Available Today',
    nextAvailableSlot: '10:30 AM Today',
    workingDays: 'Mon - Sat (8:00 AM - 6:00 PM)',
  };
  const reviewPolicy = currentDoctor.reviewPolicy || {
    policyText:
      'Only patients who have completed a verified tele-consultation on Prime Telecare can leave ratings and reviews. All patient reviews undergo clinical authenticity verification.',
    verifiedOnly: true,
    auditEnforced: true,
  };
  const reviewsList = currentDoctor.reviewsList || [
    {
      id: 'r-default-1',
      patientName: 'Kemi A.',
      rating: 5,
      date: 'Oct 18, 2026',
      comment:
        'Dr. Anya was extremely patient and attentive during our video session. E-prescription was issued immediately.',
      verifiedConsultation: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />

      {/* Header Overlay */}
      <Header
        title=""
        showBack
        onBack={() => onNavigate('doctor-discovery')}
        showLike
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
        transparent
      />

      {/* 1 & 2. HERO PHOTOGRAPH & FULL PROFESSIONAL NAME */}
      <div className="-mt-14 relative h-84 w-full rounded-b-3xl overflow-hidden shadow-lg border-b border-slate-200">
        <img
          src={currentDoctor.avatarUrl}
          alt={fullName}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#022434] via-[#022434]/40 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
          {/* 9. VERIFIED PRACTITIONER STATUS BADGE */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-extrabold font-outfit rounded-full border border-emerald-300/40 shadow-sm">
              <BadgeCheck className="w-4 h-4 text-emerald-200 fill-emerald-600" />
              <span>{verification.verifiedBadgeText}</span>
            </span>
            {availability.isOnline && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/80 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Online Now</span>
              </span>
            )}
          </div>

          {/* 1. Full Professional Name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white leading-tight">
            {fullName}
          </h1>

          {/* 3. Medical Specialty */}
          <p className="text-xs sm:text-sm text-emerald-200 font-bold font-nunito flex items-center space-x-1">
            <span>{currentDoctor.specialty}</span>
          </p>

          <div className="flex items-center space-x-3 text-xs pt-1">
            <div className="flex items-center space-x-1 text-amber-300 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{currentDoctor.rating} Rating</span>
              <span className="text-slate-300 font-normal">({currentDoctor.reviewsCount} reviews)</span>
            </div>
            <span className="text-slate-400">•</span>
            <span className="text-slate-200 font-mono text-[11px]">
              License #{verification.licenseNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 mt-4">
        {/* Floating Metrics Summary Grid */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/90 grid grid-cols-3 gap-2 text-center">
          {/* 5. Years of Relevant Experience */}
          <div className="p-1">
            <span className="text-[10px] font-bold text-slate-400 font-outfit uppercase tracking-wider block">
              Experience
            </span>
            <span className="text-base font-extrabold font-outfit text-[#022434] block mt-0.5">
              {currentDoctor.yearsExperience}+ Years
            </span>
            <span className="text-[10px] text-slate-500 font-nunito block">Relevant Practice</span>
          </div>

          {/* Patients Handled */}
          <div className="p-1 border-x border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 font-outfit uppercase tracking-wider block">
              Consultations
            </span>
            <span className="text-base font-extrabold font-outfit text-[#022434] block mt-0.5">
              {currentDoctor.patientsCount.toLocaleString()}+
            </span>
            <span className="text-[10px] text-slate-500 font-nunito block">Satisfied Patients</span>
          </div>

          {/* 10. Rating */}
          <div className="p-1">
            <span className="text-[10px] font-bold text-slate-400 font-outfit uppercase tracking-wider block">
              Rating
            </span>
            <span className="text-base font-extrabold font-outfit text-[#022434] block mt-0.5 flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" />
              <span>{currentDoctor.rating}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-nunito block">Verified Policy</span>
          </div>
        </div>

        {/* Quick Consultation Channel Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              processJoinOrPayConsultation({
                id: `doc-${currentDoctor.id}-chat`,
                type: 'Chat',
                doctorId: currentDoctor.id,
                doctorName: currentDoctor.name,
                doctorSpecialty: currentDoctor.specialty,
                doctorAvatar: currentDoctor.avatarUrl,
                price: currentDoctor.prices.chat,
                onNavigate,
                onSaveBookingSummary,
              });
            }}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-[#006c44] transition-all flex flex-col items-center justify-center text-center group shadow-2xs"
          >
            <div className="p-2.5 bg-emerald-50 text-[#006c44] rounded-xl group-hover:bg-[#006c44] group-hover:text-white transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-outfit text-[#022434] mt-2 block">Text Chat</span>
            <span className="text-[10px] font-bold font-mono text-[#006c44] mt-0.5">
              ₦{currentDoctor.prices.chat.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => {
              processJoinOrPayConsultation({
                id: `doc-${currentDoctor.id}-voice`,
                type: 'Voice',
                doctorId: currentDoctor.id,
                doctorName: currentDoctor.name,
                doctorSpecialty: currentDoctor.specialty,
                doctorAvatar: currentDoctor.avatarUrl,
                price: currentDoctor.prices.voice,
                onNavigate,
                onSaveBookingSummary,
              });
            }}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-[#006c44] transition-all flex flex-col items-center justify-center text-center group shadow-2xs"
          >
            <div className="p-2.5 bg-emerald-50 text-[#006c44] rounded-xl group-hover:bg-[#006c44] group-hover:text-white transition-all">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-outfit text-[#022434] mt-2 block">Voice Call</span>
            <span className="text-[10px] font-bold font-mono text-[#006c44] mt-0.5">
              ₦{currentDoctor.prices.voice.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => {
              processJoinOrPayConsultation({
                id: `doc-${currentDoctor.id}-video`,
                type: 'Video',
                doctorId: currentDoctor.id,
                doctorName: currentDoctor.name,
                doctorSpecialty: currentDoctor.specialty,
                doctorAvatar: currentDoctor.avatarUrl,
                price: currentDoctor.prices.video,
                onNavigate,
                onSaveBookingSummary,
              });
            }}
            className="p-3.5 bg-[#022434] text-white border border-[#022434] rounded-2xl hover:bg-[#1c3a4a] transition-all flex flex-col items-center justify-center text-center group shadow-md"
          >
            <div className="p-2.5 bg-[#77daa4] text-[#022434] rounded-xl">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-outfit text-white mt-2 block">Video Consult</span>
            <span className="text-[10px] font-bold font-mono text-[#77daa4] mt-0.5">
              ₦{currentDoctor.prices.video.toLocaleString()}
            </span>
          </button>
        </div>

        {/* 9. VERIFIED PRACTITIONER STATUS DETAILED CARD */}
        <div className="bg-gradient-to-r from-emerald-900 to-[#022434] text-white p-5 rounded-3xl shadow-md border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-[#77daa4]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold font-outfit uppercase tracking-widest text-[#77daa4]">
                  Medical Council Verification
                </span>
                <h3 className="font-bold font-outfit text-sm text-white">
                  Verified Practitioner Status
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500 text-white font-extrabold font-outfit text-[10px] rounded-full uppercase">
              Active License
            </span>
          </div>

          <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-xs font-nunito">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Licensing Board:</span>
              <span className="font-bold text-white text-right">{verification.boardName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">License Reference #:</span>
              <span className="font-mono font-bold text-[#77daa4]">{verification.licenseNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Verification Audit:</span>
              <span className="font-semibold text-slate-200">{verification.verificationDate}</span>
            </div>
          </div>
        </div>

        {/* 4. QUALIFICATIONS & CREDENTIALS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#006c44]" />
            <h3 className="font-bold font-outfit text-[#022434] text-base">
              Medical Qualifications & Certifications
            </h3>
          </div>

          <ul className="space-y-2 pt-1">
            {qualifications.map((qual, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs font-nunito text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0 mt-0.5" />
                <span className="font-semibold">{qual}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. LANGUAGES SPOKEN */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-[#006c44]" />
            <h3 className="font-bold font-outfit text-[#022434] text-base">Languages Spoken</h3>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {languages.map((lang) => (
              <span
                key={lang}
                className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-[#006c44] font-bold font-outfit text-xs rounded-xl flex items-center space-x-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-[#006c44]" />
                <span>{lang}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ABOUT CLINICAL PRACTICE */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <h3 className="font-bold font-outfit text-[#022434] text-base">Clinical Biography</h3>
          <p className="text-xs text-slate-600 font-nunito leading-relaxed">
            {showFullAbout ? currentDoctor.about : `${currentDoctor.about.slice(0, 160)}... `}
            <button
              onClick={() => { triggerHaptic('light'); setShowFullAbout(!showFullAbout); }}
              className="text-[#006c44] font-bold hover:underline ml-1"
            >
              {showFullAbout ? 'Read less' : 'Read more'}
            </button>
          </p>
        </div>

        {/* 8. VISUAL WEEKLY CALENDAR & REAL-TIME AVAILABILITY SLOTS */}
        <DoctorWeeklyCalendar
          doctor={currentDoctor}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onSelectSlot={(d, s) => {
            setSelectedDate(d);
            setSelectedSlot(s);
          }}
          onConfirmBooking={(d, s) => {
            setSelectedDate(d);
            setSelectedSlot(s);
            onNavigate('book-consultation');
          }}
        />

        {/* 7. CONSULTATION FEE STRUCTURE */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-[#006c44]" />
            <h3 className="font-bold font-outfit text-[#022434] text-base">
              Transparent Consultation Fees
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-nunito">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-bold text-[#022434] block">Text Consultation</span>
                <span className="text-[10px] text-slate-500">Async chat & photos</span>
              </div>
              <span className="font-bold font-mono text-[#006c44]">
                ₦{currentDoctor.prices.chat.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-bold text-[#022434] block">Voice Call</span>
                <span className="text-[10px] text-slate-500">HD audio consult</span>
              </div>
              <span className="font-bold font-mono text-[#006c44]">
                ₦{currentDoctor.prices.voice.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-bold text-[#022434] block">Video Consultation</span>
                <span className="text-[10px] text-emerald-800">Face-to-face primary care</span>
              </div>
              <span className="font-extrabold font-mono text-[#006c44]">
                ₦{currentDoctor.prices.video.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 10. PATIENT RATING AND REVIEW POLICY CARD & REVIEWS LIST */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="font-bold font-outfit text-[#022434] text-base">
                Patient Ratings & Verified Reviews
              </h3>
            </div>
            <div className="text-xs font-bold text-[#022434] flex items-center space-x-1">
              <span className="text-amber-500 font-extrabold text-sm">{currentDoctor.rating}</span>
              <span className="text-slate-400">({currentDoctor.reviewsCount} reviews)</span>
            </div>
          </div>

          {/* 10. Review Policy Notice Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5 text-xs font-nunito">
            <div className="flex items-center space-x-2 text-[#022434] font-bold font-outfit">
              <Lock className="w-4 h-4 text-[#006c44]" />
              <span>Authentic Patient Review Policy</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">{reviewPolicy.policyText}</p>
          </div>

          {/* Verified Patient Reviews List */}
          <div className="space-y-3 pt-1">
            {reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-outfit text-[#022434]">{rev.patientName}</span>
                    {rev.verifiedConsultation && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#006c44] font-extrabold text-[9px] rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-[#006c44]" />
                        <span>Verified Consult</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-nunito">{rev.date}</span>
                </div>

                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>

                <p className="text-slate-700 font-nunito leading-snug">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Fixed Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-30 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between space-x-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 font-nunito block">
              Selected Consult Fee
            </span>
            <span className="text-lg font-extrabold font-outfit text-[#022434] block font-mono">
              ₦{currentDoctor.prices.video.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('book-consultation');
            }}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#022434] to-[#006c44] text-white font-bold font-outfit text-sm rounded-2xl shadow-lg hover:from-[#1c3a4a] hover:to-[#004d30] transition-all transform active:scale-98 flex flex-col items-center justify-center"
          >
            <span className="text-sm font-extrabold font-outfit">Book Consultation Now</span>
            <span className="text-[10px] text-emerald-200 font-normal flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Verified MDCN Doctor • Instant Slot ({selectedSlot})</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
