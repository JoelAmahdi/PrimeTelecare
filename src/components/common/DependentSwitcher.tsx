import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  ChevronDown,
  Plus,
  Shield,
  Heart,
  Baby,
  User,
  Settings,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { User as UserType, DependentProfile } from '../../types';
import {
  getStoredDependents,
  getActiveDependentId,
  setActiveDependentId,
  getActiveProfileInfo,
  deleteDependentProfile,
  ActiveProfileInfo,
} from '../../utils/dependents';
import { triggerHaptic } from '../../utils/haptics';
import { AddEditDependentModal } from './AddEditDependentModal';
import { StandardDropdown } from './StandardDropdown';

interface DependentSwitcherProps {
  user: UserType;
  compact?: boolean;
}

export const DependentSwitcher: React.FC<DependentSwitcherProps> = ({ user, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dependents, setDependents] = useState<DependentProfile[]>(() => getStoredDependents());
  const [activeProfile, setActiveProfile] = useState<ActiveProfileInfo>(() => getActiveProfileInfo(user));
  const [editingDependent, setEditingDependent] = useState<DependentProfile | null | 'new'>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setDependents(getStoredDependents());
      setActiveProfile(getActiveProfileInfo(user));
    };

    window.addEventListener('dependents-updated', handleUpdate);
    window.addEventListener('active-dependent-changed', handleUpdate);

    return () => {
      window.removeEventListener('dependents-updated', handleUpdate);
      window.removeEventListener('active-dependent-changed', handleUpdate);
    };
  }, [user]);

  const handleSelectProfile = (id: string | null) => {
    triggerHaptic('selection');
    setActiveDependentId(id);
    setIsOpen(false);
  };

  const handleDeleteDependent = (e: React.MouseEvent, depId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this family member dependent profile?')) {
      triggerHaptic('medium');
      deleteDependentProfile(depId);
    }
  };

  return (
    <div className={`relative font-nunito ${compact ? 'inline-block' : 'w-full'}`}>
      <StandardDropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        align={compact ? 'left' : 'right'}
        width={compact ? 'w-80 sm:w-96' : 'w-full max-w-md'}
        maxHeight="max-h-64 sm:max-h-72"
        className={compact ? 'inline-block' : 'w-full'}
        closeOnSelect={false}
        trigger={
          compact ? (
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all text-xs cursor-pointer select-none ${
                activeProfile.isDependent
                  ? 'bg-[#022434] text-white border-emerald-500/50 shadow-xs'
                  : 'bg-white text-[#022434] border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="relative">
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.displayName}
                  className="w-5 h-5 rounded-full object-cover border border-[#77daa4]"
                />
                {activeProfile.isDependent && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-[#022434]" />
                )}
              </div>
              <div className="text-left leading-tight max-w-[120px] truncate">
                <span className="font-extrabold font-outfit text-xs block truncate">
                  {activeProfile.displayName}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <div
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                activeProfile.isDependent
                  ? 'bg-[#022434] text-white border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : 'bg-white text-[#022434] border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={activeProfile.avatarUrl}
                      alt={activeProfile.displayName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#77daa4] shadow-xs"
                    />
                    {activeProfile.isDependent ? (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[#022434] p-0.5 rounded-full border border-white">
                        <Baby className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </span>
                    ) : (
                      <span className="absolute -bottom-1 -right-1 bg-[#006c44] text-white p-0.5 rounded-full border border-white">
                        <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-extrabold font-outfit uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          activeProfile.isDependent
                            ? 'bg-emerald-400/20 text-[#77daa4] border-emerald-400/30'
                            : 'bg-emerald-50 text-[#006c44] border-emerald-200'
                        }`}
                      >
                        {activeProfile.isDependent ? 'Dependent' : 'Primary'}
                      </span>
                      {activeProfile.isMinor && (
                        <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Minor
                        </span>
                      )}
                    </div>

                    <h4
                      className={`font-extrabold font-outfit text-sm sm:text-base truncate ${
                        activeProfile.isDependent ? 'text-white' : 'text-[#022434]'
                      }`}
                    >
                      {activeProfile.displayName}
                    </h4>

                    <p
                      className={`text-[10px] sm:text-xs truncate ${
                        activeProfile.isDependent ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {activeProfile.relationshipLabel} • {activeProfile.ageGenderLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center shrink-0 pl-2 border-l border-slate-700/30 sm:border-none sm:pl-0">
                  <span
                    className={`text-xs font-extrabold font-outfit sm:px-3 sm:py-1.5 sm:rounded-xl sm:border flex items-center justify-center space-x-1 ${
                      activeProfile.isDependent
                        ? 'sm:bg-emerald-500/20 text-[#77daa4] sm:border-emerald-400/30'
                        : 'sm:bg-slate-100 text-slate-700 sm:border-slate-200'
                    }`}
                  >
                    <span className="hidden sm:inline">Switch Profile</span>
                    <span className="sm:hidden text-[10px] uppercase tracking-wider mr-1">Switch</span>
                    <ChevronDown className={`w-4 h-4 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </div>
            </div>
          )
        }
        header={
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#006c44]" />
              <span className="font-extrabold font-outfit text-[#022434] text-xs uppercase tracking-wider">
                Family & Care Profiles
              </span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                setEditingDependent('new');
                setIsOpen(false);
              }}
              className="text-[11px] font-extrabold font-outfit text-[#006c44] hover:text-[#005233] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dependent</span>
            </button>
          </div>
        }
        footer={
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-[#006c44] shrink-0" />
            <span>
              Consultations and records will be linked to the active selected patient.
            </span>
          </div>
        }
      >
        <div className="space-y-2">
          {/* Primary Account (Self) */}
          <div
            onClick={() => {
              handleSelectProfile(null);
              setIsOpen(false);
            }}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              !activeProfile.isDependent
                ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-300"
              />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold font-outfit text-xs text-[#022434]">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    Primary (Self)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {user.email} • Age {user.age || 28}
                </span>
              </div>
            </div>

            {!activeProfile.isDependent && (
              <CheckCircle2 className="w-5 h-5 text-[#006c44] shrink-0" />
            )}
          </div>

          {/* List of Dependents */}
          {dependents.map((dep) => {
            const isSelected = activeProfile.dependentProfile?.id === dep.id;
            return (
              <div
                key={dep.id}
                onClick={() => {
                  handleSelectProfile(dep.id);
                  setIsOpen(false);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      dep.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={dep.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-300"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold font-outfit text-xs text-[#022434]">
                        {dep.name}
                      </span>
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-[#006c44] px-2 py-0.5 rounded-full">
                        {dep.relationship}
                      </span>
                      {dep.isMinor && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                          Minor
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      setEditingDependent(dep);
                      setIsOpen(false);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteDependent(e, dep.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                    title="Delete Dependent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#006c44] ml-1" />}
                </div>
              </div>
            );
          })}
        </div>
      </StandardDropdown>

      {/* Add / Edit Dependent Modal */}
      {editingDependent && (
        <AddEditDependentModal
          initialDependent={editingDependent === 'new' ? null : editingDependent}
          onClose={() => setEditingDependent(null)}
          onSaved={(savedDep) => {
            setEditingDependent(null);
            // Optionally auto-switch to new dependent
            setActiveDependentId(savedDep.id);
          }}
        />
      )}
    </div>
  );
};
