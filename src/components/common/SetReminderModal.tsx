import React, { useState } from 'react';
import { Bell, Clock, Check, X, Volume2, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { Medication, MedicationReminder } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  prescriptionId?: string;
  doctorName?: string;
  existingReminder?: MedicationReminder;
  onSaveReminder: (reminder: MedicationReminder) => void;
}

export const SetReminderModal: React.FC<SetReminderModalProps> = ({
  isOpen,
  onClose,
  medication,
  prescriptionId,
  doctorName = 'Dr. Sarah Lee',
  existingReminder,
  onSaveReminder,
}) => {
  if (!isOpen || !medication) return null;

  const [reminderTime, setReminderTime] = useState(
    existingReminder?.time || '09:00 AM'
  );
  const [frequency, setFrequency] = useState(
    existingReminder?.frequency || medication.frequency || 'Twice daily'
  );
  const [isEnabled, setIsEnabled] = useState(
    existingReminder ? existingReminder.enabled : true
  );

  const presetTimes = [
    { label: 'Morning', time: '08:00 AM' },
    { label: 'Midday', time: '12:00 PM' },
    { label: 'Evening', time: '06:00 PM' },
    { label: 'Night', time: '09:00 PM' },
  ];

  const handleSave = () => {
    triggerHaptic('selection');
    const newReminder: MedicationReminder = {
      id: existingReminder?.id || `rem-${Date.now()}`,
      prescriptionId: prescriptionId || existingReminder?.prescriptionId || 'rx-custom',
      drugName: medication.drugName,
      dosage: medication.dosage,
      time: reminderTime,
      frequency: frequency,
      enabled: isEnabled,
      isDueNow: existingReminder?.isDueNow || false,
      takenToday: existingReminder?.takenToday || false,
      doctorName: doctorName,
    };

    onSaveReminder(newReminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-5 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100/80 rounded-2xl text-[#006c44]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-outfit text-base text-[#022434]">Set Medication Reminder</h3>
              <p className="text-xs text-slate-500 font-nunito">Prescription Dose Alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Drug Info Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
          <div>
            <span className="font-extrabold font-outfit text-base text-[#022434] block">
              {medication.drugName}
            </span>
            <span className="text-xs text-[#006c44] font-semibold block mt-0.5">
              Dosage: {medication.dosage} • {medication.duration || 'Prescribed'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full">
            Rx Active
          </span>
        </div>

        {/* Notification Times Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-outfit text-[#022434] uppercase tracking-wider block">
            Select Reminder Time
          </label>

          <div className="grid grid-cols-2 gap-2">
            {presetTimes.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  triggerHaptic('light');
                  setReminderTime(item.time);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  reminderTime === item.time
                    ? 'border-[#006c44] bg-[#e6f9f0] text-[#022434] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase">{item.label}</span>
                  <span className="block text-xs font-bold font-outfit text-[#022434]">{item.time}</span>
                </div>
                {reminderTime === item.time && <Check className="w-4 h-4 text-[#006c44]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-outfit text-[#022434] block">
            Custom Alarm Time
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              placeholder="e.g. 09:30 AM"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-outfit text-[#022434] focus:outline-none focus:border-[#006c44]"
            />
          </div>
        </div>

        {/* Frequency Display */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-outfit text-[#022434] block">
            Dosage Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#022434] focus:outline-none focus:border-[#006c44]"
          >
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily (Morning & Night)</option>
            <option value="3 times daily">3 times daily (8-hour intervals)</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="As needed (PRN)">As needed (PRN)</option>
          </select>
        </div>

        {/* Enable Push Notification Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2.5">
            <Volume2 className="w-4 h-4 text-[#006c44]" />
            <div>
              <span className="text-xs font-bold font-outfit text-[#022434] block">Daily Alarm & Sound</span>
              <span className="text-[10px] text-slate-500 font-nunito">Vibrate and trigger push alert</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsEnabled(!isEnabled);
            }}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
              isEnabled ? 'bg-[#006c44]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                isEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-[#1c3a4a] to-[#006c44] text-white font-bold font-outfit text-xs rounded-xl shadow-md hover:from-[#022434] hover:to-[#004d30] transition-all flex items-center justify-center space-x-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Save Reminder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
