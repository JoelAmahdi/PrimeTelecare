import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Lock, CreditCard, Building2, Wallet, CheckCircle2 } from 'lucide-react';
import { ScreenId, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { resetDemoAppointment15Min } from '../../utils/appointmentNotifications';

interface PaymentScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ user, onNavigate }) => {
  const [method, setMethod] = useState<'card' | 'bank' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMethodSelect = (m: 'card' | 'bank' | 'wallet') => {
    triggerHaptic('selection');
    setMethod(m);
  };

  const handlePay = () => {
    triggerHaptic('heavy');
    setIsProcessing(true);
    setTimeout(() => {
      triggerHaptic('success');
      resetDemoAppointment15Min();
      setIsProcessing(false);
      onNavigate('patient-home');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" carrier="Prime 5G" />

      <Header title="Payment" showBack onBack={() => onNavigate('book-consultation')} />

      <div className="px-5 space-y-5 mt-2">
        {/* Dark Slate Summary Card */}
        <div className="bg-[#1c3a4a] text-white rounded-3xl p-6 shadow-md">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Video Consultation</span>
          <h3 className="font-bold font-outfit text-xl mt-1">Dr. Sarah Johnson</h3>
          <p className="text-xs text-slate-300 font-nunito mt-0.5">Today · 2:00 PM</p>
          <div className="mt-4 text-3xl font-extrabold font-outfit tracking-tight">
            ₦10,000
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card option */}
          <button
            onClick={() => handleMethodSelect('card')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
              method === 'card'
                ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[#006c44] bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
                Recommended
              </span>
              <span className="font-bold font-outfit text-xs text-[#022434] block leading-tight">
                Debit/Credit Card
              </span>
            </div>
            <div className="flex space-x-1 items-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div className="w-3 h-3 bg-red-500 rounded-full inline-block"></div>
              <div className="w-3 h-3 bg-amber-400 rounded-full -ml-2 inline-block"></div>
            </div>
          </button>

          {/* Bank Transfer option */}
          <button
            onClick={() => handleMethodSelect('bank')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
              method === 'bank'
                ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <span className="font-bold font-outfit text-xs text-[#022434] block leading-tight mt-3">
                Bank Transfer
              </span>
            </div>
            <Building2 className="w-5 h-5 text-slate-600" />
          </button>

          {/* Wallet Balance option */}
          <button
            onClick={() => handleMethodSelect('wallet')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
              method === 'wallet'
                ? 'bg-[#e6f9f0] border-[#006c44] ring-2 ring-[#006c44]/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <span className="font-bold font-outfit text-xs text-[#022434] block leading-tight">
                Wallet Balance
              </span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block">Balance:</span>
              <span className="text-xs font-bold font-data text-[#022434]">₦{user.walletBalance?.toLocaleString()}</span>
            </div>
          </button>
        </div>

        {/* Card Input Form Container */}
        {method === 'card' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <div>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Card Number"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-nunito focus:outline-none focus:border-[#006c44]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-nunito focus:outline-none focus:border-[#006c44]"
              />
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="CVV"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-nunito focus:outline-none focus:border-[#006c44]"
              />
            </div>

            {/* Save Card Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-700 font-nunito">Save card for future</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSaveCard(!saveCard);
                }}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                  saveCard ? 'bg-[#77daa4] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-sm"></span>
              </button>
            </div>
          </div>
        )}

        {method === 'wallet' && (
          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 text-center space-y-2">
            <Wallet className="w-8 h-8 text-[#006c44] mx-auto" />
            <h4 className="font-bold text-[#022434]">Pay from Wallet</h4>
            <p className="text-xs text-slate-600">
              Your available balance of ₦25,000 will be debited ₦10,000 for this consultation.
            </p>
          </div>
        )}

        {/* Secured by Paystack badge */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Secured by Paystack</span>
        </div>

        {/* Submit Payment Button */}
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full py-4 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-2xl shadow-lg hover:bg-[#022434] transition-all transform active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? 'Processing Payment...' : 'Pay ₦10,000 Now'}
        </button>
      </div>
    </div>
  );
};
