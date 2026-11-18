import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  Pill,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  Check,
  Edit3,
  BellRing,
} from 'lucide-react';
import {
  User,
  ScreenId,
  Prescription,
  Medication,
  MedicationReminder,
  DrugPurchaseNotification,
} from '../../types';
import { getStoredPrescriptions, savePrescriptions } from '../../utils/prescriptionStore';
import {
  getStoredReminders,
  saveStoredReminders,
  deleteStoredReminder,
  getStoredDrugPurchaseNotifications,
  upsertDrugPurchaseNotification,
  deleteDrugPurchaseNotification,
  buildDefaultTimesForFrequency,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../../utils/reminders';
import { primeApi } from '../../services/apiClient';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { SetReminderModal } from './SetReminderModal';

interface PostConsultationNotificationsWidgetProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
}

interface PrescribedDrugEntry {
  key: string;
  prescriptionId: string;
  prescriptionRef: string;
  doctorName: string;
  rxDate: string;
  medication: Medication;
}

function getTodayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDateOffsetIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime24To12(time24: string): string {
  const m = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time24;
  let h = parseInt(m[1], 10);
  const mins = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h < 10 ? '0' : ''}${h}:${mins} ${ampm}`;
}

function getOneHourLaterTime24(): { date: string; time: string } {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

export const PostConsultationNotificationsWidget: React.FC<PostConsultationNotificationsWidgetProps> = ({
  user,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'administration' | 'purchase'>('administration');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => getStoredPrescriptions());
  const [medReminders, setMedReminders] = useState<MedicationReminder[]>(() => getStoredReminders());
  const [purchaseAlerts, setPurchaseAlerts] = useState<DrugPurchaseNotification[]>(() =>
    getStoredDrugPurchaseNotifications()
  );
  const [browserNotifStatus, setBrowserNotifStatus] = useState<string>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  // Drug Administration modal state
  const [selectedEntryForModal, setSelectedEntryForModal] = useState<PrescribedDrugEntry | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Drug Purchase form state
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayIso());
  const [purchaseTime, setPurchaseTime] = useState<string>('17:00');
  const [pharmacyName, setPharmacyName] = useState<string>(user?.preferredPharmacyHospital || '');
  const [purchaseNote, setPurchaseNote] = useState<string>('');
  const [selectedDrugNames, setSelectedDrugNames] = useState<string[]>([]);
  const [customDrugInput, setCustomDrugInput] = useState<string>('');

  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // Sync prescriptions from localStorage + backend API
  useEffect(() => {
    let isMounted = true;

    const loadAllPrescriptions = async () => {
      const localRx = getStoredPrescriptions();
      try {
        const remoteRx = await primeApi.getPrescriptions();
        if (isMounted && Array.isArray(remoteRx) && remoteRx.length > 0) {
          const seen = new Set<string>();
          const merged: Prescription[] = [];
          for (const rx of [...localRx, ...remoteRx]) {
            const k = rx.id || rx.referenceNo;
            if (!seen.has(k)) {
              seen.add(k);
              merged.push(rx);
            }
          }
          setPrescriptions(merged);
          savePrescriptions(merged);
          return;
        }
      } catch {
        // fallback to local
      }
      if (isMounted) {
        setPrescriptions(localRx);
      }
    };

    loadAllPrescriptions();
    const pollId = window.setInterval(loadAllPrescriptions, 15000);

    const handleRxUpdate = () => setPrescriptions(getStoredPrescriptions());
    const handleRemUpdate = () => setMedReminders(getStoredReminders());
    const handlePurchaseUpdate = () => setPurchaseAlerts(getStoredDrugPurchaseNotifications());

    window.addEventListener('prescriptions-updated', handleRxUpdate);
    window.addEventListener('reminders-updated', handleRemUpdate);
    window.addEventListener('drug-purchase-notifications-updated', handlePurchaseUpdate);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener('prescriptions-updated', handleRxUpdate);
      window.removeEventListener('reminders-updated', handleRemUpdate);
      window.removeEventListener('drug-purchase-notifications-updated', handlePurchaseUpdate);
    };
  }, [user?.name]);

  // Flatten all prescribed medications from active prescriptions
  const prescribedDrugs: PrescribedDrugEntry[] = useMemo(() => {
    const entries: PrescribedDrugEntry[] = [];
    for (const rx of prescriptions) {
      if (!rx.medications || !Array.isArray(rx.medications)) continue;
      for (const med of rx.medications) {
        entries.push({
          key: `${rx.id}::${med.id || med.drugName}`,
          prescriptionId: rx.id,
          prescriptionRef: rx.referenceNo || rx.id,
          doctorName: rx.doctorName || 'Attending Physician',
          rxDate: rx.date || '',
          medication: med,
        });
      }
    }
    return entries;
  }, [prescriptions]);

  // Pre-select prescribed drug names when opening the drug purchase form
  useEffect(() => {
    if (showPurchaseForm && selectedDrugNames.length === 0 && prescribedDrugs.length > 0) {
      const uniqueNames = Array.from(
        new Set(
          prescribedDrugs.map((e) =>
            e.medication.strength
              ? `${e.medication.drugName} (${e.medication.strength})`
              : e.medication.drugName
          )
        )
      );
      setSelectedDrugNames(uniqueNames);
    }
  }, [showPurchaseForm, prescribedDrugs]);

  // Live notification checker (runs every 30s to trigger alerts when scheduled time hits)
  useEffect(() => {
    const checkDueNotifications = () => {
      const now = new Date();
      const todayIso = getTodayIso();
      const current12h = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Check drug administration reminders
      for (const rem of medReminders) {
        if (!rem.enabled || rem.takenToday) continue;
        const times = rem.times && rem.times.length > 0 ? rem.times : [rem.time];
        for (const t of times) {
          if (t.trim().toUpperCase() === current12h.trim().toUpperCase()) {
            const fireKey = `med-${rem.id}-${todayIso}-${t}`;
            if (!notifiedKeysRef.current.has(fireKey)) {
              notifiedKeysRef.current.add(fireKey);
              triggerHaptic('heavy');
              showToast(`Medication Time: Take ${rem.drugName} (${rem.dosage})`, 'info');
              sendBrowserNotification(
                'Prime Telecare — Medication Administration',
                `Time to take ${rem.drugName} (${rem.dosage}) • ${rem.frequency}`
              );
            }
          }
        }
      }

      // Check drug purchase notifications
      for (const p of purchaseAlerts) {
        if (!p.enabled || p.purchased) continue;
        const formattedTarget = formatTime24To12(p.reminderTime);
        if (
          p.reminderDate === todayIso &&
          formattedTarget.trim().toUpperCase() === current12h.trim().toUpperCase()
        ) {
          const fireKey = `buy-${p.id}-${todayIso}-${formattedTarget}`;
          if (!notifiedKeysRef.current.has(fireKey)) {
            notifiedKeysRef.current.add(fireKey);
            triggerHaptic('heavy');
            const summary = p.drugNames.join(', ');
            showToast(`Pharmacy Purchase Reminder: ${summary}`, 'info');
            sendBrowserNotification(
              'Prime Telecare — Drug Purchase Reminder',
              `Remember to purchase: ${summary}${p.pharmacyName ? ` at ${p.pharmacyName}` : ''}`
            );
          }
        }
      }
    };

    checkDueNotifications();
    const interval = window.setInterval(checkDueNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [medReminders, purchaseAlerts]);

  const handleEnableBrowserNotifications = async () => {
    triggerHaptic('selection');
    const perm = await requestBrowserNotificationPermission();
    setBrowserNotifStatus(perm);
    if (perm === 'granted') {
      showToast('Device push notifications enabled for medication & purchase alerts!', 'success');
    } else if (perm === 'denied') {
      showToast('Browser notifications blocked. In-app alerts remain active.', 'info');
    }
  };

  const findReminderForEntry = (entry: PrescribedDrugEntry): MedicationReminder | undefined => {
    return medReminders.find(
      (r) =>
        (r.prescriptionId === entry.prescriptionId &&
          r.drugName.toLowerCase() === entry.medication.drugName.toLowerCase()) ||
        r.drugName.toLowerCase() === entry.medication.drugName.toLowerCase()
    );
  };

  const handleSaveMedReminder = (newRem: MedicationReminder) => {
    const existing = getStoredReminders();
    const filtered = existing.filter(
      (r) => r.id !== newRem.id && r.drugName.toLowerCase() !== newRem.drugName.toLowerCase()
    );
    const updated = [newRem, ...filtered];
    saveStoredReminders(updated);
    setMedReminders(updated);
    showToast(`Drug administration alert saved for ${newRem.drugName} (${newRem.time})`, 'success');
  };

  const handleAutoEnableAllPrescriptionAlerts = () => {
    if (prescribedDrugs.length === 0) return;
    triggerHaptic('success');
    const existing = getStoredReminders();
    const updated = [...existing];
    let addedCount = 0;

    for (const entry of prescribedDrugs) {
      const alreadyExists = updated.some(
        (r) => r.drugName.toLowerCase() === entry.medication.drugName.toLowerCase()
      );
      if (!alreadyExists) {
        const times = buildDefaultTimesForFrequency(entry.medication.frequency);
        updated.unshift({
          id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          prescriptionId: entry.prescriptionId,
          prescriptionRef: entry.prescriptionRef,
          drugName: entry.medication.drugName,
          strength: entry.medication.strength,
          dosage: entry.medication.dosage,
          time: times.join(', '),
          times,
          frequency: entry.medication.frequency,
          duration: entry.medication.duration,
          instructions: entry.medication.instructions,
          enabled: true,
          takenToday: false,
          doctorName: entry.doctorName,
        });
        addedCount += 1;
      }
    }

    saveStoredReminders(updated);
    setMedReminders(updated);
    showToast(
      addedCount > 0
        ? `Set administration alerts for ${addedCount} prescribed medication(s)!`
        : 'All prescribed medications already have alerts configured.',
      'success'
    );
  };

  const handleToggleMedReminderEnabled = (id: string) => {
    triggerHaptic('light');
    const updated = medReminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    saveStoredReminders(updated);
    setMedReminders(updated);
  };

  const handleToggleDoseTaken = (id: string) => {
    triggerHaptic('medium');
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = medReminders.map((r) =>
      r.id === id
        ? {
            ...r,
            takenToday: !r.takenToday,
            lastTakenTime: !r.takenToday ? nowLabel : undefined,
          }
        : r
    );
    saveStoredReminders(updated);
    setMedReminders(updated);
  };

  const handleDeleteMedReminder = (id: string) => {
    triggerHaptic('light');
    const updated = deleteStoredReminder(id);
    setMedReminders(updated);
    showToast('Medication alert removed.', 'info');
  };

  const handleToggleDrugSelection = (name: string) => {
    triggerHaptic('light');
    setSelectedDrugNames((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const handleAddCustomDrugToPurchase = () => {
    const trimmed = customDrugInput.trim();
    if (!trimmed) return;
    if (!selectedDrugNames.includes(trimmed)) {
      setSelectedDrugNames((prev) => [...prev, trimmed]);
    }
    setCustomDrugInput('');
  };

  const handleSavePurchaseNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const drugs = selectedDrugNames.length > 0 ? selectedDrugNames : ['Prescribed Medications'];
    triggerHaptic('success');

    const latestRx = prescriptions[0];
    const newAlert: DrugPurchaseNotification = {
      id: `buy-${Date.now()}`,
      prescriptionId: latestRx?.id,
      prescriptionRef: latestRx?.referenceNo,
      drugNames: drugs,
      pharmacyName: pharmacyName.trim() || undefined,
      reminderDate: purchaseDate || getTodayIso(),
      reminderTime: purchaseTime || '17:00',
      enabled: true,
      purchased: false,
      notes: purchaseNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = upsertDrugPurchaseNotification(newAlert);
    setPurchaseAlerts(updated);
    setShowPurchaseForm(false);
    setPurchaseNote('');
    showToast(
      `Drug purchase notification set for ${newAlert.reminderDate} at ${formatTime24To12(newAlert.reminderTime)}`,
      'success'
    );
  };

  const handleTogglePurchaseEnabled = (item: DrugPurchaseNotification) => {
    triggerHaptic('light');
    const updated = upsertDrugPurchaseNotification({ ...item, enabled: !item.enabled });
    setPurchaseAlerts(updated);
  };

  const handleTogglePurchased = (item: DrugPurchaseNotification) => {
    triggerHaptic('medium');
    const nextPurchased = !item.purchased;
    const updated = upsertDrugPurchaseNotification({
      ...item,
      purchased: nextPurchased,
      purchasedAt: nextPurchased ? new Date().toLocaleString() : undefined,
    });
    setPurchaseAlerts(updated);
    if (nextPurchased) {
      showToast('Marked prescribed drugs as purchased!', 'success');
    }
  };

  const handleDeletePurchaseAlert = (id: string) => {
    triggerHaptic('light');
    const updated = deleteDrugPurchaseNotification(id);
    setPurchaseAlerts(updated);
    showToast('Drug purchase notification removed.', 'info');
  };

  const activeAdminCount = medReminders.filter((r) => r.enabled).length;
  const activePurchaseCount = purchaseAlerts.filter((p) => p.enabled && !p.purchased).length;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
              Medication Notifications
            </h3>
          </div>
        </div>

        {browserNotifStatus === 'default' && (
          <button
            type="button"
            onClick={handleEnableBrowserNotifications}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-[11px] font-bold font-outfit flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable Push Alerts</span>
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('administration');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold font-outfit flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'administration'
              ? 'bg-white text-[#022434] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5 text-[#006c44]" />
          <span>Drug Administration</span>
          {activeAdminCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#006c44] text-[10px] font-mono">
              {activeAdminCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('purchase');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold font-outfit flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'purchase'
              ? 'bg-white text-[#022434] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
          <span>Drug Purchase</span>
          {activePurchaseCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
              {activePurchaseCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DRUG ADMINISTRATION (DIRECTLY FROM PRESCRIPTION) */}
      {activeTab === 'administration' && (
        <div className="space-y-3">
          {prescribedDrugs.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3">
                <div className="text-xs text-emerald-950">
                  <span className="font-extrabold font-outfit block">
                    Prescribed Medications ({prescribedDrugs.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoEnableAllPrescriptionAlerts}
                  className="px-3 py-2 bg-[#006c44] hover:bg-[#022434] text-white text-[11px] font-bold font-outfit rounded-xl transition-colors flex items-center space-x-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Auto-Set All Alerts</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {prescribedDrugs.map((entry) => {
                  const reminder = findReminderForEntry(entry);
                  return (
                    <div
                      key={entry.key}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-extrabold font-outfit text-sm text-[#022434]">
                              {entry.medication.drugName}
                            </span>
                            {entry.medication.strength && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                {entry.medication.strength}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[10px] font-mono">
                              {entry.prescriptionRef}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            <strong>{entry.medication.dosage}</strong> • {entry.medication.frequency} •{' '}
                            {entry.medication.duration}
                          </p>
                          {entry.medication.instructions && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {entry.medication.instructions}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Prescribed by {entry.doctorName} {entry.rxDate ? `• ${entry.rxDate}` : ''}
                          </p>
                        </div>

                        {reminder ? (
                          <button
                            type="button"
                            onClick={() => handleToggleMedReminderEnabled(reminder.id)}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                              reminder.enabled ? 'bg-[#006c44] justify-end' : 'bg-slate-300 justify-start'
                            }`}
                            title={reminder.enabled ? 'Disable alert' : 'Enable alert'}
                          >
                            <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('selection');
                              setSelectedEntryForModal(entry);
                              setIsReminderModalOpen(true);
                            }}
                            className="px-3 py-2 bg-[#022434] hover:bg-[#006c44] text-white text-[11px] font-bold font-outfit rounded-xl transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Set Dose Alert</span>
                          </button>
                        )}
                      </div>

                      {reminder && (
                        <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold font-mono">
                              <Clock className="w-3 h-3 text-[#006c44]" />
                              <span>{reminder.time}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleDoseTaken(reminder.id)}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit transition-colors cursor-pointer ${
                                reminder.takenToday
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>
                                {reminder.takenToday
                                  ? `Taken${reminder.lastTakenTime ? ` (${reminder.lastTakenTime})` : ''}`
                                  : 'Mark Taken'}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setSelectedEntryForModal(entry);
                                setIsReminderModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#022434] hover:bg-slate-200/70 transition-colors cursor-pointer"
                              title="Edit dose schedule"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedReminder(reminder.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete alert"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006c44] flex items-center justify-center mx-auto border border-emerald-100">
                <Pill className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold font-outfit text-[#022434]">
                  No Active Prescriptions
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onNavigate('health-records');
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-[#022434] text-xs font-bold font-outfit rounded-xl inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#006c44]" />
                <span>View Prescriptions & Records</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DRUG PURCHASE NOTIFICATIONS */}
      {activeTab === 'purchase' && (
        <div className="space-y-3.5">
          {!showPurchaseForm ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowPurchaseForm(true);
              }}
              className="w-full py-3 px-4 bg-[#022434] hover:bg-[#006c44] text-white font-bold font-outfit text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Set New Drug Purchase Notification</span>
            </button>
          ) : (
            <form
              onSubmit={handleSavePurchaseNotification}
              className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold font-outfit text-[#022434] flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-700" />
                  <span>Schedule Drug Purchase Reminder</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPurchaseForm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Drugs from Prescription to Purchase */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 font-outfit block">
                  Medications to Purchase {prescribedDrugs.length > 0 ? '(From Your Prescription)' : ''}
                </label>

                {prescribedDrugs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set(
                        prescribedDrugs.map((e) =>
                          e.medication.strength
                            ? `${e.medication.drugName} (${e.medication.strength})`
                            : e.medication.drugName
                        )
                      )
                    ).map((name) => {
                      const active = selectedDrugNames.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleToggleDrugSelection(name)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#006c44] text-white border-[#006c44]'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customDrugInput}
                    onChange={(e) => setCustomDrugInput(e.target.value)}
                    placeholder="Drug name"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDrugToPurchase}
                    disabled={!customDrugInput.trim()}
                    className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {selectedDrugNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedDrugNames.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-bold"
                      >
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleDrugSelection(d)}
                          className="text-blue-700 hover:text-rose-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Time Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 font-outfit block">
                  Quick Schedule Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = getOneHourLaterTime24();
                      setPurchaseDate(next.date);
                      setPurchaseTime(next.time);
                    }}
                    className="px-2.5 py-1 bg-white border border-blue-200 hover:bg-blue-100 text-blue-900 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    In 1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseDate(getTodayIso());
                      setPurchaseTime('17:00');
                    }}
                    className="px-2.5 py-1 bg-white border border-blue-200 hover:bg-blue-100 text-blue-900 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Today 5:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseDate(getDateOffsetIso(1));
                      setPurchaseTime('09:00');
                    }}
                    className="px-2.5 py-1 bg-white border border-blue-200 hover:bg-blue-100 text-blue-900 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Tomorrow 9:00 AM
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 font-outfit block mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    min={getTodayIso()}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 font-outfit block mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={purchaseTime}
                    onChange={(e) => setPurchaseTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Preferred Pharmacy & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 font-outfit block mb-1">
                    Pharmacy
                  </label>
                  <input
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="Pharmacy name"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 font-outfit block mb-1">
                    Note
                  </label>
                  <input
                    type="text"
                    value={purchaseNote}
                    onChange={(e) => setPurchaseNote(e.target.value)}
                    placeholder="Note"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#006c44] hover:bg-[#022434] text-white font-extrabold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Save Drug Purchase Notification</span>
              </button>
            </form>
          )}

          {/* Saved Drug Purchase Notifications List */}
          {purchaseAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {purchaseAlerts.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    item.purchased
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : 'bg-white border-blue-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          className={`text-xs sm:text-sm font-extrabold font-outfit ${
                            item.purchased ? 'line-through text-slate-400' : 'text-[#022434]'
                          }`}
                        >
                          {item.drugNames.join(', ')}
                        </span>
                        {item.purchased && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Purchased
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-600 mt-1">
                        <span className="inline-flex items-center space-x-1 font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {item.reminderDate} • {formatTime24To12(item.reminderTime)}
                          </span>
                        </span>
                        {item.pharmacyName && (
                          <span className="text-slate-500">Pharmacy: {item.pharmacyName}</span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 mt-1">{item.notes}</p>
                      )}
                    </div>

                    {!item.purchased && (
                      <button
                        type="button"
                        onClick={() => handleTogglePurchaseEnabled(item)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                          item.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                        title={item.enabled ? 'Disable reminder' : 'Enable reminder'}
                      >
                        <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePurchased(item)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-bold font-outfit transition-colors cursor-pointer ${
                        item.purchased
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#006c44]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.purchased ? 'Purchased ✓' : 'Mark as Purchased'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePurchaseAlert(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete purchase alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showPurchaseForm && (
              <p className="text-xs text-slate-500 text-center py-3">
                No drug purchase notifications scheduled yet. Tap the button above to set a pharmacy pickup reminder.
              </p>
            )
          )}
        </div>
      )}

      {/* Set Drug Administration Reminder Modal */}
      <SetReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setSelectedEntryForModal(null);
        }}
        medication={selectedEntryForModal?.medication || null}
        prescriptionId={selectedEntryForModal?.prescriptionId}
        prescriptionRef={selectedEntryForModal?.prescriptionRef}
        doctorName={selectedEntryForModal?.doctorName}
        existingReminder={selectedEntryForModal ? findReminderForEntry(selectedEntryForModal) : undefined}
        onSaveReminder={handleSaveMedReminder}
      />
    </div>
  );
};
