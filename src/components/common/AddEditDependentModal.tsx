import React, { useState } from 'react';
import { X, UserPlus, ShieldAlert, Heart, Calendar, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DependentProfile } from '../../types';
import { addDependentProfile, updateDependentProfile } from '../../utils/dependents';
import { triggerHaptic } from '../../utils/haptics';

interface AddEditDependentModalProps {
  initialDependent?: DependentProfile | null;
  onClose: () => void;
  onSaved: (dep: DependentProfile) => void;
}

export const AddEditDependentModal: React.FC<AddEditDependentModalProps> = ({
  initialDependent,
  onClose,
  onSaved,
}) => {
  const isEdit = !!initialDependent;

  const [name, setName] = useState(initialDependent?.name || '');
  const [relationship, setRelationship] = useState<DependentProfile['relationship']>(
    initialDependent?.relationship || 'Child'
  );
  const [dob, setDob] = useState(initialDependent?.dob || '2020-01-01');
  const [age, setAge] = useState(initialDependent?.age ? String(initialDependent.age) : '6');
  const [gender, setGender] = useState<DependentProfile['gender']>(initialDependent?.gender || 'Male');
  const [allergies, setAllergies] = useState(initialDependent?.allergies?.join(', ') || '');
  const [existingConditions, setExistingConditions] = useState(
    initialDependent?.existingConditions?.join(', ') || ''
  );
  const [bloodGroup, setBloodGroup] = useState(initialDependent?.bloodGroup || 'O+');
  const [isMinor, setIsMinor] = useState(initialDependent?.isMinor ?? true);
  const [guardianConsent, setGuardianConsent] = useState(initialDependent?.guardianConsent ?? true);
  const [notes, setNotes] = useState(initialDependent?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');

    const allergiesArr = allergies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const conditionsArr = existingConditions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let result: DependentProfile;

    if (isEdit && initialDependent) {
      result = {
        ...initialDependent,
        name,
        relationship,
        dob,
        age: parseInt(age) || 0,
        gender,
        allergies: allergiesArr,
        existingConditions: conditionsArr,
        bloodGroup,
        isMinor,
        guardianConsent,
        notes,
      };
      updateDependentProfile(result);
    } else {
      const defaultAvatar =
        gender === 'Female'
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200';

      result = addDependentProfile({
        name,
        relationship,
        dob,
        age: parseInt(age) || 0,
        gender,
        avatarUrl: defaultAvatar,
        allergies: allergiesArr,
        existingConditions: conditionsArr,
        bloodGroup,
        isMinor,
        guardianConsent,
        notes,
      });
    }

    triggerHaptic('success');
    onSaved(result);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-[#e6f9f0] text-[#006c44] rounded-2xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold font-outfit text-[#022434] text-lg">
                {isEdit ? 'Edit Dependent Profile' : 'Add Family Member / Dependent'}
              </h3>
              <p className="text-xs text-slate-500 font-nunito">
                Manage care for minor children or elderly dependents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-nunito">
          {/* Full Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold font-outfit text-slate-700 block mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kofi Okonkwo"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
              />
            </div>

            <div>
              <label className="font-bold font-outfit text-slate-700 block mb-1">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => {
                  const rel = e.target.value as DependentProfile['relationship'];
                  setRelationship(rel);
                  if (rel === 'Child' || rel === 'Ward') {
                    setIsMinor(true);
                  } else if (rel === 'Parent' || rel === 'Elderly Dependent') {
                    setIsMinor(false);
                  }
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
              >
                <option value="Child">Child (Son / Daughter)</option>
                <option value="Parent">Parent (Elderly Mother / Father)</option>
                <option value="Elderly Dependent">Elderly Family Member</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Ward">Ward / Foster Child</option>
                <option value="Other">Other Family Dependent</option>
              </select>
            </div>
          </div>

          {/* DOB, Age, Gender */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold font-outfit text-slate-700 block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
              />
            </div>

            <div>
              <label className="font-bold font-outfit text-slate-700 block mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
              />
            </div>

            <div>
              <label className="font-bold font-outfit text-slate-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as DependentProfile['gender'])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Blood Group & HMO Policy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold font-outfit text-slate-700 block mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

          </div>

          {/* Allergies & Chronic Conditions */}
          <div>
            <label className="font-bold font-outfit text-slate-700 block mb-1">
              Known Allergies (comma separated)
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts, Latex"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
            />
          </div>

          <div>
            <label className="font-bold font-outfit text-slate-700 block mb-1">
              Existing Pre-conditions (comma separated)
            </label>
            <input
              type="text"
              value={existingConditions}
              onChange={(e) => setExistingConditions(e.target.value)}
              placeholder="e.g. Asthma, Hypertension, Diabetes"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#006c44]"
            />
          </div>

          {/* Minor Guardian Consent Checkbox */}
          <div className="bg-[#f0f9f4] p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={guardianConsent}
                onChange={(e) => setGuardianConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#006c44] focus:ring-[#006c44]"
              />
              <div>
                <span className="font-bold font-outfit text-[#022434] text-xs block">
                  Parent / Legal Guardian Caretaker Authorization
                </span>
                <span className="text-[11px] text-slate-600 leading-snug block">
                  I confirm that I am the legal parent, primary guardian, or authorized guardian for this dependent and consent to managing their telehealth records and consultations.
                </span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#77daa4]" />
            <span>{isEdit ? 'Save Changes' : 'Create Dependent Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
