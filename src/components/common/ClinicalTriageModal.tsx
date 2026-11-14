import React, { useState } from 'react';
import {
  HeartPulse,
  Thermometer,
  Activity,
  ArrowRight,
  ShieldCheck,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { primeApi } from '../../services/apiClient';

export interface VitalsData {
  temp?: string;
  hr?: string;
  spo2?: string;
  systolicBp?: string;
  diastolicBp?: string;
}

export interface TriageResult {
  isEmergency: boolean;
  vitalWarnings: string[];
  vitals: VitalsData;
  cleared: boolean;
}

interface ClinicalTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriageComplete: (result: TriageResult) => void;
  doctorName?: string;
  patientName?: string;
  initialVitals?: VitalsData;
}

export const ClinicalTriageModal: React.FC<ClinicalTriageModalProps> = ({
  isOpen,
  onClose,
  onTriageComplete,
  doctorName = 'your clinician',
  patientName = 'Patient',
  initialVitals,
}) => {
  if (!isOpen) return null;

  // Pre-consultation Vitals Input (Symptoms removed per clinical instructions)
  const [temp, setTemp] = useState(initialVitals?.temp || '');
  const [hr, setHr] = useState(initialVitals?.hr || '');
  const [spo2, setSpo2] = useState(initialVitals?.spo2 || '');
  const [systolicBp, setSystolicBp] = useState(initialVitals?.systolicBp || '');
  const [diastolicBp, setDiastolicBp] = useState(initialVitals?.diastolicBp || '');

  const [triageEvaluated, setTriageEvaluated] = useState(false);
  const [evalResult, setEvalResult] = useState<TriageResult | null>(null);

  const applyNormalBaseline = () => {
    triggerHaptic('selection');
    setTemp('36.8');
    setHr('72');
    setSpo2('99');
    setSystolicBp('120');
    setDiastolicBp('80');
  };

  const evaluateVitals = () => {
    triggerHaptic('medium');
    const vitalWarnings: string[] = [];

    const tempNum = parseFloat(temp);
    if (!isNaN(tempNum)) {
      if (tempNum >= 39.5) {
        vitalWarnings.push(`High Fever (${tempNum}°C)`);
      } else if (tempNum <= 35.0) {
        vitalWarnings.push(`Hypothermia Risk (${tempNum}°C)`);
      }
    }

    const hrNum = parseInt(hr, 10);
    if (!isNaN(hrNum)) {
      if (hrNum >= 130) {
        vitalWarnings.push(`Elevated Heart Rate / Tachycardia (${hrNum} BPM)`);
      } else if (hrNum <= 45) {
        vitalWarnings.push(`Low Heart Rate / Bradycardia (${hrNum} BPM)`);
      }
    }

    const spo2Num = parseInt(spo2, 10);
    if (!isNaN(spo2Num) && spo2Num < 92) {
      vitalWarnings.push(`Low Blood Oxygen Saturation (${spo2Num}%)`);
    }

    const sysNum = parseInt(systolicBp, 10);
    if (!isNaN(sysNum)) {
      if (sysNum >= 180) {
        vitalWarnings.push(`Severely Elevated Blood Pressure (${sysNum} mmHg)`);
      } else if (sysNum <= 80) {
        vitalWarnings.push(`Hypotension / Low Blood Pressure (${sysNum} mmHg)`);
      }
    }

    const isCritical = !isNaN(spo2Num) && spo2Num < 88;

    const result: TriageResult = {
      isEmergency: isCritical,
      vitalWarnings,
      vitals: {
        temp: temp || '36.8',
        hr: hr || '72',
        spo2: spo2 || '98',
        systolicBp: systolicBp || '120',
        diastolicBp: diastolicBp || '80',
      },
      cleared: true,
    };

    setEvalResult(result);
    setTriageEvaluated(true);

    // Asynchronously log to core clinical backend
    primeApi.evaluateTriage({
      patientName: patientName || 'Patient',
      vitals: { temp, hr, spo2, systolicBp },
      redFlags: {},
    }).catch(() => {});
  };

  const handleConfirmAndProceed = () => {
    if (evalResult) {
      triggerHaptic('success');
      onTriageComplete(evalResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 font-nunito">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#022434] to-[#1c3a4a] text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/40 text-emerald-300">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full inline-block mb-0.5">
                Pre-Consultation Clinical Intake
              </span>
              <h3 className="font-extrabold font-outfit text-lg leading-tight text-white">
                Patient Vital Signs
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {!triageEvaluated ? (
            <>
              {/* Clinical Context Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-1 text-emerald-950 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-outfit text-sm text-[#006c44] flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-[#006c44]" />
                    <span>Clinical Vitals Check</span>
                  </span>
                  <button
                    type="button"
                    onClick={applyNormalBaseline}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-[#006c44] border border-emerald-300 rounded-lg text-[11px] font-bold font-outfit transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Use Standard Baseline</span>
                  </button>
                </div>
                <p className="text-emerald-800 leading-relaxed font-nunito">
                  Please enter your current vital signs for {doctorName}. If you do not have measurement equipment, tap <strong>Use Standard Baseline</strong> to proceed with nominal values.
                </p>
              </div>

              {/* Vitals Form Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Temperature */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center space-x-1.5 font-outfit">
                    <Thermometer className="w-3.5 h-3.5 text-[#006c44]" />
                    <span>Body Temp (°C)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 36.8"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full text-sm font-mono font-bold p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#006c44]"
                  />
                  <span className="text-[10px] text-slate-400 block font-nunito">Normal: 36.1 – 37.2 °C</span>
                </div>

                {/* 2. Heart Rate */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center space-x-1.5 font-outfit">
                    <HeartPulse className="w-3.5 h-3.5 text-[#006c44]" />
                    <span>Heart Rate (BPM)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    className="w-full text-sm font-mono font-bold p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#006c44]"
                  />
                  <span className="text-[10px] text-slate-400 block font-nunito">Normal: 60 – 100 BPM</span>
                </div>

                {/* 3. Blood Oxygen SpO2 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center space-x-1.5 font-outfit">
                    <Activity className="w-3.5 h-3.5 text-[#006c44]" />
                    <span>Oxygen (SpO2 %)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full text-sm font-mono font-bold p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#006c44]"
                  />
                  <span className="text-[10px] text-slate-400 block font-nunito">Normal: 95 – 100 %</span>
                </div>

                {/* 4. Blood Pressure */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center space-x-1.5 font-outfit">
                    <Activity className="w-3.5 h-3.5 text-[#006c44]" />
                    <span>Blood Pressure</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      placeholder="Sys (120)"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      className="w-1/2 text-sm font-mono font-bold p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#006c44]"
                    />
                    <span className="text-slate-400 font-bold">/</span>
                    <input
                      type="number"
                      placeholder="Dia (80)"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value)}
                      className="w-1/2 text-sm font-mono font-bold p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#006c44]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-nunito">Standard: 120 / 80 mmHg</span>
                </div>
              </div>

              {/* Submit Vitals Button */}
              <button
                type="button"
                onClick={evaluateVitals}
                className="w-full py-4 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer mt-4"
              >
                <span>Confirm Vitals & Proceed</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            </>
          ) : (
            /* VITALS VERIFIED SUMMARY SCREEN */
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-[#006c44] rounded-full flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold font-outfit text-[#022434] text-lg">
                  Clinical Vitals Recorded
                </h4>
                <p className="text-xs text-slate-600 font-nunito max-w-md mx-auto">
                  Your vital signs have been captured and will be transmitted to <strong>{doctorName}</strong> for the upcoming consultation.
                </p>
              </div>

              {/* Summary of Vitals */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block font-outfit">Temperature</span>
                  <span className="text-sm font-bold font-mono text-[#022434]">
                    {evalResult?.vitals.temp ? `${evalResult.vitals.temp} °C` : '36.8 °C'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block font-outfit">Heart Rate</span>
                  <span className="text-sm font-bold font-mono text-[#022434]">
                    {evalResult?.vitals.hr ? `${evalResult.vitals.hr} BPM` : '72 BPM'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block font-outfit">SpO2</span>
                  <span className="text-sm font-bold font-mono text-[#022434]">
                    {evalResult?.vitals.spo2 ? `${evalResult.vitals.spo2} %` : '99 %'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block font-outfit">Blood Pressure</span>
                  <span className="text-sm font-bold font-mono text-[#022434]">
                    {evalResult?.vitals.systolicBp ? `${evalResult.vitals.systolicBp}/${evalResult.vitals.diastolicBp || '80'}` : '120/80'} mmHg
                  </span>
                </div>
              </div>

              {evalResult?.vitalWarnings && evalResult.vitalWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl text-left space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold font-outfit text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Clinical Alert for Physician</span>
                  </div>
                  <ul className="text-xs text-amber-800 list-disc list-inside">
                    {evalResult.vitalWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTriageEvaluated(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Edit Vitals
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndProceed}
                  className="flex-2 py-3.5 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
