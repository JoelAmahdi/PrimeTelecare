import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  MapPin,
  CheckCircle2,
  X,
  HeartPulse,
  Thermometer,
  Activity,
  ArrowRight,
  ShieldCheck,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface TriageResult {
  isEmergency: boolean;
  flaggedSymptoms: string[];
  vitalWarnings: string[];
  cleared: boolean;
}

interface ClinicalTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriageComplete: (result: TriageResult) => void;
  doctorName?: string;
}

export const ClinicalTriageModal: React.FC<ClinicalTriageModalProps> = ({
  isOpen,
  onClose,
  onTriageComplete,
  doctorName = 'your clinician',
}) => {
  if (!isOpen) return null;

  // Red-flag emergency questions state
  const [answers, setAnswers] = useState<{ [key: string]: boolean }>({
    chestPain: false,
    breathingDiff: false,
    strokeSymptoms: false,
    heavyBleeding: false,
    anaphylaxis: false,
    severeTrauma: false,
  });

  // Optional Vitals input
  const [temp, setTemp] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [systolicBp, setSystolicBp] = useState('');

  const [triageEvaluated, setTriageEvaluated] = useState(false);
  const [evalResult, setEvalResult] = useState<TriageResult | null>(null);

  const emergencyQuestions = [
    {
      id: 'chestPain',
      label: 'Severe Chest Pain / Pressure',
      desc: 'Crushing chest tightness radiating to left arm, neck, or jaw',
    },
    {
      id: 'breathingDiff',
      label: 'Severe Shortness of Breath',
      desc: 'Inability to speak in full sentences or blue/pale lips at rest',
    },
    {
      id: 'strokeSymptoms',
      label: 'Sudden Weakness / Numbness (FAST)',
      desc: 'Facial drooping, arm weakness, or sudden slurred speech',
    },
    {
      id: 'heavyBleeding',
      label: 'Uncontrolled Bleeding or Confusion',
      desc: 'Heavy arterial bleeding, sudden loss of consciousness, or severe disorientation',
    },
    {
      id: 'anaphylaxis',
      label: 'Severe Allergic Reaction',
      desc: 'Swelling of throat, tongue, or lips with wheezing after exposure',
    },
  ];

  const handleToggleQuestion = (id: string) => {
    triggerHaptic('selection');
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const evaluateTriage = () => {
    triggerHaptic('heavy');
    const flaggedSymptoms: string[] = [];
    const vitalWarnings: string[] = [];

    // Check emergency questions
    emergencyQuestions.forEach((q) => {
      if (answers[q.id]) {
        flaggedSymptoms.push(q.label);
      }
    });

    // Evaluate Vitals if provided
    const tempNum = parseFloat(temp);
    if (!isNaN(tempNum) && (tempNum >= 40 || tempNum <= 35)) {
      vitalWarnings.push(`Critical Temperature (${tempNum}°C)`);
    }

    const hrNum = parseInt(hr, 10);
    if (!isNaN(hrNum) && (hrNum >= 130 || hrNum <= 45)) {
      vitalWarnings.push(`Critical Heart Rate (${hrNum} BPM)`);
    }

    const spo2Num = parseInt(spo2, 10);
    if (!isNaN(spo2Num) && spo2Num < 92) {
      vitalWarnings.push(`Low Blood Oxygen Saturation (${spo2Num}%)`);
    }

    const bpNum = parseInt(systolicBp, 10);
    if (!isNaN(bpNum) && (bpNum >= 180 || bpNum <= 80)) {
      vitalWarnings.push(`Critical Blood Pressure (${bpNum} mmHg)`);
    }

    const isEmergency = flaggedSymptoms.length > 0 || vitalWarnings.length > 0;

    const result: TriageResult = {
      isEmergency,
      flaggedSymptoms,
      vitalWarnings,
      cleared: !isEmergency,
    };

    setEvalResult(result);
    setTriageEvaluated(true);
  };

  const handleProceedIfCleared = () => {
    if (evalResult && !evalResult.isEmergency) {
      triggerHaptic('success');
      onTriageComplete(evalResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#022434] to-[#1c3a4a] text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 rounded-2xl border border-rose-500/40 text-rose-300">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full inline-block mb-0.5">
                Mandatory Safety Protocol
              </span>
              <h3 className="font-extrabold font-outfit text-lg leading-tight text-white">
                Pre-Consultation Emergency Triage
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {!triageEvaluated ? (
            <>
              {/* Emergency Statement Banner */}
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl space-y-2 text-amber-950 font-nunito text-xs shadow-2xs">
                <div className="flex items-start space-x-2 font-bold font-outfit text-sm text-amber-950">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Are you experiencing a medical emergency?</span>
                </div>
                <p className="leading-relaxed text-amber-900">
                  <strong>Prime Telecare is not an emergency-response service.</strong> If you or the patient are experiencing life-threatening symptoms, please seek immediate in-person medical assistance or call emergency services now.
                </p>
              </div>

              {/* Step 1: Safety Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold font-outfit text-[#022434] text-sm flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#022434] text-white text-xs flex items-center justify-center font-mono">
                      1
                    </span>
                    <span>Safety Screening Questions (Check all that apply):</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold font-nunito">
                    Select any active symptoms
                  </span>
                </div>

                <div className="space-y-2">
                  {emergencyQuestions.map((q) => {
                    const isChecked = answers[q.id];
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleToggleQuestion(q.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between space-x-3 ${
                          isChecked
                            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span
                            className={`font-bold font-outfit text-xs block ${
                              isChecked ? 'text-rose-900' : 'text-[#022434]'
                            }`}
                          >
                            {q.label}
                          </span>
                          <span className="text-[11px] text-slate-500 font-nunito block leading-snug">
                            {q.desc}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Vital Signs (Optional Self-Reported) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-extrabold font-outfit text-[#022434] text-sm flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#006c44] text-white text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <span>Current Vital Signs (Optional Self-Reported):</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                      <Thermometer className="w-3 h-3 text-[#006c44]" />
                      <span>Temp (°C)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="37.0"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006c44]"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                      <HeartPulse className="w-3 h-3 text-[#006c44]" />
                      <span>Heart Rate (BPM)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="72"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006c44]"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-[#006c44]" />
                      <span>SpO2 (%)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="98"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006c44]"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-[#006c44]" />
                      <span>Systolic BP</span>
                    </label>
                    <input
                      type="number"
                      placeholder="120"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006c44]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Triage Check Button */}
              <button
                type="button"
                onClick={evaluateTriage}
                className="w-full py-4 bg-[#022434] text-white font-extrabold font-outfit text-sm rounded-2xl shadow-lg hover:bg-[#1c3a4a] transition-all flex items-center justify-center space-x-2"
              >
                <span>Evaluate Safety & Continue to Booking</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            </>
          ) : evalResult?.isEmergency ? (
            /* EMERGENCY HIGH-RISK DETECTED SCREEN */
            <div className="space-y-5 py-2">
              <div className="bg-rose-50 border-2 border-rose-500 p-5 rounded-3xl space-y-3 text-rose-950">
                <div className="flex items-center space-x-2 text-rose-600 font-extrabold font-outfit text-base">
                  <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
                  <span>CRITICAL EMERGENCY DETECTED — DO NOT WAIT</span>
                </div>

                <p className="text-xs font-bold leading-relaxed text-rose-900">
                  Based on your responses, you are reporting red-flag emergency symptoms or critical vital signs that require <strong>IMMEDIATE IN-PERSON EMERGENCY CARE</strong>.
                </p>

                {/* Flagged items summary */}
                <div className="bg-white/80 p-3.5 rounded-2xl border border-rose-200 space-y-1.5 text-xs">
                  <span className="font-extrabold text-rose-900 font-outfit block">
                    Flagged Emergency Markers:
                  </span>
                  <ul className="list-disc list-inside text-rose-800 space-y-0.5">
                    {evalResult.flaggedSymptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                    {evalResult.vitalWarnings.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Unmistakable Emergency Guidance Box */}
              <div className="bg-[#022434] text-white p-5 rounded-3xl space-y-3 border border-slate-700">
                <h4 className="font-extrabold font-outfit text-sm text-emerald-300 uppercase tracking-wider">
                  Immediate Emergency Action Steps:
                </h4>

                <p className="text-xs text-slate-200 font-nunito leading-relaxed">
                  <strong>Prime Telecare is not an emergency response service.</strong> Please do not wait for an online consultation. Proceed immediately to the nearest Emergency Department or dial emergency services.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href="tel:112"
                    onClick={() => triggerHaptic('heavy')}
                    className="p-3.5 bg-rose-600 text-white rounded-2xl font-extrabold font-outfit text-xs flex items-center justify-center space-x-2 hover:bg-rose-700 transition-colors shadow-md text-center"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Emergency (112 / 911)</span>
                  </a>

                  <a
                    href="https://maps.google.com/?q=hospital+emergency+room"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic('light')}
                    className="p-3.5 bg-white/10 text-white rounded-2xl font-extrabold font-outfit text-xs flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors border border-white/20 text-center"
                  >
                    <MapPin className="w-4 h-4 text-emerald-300" />
                    <span>Find Nearest ER Hospital</span>
                  </a>
                </div>
              </div>

              {/* Override / Re-evaluate Option if user made a typo */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setTriageEvaluated(false);
                  }}
                  className="text-slate-500 hover:text-[#022434] font-bold underline"
                >
                  Edit My Responses / Re-assess
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onTriageComplete({
                      ...evalResult,
                      cleared: true,
                    });
                    onClose();
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold"
                >
                  I am at ER / Proceed anyway
                </button>
              </div>
            </div>
          ) : (
            /* CLEARED ROUTINE CONSULTATION SCREEN */
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-[#006c44] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold font-outfit text-[#022434] text-lg">
                  Safety Triage Cleared for Routine Tele-Consult
                </h4>
                <p className="text-xs text-slate-600 font-nunito max-w-md mx-auto">
                  No emergency red flags were identified. You may now proceed with scheduling your session with <strong>{doctorName}</strong>.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-[#006c44] font-semibold font-nunito max-w-md mx-auto space-y-1 text-left">
                <div className="flex items-center space-x-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#006c44]" />
                  <span>Safety clearance token active for this booking session.</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-normal">
                  <strong>Clinical Record Protocol:</strong> In compliance with NDPA & telemedicine regulations, the health record and clinical notes for this encounter can only be exported after attending doctor sign-off.
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedIfCleared}
                className="w-full py-4 bg-[#006c44] text-white font-extrabold font-outfit text-sm rounded-2xl shadow-lg hover:bg-[#005233] transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Payment Review</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
