import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Phone,
  MessageSquare,
  CheckCircle2,
  Lock,
  Sparkles,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Doctor } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface DoctorWeeklyCalendarProps {
  doctor: Doctor;
  selectedDate: string;
  selectedSlot: string;
  onSelectSlot: (dateStr: string, slotTime: string, consultType?: 'video' | 'voice' | 'chat') => void;
  onConfirmBooking?: (dateStr: string, slotTime: string, consultType: 'video' | 'voice' | 'chat') => void;
}

export interface DaySlotData {
  dateObj: Date;
  dateFormatted: string; // e.g., "Tue, Oct 21"
  dayName: string; // e.g., "Tue"
  dayNumber: number; // e.g., 21
  monthName: string; // e.g., "Oct"
  isToday: boolean;
  slots: {
    time: string; // e.g. "09:00 AM"
    period: 'morning' | 'afternoon' | 'evening';
    isBooked: boolean;
    availableTypes: ('video' | 'voice' | 'chat')[];
  }[];
}

// Generator function for 7 days starting from a given week offset
export function generateWeeklySchedule(doctor: Doctor, weekOffset: number = 0): DaySlotData[] {
  const result: DaySlotData[] = [];
  const now = new Date();
  
  // Calculate start of week (Monday)
  const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMon + weekOffset * 7);

  const timeTemplates = [
    { time: '08:30 AM', period: 'morning' as const },
    { time: '09:30 AM', period: 'morning' as const },
    { time: '10:30 AM', period: 'morning' as const },
    { time: '11:30 AM', period: 'morning' as const },
    { time: '01:30 PM', period: 'afternoon' as const },
    { time: '02:30 PM', period: 'afternoon' as const },
    { time: '03:30 PM', period: 'afternoon' as const },
    { time: '05:00 PM', period: 'evening' as const },
    { time: '06:00 PM', period: 'evening' as const },
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const isToday = d.toDateString() === now.toDateString();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNumber = d.getDate();
    const dateFormatted = `${dayName}, ${monthName} ${dayNumber}`;

    const isSunday = d.getDay() === 0;

    const slots = timeTemplates.map((item, idx) => {
      // Create a deterministic pseudo-random booking pattern based on doctor ID & day & index
      const hash = (doctor.id.length * 13 + d.getDate() * 7 + idx * 3) % 10;
      // Sunday has fewer slots available, weekdays more available
      const isBooked = isSunday ? idx !== 2 : hash === 2 || hash === 5;

      return {
        time: item.time,
        period: item.period,
        isBooked,
        availableTypes: ['video', 'voice', 'chat'] as ('video' | 'voice' | 'chat')[],
      };
    });

    result.push({
      dateObj: d,
      dateFormatted,
      dayName,
      dayNumber,
      monthName,
      isToday,
      slots,
    });
  }

  return result;
}

export const DoctorWeeklyCalendar: React.FC<DoctorWeeklyCalendarProps> = ({
  doctor,
  selectedDate,
  selectedSlot,
  onSelectSlot,
  onConfirmBooking,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [consultType, setConsultType] = useState<'video' | 'voice' | 'chat'>('video');
  const [activeDayIndex, setActiveDayIndex] = useState(0); // For mobile day switcher view

  const days = generateWeeklySchedule(doctor, weekOffset);

  // Date range label for header e.g. "Oct 20 - Oct 26, 2026"
  const startDay = days[0];
  const endDay = days[6];
  const dateRangeLabel = `${startDay.monthName} ${startDay.dayNumber} – ${endDay.monthName} ${endDay.dayNumber}, ${startDay.dateObj.getFullYear()}`;

  // Count total available slots across week
  const totalOpenSlots = days.reduce((acc, day) => {
    return (
      acc +
      day.slots.filter(
        (s) => !s.isBooked && (periodFilter === 'all' || s.period === periodFilter)
      ).length
    );
  }, 0);

  const handleSlotClick = (dateFormatted: string, time: string) => {
    triggerHaptic('selection');
    onSelectSlot(dateFormatted, time, consultType);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4 font-nunito">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#006c44]" />
            <h3 className="font-extrabold font-outfit text-[#022434] text-base">
              Real-Time Weekly Availability Schedule
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an open consultation slot on the calendar grid
          </p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('light');
              setWeekOffset((prev) => prev - 1);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-outfit text-[#022434] min-w-[150px] text-center">
            {dateRangeLabel}
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setWeekOffset((prev) => prev + 1);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {weekOffset !== 0 && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setWeekOffset(0);
              }}
              className="text-[10px] font-bold font-outfit text-[#006c44] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 hover:bg-emerald-100"
            >
              This Week
            </button>
          )}
        </div>
      </div>

      {/* Control Filters: Consultation Type & Time of Day */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
        {/* Consult Type Toggle */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setConsultType('video');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit transition-all ${
              consultType === 'video'
                ? 'bg-[#022434] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Consult</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setConsultType('voice');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit transition-all ${
              consultType === 'voice'
                ? 'bg-[#022434] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Voice Call</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setConsultType('chat');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit transition-all ${
              consultType === 'chat'
                ? 'bg-[#022434] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Text Chat</span>
          </button>
        </div>

        {/* Time of Day Filter & Slot Count */}
        <div className="flex items-center justify-between sm:justify-end space-x-2">
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mr-1">
              Time:
            </span>
            {(['all', 'morning', 'afternoon', 'evening'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  triggerHaptic('selection');
                  setPeriodFilter(p);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  periodFilter === p
                    ? 'bg-[#006c44] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-extrabold font-outfit bg-emerald-100 text-[#006c44] px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
            {totalOpenSlots} slots open
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end space-x-4 text-[11px] text-slate-500 pt-1 px-1">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#022434] border border-[#022434]" />
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
          <span>Booked / Reserved</span>
        </div>
      </div>

      {/* MOBILE DAY TABS (VISIBLE ON SMALL SCREENS) */}
      <div className="flex sm:hidden space-x-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-slate-100">
        {days.map((day, idx) => {
          const count = day.slots.filter((s) => !s.isBooked).length;
          return (
            <button
              key={day.dateFormatted}
              onClick={() => {
                triggerHaptic('selection');
                setActiveDayIndex(idx);
              }}
              className={`flex-1 min-w-[65px] p-2 rounded-2xl text-center transition-all border ${
                activeDayIndex === idx
                  ? 'bg-[#022434] text-white border-[#022434] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block">{day.dayName}</span>
              <span className="text-sm font-extrabold font-outfit block">{day.dayNumber}</span>
              <span
                className={`text-[9px] font-bold rounded-full px-1.5 py-0.2 mt-0.5 inline-block ${
                  activeDayIndex === idx
                    ? 'bg-emerald-400 text-[#022434]'
                    : count > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {count} open
              </span>
            </button>
          );
        })}
      </div>

      {/* DESKTOP/TABLET WEEKLY GRID (7 COLUMNS) */}
      <div className="hidden sm:grid grid-cols-7 gap-2">
        {days.map((day) => {
          const visibleSlots = day.slots.filter(
            (s) => periodFilter === 'all' || s.period === periodFilter
          );

          return (
            <div
              key={day.dateFormatted}
              className={`rounded-2xl border p-2 space-y-2 transition-all ${
                day.isToday
                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/30'
                  : 'bg-slate-50/60 border-slate-200/80'
              }`}
            >
              {/* Day Column Header */}
              <div className="text-center pb-1.5 border-b border-slate-200/60">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  {day.dayName}
                </span>
                <span className="text-base font-extrabold font-outfit text-[#022434]">
                  {day.dayNumber}
                </span>
                {day.isToday && (
                  <span className="bg-[#006c44] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mt-0.5">
                    Today
                  </span>
                )}
              </div>

              {/* Time Slots List */}
              <div className="space-y-1.5">
                {visibleSlots.map((slot) => {
                  const isSelected =
                    selectedDate === day.dateFormatted && selectedSlot === slot.time;

                  if (slot.isBooked) {
                    return (
                      <div
                        key={slot.time}
                        className="py-1.5 px-1 bg-slate-200/60 text-slate-400 text-[10px] font-mono font-bold rounded-xl text-center cursor-not-allowed flex items-center justify-center space-x-1 line-through"
                        title="Booked by another patient"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>{slot.time}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(day.dateFormatted, slot.time)}
                      className={`w-full py-2 px-1 rounded-xl text-[11px] font-extrabold font-outfit transition-all flex items-center justify-center space-x-1 border shadow-2xs ${
                        isSelected
                          ? 'bg-[#022434] text-white border-[#022434] ring-2 ring-emerald-400'
                          : 'bg-white text-[#006c44] border-emerald-200 hover:bg-[#e6f9f0] hover:border-[#006c44]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#77daa4]" />}
                      <span>{slot.time}</span>
                    </button>
                  );
                })}

                {visibleSlots.length === 0 && (
                  <div className="py-4 text-center text-[10px] text-slate-400 font-nunito">
                    No slots
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE SINGLE-DAY SLOT DETAIL VIEW */}
      <div className="sm:hidden space-y-2 pt-1">
        {(() => {
          const currentDay = days[activeDayIndex];
          const visibleSlots = currentDay.slots.filter(
            (s) => periodFilter === 'all' || s.period === periodFilter
          );

          return (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold font-outfit text-sm text-[#022434]">
                  {currentDay.dateFormatted} {currentDay.isToday && '(Today)'}
                </span>
                <span className="text-xs text-slate-500">
                  {visibleSlots.filter((s) => !s.isBooked).length} Available Slots
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {visibleSlots.map((slot) => {
                  const isSelected =
                    selectedDate === currentDay.dateFormatted && selectedSlot === slot.time;

                  if (slot.isBooked) {
                    return (
                      <div
                        key={slot.time}
                        className="py-2.5 bg-slate-200/80 text-slate-400 text-xs font-mono font-bold rounded-xl text-center line-through flex items-center justify-center space-x-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>{slot.time}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(currentDay.dateFormatted, slot.time)}
                      className={`py-2.5 rounded-xl text-xs font-extrabold font-outfit transition-all border flex items-center justify-center space-x-1 ${
                        isSelected
                          ? 'bg-[#022434] text-white border-[#022434] ring-2 ring-emerald-400 shadow-sm'
                          : 'bg-white text-[#006c44] border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#77daa4]" />}
                      <span>{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* SELECTED SLOT ACTION FOOTER BANNER */}
      {selectedSlot && selectedDate && (
        <div className="bg-gradient-to-r from-[#022434] to-[#1c3a4a] text-white p-4 rounded-2xl shadow-lg border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-[#77daa4] border border-emerald-400/30 flex items-center justify-center shrink-0">
              {consultType === 'video' ? (
                <Video className="w-5 h-5" />
              ) : consultType === 'voice' ? (
                <Phone className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-extrabold font-outfit text-[#77daa4] uppercase tracking-wider block">
                Selected Appointment Slot
              </span>
              <h4 className="font-extrabold font-outfit text-white text-sm sm:text-base">
                {selectedDate} at {selectedSlot}
              </h4>
              <p className="text-xs text-slate-300">
                {consultType === 'video'
                  ? 'HD Video Consultation'
                  : consultType === 'voice'
                  ? 'Voice Call'
                  : 'Async Text Consultation'}{' '}
                • ₦{(doctor.prices[consultType] || 10000).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              if (onConfirmBooking) {
                onConfirmBooking(selectedDate, selectedSlot, consultType);
              }
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#77daa4] hover:bg-emerald-300 text-[#022434] font-extrabold font-outfit text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 active:scale-[0.98]"
          >
            <span>Proceed to Book Slot</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
