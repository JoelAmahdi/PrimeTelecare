import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { BottomNav } from '../common/BottomNav';
import { Star, MessageSquare, Phone, Video, CheckCircle2, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScreenId, Doctor, UserRole } from '../../types';
import { mockDoctors } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';

interface BookConsultationScreenProps {
  selectedDoctorId?: string;
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctor: (doctorId: string) => void;
  role?: UserRole;
}

export const BookConsultationScreen: React.FC<BookConsultationScreenProps> = ({
  selectedDoctorId,
  onNavigate,
  onSelectDoctor,
  role = 'patient',
}) => {
  const currentDoctor: Doctor =
    mockDoctors.find((d) => d.id === selectedDoctorId) || mockDoctors[0];

  const [consultationType, setConsultationType] = useState<'Chat' | 'Voice' | 'Video'>('Video');
  const [selectedDateIndex, setSelectedDateIndex] = useState(2); // Wed 23
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM');

  const dates = [
    { day: 'Mon', date: '21' },
    { day: 'Tue', date: '22' },
    { day: 'Wed', date: '23' },
    { day: 'Thu', date: '24' },
    { day: 'Fri', date: '25' },
    { day: 'Sat', date: '26' },
  ];

  const timeSlots = [
    { time: '9:00 AM', status: 'available', color: 'bg-emerald-500' },
    { time: '10:30 AM', status: 'available', color: 'bg-emerald-500' },
    { time: '1:00 PM', status: 'busy', color: 'bg-amber-400' },
    { time: '3:15 PM', status: 'available', color: 'bg-emerald-500' },
    { time: '4:45 PM', status: 'full', color: 'bg-rose-500' },
  ];

  const prices = {
    Chat: currentDoctor.prices.chat,
    Voice: currentDoctor.prices.voice,
    Video: currentDoctor.prices.video,
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" time="9:41 AM" batteryLevel={100} />

      <Header
        title="Book a Consultation"
        showBack
        onBack={() => onNavigate('patient-home')}
        showBell
        bellCount={1}
      />

      <div className="px-5 space-y-5 mt-2">
        {/* Selected Doctor Summary Card */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={currentDoctor.avatarUrl} alt={currentDoctor.name} className="w-14 h-14 rounded-2xl object-cover" />
            <div>
              <h3 className="font-bold font-outfit text-[#022434] text-base">{currentDoctor.name}</h3>
              <p className="text-xs text-slate-500 font-nunito">{currentDoctor.specialty}</p>
              <div className="flex items-center space-x-1 text-xs mt-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold text-[#022434]">{currentDoctor.rating}</span>
                <span className="text-slate-400">({currentDoctor.reviewsCount} reviews)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('doctor-profile')}
            className="text-xs font-bold text-[#006c44] hover:underline whitespace-nowrap"
          >
            Change doctor
          </button>
        </div>

        {/* Select Consultation Type */}
        <div>
          <h3 className="font-bold font-outfit text-[#022434] text-base mb-3">Select Consultation Type</h3>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Chat Option */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                setConsultationType('Chat');
              }}
              className={`relative p-3 rounded-2xl border flex flex-col items-center justify-between h-32 text-center transition-all ${
                consultationType === 'Chat'
                  ? 'border-[#006c44] bg-[#e6f9f0] ring-2 ring-[#006c44]/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {consultationType === 'Chat' && (
                <CheckCircle2 className="w-4 h-4 text-[#006c44] absolute top-2 right-2 fill-[#006c44] text-white" />
              )}
              <MessageSquare className="w-6 h-6 text-[#022434] mt-1" />
              <div>
                <span className="font-bold font-outfit text-sm text-[#022434] block">Chat</span>
                <span className="text-[10px] text-slate-500 leading-tight block">Text-based consultation.</span>
              </div>
              <span className="text-xs font-bold font-data bg-slate-100 text-[#022434] px-2 py-0.5 rounded-full">
                ₦{prices.Chat.toLocaleString()}
              </span>
            </button>

            {/* Voice Option */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                setConsultationType('Voice');
              }}
              className={`relative p-3 rounded-2xl border flex flex-col items-center justify-between h-32 text-center transition-all ${
                consultationType === 'Voice'
                  ? 'border-[#006c44] bg-[#e6f9f0] ring-2 ring-[#006c44]/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {consultationType === 'Voice' && (
                <CheckCircle2 className="w-4 h-4 text-[#006c44] absolute top-2 right-2 fill-[#006c44] text-white" />
              )}
              <Phone className="w-6 h-6 text-[#022434] mt-1" />
              <div>
                <span className="font-bold font-outfit text-sm text-[#022434] block">Voice</span>
                <span className="text-[10px] text-slate-500 leading-tight block">Audio call.</span>
              </div>
              <span className="text-xs font-bold font-data bg-slate-100 text-[#022434] px-2 py-0.5 rounded-full">
                ₦{prices.Voice.toLocaleString()}
              </span>
            </button>

            {/* Video Option */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                setConsultationType('Video');
              }}
              className={`relative p-3 rounded-2xl border flex flex-col items-center justify-between h-32 text-center transition-all ${
                consultationType === 'Video'
                  ? 'border-[#006c44] bg-[#e6f9f0] ring-2 ring-[#006c44]/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {consultationType === 'Video' && (
                <CheckCircle2 className="w-4 h-4 text-[#006c44] absolute top-2 right-2 fill-[#006c44] text-white" />
              )}
              <Video className="w-6 h-6 text-[#022434] mt-1" />
              <div>
                <span className="font-bold font-outfit text-sm text-[#022434] block">Video</span>
                <span className="text-[10px] text-slate-500 leading-tight block">Face-to-face call.</span>
              </div>
              <span className="text-xs font-bold font-data bg-[#77daa4] text-[#022434] px-2 py-0.5 rounded-full">
                ₦{prices.Video.toLocaleString()}
              </span>
            </button>
          </div>
        </div>

        {/* Select Date Horizontal Row */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold font-outfit text-[#022434] text-base">Select Date</h3>
            <div className="flex items-center space-x-1 text-xs font-bold text-[#022434]">
              <ChevronLeft className="w-4 h-4 cursor-pointer text-slate-400" />
              <span>October 2024</span>
              <ChevronRight className="w-4 h-4 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {dates.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedDateIndex(idx);
                }}
                className={`py-3 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                  selectedDateIndex === idx
                    ? 'bg-[#1c3a4a] text-white border-[#1c3a4a] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-medium opacity-80">{item.day}</span>
                <span className="text-base font-extrabold font-outfit">{item.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Select Time Heatmap Indicators */}
        <div>
          <h3 className="font-bold font-outfit text-[#022434] text-base mb-2">Select Time</h3>

          {/* Availability Heat Blocks */}
          <div className="grid grid-cols-12 gap-1 mb-2">
            {[
              'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500',
              'bg-emerald-500', 'bg-emerald-500', 'bg-amber-400', 'bg-amber-400',
              'bg-emerald-500', 'bg-rose-500', 'bg-rose-500', 'bg-rose-500'
            ].map((color, i) => (
              <div key={i} className={`h-6 rounded-md ${color}`}></div>
            ))}
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-600 font-data px-1">
            <span>9:00 AM</span>
            <span>10:30 AM</span>
            <span>1:00 PM</span>
            <span>3:15 PM</span>
            <span>4:45 PM</span>
          </div>
        </div>

        {/* Upload photos optional button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onNavigate('upload-media');
          }}
          className="w-full border-2 border-dashed border-[#77daa4] bg-emerald-50/50 p-4 rounded-2xl flex items-center justify-center space-x-2 text-sm font-bold text-[#006c44] hover:bg-emerald-100/50 transition-all"
        >
          <Camera className="w-5 h-5" />
          <span>Upload photos (optional)</span>
        </button>

        {/* Proceed to Payment Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onNavigate('payment');
          }}
          className="w-full py-4 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-2xl shadow-lg hover:bg-[#022434] transition-all transform active:scale-98 mt-4"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};
