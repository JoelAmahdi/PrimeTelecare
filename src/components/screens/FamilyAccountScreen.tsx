import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  UserPlus,
  Baby,
  User,
  Settings,
  AlertCircle,
  FileText,
  Lock,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { ScreenId, DependentProfile } from '../../types';
import { getStoredDependents, updateDependentProfile } from '../../utils/dependents';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface FamilyAccountScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const FamilyAccountScreen: React.FC<FamilyAccountScreenProps> = ({ onNavigate }) => {
  const [dependents, setDependents] = useState<DependentProfile[]>([]);
  const [selectedDependent, setSelectedDependent] = useState<DependentProfile | null>(null);

  useEffect(() => {
    setDependents(getStoredDependents());
    const handleUpdate = () => setDependents(getStoredDependents());
    window.addEventListener('dependents-updated', handleUpdate);
    return () => window.removeEventListener('dependents-updated', handleUpdate);
  }, []);

  const handleUpdateAccess = (accessLevel: 'Full Authority' | 'View Only' | 'Emergency Only') => {
    if (!selectedDependent) return;
    triggerHaptic('medium');
    const updated = { ...selectedDependent, accessLevel };
    updateDependentProfile(updated);
    setSelectedDependent(updated);
  };

  const handleToggleConsent = () => {
    if (!selectedDependent) return;
    triggerHaptic('light');
    const updated = { ...selectedDependent, guardianConsent: !selectedDependent.guardianConsent };
    updateDependentProfile(updated);
    setSelectedDependent(updated);
  };

  const handleToggleClinicalConsent = () => {
    if (!selectedDependent) return;
    triggerHaptic('light');
    const updated = { ...selectedDependent, clinicalRecordsConsent: !selectedDependent.clinicalRecordsConsent };
    updateDependentProfile(updated);
    setSelectedDependent(updated);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col font-nunito text-[#171c1f]">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => {
            triggerHaptic('light');
            if (selectedDependent) {
              setSelectedDependent(null);
            } else {
              onNavigate('settings');
            }
          }}
          className="p-2 -ml-2 text-slate-500 hover:text-[#022434] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold font-outfit text-[#022434] text-lg text-center flex-1 pr-6">
          Family Health Account
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-4xl mx-auto pb-24 space-y-6">
        
        {!selectedDependent ? (
          /* LIST VIEW */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-extrabold font-outfit text-[#022434] text-base">Delegated Care & Privacy</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage medical profiles for your approved dependents. Each profile is strictly separated to avoid exposing clinical information without appropriate verified authority and explicit consent.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold font-outfit text-[#022434] text-base">Managed Dependents</h3>
                <span className="text-xs text-slate-400 font-bold">{dependents.length} Profiles</span>
              </div>
              
              {dependents.map(dep => (
                <button
                  key={dep.id}
                  onClick={() => setSelectedDependent(dep)}
                  className="w-full bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-all active:scale-[0.98] text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img src={dep.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'} alt={dep.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                      {dep.isMinor ? (
                        <div className="absolute -bottom-1 -right-1 bg-amber-100 border border-amber-200 text-amber-600 rounded-full p-1 shadow-xs">
                           <Baby className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 bg-blue-100 border border-blue-200 text-blue-600 rounded-full p-1 shadow-xs">
                           <User className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold font-outfit text-[#022434] text-base">{dep.name}</h4>
                      <p className="text-xs text-slate-500 font-bold">{dep.relationship} • {dep.age} yrs</p>
                      
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {dep.accessLevel || (dep.isMinor ? 'Full Authority' : 'View Only')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}

              <button className="w-full mt-4 bg-slate-50 p-4 rounded-3xl border border-dashed border-slate-300 flex items-center justify-center space-x-2 text-slate-600 hover:bg-slate-100 transition-colors">
                <UserPlus className="w-5 h-5" />
                <span className="font-bold font-outfit text-sm">Add Family Member</span>
              </button>
            </div>
          </div>
        ) : (
          /* DETAIL VIEW */
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Dependent Profile Summary */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <img src={selectedDependent.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'} alt={selectedDependent.name} className="w-16 h-16 rounded-full object-cover border border-slate-200" />
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold font-outfit text-[#022434] text-lg truncate">{selectedDependent.name}</h2>
                <p className="text-xs text-slate-500">{selectedDependent.relationship} • {selectedDependent.gender} • {selectedDependent.age} yrs</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap">
                    {selectedDependent.bloodGroup || 'Blood Group Unknown'}
                  </span>
                  {selectedDependent.isMinor && (
                     <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full whitespace-nowrap">
                       Minor Dependent
                     </span>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy & Access Controls */}
            <div className="space-y-3">
               <h3 className="font-bold font-outfit text-[#022434] text-base px-1">Access & Privacy Level</h3>
               
               <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                 
                 <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      To prevent unauthorized exposure of clinical history, specify your authority level over this family member's health account.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {(['Full Authority', 'View Only', 'Emergency Only'] as const).map(level => {
                         const isActive = (selectedDependent.accessLevel || (selectedDependent.isMinor ? 'Full Authority' : 'View Only')) === level;
                         return (
                           <button
                             key={level}
                             onClick={() => handleUpdateAccess(level)}
                             className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                               isActive ? 'bg-[#022434] text-white border-[#022434] shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                             }`}
                           >
                             <div className="space-y-0.5">
                                <span className={`block font-bold font-outfit text-sm ${isActive ? 'text-white' : 'text-[#022434]'}`}>{level}</span>
                                <span className={`block text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {level === 'Full Authority' ? 'Can book, view records, and consent to care.' : 
                                   level === 'View Only' ? 'Can view summaries but cannot modify records.' : 
                                   'Access restricted solely to emergency contacts & basic info.'}
                                </span>
                             </div>
                             {isActive && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                           </button>
                         )
                      })}
                    </div>
                 </div>

                 <div className="p-4 flex items-start space-x-3">
                   <button onClick={handleToggleConsent} className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 mt-1 ${selectedDependent.guardianConsent ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                     <span className="w-5 h-5 bg-white rounded-full shadow-sm"></span>
                   </button>
                   <div>
                     <span className="font-bold font-outfit text-[#022434] text-sm block">Legal Guardianship Consent</span>
                     <span className="text-[11px] text-slate-500 font-nunito leading-relaxed block mt-0.5">
                       I affirm I hold legal guardianship and possess the right to make medical decisions on behalf of {selectedDependent.name}.
                     </span>
                   </div>
                 </div>

                 <div className="p-4 flex items-start space-x-3">
                   <button onClick={handleToggleClinicalConsent} className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 mt-1 ${selectedDependent.clinicalRecordsConsent ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                     <span className="w-5 h-5 bg-white rounded-full shadow-sm"></span>
                   </button>
                   <div>
                     <span className="font-bold font-outfit text-[#022434] text-sm block">Clinical Records Transparency</span>
                     <span className="text-[11px] text-slate-500 font-nunito leading-relaxed block mt-0.5">
                       I consent to viewing this dependent's isolated clinical records inside my dashboard.
                     </span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Separate Records Entry Point */}
            <div className="bg-emerald-950 rounded-3xl p-5 text-white flex items-center justify-between shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
               <div className="flex items-center space-x-3 relative z-10">
                 <div className="p-3 bg-emerald-800/50 rounded-2xl">
                   <FileText className="w-6 h-6 text-emerald-300" />
                 </div>
                 <div>
                   <span className="font-extrabold font-outfit text-base block">Isolated Medical File</span>
                   <span className="text-xs text-emerald-200/80">View {selectedDependent.name.split(' ')[0]}'s private EHR</span>
                 </div>
               </div>
               <button 
                  onClick={() => {
                    triggerHaptic('selection');
                    showToast(`Opening isolated clinical environment for ${selectedDependent.name}`, 'info');
                  }}
                  className="bg-emerald-400 hover:bg-emerald-300 text-[#022434] font-bold text-xs px-4 py-2 rounded-xl transition-colors relative z-10 shadow-lg cursor-pointer"
               >
                 Access
               </button>
            </div>
            
            {/* Danger Zone */}
            <div className="pt-4 px-1">
               <button className="w-full flex items-center justify-center space-x-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 py-3 rounded-2xl transition-colors font-bold font-outfit text-xs">
                 <Trash2 className="w-4 h-4" />
                 <span>Revoke Access & Remove Profile</span>
               </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
