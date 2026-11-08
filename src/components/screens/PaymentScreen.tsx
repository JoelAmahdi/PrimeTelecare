import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { BookingProgressTracker } from '../common/BookingProgressTracker';
import { ReceiptInvoiceModal } from '../common/ReceiptInvoiceModal';
import { LegalPoliciesModal } from '../common/LegalPoliciesModal';
import { LivePaymentGatewayModal } from '../common/LivePaymentGatewayModal';
import {
  Lock,
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRight,
  Info,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Receipt,
  Copy,
  Check,
} from 'lucide-react';
import { ScreenId, User, BookingSummary } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { requestExportPermission } from '../../utils/healthRecordPermissions';
import { bookNewConsultation } from '../../utils/appointmentNotifications';
import { mockDoctors } from '../../data/mockData';
import { markConsultationAsPaid } from '../../utils/consultationPayment';
import { showToast } from '../../utils/toast';
import { GoogleCalendarSyncModal } from '../common/GoogleCalendarSyncModal';
import {
  isGoogleCalendarConnected,
  addConsultationToGoogleCalendar,
} from '../../services/googleCalendar';
import { primeApi } from '../../services/apiClient';

interface PaymentScreenProps {
  user: User;
  bookingSummary?: BookingSummary;
  onNavigate: (screen: ScreenId) => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  user,
  bookingSummary,
  onNavigate,
}) => {
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Authorizing' | 'Paid' | 'Failed'>('Pending');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true);
  const [showFailedConsultationPolicy, setShowFailedConsultationPolicy] = useState(false);
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);
  const [simulatedDeclineMode, setSimulatedDeclineMode] = useState(false);
  const [isLiveGatewayOpen, setIsLiveGatewayOpen] = useState(false);

  // Fallbacks if user lands on PaymentScreen directly
  const doctor = mockDoctors.find((d) => d.id === bookingSummary?.doctorId) || mockDoctors[0] || null;
  const consultationType = bookingSummary?.consultationType || 'Video';
  const date = bookingSummary?.date || 'Today, Oct 24, 2026';
  const timeSlot = bookingSummary?.timeSlot || '10:30 AM';
  const duration = bookingSummary?.duration || '30 Minutes';

  // Itemized Pricing Calculation (Consultation Fee, Platform Charge, Taxes)
  const consultationFee = bookingSummary?.baseFee || doctor?.prices?.video || 10000;
  const platformCharge = bookingSummary?.serviceFee || 500;
  const vatTaxFee = Math.round(consultationFee * 0.075); // 7.5% Statutory VAT
  const totalAmount = consultationFee + platformCharge + vatTaxFee;

  const timeZone = bookingSummary?.timeZone || 'WAT (GMT+1)';
  const cleanTimeZone = timeZone.split('•')[0].replace('West Africa Time', '').replace('(', '').replace(')', '').trim() || 'WAT';

  const handleMethodSelect = (m: 'card' | 'bank') => {
    triggerHaptic('selection');
    setMethod(m);
    setPaymentError(null);
  };

  const handleCopyAccount = () => {
    triggerHaptic('light');
    navigator.clipboard?.writeText('0129384812');
    setCopiedBankAcc(true);
    setTimeout(() => setCopiedBankAcc(false), 2000);
  };

  const handlePay = () => {
    triggerHaptic('heavy');
    setIsLiveGatewayOpen(true);
  };

  const handleGatewaySuccess = (details: { reference: string; method: string; amount: number }) => {
    triggerHaptic('success');
    const consultId = bookingSummary?.consultationId || `cns-${Date.now()}`;
    markConsultationAsPaid(consultId, consultationType);

    bookNewConsultation({
      appointmentId: consultId,
      doctorId: doctor.id,
      doctorName: doctor.fullNameWithTitle || doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar: doctor.avatarUrl,
      patientName: user.name || 'Ada Okonkwo',
      scheduledTime: timeSlot,
      scheduledDate: date,
      type: consultationType,
      bookingMode: bookingSummary?.bookingMode || 'scheduled',
      price: details.amount,
    });

    requestExportPermission({
      sessionId: consultId,
      patientName: user.name || 'Patient User',
      doctorName: doctor.fullNameWithTitle || doctor.name,
      doctorLicense: doctor.verification?.licenseNumber || 'MDCN/2019/88492',
      purpose: bookingSummary?.exportAuthorization?.purpose || 'Second Medical Opinion & Care Continuity',
    });

    primeApi.createAppointment({
      doctorId: doctor.id,
      patientName: user.name || 'Ada Okonkwo',
      scheduledDate: date,
      timeSlot,
      type: consultationType,
      notes: bookingSummary?.symptomsDescription,
      price: details.amount,
    }).catch(() => {});

    if (autoSyncCalendar && isGoogleCalendarConnected()) {
      addConsultationToGoogleCalendar({
        doctorName: doctor.fullNameWithTitle || doctor.name,
        doctorSpecialty: doctor.specialty,
        patientName: user.name || 'Ada Okonkwo',
        consultationType,
        dateStr: date,
        timeSlot,
        durationMinutes: 30,
        notes: bookingSummary?.symptomsDescription,
      }).catch(() => {});
    }

    setPaymentStatus('Paid');
    setIsProcessing(false);
    showToast('Payment successful & consultation room unlocked!');

    setTimeout(() => {
      if (consultationType === 'Chat') {
        onNavigate('active-chat');
      } else {
        onNavigate('video-call');
      }
    }, 1200);
  };

  const invoiceData = {
    invoiceNo: 'INV-2026-88392',
    date: 'Oct 24, 2026',
    patientName: user.name || 'Patient User',
    patientEmail: user.email || 'patient@primetelecare.com',
    doctorName: doctor.fullNameWithTitle || doctor.name,
    doctorSpecialty: doctor.specialty,
    doctorLicense: doctor.verification?.licenseNumber || 'MDCN/R/73820',
    consultationType,
    consultationDate: date,
    consultationTime: timeSlot,
    baseFee: consultationFee,
    platformFee: platformCharge,
    vatFee: vatTaxFee,
    totalFee: totalAmount,
    paymentMethod: method === 'card' ? 'Debit/Credit Card (Visa/Mastercard)' : 'Instant Bank Transfer',
    paymentReference: 'PAY-PRIME-948201',
    paymentStatus: paymentStatus === 'Paid' ? ('Paid' as const) : paymentStatus === 'Failed' ? ('Failed' as const) : ('Pending' as const),
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 sm:pb-32 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#0f172a] font-nunito">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" carrier="Prime 5G" />

      <Header title="Payment & Confirmation" showBack onBack={() => onNavigate('book-consultation')} />

      <div className="mt-4 space-y-5">
        {/* Apple HIG Segmented Progress Tracker */}
        <BookingProgressTracker
          currentStep={4}
          onStepClick={(step) => {
            if (step < 4) {
              onNavigate('book-consultation');
            }
          }}
          providerName={doctor.name}
          selectedDateTime={`${date} @ ${timeSlot}`}
        />

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: Payment Methods & Options (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Failed Payment Notice (if triggered) */}
            {paymentError && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2.5 text-xs text-rose-900">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-outfit font-bold block">Payment could not be completed</strong>
                    <p className="text-rose-700 mt-0.5">{paymentError}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedDeclineMode(false);
                      handlePay();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-xs flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedDeclineMode(false);
                      setMethod('bank');
                      setPaymentError(null);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0f172a] border border-slate-200 font-medium rounded-xl text-xs"
                  >
                    Use Bank Transfer
                  </button>
                </div>
              </div>
            )}

            {/* Payment Methods - Clean Apple Style Radio Cards */}
            <div className="space-y-3">
              <h3 className="font-bold font-outfit text-sm sm:text-base text-[#0f172a]">
                Select Payment Channel
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Card */}
                <button
                  type="button"
                  onClick={() => handleMethodSelect('card')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                    method === 'card'
                      ? 'bg-emerald-50/50 border-[#006c44] ring-2 ring-[#006c44]/15 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold text-xs text-[#0f172a] block">Debit / Credit Card</span>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px]">Visa, Mastercard, Verve</span>
                    <CreditCard className="w-4 h-4 text-[#006c44]" />
                  </div>
                </button>

                {/* Bank Transfer */}
                <button
                  type="button"
                  onClick={() => handleMethodSelect('bank')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                    method === 'bank'
                      ? 'bg-emerald-50/50 border-[#006c44] ring-2 ring-[#006c44]/15 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold text-xs text-[#0f172a] block">Bank Transfer</span>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px]">Instant Virtual NUBAN</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                </button>
              </div>
            </div>

            {/* Card Form */}
            {method === 'card' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Card number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="5399 •••• •••• 1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-nunito focus:outline-none focus:border-[#006c44] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-nunito focus:outline-none focus:border-[#006c44] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-nunito focus:outline-none focus:border-[#006c44] transition-colors"
                    />
                  </div>
                </div>

                {/* Save Card Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600 font-nunito">
                    Save card for future visits
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSaveCard(!saveCard);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${
                      saveCard ? 'bg-[#006c44] justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 bg-white rounded-full shadow-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {method === 'bank' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-[#0f172a] font-outfit text-sm">Transfer to Virtual Account</h4>
                  <p className="text-xs text-slate-500">
                    Transfer exactly <strong className="text-[#0f172a]">₦{totalAmount.toLocaleString()}</strong> to complete booking.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Bank:</span>
                    <span className="font-semibold text-[#0f172a]">Wema Bank / Paystack</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Account Name:</span>
                    <span className="font-semibold text-[#0f172a]">Prime Telecare</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Account Number:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-[#006c44] text-base">0129384812</span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedBankAcc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Google Calendar Sync Option */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-bold font-outfit text-xs text-[#0f172a]">Google Calendar Sync</h4>
                    {isGoogleCalendarConnected() && (
                      <span className="bg-emerald-100 text-[#006c44] text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        CONNECTED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-nunito truncate">
                    Dual reminders (15m &amp; 1h) and direct session link in calendar
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCalendarModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                >
                  {isGoogleCalendarConnected() ? 'Manage' : 'Connect'}
                </button>
              </div>
            </div>

            {/* SLA & Service Protocols Accordion */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowFailedConsultationPolicy(!showFailedConsultationPolicy);
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <div>
                    <h4 className="font-semibold font-outfit text-xs sm:text-sm text-[#0f172a]">
                      Service Guarantees &amp; Cancellation Policy
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Doctor no-show protection, reconnection grace period, and instant refunds
                    </p>
                  </div>
                </div>
                {showFailedConsultationPolicy ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showFailedConsultationPolicy && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2.5 text-xs text-slate-600 font-nunito">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#0f172a] block">Doctor No-Show Protection:</strong>
                      If your doctor doesn't join within 10 minutes, you receive an instant 100% refund plus priority rebooking.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#0f172a] block">Reconnection Grace Period:</strong>
                      15-minute waiting window with automatic WebRTC reconnection or fallback audio/chat option.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#0f172a] block">Cancellation &amp; Rescheduling:</strong>
                      Cancel up to 2 hours prior for 100% refund. Rescheduling is completely free with no penalty.
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        setIsSlaModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[#006c44] hover:underline"
                    >
                      Read full policy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary & Pay Button (lg:col-span-5) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            {/* Consultation Summary Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold font-outfit uppercase tracking-wider text-[#0f172a]">
                  Order Invoice
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Awaiting Payment</span>
                </span>
              </div>

              {/* Doctor Details */}
              <div className="flex items-center space-x-3.5">
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  className="w-13 h-13 rounded-2xl object-cover border border-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold font-outfit text-sm sm:text-base text-[#0f172a] truncate">
                    {doctor.fullNameWithTitle || doctor.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{doctor.specialty}</p>
                  <span className="text-[11px] text-emerald-700 font-semibold">{consultationType} Consultation</span>
                </div>
              </div>

              {/* Key Session Details */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-nunito">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    {bookingSummary?.bookingMode === 'instant' ? 'Mode' : 'Date'}
                  </span>
                  <span className="font-bold text-[#0f172a] mt-0.5 block truncate">{date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    {bookingSummary?.bookingMode === 'instant' ? 'Queue' : 'Time Slot'}
                  </span>
                  <span className="font-bold text-[#0f172a] mt-0.5 block truncate">{timeSlot}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Duration</span>
                  <span className="font-bold text-[#0f172a] mt-0.5 block">{duration}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Time Zone</span>
                  <span className="font-bold text-[#0f172a] mt-0.5 block truncate">{cleanTimeZone}</span>
                </div>
              </div>

              {/* Itemized Pricing Breakdown */}
              <div className="space-y-2 text-xs font-nunito border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center text-slate-600">
                  <span>{consultationType} consultation fee</span>
                  <span className="font-semibold font-mono text-[#0f172a]">
                    ₦{consultationFee.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Platform &amp; telehealth connection</span>
                  <span className="font-semibold font-mono text-[#0f172a]">
                    ₦{platformCharge.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Statutory VAT (7.5%)</span>
                  <span className="font-semibold font-mono text-[#0f172a]">
                    ₦{vatTaxFee.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-outfit pt-2 border-t border-slate-100 font-bold text-[#0f172a]">
                  <span>Total Amount</span>
                  <span className="font-mono text-lg text-[#006c44]">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Security Assurance */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit encrypted checkout</span>
                </span>

                {/* Discreet simulation control */}
                <label className="flex items-center space-x-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-600">
                  <input
                    type="checkbox"
                    checked={simulatedDeclineMode}
                    onChange={(e) => setSimulatedDeclineMode(e.target.checked)}
                    className="rounded text-[#006c44] w-3 h-3"
                  />
                  <span>Test decline</span>
                </label>
              </div>

              {/* Submit Payment Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full min-h-[48px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Authorizing Payment...</span>
                ) : (
                  <>
                    <span>Pay ₦{totalAmount.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>

              {/* Tax invoice link */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Official e-receipt generated</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsReceiptModalOpen(true);
                  }}
                  className="font-bold text-[#006c44] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Preview invoice</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% full refund if canceled up to 2h prior</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Invoice & Official Receipt Modal */}
      <ReceiptInvoiceModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoiceData={invoiceData}
      />

      {/* Governance & SLA Policies Modal */}
      <LegalPoliciesModal
        isOpen={isSlaModalOpen}
        policyType="sla"
        onClose={() => setIsSlaModalOpen(false)}
      />

      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        pendingAppointment={{
          doctorName: doctor.fullNameWithTitle || doctor.name,
          doctorSpecialty: doctor.specialty,
          patientName: user.name || 'Ada Okonkwo',
          consultationType,
          dateStr: date,
          timeSlot,
          durationMinutes: 30,
          notes: bookingSummary?.symptomsDescription,
        }}
      />
      {/* Real Live Payment Gateway Modal (Paystack Verified Multi-Channel) */}
      <LivePaymentGatewayModal
        isOpen={isLiveGatewayOpen}
        onClose={() => setIsLiveGatewayOpen(false)}
        onSuccess={handleGatewaySuccess}
        amount={totalAmount}
        doctorName={doctor.fullNameWithTitle || doctor.name}
        consultationType={consultationType}
        patientName={user.name || 'Ada Okonkwo'}
        consultationId={bookingSummary?.consultationId}
        walletBalance={user.walletBalance || 25000}
      />
    </div>
  );
};
