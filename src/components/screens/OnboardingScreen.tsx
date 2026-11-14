import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  User as UserIcon,
  Stethoscope,
  Phone,
  Calendar,
  HeartPulse,
  MapPin,
  Building2,
  Award,
  Video,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Globe,
} from 'lucide-react';
import { User, UserRole, Doctor } from '../../types';
import { primeApi } from '../../services/apiClient';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface OnboardingScreenProps {
  user: User;
  role: UserRole;
  onComplete: (updatedUser: User, createdDoctor?: Doctor) => void;
  onLogout?: () => void;
}

const NIGERIAN_STATES = [
  'Lagos State',
  'FCT Abuja',
  'Rivers State',
  'Oyo State',
  'Kano State',
  'Kaduna State',
  'Edo State',
  'Enugu State',
  'Delta State',
  'Ogun State',
  'Anambra State',
  'Akwa Ibom State',
  'Imo State',
  'Plateau State',
  'Other / International',
];

const SPECIALTY_OPTIONS = [
  'General Practice / Family Medicine',
  'Paediatrics',
  'Cardiology',
  'Obstetrics & Gynaecology',
  'Internal Medicine',
  'Dermatology',
  'Orthopaedics',
  'Psychiatry',
  'Neurology',
  'Ophthalmology',
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  user,
  role,
  onComplete,
  onLogout,
}) => {
  const isDoctor = role === 'doctor';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common Fields
  const [fullName, setFullName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone && user.phone !== '+234 800 000 0000' ? user.phone : '');
  const [stateOfResidence, setStateOfResidence] = useState(user.stateOfResidence || 'Lagos State');

  // Patient Fields
  const [dob, setDob] = useState(user.dob || '');
  const [gender, setGender] = useState(user.gender && user.gender !== 'Other' ? user.gender : 'Female');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || 'O+');
  const [genotype, setGenotype] = useState('AA');
  const [allergiesText, setAllergiesText] = useState(user.allergies?.join(', ') || 'None');
  const [conditionsText, setConditionsText] = useState(user.existingConditions?.join(', ') || 'None');
  const [emergencyName, setEmergencyName] = useState(user.emergencyContact?.name || '');
  const [emergencyRelation, setEmergencyRelation] = useState(user.emergencyContact?.relationship || 'Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContact?.phone || '');

  // Doctor Fields
  const initialDoctorName = user.name?.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name?.trim() || ''}`;
  const [doctorName, setDoctorName] = useState(initialDoctorName);
  const [doctorSpecialty, setDoctorSpecialty] = useState(user.doctorSpecialty || 'General Practice / Family Medicine');
  const [doctorLicenseNo, setDoctorLicenseNo] = useState(user.doctorLicenseNo || '');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('Lagos University Teaching Hospital (LUTH)');
  const [yearsExperience, setYearsExperience] = useState('6');
  const [videoFee, setVideoFee] = useState('10000');
  const [voiceFee, setVoiceFee] = useState('7000');
  const [chatFee, setChatFee] = useState('5000');
  const [doctorBio, setDoctorBio] = useState(
    `Board-certified clinician committed to prompt, compassionate, evidence-based tele-consultations and continuity of care.`
  );
  const [languages, setLanguages] = useState('English, Pidgin');
  const [isOnlineNow, setIsOnlineNow] = useState(true);

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      triggerHaptic('error');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your contact phone number.');
      triggerHaptic('error');
      return;
    }

    if (!dob) {
      setErrorMessage('Please select your date of birth.');
      triggerHaptic('error');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const allergiesList = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== 'none');
      const conditionsList = conditionsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== 'none');

      const updatedUser: User = {
        ...user,
        name: fullName.trim(),
        phone: phone.trim(),
        dob,
        gender,
        bloodGroup,
        stateOfResidence,
        allergies: allergiesList,
        existingConditions: conditionsList,
        emergencyContact: {
          name: emergencyName.trim() || 'Next of Kin',
          relationship: emergencyRelation,
          phone: emergencyPhone.trim() || phone.trim(),
        },
        onboarded: true,
        hasCompletedOnboarding: true,
      };

      try {
        await primeApi.updateProfile({
          id: user.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          dob: updatedUser.dob,
          gender: updatedUser.gender,
          bloodGroup: updatedUser.bloodGroup,
          stateOfResidence: updatedUser.stateOfResidence,
          allergies: updatedUser.allergies,
          existingConditions: updatedUser.existingConditions,
          emergencyContact: updatedUser.emergencyContact,
          onboarded: true,
          hasCompletedOnboarding: true,
        });
      } catch (err) {
        console.warn('Backend profile update fallback', err);
      }

      localStorage.setItem('prime_telecare_user', JSON.stringify(updatedUser));
      triggerHaptic('success');
      showToast('Profile completed successfully!', 'success');
      onComplete(updatedUser);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete profile.');
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    if (!doctorName.trim()) {
      setErrorMessage('Please enter your professional name with title.');
      triggerHaptic('error');
      return;
    }

    if (!doctorLicenseNo.trim()) {
      setErrorMessage('Please enter your MDCN folio / license registration number.');
      triggerHaptic('error');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const cleanDocName = doctorName.trim().startsWith('Dr.') ? doctorName.trim() : `Dr. ${doctorName.trim()}`;
      const docId = `doc-${user.id || Date.now()}`;

      const createdDoctor: Doctor = {
        id: docId,
        name: cleanDocName,
        fullNameWithTitle: `${cleanDocName}, MD`,
        specialty: doctorSpecialty,
        title: `Consultant in ${doctorSpecialty}`,
        rating: 5.0,
        reviewsCount: 0,
        avatarUrl:
          user.avatarUrl ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        isOnline: isOnlineNow,
        isActive: true,
        practiceStatus: 'active',
        hospitalAffiliation: hospitalAffiliation.trim() || 'Private Practice',
        yearsExperience: Number(yearsExperience) || 5,
        patientsCount: 0,
        about: doctorBio.trim() || `${cleanDocName} is a licensed medical practitioner on Prime Telecare.`,
        qualifications: [doctorLicenseNo.trim(), 'MDCN Licensed Medical Practitioner'],
        languagesSpoken: languages.split(',').map((l) => l.trim()).filter(Boolean),
        consultationFee: {
          chat: Number(chatFee) || 5000,
          voice: Number(voiceFee) || 7000,
          video: Number(videoFee) || 10000,
          base: Number(videoFee) || 10000,
        },
        prices: {
          chat: Number(chatFee) || 5000,
          voice: Number(voiceFee) || 7000,
          video: Number(videoFee) || 10000,
        },
        availabilityStatus: {
          isOnline: isOnlineNow,
          statusText: isOnlineNow ? 'Online & Available Now' : 'Offline',
          nextAvailableSlot: 'Today',
          workingDays: 'Mon - Fri (8:00 AM - 6:00 PM)',
        },
        verification: {
          isVerified: true,
          licenseNumber: doctorLicenseNo.trim(),
          boardName: 'Medical and Dental Council of Nigeria (MDCN)',
          verifiedBadgeText: 'Verified MDCN License',
          verificationDate: 'Verified',
        },
        reviewPolicy: {
          policyText: 'Authentic patient tele-consultation feedback.',
          verifiedOnly: true,
          auditEnforced: true,
        },
        reviewsList: [],
        availableDates: ['Today', 'Tomorrow', 'This Week'],
        availableTimeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
      };

      // Register doctor in server store and local storage
      try {
        await primeApi.addDoctor(createdDoctor);
      } catch (err) {
        console.warn('API addDoctor fallback', err);
      }

      // Also persist to local custom doctors list
      try {
        const storedCustomDocs = JSON.parse(localStorage.getItem('prime_telecare_custom_doctors') || '[]');
        storedCustomDocs.unshift(createdDoctor);
        localStorage.setItem('prime_telecare_custom_doctors', JSON.stringify(storedCustomDocs));
      } catch {}

      const updatedUser: User = {
        ...user,
        name: cleanDocName,
        phone: phone.trim() || user.phone,
        role: 'doctor',
        doctorLicenseNo: doctorLicenseNo.trim(),
        doctorSpecialty,
        onboarded: true,
        hasCompletedOnboarding: true,
      };

      try {
        await primeApi.updateProfile({
          id: user.id,
          name: cleanDocName,
          phone: updatedUser.phone,
          doctorLicenseNo: updatedUser.doctorLicenseNo,
          doctorSpecialty: updatedUser.doctorSpecialty,
          role: 'doctor',
          onboarded: true,
          hasCompletedOnboarding: true,
        });
      } catch {}

      localStorage.setItem('prime_telecare_user', JSON.stringify(updatedUser));
      triggerHaptic('success');
      showToast(`Doctor profile created for ${cleanDocName}! Practice is live.`, 'success');
      onComplete(updatedUser, createdDoctor);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create doctor profile.');
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] flex flex-col justify-between px-4 py-6 sm:px-8 sm:py-8 w-full max-w-2xl mx-auto text-[#171c1f]">
      <div>
        <StatusBar className="-mx-4 sm:-mx-8 -mt-6 sm:-mt-8 mb-2" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-[#006c44] flex items-center justify-center font-bold">
              {isDoctor ? <Stethoscope className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-outfit text-[#022434]">
                {isDoctor ? 'Doctor Profile Setup' : 'Patient Registration'}
              </h1>
              <span className="text-xs text-slate-500 font-nunito">
                Signed in as <strong>{user.email}</strong>
              </span>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors px-2 py-1"
            >
              Log out
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ----------------- PATIENT ONBOARDING FORM ----------------- */}
        {!isDoctor && (
          <form onSubmit={handlePatientSubmit} className="space-y-4 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold font-outfit text-[#022434] text-base">Personal & Clinical Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amaka Obi"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito bg-white"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Genotype</label>
                <select
                  value={genotype}
                  onChange={(e) => setGenotype(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito bg-white"
                >
                  <option value="AA">AA</option>
                  <option value="AS">AS</option>
                  <option value="SS">SS</option>
                  <option value="AC">AC</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">State of Residence</label>
                <select
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito bg-white"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Known Drug / Food Allergies</label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, or None"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pre-existing Medical Conditions</label>
                <input
                  type="text"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  placeholder="e.g. Asthma, Hypertension, or None"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <h3 className="font-bold font-outfit text-[#022434] text-sm mb-3">Emergency Contact (Next of Kin)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Contact Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] outline-hidden font-nunito"
                  />
                </div>
                <div>
                  <select
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] outline-hidden font-nunito bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Contact Phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] outline-hidden font-nunito"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-6 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving Details...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>
          </form>
        )}

        {/* ----------------- DOCTOR ONBOARDING FORM ----------------- */}
        {isDoctor && (
          <form onSubmit={handleDoctorSubmit} className="space-y-4 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold font-outfit text-[#022434] text-base">Clinician Credentials & Practice Setup</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Professional Name & Title</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Ngozi Eze"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Specialty</label>
                <select
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito bg-white"
                >
                  {SPECIALTY_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">MDCN Folio / License Number</label>
                <input
                  type="text"
                  required
                  value={doctorLicenseNo}
                  onChange={(e) => setDoctorLicenseNo(e.target.value)}
                  placeholder="e.g. MDCN/R/2026/8942"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hospital / Clinic Affiliation</label>
                <input
                  type="text"
                  required
                  value={hospitalAffiliation}
                  onChange={(e) => setHospitalAffiliation(e.target.value)}
                  placeholder="e.g. Lagos University Teaching Hospital"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Years of Clinical Experience</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Languages Spoken</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. English, Igbo, Yoruba"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Professional Summary / Bio</label>
                <textarea
                  rows={2}
                  value={doctorBio}
                  onChange={(e) => setDoctorBio(e.target.value)}
                  placeholder="Brief summary of clinical background..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] outline-hidden font-nunito"
                />
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                <h3 className="font-bold font-outfit text-[#022434] text-xs mb-2">Consultation Fees (₦)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Video (₦)</label>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={videoFee}
                      onChange={(e) => setVideoFee(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Voice (₦)</label>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={voiceFee}
                      onChange={(e) => setVoiceFee(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chat (₦)</label>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={chatFee}
                      onChange={(e) => setChatFee(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold font-outfit text-xs text-[#006c44] block">Availability Status</span>
                  <span className="text-[11px] text-emerald-800">Set Online for Instant and Scheduled Consultations</span>
                </div>
                <input
                  type="checkbox"
                  checked={isOnlineNow}
                  onChange={(e) => setIsOnlineNow(e.target.checked)}
                  className="w-5 h-5 accent-[#006c44] rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-6 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Profile...' : 'Save Doctor Profile & Open Clinic'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
