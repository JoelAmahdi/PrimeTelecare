import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { ClinicalTriageModal } from '../common/ClinicalTriageModal';
import {
  Zap,
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  ShieldCheck,
  Check,
  Search,
  X,
  Paperclip,
  FileText,
  Star,
  Info,
  ChevronDown,
} from 'lucide-react';
import { ScreenId, Doctor, UserRole, BookingSummary } from '../../types';
import { primeApi } from '../../services/apiClient';
import { mockDoctors, currentUserPatient } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { DependentSwitcher } from '../common/DependentSwitcher';
import { NotificationsDrawer } from '../common/NotificationsDrawer';

interface BookConsultationScreenProps {
  selectedDoctorId?: string;
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctor: (doctorId: string) => void;
  onSaveBookingSummary?: (summary: BookingSummary) => void;
  role?: UserRole;
  user?: User;
}

export const BookConsultationScreen: React.FC<BookConsultationScreenProps> = ({
  selectedDoctorId,
  onNavigate,
  onSelectDoctor,
  onSaveBookingSummary,
  role = 'patient',
  user,
}) => {
  // Two distinct paths: 'instant' vs 'scheduled'
  const [bookingMode, setBookingMode] = useState<'instant' | 'scheduled'>('instant');

  // Physician selection
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [chosenDoctorId, setChosenDoctorId] = useState<string>(selectedDoctorId || '');
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  useEffect(() => {
    primeApi.getDoctors().then((docs) => {
      const list = docs || [];
      setDoctorsList(list);
      if (!chosenDoctorId && list.length > 0) {
        setChosenDoctorId(list[0].id);
      }
    }).catch(() => {
      setDoctorsList([]);
    });
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      setChosenDoctorId(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  const fallbackEmptyDoctor: Doctor = {
    id: 'doc-pending',
    name: 'Attending Telehealth Physician',
    fullNameWithTitle: 'Attending Telehealth Physician, MD',
    specialty: 'General Practice',
    title: 'Consultant Telehealth Practitioner',
    rating: 5.0,
    reviewsCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    isOnline: true,
    yearsExperience: 5,
    patientsCount: 0,
    about: 'Board-licensed clinical telehealth practitioner on Prime Telecare.',
    qualifications: ['MDCN Licensed Practitioner'],
    languagesSpoken: ['English'],
    consultationFee: { chat: 5000, voice: 7000, video: 10000, base: 10000 },
    availabilityStatus: { isOnline: true, statusText: 'Online & Available', nextAvailableSlot: 'Today', workingDays: 'Mon - Fri' },
    verification: { isVerified: true, licenseNumber: 'MDCN/2026/001', boardName: 'Medical and Dental Council of Nigeria', verifiedBadgeText: 'Verified MDCN License', verificationDate: 'Verified' },
    prices: { chat: 5000, voice: 7000, video: 10000 },
  };

  const currentDoctor: Doctor =
    doctorsList.find((d) => d.id === chosenDoctorId) || doctorsList[0] || fallbackEmptyDoctor;

  // Consultation Format: Video / Voice / Chat
  const [consultationType, setConsultationType] = useState<'Video' | 'Voice' | 'Chat'>('Video');

  // Schedule Dates (for 'scheduled' mode)
  const availableDates = [
    { label: 'Today', day: 'Wed', date: 'Oct 24', fullDate: 'Wed, Oct 24, 2026' },
    { label: 'Tomorrow', day: 'Thu', date: 'Oct 25', fullDate: 'Thu, Oct 25, 2026' },
    { label: 'Fri', day: 'Fri', date: 'Oct 26', fullDate: 'Fri, Oct 26, 2026' },
    { label: 'Sat', day: 'Sat', date: 'Oct 27', fullDate: 'Sat, Oct 27, 2026' },
    { label: 'Sun', day: 'Sun', date: 'Oct 28', fullDate: 'Sun, Oct 28, 2026' },
    { label: 'Mon', day: 'Mon', date: 'Oct 29', fullDate: 'Mon, Oct 29, 2026' },
  ];
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const timeSlots = [
    { time: '09:00 AM', label: 'Morning' },
    { time: '10:30 AM', label: 'Morning' },
    { time: '01:00 PM', label: 'Afternoon' },
    { time: '03:15 PM', label: 'Afternoon' },
    { time: '05:00 PM', label: 'Evening' },
    { time: '06:30 PM', label: 'Evening' },
  ];
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM');

  // Simple Visit Reason & Optional Attachment
  const [symptomsInput, setSymptomsInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      triggerHaptic('light');

      setTimeout(() => {
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: `f-${Date.now()}`,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          },
        ]);
        setIsUploading(false);
        triggerHaptic('success');
      }, 500);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    triggerHaptic('light');
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Pricing calculations
  const baseConsultationFee =
    consultationType === 'Video'
      ? currentDoctor.prices.video
      : consultationType === 'Voice'
      ? currentDoctor.prices.voice
      : currentDoctor.prices.chat;

  const platformServiceFee = 500;
  const totalAmountPayable = baseConsultationFee + platformServiceFee;

  const consultationDuration =
    consultationType === 'Video'
      ? '30 mins'
      : consultationType === 'Voice'
      ? '20 mins'
      : 'Async 24h';

  // Safety Triage & Notifications
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [isTriageCleared, setIsTriageCleared] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const proceedToCheckout = () => {
    const isInstant = bookingMode === 'instant';
    const chosenDateStr = isInstant
      ? 'Today (Instant Consultation)'
      : availableDates[selectedDateIndex].fullDate;
    const chosenTimeStr = isInstant ? 'Immediate Queue (2–5 mins wait)' : selectedTimeSlot;

    const summary: BookingSummary = {
      doctorId: currentDoctor.id,
      consultationType,
      bookingMode,
      symptomsDescription: symptomsInput.trim() || undefined,
      date: chosenDateStr,
      timeSlot: chosenTimeStr,
      duration: consultationDuration,
      baseFee: baseConsultationFee,
      serviceFee: platformServiceFee,
      totalFee: totalAmountPayable,
      connectionMethod:
        consultationType === 'Video'
          ? 'Encrypted HD Video Call via WebRTC'
          : consultationType === 'Voice'
          ? 'Encrypted Audio Call'
          : 'Secured End-to-End Encrypted Chat',
      uploadedFiles,
      reminderPreferences: { sms: true, email: true, push: true, whatsapp: true },
      timeZone: 'West Africa Time (WAT) • GMT+1',
      cancellationPolicy: 'Free cancellation & 100% full refund up to 2 hours prior to scheduled start.',
      reschedulePolicy: 'Free 1-click rescheduling available from dashboard.',
    };

    if (onSaveBookingSummary) {
      onSaveBookingSummary(summary);
    }

    onNavigate('payment');
  };

  const handleConfirmAction = () => {
    triggerHaptic('heavy');
    if (!isTriageCleared) {
      setIsTriageModalOpen(true);
      return;
    }
    proceedToCheckout();
  };

  const filteredDoctors = doctorsList.filter((doc) => {
    const q = doctorSearchQuery.toLowerCase().trim();
    return (
      !q ||
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q)
    );
  });

  const fullName = currentDoctor.fullNameWithTitle || currentDoctor.name;
  const licenseNo = currentDoctor.verification?.licenseNumber || 'MDCN/2018/74920';

  return (
    <div className="min-h-screen bg-slate-50 pb-28 sm:pb-32 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#0f172a] font-nunito">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />

      <Header
        title="Book Consultation"
        showBack
        onBack={() => onNavigate('patient-home')}
        showBell
        bellCount={1}
        onBellClick={() => {
          triggerHaptic('light');
          setIsNotificationsOpen(true);
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mt-4">
        {/* LEFT COLUMN: Booking Choices & Details (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
        {/* COMPACT PATIENT / DEPENDENT SELECTOR */}
        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Consultation For</span>
          <DependentSwitcher user={user || currentUserPatient} compact />
        </div>

        {/* 1. TWO DISTINCT PATHS SEGMENTED CONTROL */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            {/* Path A: Instant Consultation */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setBookingMode('instant');
              }}
              className={`py-3 px-3 rounded-lg text-left transition-all ${
                bookingMode === 'instant'
                  ? 'bg-white text-[#006c44] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-1.5 justify-center py-1">
                <Zap className="w-4 h-4 fill-emerald-500 text-emerald-600 shrink-0" />
                <span className="font-outfit font-bold text-sm">Instant</span>
              </div>
            </button>

            {/* Path B: Scheduled Appointment */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setBookingMode('scheduled');
              }}
              className={`py-3 px-3 rounded-lg text-left transition-all ${
                bookingMode === 'scheduled'
                  ? 'bg-white text-[#022434] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-1.5 justify-center py-1">
                <Calendar className="w-4 h-4 text-[#022434] shrink-0" />
                <span className="font-outfit font-bold text-sm">Scheduled</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. ATTENDING CLINICIAN CARD */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentDoctor.avatarUrl}
                alt={fullName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <h3 className="font-outfit font-bold text-sm text-[#022434] truncate">
                {fullName}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {currentDoctor.specialty}
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center text-amber-600 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                  {currentDoctor.rating}
                </span>
                <span>·</span>
                <span>{licenseNo}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsDoctorModalOpen(true);
            }}
            className="text-xs font-bold font-outfit text-[#006c44] hover:text-[#022434] border border-slate-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
          >
            Change
          </button>
        </div>

        {/* 3. PATH-SPECIFIC AVAILABILITY SECTION */}
        {bookingMode === 'instant' ? (
          /* Instant Consultation Availability Banner */
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <h4 className="font-outfit font-bold text-sm text-emerald-950">
                  Doctor On Call · Immediate Queue
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                Wait: ~2–5 mins
              </span>
            </div>
            <p className="text-xs text-emerald-800/90 leading-relaxed">
              Your consultation starts immediately upon payment confirmation. You will enter the secured video/audio room directly.
            </p>
          </div>
        ) : (
          /* Scheduled Appointment Date & Time Selection */
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Date Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold font-outfit text-slate-700">
                  1. Select Appointment Date
                </label>
                <span className="text-[11px] text-slate-400">WAT (GMT+1)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {availableDates.map((item, idx) => {
                  const isSelected = selectedDateIndex === idx;
                  return (
                    <button
                      key={item.fullDate}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedDateIndex(idx);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-[#006c44] text-white border-[#006c44] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`block text-[10px] font-semibold uppercase ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                      <span className="block text-xs font-outfit font-bold mt-0.5">
                        {item.date}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold font-outfit text-slate-700 block mb-2">
                2. Select Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedTimeSlot(slot.time);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-outfit font-bold border transition-all text-center ${
                        isSelected
                          ? 'bg-[#022434] text-white border-[#022434] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. CONSULTATION FORMAT & PRICING OPTIONS */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-outfit font-bold text-xs uppercase tracking-wider text-slate-500">
              Select Consultation Format
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Duration: {consultationDuration}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Video Call */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setConsultationType('Video');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                consultationType === 'Video'
                  ? 'border-[#006c44] bg-emerald-50/50 ring-1 ring-[#006c44]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${consultationType === 'Video' ? 'bg-[#006c44] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Video className="w-4 h-4" />
                </div>
                {consultationType === 'Video' && <Check className="w-4 h-4 text-[#006c44]" />}
              </div>
              <h5 className="font-outfit font-bold text-xs text-[#022434]">HD Video Call</h5>
              <p className="text-[11px] text-slate-500">Face-to-face · 30m</p>
              <p className="text-sm font-outfit font-bold text-[#006c44] mt-2 font-mono">
                ₦{currentDoctor.prices.video.toLocaleString()}
              </p>
            </button>

            {/* Voice Call */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setConsultationType('Voice');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                consultationType === 'Voice'
                  ? 'border-[#006c44] bg-emerald-50/50 ring-1 ring-[#006c44]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${consultationType === 'Voice' ? 'bg-[#006c44] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Phone className="w-4 h-4" />
                </div>
                {consultationType === 'Voice' && <Check className="w-4 h-4 text-[#006c44]" />}
              </div>
              <h5 className="font-outfit font-bold text-xs text-[#022434]">Voice Call</h5>
              <p className="text-[11px] text-slate-500">Audio only · 20m</p>
              <p className="text-sm font-outfit font-bold text-[#006c44] mt-2 font-mono">
                ₦{currentDoctor.prices.voice.toLocaleString()}
              </p>
            </button>

            {/* Live Chat */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setConsultationType('Chat');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                consultationType === 'Chat'
                  ? 'border-[#006c44] bg-emerald-50/50 ring-1 ring-[#006c44]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${consultationType === 'Chat' ? 'bg-[#006c44] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                {consultationType === 'Chat' && <Check className="w-4 h-4 text-[#006c44]" />}
              </div>
              <h5 className="font-outfit font-bold text-xs text-[#022434]">Live Chat</h5>
              <p className="text-[11px] text-slate-500">Messaging · 24h</p>
              <p className="text-sm font-outfit font-bold text-[#006c44] mt-2 font-mono">
                ₦{currentDoctor.prices.chat.toLocaleString()}
              </p>
            </button>
          </div>
        </div>

        {/* 5. BRIEF SYMPTOM / REASON NOTE (CLEAN 1-ROW OPTIONAL) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-outfit text-slate-700">
              Reason for Visit (Optional)
            </label>
            <label className="inline-flex items-center space-x-1 text-xs text-[#006c44] hover:underline cursor-pointer font-semibold">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Attaching...' : 'Attach File'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc"
              />
            </label>
          </div>

          <input
            type="text"
            placeholder="e.g. Persistent fever, rash review, medication refill"
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#006c44]"
          />

          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-[#006c44] shrink-0" />
                    <span className="truncate font-semibold text-slate-700">{file.name}</span>
                    <span className="text-[10px] text-slate-400">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        </div>
        {/* End of LEFT COLUMN */}

        {/* RIGHT COLUMN: Sticky Booking Summary & Pricing (lg:col-span-5) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold font-outfit text-base text-[#022434] pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Booking Summary</span>
              <span className="text-xs font-semibold font-mono text-[#006c44] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                WAT (GMT+1)
              </span>
            </h3>

            {/* Doctor Snapshot */}
            <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100">
              <img
                src={currentDoctor.avatarUrl}
                alt={fullName}
                className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434] truncate">{fullName}</h4>
                <p className="text-xs text-slate-500 truncate">{currentDoctor.specialty}</p>
                <span className="text-[11px] text-emerald-700 font-semibold">{currentDoctor.yearsExperience} yrs experience • MDCN Active</span>
              </div>
            </div>

            {/* Session details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Appointment Mode</span>
                <span className="font-semibold text-slate-800">
                  {bookingMode === 'instant' ? 'Instant Triage' : 'Scheduled Slot'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Time &amp; Date</span>
                <span className="font-semibold text-slate-800">
                  {bookingMode === 'instant' ? 'Immediate (2–5 mins)' : `${availableDates[selectedDateIndex].date} @ ${selectedTimeSlot}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Medium</span>
                <span className="font-semibold text-slate-800">
                  {consultationType === 'Video' ? 'Encrypted HD Video' : consultationType === 'Voice' ? 'High-Def Voice' : 'E2E Encrypted Chat'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Duration</span>
                <span className="font-semibold text-slate-800">{consultationDuration}</span>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{consultationType} Consultation Fee</span>
                <span className="font-mono font-semibold text-slate-800">
                  ₦{baseConsultationFee.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center space-x-1">
                  <span>Platform &amp; Encryption Fee</span>
                  <Info className="w-3 h-3 text-slate-400" />
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  ₦{platformServiceFee.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="font-outfit font-bold text-[#022434]">Total Amount</span>
                <span className="font-outfit font-bold text-[#006c44] font-mono text-lg">
                  ₦{totalAmountPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmAction}
                className="w-full min-h-[48px] py-3.5 px-5 bg-[#006c44] hover:bg-[#022434] text-white font-outfit font-bold text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-300" />
                <span>
                  {bookingMode === 'instant' ? 'Connect with Doctor Now' : 'Schedule Appointment'} · ₦{totalAmountPayable.toLocaleString()}
                </span>
              </button>
              <p className="text-[11px] text-center text-emerald-700 font-semibold pt-2">
                {bookingMode === 'instant'
                  ? '⚡ Live triage in ~2–5 mins · Priority Queue'
                  : `📅 Scheduled for ${availableDates[selectedDateIndex].date} at ${selectedTimeSlot}`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>NDPA Encrypted · 100% full refund if canceled up to 2h prior</span>
            </div>
          </div>
        </div>
      </div>

      {/* DOCTOR SELECTION MODAL (Keeps main booking flow clean) */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-outfit font-bold text-base text-[#022434]">
                Choose Clinician
              </h3>
              <button
                type="button"
                onClick={() => setIsDoctorModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search physician or specialty..."
                value={doctorSearchQuery}
                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#006c44]"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredDoctors.map((doc) => {
                const isSelected = doc.id === currentDoctor.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setChosenDoctorId(doc.id);
                      onSelectDoctor(doc.id);
                      setIsDoctorModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#006c44] bg-emerald-50/60'
                        : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={doc.avatarUrl}
                        alt={doc.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#022434] truncate">
                          {doc.fullNameWithTitle || doc.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {doc.specialty}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-mono">
                          Video: ₦{doc.prices.video.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#006c44] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY PRE-CONSULTATION CLINICAL TRIAGE MODAL */}
      <ClinicalTriageModal
        isOpen={isTriageModalOpen}
        onClose={() => setIsTriageModalOpen(false)}
        doctorName={fullName}
        onTriageComplete={(result) => {
          if (result.cleared) {
            setIsTriageCleared(true);
            setIsTriageModalOpen(false);
            proceedToCheckout();
          }
        }}
      />
    </div>
  );
};
