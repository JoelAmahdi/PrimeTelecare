import React, { useState } from 'react';
import { X, Stethoscope, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Doctor } from '../../types';
import { primeApi } from '../../services/apiClient';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoctorAdded: (doc: Doctor) => void;
}

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ isOpen, onClose, onDoctorAdded }) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('General Practice / Family Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsExperience, setYearsExperience] = useState('5');
  const [videoFee, setVideoFee] = useState('10000');
  const [chatFee, setChatFee] = useState('5000');
  const [about, setAbout] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter the doctor name', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic('medium');

      const cleanName = name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`;
      const newDoc = await primeApi.addDoctor({
        name: cleanName,
        fullNameWithTitle: `${cleanName}, MD`,
        specialty,
        title: `Consultant Physician in ${specialty}`,
        rating: 5.0,
        reviewsCount: 0,
        avatarUrl:
          avatarUrl.trim() ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        isOnline: true,
        yearsExperience: Number(yearsExperience) || 5,
        patientsCount: 0,
        about: about.trim() || `${cleanName} is a licensed medical practitioner on Prime Telecare specializing in ${specialty}.`,
        qualifications: [licenseNumber.trim() || 'MDCN Licensed Medical Practitioner'],
        languagesSpoken: ['English'],
        consultationFee: {
          chat: Number(chatFee) || 5000,
          voice: Math.round(Number(videoFee) * 0.7) || 7000,
          video: Number(videoFee) || 10000,
          base: Number(videoFee) || 10000,
        },
        availabilityStatus: {
          isOnline: true,
          statusText: 'Online & Available Today',
          nextAvailableSlot: 'Today',
          workingDays: 'Mon - Fri (8:00 AM - 6:00 PM)',
        },
        verification: {
          isVerified: true,
          licenseNumber: licenseNumber.trim() || 'MDCN/2026/001',
          boardName: 'Medical and Dental Council of Nigeria (MDCN)',
          verifiedBadgeText: 'Verified MDCN License',
          verificationDate: 'Verified Nov 2026',
        },
        prices: {
          chat: Number(chatFee) || 5000,
          voice: Math.round(Number(videoFee) * 0.7) || 7000,
          video: Number(videoFee) || 10000,
        },
      });

      triggerHaptic('success');
      showToast(`Doctor profile created for ${cleanName}`, 'success');
      onDoctorAdded(newDoc);
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create doctor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006c44] flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-outfit text-[#022434]">Register Doctor Profile</h3>
              <p className="text-xs text-slate-500 font-nunito">Publish a verified clinician to the roster</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-nunito">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Doctor Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Emeka Obi or Maryam Musa"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Medical Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none"
              >
                <option value="General Practice / Family Medicine">General Practice</option>
                <option value="Pediatrician & Child Health">Pediatrician</option>
                <option value="Consultant Cardiologist">Cardiologist</option>
                <option value="Consultant Dermatologist">Dermatologist</option>
                <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Psychiatrist & Mental Health">Psychiatry</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">MDCN License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. MDCN/2023/18492"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Video Fee (₦)</label>
              <input
                type="number"
                value={videoFee}
                onChange={(e) => setVideoFee(e.target.value)}
                placeholder="10000"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Chat Fee (₦)</label>
              <input
                type="number"
                value={chatFee}
                onChange={(e) => setChatFee(e.target.value)}
                placeholder="5000"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
            <input
              type="number"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="5"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Doctor Bio / Clinical Summary</label>
            <textarea
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Short clinical summary of background, medical school, and areas of focus..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006c44] focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#006c44] hover:bg-[#022434] text-white rounded-xl font-bold font-outfit text-sm transition-all active:scale-98 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Doctor to Roster</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-nunito">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Profile will be instantly visible to patients across the platform</span>
        </div>
      </div>
    </div>
  );
};
