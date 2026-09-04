import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { BottomNav } from '../common/BottomNav';
import { Info, Phone, Video, MessageSquare, Star, ShieldCheck } from 'lucide-react';
import { ScreenId, Doctor, UserRole } from '../../types';
import { mockDoctors } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';

interface DoctorProfileScreenProps {
  doctorId?: string;
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ doctorId, onNavigate, role = 'patient' }) => {
  const currentDoctor: Doctor =
    mockDoctors.find((d) => d.id === doctorId) || mockDoctors[3]; // Dr. Ching Ming Yu

  const [isLiked, setIsLiked] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Tomorrow, Oct 25');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [showFullAbout, setShowFullAbout] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />
      {/* Top Header transparent overlay */}
      <Header
        title=""
        showBack
        onBack={() => onNavigate('patient-home')}
        showLike
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
        transparent
      />

      {/* Hero Photo Section */}
      <div className="-mt-14 relative h-80 w-full overflow-hidden">
        <img
          src={currentDoctor.avatarUrl}
          alt={currentDoctor.name}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#022434] via-[#022434]/30 to-transparent"></div>

        <div className="absolute bottom-6 left-5 right-5 text-white">
          <h1 className="text-2xl font-extrabold font-outfit">{currentDoctor.name}</h1>
          <p className="text-xs text-slate-200 font-nunito">{currentDoctor.specialty}</p>

          <div className="flex items-center space-x-1.5 mt-2 bg-emerald-900/60 backdrop-blur-md px-3 py-1 rounded-full w-fit">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white">{currentDoctor.rating} Rating</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 -mt-3 relative z-10">
        {/* Floating Stats Card */}
        <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 font-nunito block">Experience</span>
            <span className="text-sm font-extrabold font-outfit text-[#022434] block mt-0.5">
              {currentDoctor.yearsExperience}+ Years
            </span>
          </div>
          <div className="border-x border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 font-nunito block">Patients</span>
            <span className="text-sm font-extrabold font-outfit text-[#022434] block mt-0.5">
              {currentDoctor.patientsCount.toLocaleString()}+
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 font-nunito block">Rating</span>
            <span className="text-sm font-extrabold font-outfit text-[#022434] block mt-0.5">
              {currentDoctor.rating} ({currentDoctor.reviewsCount}+)
            </span>
          </div>
        </div>

        {/* Quick Action Circle Buttons */}
        <div className="flex justify-around items-center">
          <button
            onClick={() => alert(`Doctor Specialty: ${currentDoctor.title}`)}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="p-3.5 bg-[#022434] text-white rounded-full shadow-sm group-hover:bg-[#1c3a4a] transition-all">
              <Info className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-nunito text-slate-600">Info</span>
          </button>

          <button
            onClick={() => onNavigate('video-call')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="p-3.5 bg-[#022434] text-white rounded-full shadow-sm group-hover:bg-[#1c3a4a] transition-all">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-nunito text-slate-600">Call</span>
          </button>

          <button
            onClick={() => onNavigate('video-call')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="p-3.5 bg-[#022434] text-white rounded-full shadow-sm group-hover:bg-[#1c3a4a] transition-all">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-nunito text-slate-600">Video</span>
          </button>

          <button
            onClick={() => onNavigate('active-chat')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="p-3.5 bg-[#022434] text-white rounded-full shadow-sm group-hover:bg-[#1c3a4a] transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-nunito text-slate-600">Chat</span>
          </button>
        </div>

        {/* About Section */}
        <div>
          <h3 className="font-bold font-outfit text-[#022434] text-base mb-1">About</h3>
          <p className="text-xs text-slate-600 font-nunito leading-relaxed">
            {showFullAbout ? currentDoctor.about : `${currentDoctor.about.slice(0, 130)}... `}
            <button
              onClick={() => setShowFullAbout(!showFullAbout)}
              className="text-[#006c44] font-bold hover:underline ml-1"
            >
              {showFullAbout ? 'Read less' : 'Read more'}
            </button>
          </p>
        </div>

        {/* Date Selector Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {currentDoctor.availableDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-full text-xs font-bold font-outfit whitespace-nowrap transition-all border ${
                selectedDate === date
                  ? 'bg-[#007349] text-white border-[#007349] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {date}
            </button>
          ))}
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {currentDoctor.availableTimeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`py-2.5 rounded-2xl text-xs font-bold font-outfit transition-all border ${
                selectedSlot === slot
                  ? 'bg-[#1c3a4a] text-white border-[#1c3a4a] shadow-sm'
                  : 'bg-[#1c3a4a]/10 text-[#022434] border-transparent hover:bg-slate-200'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Fixed Booking Bar */}
      <div className="fixed bottom-14 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-xl z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between space-x-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 font-nunito block">Consultation Fee</span>
            <span className="text-lg font-extrabold font-outfit text-[#022434] block">₦{currentDoctor.prices.video.toLocaleString()}</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('book-consultation');
            }}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#1c3a4a] to-[#006c44] text-white font-bold font-outfit text-sm rounded-2xl shadow-lg hover:from-[#022434] hover:to-[#004d30] transition-all transform active:scale-98 flex flex-col items-center justify-center"
          >
            <span className="text-sm font-extrabold font-outfit">Book Consultation Now</span>
            <span className="text-[10px] text-emerald-200 font-normal flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Secured Instant Booking</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
