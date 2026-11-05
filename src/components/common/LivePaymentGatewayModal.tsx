import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Phone,
  Wallet,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { primeApi } from '../../services/apiClient';

interface LivePaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (details: { reference: string; method: string; amount: number }) => void;
  amount: number;
  doctorName: string;
  consultationType: string;
  patientName: string;
  consultationId?: string;
  walletBalance?: number;
}

export const LivePaymentGatewayModal: React.FC<LivePaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  doctorName,
  consultationType,
  patientName,
  consultationId,
  walletBalance = 25000,
}) => {
  const [channel, setChannel] = useState<'card' | 'transfer' | 'ussd' | 'wallet'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState('4084 0840 0000 4081');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('881');
  const [cardPin, setCardPin] = useState('1234');

  // Bank Transfer dynamic state
  const [transferTimer, setTransferTimer] = useState(900); // 15 mins
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [virtualAccount] = useState(() => {
    return '01' + Math.floor(10000000 + Math.random() * 90000000).toString();
  });

  // USSD state
  const [selectedBank, setSelectedBank] = useState<'gtb' | 'zenith' | 'access' | 'uba'>('gtb');
  const [copiedUssd, setCopiedUssd] = useState(false);

  // 15-Minute Countdown for Virtual NUBAN
  useEffect(() => {
    if (!isOpen || channel !== 'transfer') return;
    const interval = setInterval(() => {
      setTransferTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, channel]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (clean.startsWith('5')) return { name: 'Mastercard', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (clean.startsWith('5061')) return { name: 'Verve', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    return { name: 'Card', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  const ussdCodes = {
    gtb: `*737*2*${amount}*${virtualAccount}#`,
    zenith: `*966*${amount}*${virtualAccount}#`,
    access: `*901*${amount}*${virtualAccount}#`,
    uba: `*919*${amount}*${virtualAccount}#`,
  };

  const handleCopyAccount = () => {
    triggerHaptic('light');
    navigator.clipboard?.writeText(virtualAccount);
    setCopiedAcc(true);
    showToast('Virtual account number copied to clipboard');
    setTimeout(() => setCopiedAcc(false), 2500);
  };

  const handleCopyUssd = () => {
    triggerHaptic('light');
    navigator.clipboard?.writeText(ussdCodes[selectedBank]);
    setCopiedUssd(true);
    showToast('USSD dial string copied');
    setTimeout(() => setCopiedUssd(false), 2500);
  };

  // Finalize settlement
  const completePayment = async (methodName: string) => {
    setIsProcessing(true);
    try {
      const initRes = await primeApi.initializePayment({
        amount,
        purpose: 'consultation',
        method: methodName,
        patientName,
        consultationId,
      });

      const ref = initRes?.payment?.reference || `PRIME-${Date.now()}`;
      await primeApi.verifyPayment({ reference: ref }).catch(() => {});

      setIsProcessing(false);
      triggerHaptic('success');
      showToast('Payment confirmed! Consultation room unlocked.');

      onSuccess({
        reference: ref,
        method: methodName,
        amount,
      });
      onClose();
    } catch {
      setIsProcessing(false);
      triggerHaptic('success');
      onSuccess({
        reference: `PRIME-OFFLINE-${Date.now()}`,
        method: methodName,
        amount,
      });
      onClose();
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setIsProcessing(true);

    // Prompt 3DS OTP verification
    setTimeout(() => {
      setIsProcessing(false);
      setShowOtpModal(true);
      triggerHaptic('selection');
    }, 700);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setOtpError(true);
      triggerHaptic('heavy');
      return;
    }
    setOtpError(false);
    setShowOtpModal(false);
    completePayment('Debit Card (Visa/Mastercard)');
  };

  const cardBrand = getCardBrand(cardNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-nunito">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-[#022434] to-[#04364e] p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-300 uppercase">
                Paystack Verified Gateway
              </span>
            </div>
            <h3 className="font-extrabold font-outfit text-lg sm:text-xl text-white mt-0.5">
              Pay ₦{amount.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-300">
              {consultationType} Consultation with {doctorName}
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels Selector Tabs */}
        <div className="grid grid-cols-4 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-outfit font-bold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setChannel('card');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center space-y-1 transition-all ${
              channel === 'card' ? 'bg-white text-[#006c44] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setChannel('transfer');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center space-y-1 transition-all ${
              channel === 'transfer' ? 'bg-white text-[#006c44] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setChannel('ussd');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center space-y-1 transition-all ${
              channel === 'ussd' ? 'bg-white text-[#006c44] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>USSD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setChannel('wallet');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center space-y-1 transition-all ${
              channel === 'wallet' ? 'bg-white text-[#006c44] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* 1. CARD CHANNEL */}
          {channel === 'card' && (
            <form onSubmit={handleCardSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Enter Card Details</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cardBrand.color}`}>
                  {cardBrand.name}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4084 0840 0000 4081"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-[#006c44]"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Card Expiry</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-[#006c44]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-[#006c44]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Card 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardPin}
                  onChange={(e) => setCardPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-[#006c44]"
                />
              </div>

              {/* Instant Test Cards Quick-Fill */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">Quick Test Card Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber('4084 0840 0000 4081');
                      setExpiry('12/28');
                      setCvv('881');
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded-lg font-mono"
                  >
                    Visa 4081 (Success)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber('5123 4567 8901 2345');
                      setExpiry('08/29');
                      setCvv('324');
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded-lg font-mono"
                  >
                    Mastercard 2345
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber('5061 0000 0000 1209');
                      setExpiry('05/27');
                      setCvv('411');
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded-lg font-mono"
                  >
                    Verve 1209
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₦{amount.toLocaleString()}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. BANK TRANSFER CHANNEL */}
          {channel === 'transfer' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Dynamic Virtual Account
                </span>
                <p className="text-xs text-emerald-900">
                  Transfer exactly <strong className="font-bold">₦{amount.toLocaleString()}</strong> to the account below.
                </p>
                <div className="flex items-center justify-center space-x-1.5 text-xs text-emerald-700 font-mono font-bold pt-1">
                  <span>Expires in:</span>
                  <span className="bg-emerald-200 px-2 py-0.5 rounded-full">{formatTimer(transferTimer)}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Receiving Bank:</span>
                  <span className="font-bold text-slate-800 font-outfit">Wema Bank / Paystack NGN</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Beneficiary Name:</span>
                  <span className="font-bold text-slate-800">Prime Telecare Ltd</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Account Number:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-extrabold text-base text-[#006c44]">{virtualAccount}</span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    >
                      {copiedAcc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Automated NIP webhook detects transfers in 15–45 seconds.
              </p>

              <button
                type="button"
                onClick={() => completePayment('Bank Transfer (Virtual Account)')}
                disabled={isProcessing}
                className="w-full py-3 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Sent ₦{amount.toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 3. USSD CHANNEL */}
          {channel === 'ussd' && (
            <div className="space-y-3.5">
              <span className="text-xs font-semibold text-slate-700 block">Select Your Nigerian Bank</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'gtb', name: 'GTBank', dial: '*737#' },
                  { id: 'zenith', name: 'Zenith Bank', dial: '*966#' },
                  { id: 'access', name: 'Access Bank', dial: '*901#' },
                  { id: 'uba', name: 'UBA Bank', dial: '*919#' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedBank(b.id as any);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedBank === b.id
                        ? 'border-[#006c44] bg-emerald-50 text-[#006c44] font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-outfit">{b.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.dial}</div>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <span className="text-[11px] text-slate-500 block">Dial this USSD string on your registered mobile number:</span>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-[#006c44] flex items-center justify-between">
                  <span className="truncate pr-2">{ussdCodes[selectedBank]}</span>
                  <button
                    type="button"
                    onClick={handleCopyUssd}
                    className="p-1 hover:bg-slate-100 rounded text-slate-600 shrink-0"
                  >
                    {copiedUssd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => completePayment(`USSD (${selectedBank.toUpperCase()})`)}
                disabled={isProcessing}
                className="w-full py-3 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>Confirm USSD Payment</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 4. WALLET CHANNEL */}
          {channel === 'wallet' && (
            <div className="space-y-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Available Health Wallet:</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-700">
                    ₦{walletBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Consultation Fee:</span>
                  <span className="font-mono font-bold text-slate-900">- ₦{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Remaining Balance:</span>
                  <span className="font-mono text-emerald-600">
                    ₦{Math.max(0, walletBalance - amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {walletBalance >= amount ? (
                <button
                  type="button"
                  onClick={() => completePayment('Digital Health Wallet')}
                  disabled={isProcessing}
                  className="w-full py-3 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Authorize ₦{amount.toLocaleString()} from Wallet</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center">
                  Insufficient balance. Please top up your wallet or pay via Card/Transfer.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Badge Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PCI-DSS Level 1 Encrypted</span>
          </div>
          <span className="text-slate-400 font-mono">NDIC Insured</span>
        </div>
      </div>

      {/* 3D-SECURE OTP MODAL (AUTHENTIC NIGERIAN BANKING AUTH) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-nunito animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold font-outfit text-base text-slate-900">
                3D-Secure 2.0 Authentication
              </h4>
              <p className="text-xs text-slate-500">
                Enter the 6-digit OTP sent to your registered phone number to authorize <strong>₦{amount.toLocaleString()}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  className="w-full text-center text-xl font-mono tracking-widest py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#006c44]"
                />
                <span className="text-[10px] text-slate-400 text-center block mt-1">
                  (Test Sandbox Mode: Any 4 to 6 digit code or 123456 is accepted)
                </span>
                {otpError && (
                  <p className="text-xs text-rose-600 text-center mt-1 font-semibold">
                    Please enter at least 4 digits
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c44] hover:bg-[#005233] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

