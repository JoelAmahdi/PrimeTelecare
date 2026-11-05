import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Activity,
  HeartPulse,
  Droplet,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  mockBloodPressureData,
  mockGlucoseData,
  mockOxygenPulseData,
  BloodPressureReading,
  GlucoseReading,
  OxygenPulseReading,
} from '../../data/mockHealthTrends';
import { triggerHaptic } from '../../utils/haptics';

export const HealthTrendsChart: React.FC = () => {
  const [metric, setMetric] = useState<'bp' | 'glucose' | 'spo2'>('bp');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | 'ALL'>('3M');

  // Dynamic readings state allowing user to log new vitals
  const [bpData, setBpData] = useState<BloodPressureReading[]>(mockBloodPressureData);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>(mockGlucoseData);
  const [spo2Data, setSpo2Data] = useState<OxygenPulseReading[]>(mockOxygenPulseData);

  // New Vital Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [newSystolic, setNewSystolic] = useState('120');
  const [newDiastolic, setNewDiastolic] = useState('80');
  const [newGlucose, setNewGlucose] = useState('95');
  const [newSpo2, setNewSpo2] = useState('98');
  const [newPulse, setNewPulse] = useState('72');

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');

    const todayStr = new Date().toISOString().split('T')[0];
    const shortDateStr = 'Today';

    if (metric === 'bp') {
      const sys = parseInt(newSystolic) || 120;
      const dia = parseInt(newDiastolic) || 80;
      let cat: BloodPressureReading['category'] = 'Optimal';
      if (sys >= 140 || dia >= 90) cat = 'Stage 2 HTN';
      else if (sys >= 130 || dia >= 80) cat = 'Stage 1 HTN';
      else if (sys >= 120) cat = 'Elevated';

      const newEntry: BloodPressureReading = {
        id: `bp-${Date.now()}`,
        date: todayStr,
        shortDate: shortDateStr,
        systolic: sys,
        diastolic: dia,
        heartRate: parseInt(newPulse) || 70,
        category: cat,
        notes: 'User self-logged reading',
      };
      setBpData((prev) => [...prev, newEntry]);
    } else if (metric === 'glucose') {
      const glu = parseInt(newGlucose) || 95;
      let status: GlucoseReading['status'] = 'Normal';
      if (glu >= 126) status = 'High';
      else if (glu >= 100) status = 'Prediabetic';

      const newEntry: GlucoseReading = {
        id: `glu-${Date.now()}`,
        date: todayStr,
        shortDate: shortDateStr,
        glucose: glu,
        type: 'Fasting',
        status,
      };
      setGlucoseData((prev) => [...prev, newEntry]);
    } else {
      const sp = parseInt(newSpo2) || 98;
      const hr = parseInt(newPulse) || 72;
      const newEntry: OxygenPulseReading = {
        id: `spo2-${Date.now()}`,
        date: todayStr,
        shortDate: shortDateStr,
        spo2: sp,
        pulse: hr,
      };
      setSpo2Data((prev) => [...prev, newEntry]);
    }

    setShowLogModal(false);
    triggerHaptic('success');
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#022434] text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-nunito space-y-1.5 min-w-[160px]">
          <span className="font-extrabold font-outfit text-emerald-300 block border-b border-slate-700 pb-1">
            {label}
          </span>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center space-x-3">
              <span className="flex items-center space-x-1 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-5">
      {/* Chart Top Header & Metric Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#006c44]" />
            <h3 className="font-extrabold font-outfit text-[#022434] text-base">
              Chronic Condition Health Trends
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-nunito mt-0.5">
            Continuous longitudinal vital sign tracking & target range monitoring
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            setShowLogModal(true);
          }}
          className="px-3.5 py-2 bg-[#022434] hover:bg-[#1c3a4a] text-white font-extrabold font-outfit text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#77daa4]" />
          <span>Log Vitals Reading</span>
        </button>
      </div>

      {/* Metric Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setMetric('bp');
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            metric === 'bp'
              ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <HeartPulse className={`w-4 h-4 ${metric === 'bp' ? 'text-[#006c44]' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
              116/76 mmHg
            </span>
          </div>
          <span className="font-bold font-outfit text-xs text-[#022434] block mt-1">
            Blood Pressure
          </span>
          <span className="text-[10px] text-slate-500 font-nunito block">
            Systolic / Diastolic
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            setMetric('glucose');
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            metric === 'glucose'
              ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <Droplet className={`w-4 h-4 ${metric === 'glucose' ? 'text-[#006c44]' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
              90 mg/dL
            </span>
          </div>
          <span className="font-bold font-outfit text-xs text-[#022434] block mt-1">
            Fasting Glucose
          </span>
          <span className="text-[10px] text-slate-500 font-nunito block">
            Blood Sugar Level
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            setMetric('spo2');
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            metric === 'spo2'
              ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <Activity className={`w-4 h-4 ${metric === 'spo2' ? 'text-[#006c44]' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
              99% SpO2
            </span>
          </div>
          <span className="font-bold font-outfit text-xs text-[#022434] block mt-1">
            Pulse & O2
          </span>
          <span className="text-[10px] text-slate-500 font-nunito block">
            Oxygen & Heart Rate
          </span>
        </button>
      </div>

      {/* Main Recharts Container */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold font-outfit text-[#022434] flex items-center space-x-1.5">
            <TrendingDown className="w-4 h-4 text-[#006c44]" />
            <span>
              {metric === 'bp' && 'Blood Pressure Trend (mmHg)'}
              {metric === 'glucose' && 'Fasting Blood Sugar Trend (mg/dL)'}
              {metric === 'spo2' && 'Pulse Oximetry & Heart Rate (SpO2 % / BPM)'}
            </span>
          </span>

          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Target Zone: {metric === 'bp' ? '< 120/80 mmHg' : metric === 'glucose' ? '70 - 99 mg/dL' : '95 - 100%'}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {metric === 'bp' ? (
              <LineChart data={bpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[60, 160]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={120} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Systolic Goal (120)', fill: '#059669', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={80} stroke="#059669" strokeDasharray="4 4" label={{ value: 'Diastolic Goal (80)', fill: '#059669', fontSize: 10, position: 'insideBottomRight' }} />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic (mmHg)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444' }}
                  activeDot={{ r: 6 }}
                  unit="mmHg"
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic (mmHg)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                  unit="mmHg"
                />
              </LineChart>
            ) : metric === 'glucose' ? (
              <LineChart data={glucoseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[70, 140]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Lower Normal (70 mg/dL)', fill: '#059669', fontSize: 10 }} />
                <ReferenceLine y={99} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Fasting Upper Goal (99 mg/dL)', fill: '#059669', fontSize: 10 }} />
                <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Prediabetes Threshold (100 mg/dL)', fill: '#d97706', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="glucose"
                  name="Fasting Glucose (mg/dL)"
                  stroke="#006c44"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#006c44' }}
                  activeDot={{ r: 6 }}
                  unit="mg/dL"
                />
              </LineChart>
            ) : (
              <LineChart data={spo2Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[60, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={95} stroke="#059669" strokeDasharray="4 4" label={{ value: 'Normal Oxygen (>95%)', fill: '#059669', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  name="SpO2 (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  unit="%"
                />
                <Line
                  type="monotone"
                  dataKey="pulse"
                  name="Heart Rate (BPM)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  unit="BPM"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinical Insights Banner */}
      <div className="bg-[#022434] text-white p-4 rounded-2xl space-y-2 text-xs font-nunito border border-slate-700">
        <div className="flex items-center space-x-2 text-[#77daa4] font-extrabold font-outfit">
          <CheckCircle2 className="w-4 h-4" />
          <span>Clinical Summary & Long-Term Progress:</span>
        </div>
        <p className="text-slate-200 leading-relaxed">
          {metric === 'bp' &&
            'Blood Pressure measurements demonstrate a steady improvement over the last 90 days. Average Systolic reduced from 138 mmHg to 116 mmHg, indicating excellent pharmacological and lifestyle response.'}
          {metric === 'glucose' &&
            'Fasting glucose has stabilized within normal physiological limits (< 100 mg/dL). No prediabetic spikes detected in recent 4 weeks.'}
          {metric === 'spo2' &&
            'Oxygen saturation levels are well-maintained at 98-99% with a normal resting heart rate average of 70 BPM.'}
        </p>
      </div>

      {/* LOG VITALS MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#006c44]" />
                <h4 className="font-extrabold font-outfit text-[#022434] text-base">
                  Log Vital Sign Reading
                </h4>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReading} className="space-y-3 text-xs">
              {metric === 'bp' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold font-outfit text-slate-700 block mb-1">
                      Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      required
                      value={newSystolic}
                      onChange={(e) => setNewSystolic(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-[#006c44]"
                    />
                  </div>
                  <div>
                    <label className="font-bold font-outfit text-slate-700 block mb-1">
                      Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      required
                      value={newDiastolic}
                      onChange={(e) => setNewDiastolic(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-[#006c44]"
                    />
                  </div>
                </div>
              )}

              {metric === 'glucose' && (
                <div>
                  <label className="font-bold font-outfit text-slate-700 block mb-1">
                    Fasting Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    required
                    value={newGlucose}
                    onChange={(e) => setNewGlucose(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-[#006c44]"
                  />
                </div>
              )}

              {metric === 'spo2' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold font-outfit text-slate-700 block mb-1">
                      SpO2 Oxygen (%)
                    </label>
                    <input
                      type="number"
                      required
                      value={newSpo2}
                      onChange={(e) => setNewSpo2(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-[#006c44]"
                    />
                  </div>
                  <div>
                    <label className="font-bold font-outfit text-slate-700 block mb-1">
                      Pulse (BPM)
                    </label>
                    <input
                      type="number"
                      required
                      value={newPulse}
                      onChange={(e) => setNewPulse(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-[#006c44]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-xs rounded-xl shadow-md transition-all pt-3"
              >
                Save Reading to Trend Chart
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
