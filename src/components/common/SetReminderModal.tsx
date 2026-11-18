import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, X, Volume2, Plus, Trash2 } from 'lucide-react';
import { Medication, MedicationReminder } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { buildDefaultTimesForFrequency } from '../../utils/reminders';

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  prescriptionId?: string;
  prescriptionRef?: string;
  doctorName?: string;
  existingReminder?: MedicationReminder;
  onSaveReminder: (reminder: MedicationReminder) => void;
}

export const SetReminderModal: React.FC<SetReminderModalProps> = ({
  isOpen,
  onClose,
  medication,
  prescriptionId,
  prescriptionRef,
  doctorName = '',
  existingReminder,
  onSaveReminder,
}) => {
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00 AM']);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [frequency, setFrequency] = useState('Twice daily');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!isOpen || !medication) return;
    const freq = existingReminder?.frequency || medication.frequency || 'Twice daily';
    setFrequency(freq);
    setIsEnabled(existingReminder ? existingReminder.enabled : true);
    if (existingReminder?.times && existingReminder.times.length > 0) {
      setReminderTimes(existingReminder.times);
    } else if (existingReminder?.time) {
      setReminderTimes([existingReminder.time]);
    } else {
      setReminderTimes(buildDefaultTimesForFrequency(freq));
    }
    setCustomTimeInput('');
  }, [isOpen, medication, existingReminder]);

  if (!isOpen || !medication) return null;

  const presetTimes = [
    { label: 'Morning', time: '08:00 AM' },
    { label: 'Midday', time: '02:00 PM' },
    { label: 'Evening', time: '06:00 PM' },
    { label: 'Night', time: '09:00 PM' },
  ];

  const togglePresetTime = (time: string) => {
    triggerHaptic('light');
    setReminderTimes((prev) => {
      if (prev.includes(time)) {
        return prev.length > 1 ? prev.filter((t) => t !== time) : prev;
      }
      return [...prev, time];
    });
  };

  const handleAddCustomTime = () => {
    const trimmed = customTimeInput.trim();
    if (!trimmed) return;
    // Format HH:mm (24h from time input) to 12h AM/PM
    let formatted = trimmed;
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      let h = parseInt(match24[1], 10);
      const m = match24[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      formatted = `${h < 10 ? '0' : ''}${h}:${m} ${ampm}`;
    }
    if (!reminderTimes.includes(formatted)) {
      triggerHaptic('light');
      setReminderTimes((prev) => [...prev, formatted]);
    }
    setCustomTimeInput('');
  };

  const handleRemoveTime = (time: string) => {
    triggerHaptic('light');
    setReminderTimes((prev) => (prev.length > 1 ? prev.filter((t) => t !== time) : prev));
  };

  const handleSave = () => {
    triggerHaptic('selection');
    const finalTimes = reminderTimes.length > 0 ? reminderTimes : ['08:00 AM'];
    const newReminder: MedicationReminder = {
      id: existingReminder?.id || `rem-${Date.now()}`,
      prescriptionId: prescriptionId || existingReminder?.prescriptionId || 'rx-active',
      prescriptionRef: prescriptionRef || existingReminder?.prescriptionRef,
      drugName: medication.drugName,
      strength: medication.strength,
      dosage: medication.dosage,
      time: finalTimes.join(', '),
      times: finalTimes,
      frequency,
      duration: medication.duration,
      instructions: medication.instructions,
      enabled: isEnabled,
      isDueNow: existingReminder?.isDueNow || false,
      takenToday: existingReminder?.takenToday || false,
      doctorName,
    };

    onSaveReminder(newReminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100/80 rounded-2xl text-[#006c44]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-outfit text-base text-[#022434]">Drug Administration Alert</h3>
              <p className="text-xs text-slate-500 font-nunito">Configured from Doctor's Prescription</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Drug Info Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start justify-between gap-2">
          <div>
            <span className="font-extrabold font-outfit text-base text-[#022434] block">
              {medication.drugName} {medication.strength ? `(${medication.strength})` : ''}
            </span>
            <span className="text-xs text-[#006c44] font-semibold block mt-0.5">
              Dosage: {medication.dosage} • {medication.frequency} • {medication.duration || 'Prescribed'}
            </span>
            {medication.instructions && (
              <span className="text-[11px] text-slate-600 block mt-1">
                Instructions: {medication.instructions}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full shrink-0">
            From Rx
          </span>
        </div>

        {/* Notification Times Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-outfit text-[#022434] uppercase tracking-wider block">
            Select Dose Times (Multi-Select)
          </label>

          <div className="grid grid-cols-2 gap-2">
            {presetTimes.map((item) => {
              const selected = reminderTimes.includes(item.time);
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => togglePresetTime(item.time)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selected
                      ? 'border-[#006c44] bg-[#e6f9f0] text-[#022434] shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 uppercase">{item.label}</span>
                    <span className="block text-xs font-bold font-outfit text-[#022434]">{item.time}</span>
                  </div>
                  {selected && <Check className="w-4 h-4 text-[#006c44]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Times Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Dose Alarm Times ({reminderTimes.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {reminderTimes.map((t) => (
              <span
                key={t}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#022434] text-white text-xs font-bold font-mono"
              >
                <Clock className="w-3 h-3 text-emerald-300" />
                <span>{t}</span>
                {reminderTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(t)}
                    className="text-slate-300 hover:text-rose-300 ml-0.5 cursor-pointer"
                    aria-label={`Remove ${t}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Add Custom Time Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-outfit text-[#022434] block">
            Add Custom Administration Time
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={customTimeInput}
              onChange={(e) => setCustomTimeInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-outfit text-[#022434] focus:outline-none focus:border-[#006c44]"
            />
            <button
              type="button"
              onClick={handleAddCustomTime}
              disabled={!customTimeInput}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold font-outfit rounded-xl flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Frequency Display */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-outfit text-[#022434] block">
            Prescribed Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#022434] focus:outline-none focus:border-[#006c44]"
          >
            <option value={medication.frequency}>{medication.frequency}</option>
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
              <span className="text-xs font-bold font-outfit text-[#022434] block">Dose Notification Alert</span>
              <span className="text-[10px] text-slate-500 font-nunito">Trigger alert at scheduled times</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsEnabled(!isEnabled);
            }}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
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
        <div className="pt-1 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-[#1c3a4a] to-[#006c44] text-white font-bold font-outfit text-xs rounded-xl shadow-md hover:from-[#022434] hover:to-[#004d30] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Save Notification</span>
          </button>
        </div>
      </div>
    </div>
  );
};
