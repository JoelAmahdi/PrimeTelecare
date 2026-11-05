import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  X,
  Calendar,
  WifiOff,
  Video,
  Phone,
  MessageSquare,
  Clock,
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { ScreenId, User, BookingSummary } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { useOfflineStatus } from '../../utils/useOfflineStatus';
import {
  AppointmentAlert,
  getActiveOrUpcomingConsultations,
  cancelConsultation,
} from '../../utils/appointmentNotifications';
import { processJoinOrPayConsultation } from '../../utils/consultationPayment';
import { showToast } from '../../utils/toast';

interface PatientHomeDashboardProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctor: (doctorId: string) => void;
  onSaveBookingSummary?: (summary: BookingSummary) => void;
  isOfflineMode?: boolean;
}

export const PatientHomeDashboard: React.FC<PatientHomeDashboardProps> = ({
  user,
  onNavigate,
  onSaveBookingSummary,
  isOfflineMode = false,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [consultations, setConsultations] = useState<AppointmentAlert[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
  const [metricView, setMetricView] = useState<'bpm' | 'temp' | 'bp'>('bpm');
  const { isOffline, isSimulatedOffline } = useOfflineStatus();
  const effectiveOffline = isOfflineMode || isOffline || isSimulatedOffline;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadConsultations = () => {
      const active = getActiveOrUpcomingConsultations();
      setConsultations(active);
    };
    loadConsultations();
    window.addEventListener('appointment-alerts-updated', loadConsultations);
    window.addEventListener('consultation-payment-updated', loadConsultations);
    return () => {
      window.removeEventListener('appointment-alerts-updated', loadConsultations);
      window.removeEventListener('consultation-payment-updated', loadConsultations);
    };
  }, []);

  const handleJoinConsultation = (consult: AppointmentAlert) => {
    triggerHaptic('heavy');
    processJoinOrPayConsultation({
      id: consult.id,
      type: consult.type,
      doctorId: consult.doctorId || 'doc-anya',
      doctorName: consult.doctorName,
      doctorSpecialty: consult.doctorSpecialty,
      doctorAvatar: consult.doctorAvatar,
      price: consult.price || 10000,
      onNavigate,
      onSaveBookingSummary,
    });
  };

  const handleCancelConsultation = (id: string, doctorName: string) => {
    triggerHaptic('medium');
    cancelConsultation(id);
    showToast(`Consultation with ${doctorName} has been cancelled.`);
  };

  const weeklyVitalsData = [
    { day: 'Mon', bpm: 72, temp: 98.2, sys: 120, dia: 80 },
    { day: 'Tue', bpm: 74, temp: 98.4, sys: 118, dia: 79 },
    { day: 'Wed', bpm: 71, temp: 98.1, sys: 121, dia: 81 },
    { day: 'Thu', bpm: 75, temp: 98.6, sys: 122, dia: 82 },
    { day: 'Fri', bpm: 73, temp: 98.3, sys: 119, dia: 78 },
    { day: 'Sat', bpm: 76, temp: 98.5, sys: 124, dia: 83 },
    { day: 'Sun', bpm: 72, temp: 98.2, sys: 120, dia: 80 },
  ];
  const monthlyVitalsData = [
    { day: 'W1', bpm: 73, temp: 98.2, sys: 120, dia: 80 },
    { day: 'W2', bpm: 71, temp: 98.4, sys: 118, dia: 79 },
    { day: 'W3', bpm: 75, temp: 98.1, sys: 121, dia: 81 },
    { day: 'W4', bpm: 74, temp: 98.6, sys: 122, dia: 82 },
  ];
  const currentVitalsData = chartView === 'weekly' ? weeklyVitalsData : monthlyVitalsData;

  const isWeekly = chartView === 'weekly';
  let activeMetricInfo = { 
    title: 'Heart Rate', unit: 'bpm', value: '73', color: '#006c44', dataKey: 'bpm',
    trend: { value: isWeekly ? '-2%' : '-5%', direction: 'down', colorClass: 'text-emerald-600 bg-emerald-50' }
  };
  if (metricView === 'temp') {
    activeMetricInfo = { 
      title: 'Temperature', unit: '°F', value: '98.3', color: '#ea580c', dataKey: 'temp',
      trend: { value: isWeekly ? '+0.2%' : '+0.5%', direction: 'up', colorClass: 'text-rose-600 bg-rose-50' }
    };
  } else if (metricView === 'bp') {
    activeMetricInfo = { 
      title: 'Blood Pressure', unit: 'mmHg', value: '120/80', color: '#2563eb', dataKey: 'sys',
      trend: { value: isWeekly ? '-1%' : '-3%', direction: 'down', colorClass: 'text-emerald-600 bg-emerald-50' }
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-nunito selection:bg-emerald-100 selection:text-emerald-900 pb-28 sm:pb-24">
      <div className="flex-1 px-4 sm:px-5 pt-4 sm:pt-6 max-w-3xl mx-auto w-full space-y-6">
        {/* Header Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-outfit text-[#022434] truncate">
              Good morning, {user.name.split(' ')[0]}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-nunito truncate">
              Your journey to better health
            </p>
          </div>
          <button 
            onClick={() => { triggerHaptic('selection'); setIsNotificationsOpen(true); }}
            className="relative p-2.5 rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-500 hover:text-[#022434] transition-colors active:scale-95"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {consultations.length > 0 && (
              <span className="absolute top-2 right-2.5 flex items-center justify-center w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {effectiveOffline && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-800 shrink-0">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold font-outfit text-amber-900 block">Offline Mode — Cached Dashboard Active</span>
                <span className="text-[11px] text-amber-800">Preserved in IndexedDB storage. Records and offline features remain available.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
              IndexedDB
            </span>
          </div>
        )}

        {/* 1. Quick-Glance Health Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold font-outfit text-[#022434] text-base">Health Summary</h3>
              <p className="text-xs text-slate-400 font-nunito">Real-time biometrics & historical trends</p>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
              <button 
                onClick={() => { triggerHaptic('selection'); setChartView('weekly'); }}
                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition-colors ${chartView === 'weekly' ? 'bg-white text-[#022434] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                1W
              </button>
              <button 
                onClick={() => { triggerHaptic('selection'); setChartView('monthly'); }}
                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition-colors ${chartView === 'monthly' ? 'bg-white text-[#022434] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                1M
              </button>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg mb-4">
            <button 
              onClick={() => { triggerHaptic('selection'); setMetricView('bpm'); }}
              className={`flex-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md transition-colors ${metricView === 'bpm' ? 'bg-white text-[#006c44] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pulse
            </button>
            <button 
              onClick={() => { triggerHaptic('selection'); setMetricView('temp'); }}
              className={`flex-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md transition-colors ${metricView === 'temp' ? 'bg-white text-[#ea580c] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Temp
            </button>
            <button 
              onClick={() => { triggerHaptic('selection'); setMetricView('bp'); }}
              className={`flex-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md transition-colors ${metricView === 'bp' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              BP
            </button>
          </div>
          
          <div className="flex items-end space-x-4 mb-2">
            <div className="pb-1 min-w-[80px]">
              <div className="flex items-center space-x-2 mb-1">
                <div className="text-3xl font-extrabold font-outfit text-[#022434] leading-none">{activeMetricInfo.value}</div>
                <div className={`flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeMetricInfo.trend.colorClass}`}>
                  {activeMetricInfo.trend.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {activeMetricInfo.trend.value}
                </div>
              </div>
              <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">{activeMetricInfo.unit}</div>
            </div>
            <div className="flex-1 h-20 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentVitalsData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorbpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006c44" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#006c44" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colortemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorbp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorbp_dia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '4px 12px' }}
                    labelStyle={{ display: 'none' }}
                    itemStyle={{ color: activeMetricInfo.color, fontWeight: 'bold', fontSize: '14px' }}
                    cursor={{ stroke: activeMetricInfo.color, strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey={activeMetricInfo.dataKey} stroke={activeMetricInfo.color} strokeWidth={3} fillOpacity={1} fill={`url(#color${metricView})`} />
                  {metricView === 'bp' && (
                    <Area type="monotone" dataKey="dia" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorbp_dia)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* 2. Upcoming / Active Booking OR 'Book a consultation now' */}
        <div className="space-y-3">
          <h3 className="font-bold font-outfit text-[#022434] text-base">
            Upcoming/active bookings
          </h3>

          {consultations.length > 0 ? (
            <div className="space-y-3">
              {consultations.map((consult) => {
                const diffMs = consult.startTimeTimestamp - currentTime;
                const isStartingSoon = diffMs <= 15 * 60 * 1000 && diffMs >= -45 * 60 * 1000;
                
                let countdownLabel = `${consult.scheduledDate} • ${consult.scheduledTime}`;
                if (diffMs <= 0 && diffMs >= -45 * 60 * 1000) {
                  countdownLabel = 'Live Now • Room Ready';
                } else if (diffMs > 0 && diffMs <= 15 * 60 * 1000) {
                  const totalSecs = Math.floor(diffMs / 1000);
                  const mins = Math.floor(totalSecs / 60);
                  const secs = totalSecs % 60;
                  countdownLabel = `Starts in ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
                }

                return (
                  <motion.div
                    key={consult.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4.5 sm:p-5 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                          {consult.type === 'Chat' ? (
                            <MessageSquare className="w-3.5 h-3.5 text-[#006c44]" />
                          ) : consult.type === 'Voice' ? (
                            <Phone className="w-3.5 h-3.5 text-[#006c44]" />
                          ) : (
                            <Video className="w-3.5 h-3.5 text-[#006c44]" />
                          )}
                          <span>{consult.type} Call</span>
                        </span>

                        {isStartingSoon ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-[#006c44] border border-emerald-200/80 text-xs font-semibold rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{countdownLabel}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-slate-500 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{consult.scheduledDate}, {consult.scheduledTime}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCancelConsultation(consult.id, consult.doctorName)}
                        className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors px-1 py-0.5 shrink-0"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Doctor Details */}
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={consult.doctorAvatar}
                        alt={consult.doctorName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold font-outfit text-base text-[#022434] leading-snug">
                          {consult.doctorName}
                        </h4>
                        <p className="text-xs text-slate-500 font-nunito mt-0.5">
                          {consult.doctorSpecialty}
                        </p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleJoinConsultation(consult)}
                      className="w-full py-3 px-4 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-xs hover:shadow-sm transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
                    >
                      {consult.type === 'Chat' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : consult.type === 'Voice' ? (
                        <Phone className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span>{isStartingSoon ? 'Join Consultation Room' : 'Enter Consultation'}</span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* When there are no active consultations or booked consultations: show 'book a consultation now' */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/90 flex flex-col items-center justify-center text-center space-y-3.5"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                <Calendar className="w-6 h-6 text-slate-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold font-outfit text-[#022434]">
                  No active or booked consultations
                </p>
                <p className="text-xs text-slate-500 font-nunito max-w-xs mx-auto">
                  Connect with our board-certified physicians for virtual care and prescriptions.
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onNavigate('book-consultation');
                }}
                className="w-full max-w-xs py-3 px-4 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-xs hover:shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <span>Book a consultation now</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl text-[#006c44]">
                  <Bell className="w-5 h-5 fill-[#006c44]" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-base text-[#022434]">Notifications</h3>
                </div>
              </div>
              <button
                onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {consultations.length > 0 ? (
              <div className="space-y-2">
                {consultations.map((c) => (
                  <div key={c.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                    <p className="font-bold text-emerald-900">{c.type} session with {c.doctorName}</p>
                    <p className="text-emerald-700">{c.scheduledDate} at {c.scheduledTime}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No new notifications.</p>
            )}
            <button
              onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(false); }}
              className="w-full py-3 bg-[#1c3a4a] text-white font-bold font-outfit text-xs rounded-xl hover:bg-[#022434] transition-colors"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

