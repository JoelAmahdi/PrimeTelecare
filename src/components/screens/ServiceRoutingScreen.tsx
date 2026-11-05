import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Stethoscope,
  Activity,
  Pill,
  Building2,
  TestTube,
  Phone,
  Brain,
  ChevronRight,
  ShieldAlert,
  HeartPulse,
  Syringe,
  MapPin
} from 'lucide-react';
import { ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface ServiceRoutingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type RoutingStep = 'emergency-check' | 'service-selection' | 'emergency-guidance' | 'routing-in-progress';

export const ServiceRoutingScreen: React.FC<ServiceRoutingScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<RoutingStep>('emergency-check');
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleRoute = (serviceName: string, targetScreen: ScreenId | null) => {
    triggerHaptic('medium');
    setSelectedService(serviceName);
    setStep('routing-in-progress');
    
    // Simulate routing delay
    setTimeout(() => {
      if (targetScreen) {
        onNavigate(targetScreen);
      } else {
        // Fallback if we don't have a dedicated screen yet
        onNavigate('doctor-discovery');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col font-nunito text-[#171c1f]">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
        <button
          onClick={() => {
            triggerHaptic('light');
            if (step === 'service-selection') {
              setStep('emergency-check');
            } else if (step === 'emergency-guidance') {
              setStep('emergency-check');
            } else if (step === 'routing-in-progress') {
              // block back button during routing
            } else {
              onNavigate('patient-home');
            }
          }}
          className="p-2 -ml-2 text-slate-500 hover:text-[#022434] transition-colors"
          disabled={step === 'routing-in-progress'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold font-outfit text-[#022434] text-lg text-center flex-1 pr-6">
          Care Triage
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-3xl mx-auto pb-24">
        
        {step === 'emergency-check' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold font-outfit text-rose-900">
                Is this an emergency?
              </h2>
              <p className="text-sm text-rose-700 font-bold leading-relaxed px-4">
                Are you experiencing any life-threatening symptoms such as severe chest pain, difficulty breathing, sudden weakness, or severe bleeding?
              </p>
              
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    setStep('emergency-guidance');
                  }}
                  className="w-full py-3.5 bg-rose-600 text-white font-extrabold font-outfit text-base rounded-2xl shadow-lg hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Yes, this is an emergency</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setStep('service-selection');
                  }}
                  className="w-full py-3.5 bg-white text-slate-700 font-extrabold font-outfit text-base rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                >
                  No, continue to triage
                </button>
              </div>
            </div>
            
            <div className="text-center px-6">
              <p className="text-xs text-slate-500 font-medium">
                Our triage system helps route you to the right care service based on your symptoms, but it does not provide an automated medical diagnosis.
              </p>
            </div>
          </div>
        )}

        {step === 'emergency-guidance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-rose-600 text-white rounded-3xl p-6 space-y-5 shadow-xl border border-rose-700 relative overflow-hidden">
                <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-rose-500/30 pointer-events-none" />
                <h2 className="text-2xl font-extrabold font-outfit relative z-10">
                  Please seek immediate physical care.
                </h2>
                <p className="text-rose-100 text-sm font-bold leading-relaxed relative z-10">
                  Telemedicine is not suitable for life-threatening emergencies. Please call emergency services or go to the nearest emergency room immediately.
                </p>
                <div className="pt-2 relative z-10 space-y-3">
                  <a href="tel:911" className="block w-full text-center py-4 bg-white text-rose-700 font-extrabold font-outfit text-lg rounded-2xl shadow-md transition-transform active:scale-95">
                    Call 911 Now
                  </a>
                  <button 
                    onClick={() => handleRoute('Emergency Facility', 'doctor-discovery')} // Mocking routing to facility map
                    className="w-full py-3.5 bg-rose-700 text-white font-extrabold font-outfit text-base rounded-2xl border border-rose-500/50 hover:bg-rose-800 transition-all active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Find Nearest Emergency Room</span>
                  </button>
                </div>
             </div>
          </div>
        )}

        {step === 'service-selection' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-2">
              <h2 className="text-xl font-extrabold font-outfit text-[#022434]">
                What kind of care do you need?
              </h2>
              <p className="text-sm text-slate-500 font-nunito mt-1">
                Select the option that best describes your situation to be routed to the appropriate service.
              </p>
            </div>

            {/* Service Options Grid */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {[
                { 
                  id: 'gp', 
                  title: 'General Practitioner', 
                  desc: 'Fever, cough, general sickness, or routine check-ups', 
                  icon: Stethoscope, 
                  color: 'text-emerald-600', 
                  bg: 'bg-emerald-50',
                  target: 'book-consultation'
                },
                { 
                  id: 'specialist', 
                  title: 'Specialist', 
                  desc: 'Specific conditions (e.g. Skin, Heart, Women\'s Health)', 
                  icon: HeartPulse, 
                  color: 'text-indigo-600', 
                  bg: 'bg-indigo-50',
                  target: 'doctor-discovery'
                },
                { 
                  id: 'mental', 
                  title: 'Mental Health Professional', 
                  desc: 'Therapy, counseling, stress, or anxiety management', 
                  icon: Brain, 
                  color: 'text-purple-600', 
                  bg: 'bg-purple-50',
                  target: 'doctor-discovery'
                },
                { 
                  id: 'pharmacy', 
                  title: 'Pharmacy Support', 
                  desc: 'Medication refills, dosage advice, or delivery', 
                  icon: Pill, 
                  color: 'text-amber-600', 
                  bg: 'bg-amber-50',
                  target: null
                },
                { 
                  id: 'facility', 
                  title: 'Physical Facility', 
                  desc: 'In-person clinic visit for physical exams or procedures', 
                  icon: Building2, 
                  color: 'text-slate-600', 
                  bg: 'bg-slate-100',
                  target: null
                },
              ].map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => handleRoute(service.title, service.target as ScreenId | null)}
                    className="w-full bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all active:scale-98 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.bg} ${service.color} shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold font-outfit text-[#022434] text-base group-hover:text-emerald-700 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-snug pr-4">
                          {service.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'routing-in-progress' && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                <Activity className="w-10 h-10 text-emerald-600" />
              </div>
              <svg className="absolute -inset-2 w-24 h-24 text-emerald-500 animate-spin" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="60 40" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold font-outfit text-[#022434]">
                Routing you to care...
              </h2>
              <p className="text-sm text-slate-500 font-bold">
                Connecting you with {selectedService} services.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
