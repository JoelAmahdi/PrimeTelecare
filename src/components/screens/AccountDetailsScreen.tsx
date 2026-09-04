import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  User as UserIcon,
  CreditCard,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  DollarSign,
  Plus,
  ChevronRight,
  Lock,
  Phone,
  Mail,
  Edit3,
  Check,
  AlertCircle,
  FileText,
  Wallet,
  ArrowDownLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { ScreenId, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface AccountDetailsScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  initialTab?: 'details' | 'withdrawal' | 'history';
}

interface SavedBank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface WithdrawalTransaction {
  id: string;
  referenceNo: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  dateStr: string;
  status: 'completed' | 'processing' | 'failed';
  fee: number;
}

export const AccountDetailsScreen: React.FC<AccountDetailsScreenProps> = ({
  user,
  onNavigate,
  initialTab = 'details',
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'withdrawal' | 'history'>(initialTab);

  // Editable Profile details state
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '+234 803 123 4567');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Financial Balance State
  const [walletBalance, setWalletBalance] = useState<number>(
    user.walletBalance ?? (user.role === 'doctor' ? 45000 : 15000)
  );
  const [pendingSettlement] = useState<number>(user.role === 'doctor' ? 12500 : 0);
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(185000);

  // Saved Bank Accounts
  const [savedBanks, setSavedBanks] = useState<SavedBank[]>([
    {
      id: 'b-1',
      bankName: 'Zenith Bank',
      accountNumber: '2234567890',
      accountName: user.name.toUpperCase(),
      isDefault: true,
    },
    {
      id: 'b-2',
      bankName: 'Guaranty Trust Bank (GTB)',
      accountNumber: '0123456789',
      accountName: user.name.toUpperCase(),
      isDefault: false,
    },
    {
      id: 'b-3',
      bankName: 'Kuda Microfinance Bank',
      accountNumber: '9988776655',
      accountName: user.name.toUpperCase(),
      isDefault: false,
    },
  ]);
  const [selectedBankId, setSelectedBankId] = useState<string>('b-1');

  // Withdrawal Form State
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('10000');
  const [payoutSpeed, setPayoutSpeed] = useState<'instant' | 'standard'>('instant');
  const [withdrawalSuccessMsg, setWithdrawalSuccessMsg] = useState<string | null>(null);

  // Add Bank Modal state
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('First Bank of Nigeria');
  const [newAccNum, setNewAccNum] = useState('');
  const [newAccName, setNewAccName] = useState('');

  // Pin verification state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [withdrawalPin, setWithdrawalPin] = useState(['', '', '', '']);

  // Withdrawal history list
  const [transactions, setTransactions] = useState<WithdrawalTransaction[]>([
    {
      id: 'tx-101',
      referenceNo: 'WTH-8829104',
      amount: 15000,
      bankName: 'Zenith Bank (****7890)',
      accountNumber: '2234567890',
      dateStr: 'Yesterday, 02:45 PM',
      status: 'completed',
      fee: 50,
    },
    {
      id: 'tx-102',
      referenceNo: 'WTH-7734102',
      amount: 25000,
      bankName: 'GTBank (****6789)',
      accountNumber: '0123456789',
      dateStr: 'Aug 26, 2026, 11:15 AM',
      status: 'completed',
      fee: 50,
    },
    {
      id: 'tx-103',
      referenceNo: 'WTH-6623991',
      amount: 50000,
      bankName: 'Kuda Bank (****6655)',
      accountNumber: '9988776655',
      dateStr: 'Aug 18, 2026, 09:30 AM',
      status: 'completed',
      fee: 50,
    },
  ]);

  const numAmount = parseFloat(withdrawalAmount) || 0;
  const processingFee = payoutSpeed === 'instant' ? 50 : 0;
  const totalDeduction = numAmount + processingFee;

  // Handlers
  const handlePresetAmount = (amt: number) => {
    setWithdrawalAmount(amt.toString());
    triggerHaptic('light');
  };

  const handleOpenPinModal = () => {
    if (numAmount < 1000) {
      alert('Minimum withdrawal amount is ₦1,000.');
      return;
    }
    if (totalDeduction > walletBalance) {
      alert('Insufficient wallet balance for this withdrawal request.');
      return;
    }
    setIsPinModalOpen(true);
  };

  const handleConfirmWithdrawal = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
    triggerHaptic('medium');

    const selectedBank = savedBanks.find((b) => b.id === selectedBankId) || savedBanks[0];

    // Deduct balance
    setWalletBalance((prev) => Math.max(0, prev - totalDeduction));
    setTotalWithdrawn((prev) => prev + numAmount);

    const newTx: WithdrawalTransaction = {
      id: `tx-${Date.now()}`,
      referenceNo: `WTH-${Math.floor(1000000 + Math.random() * 9000000)}`,
      amount: numAmount,
      bankName: `${selectedBank.bankName} (****${selectedBank.accountNumber.slice(-4)})`,
      accountNumber: selectedBank.accountNumber,
      dateStr: 'Just Now',
      status: payoutSpeed === 'instant' ? 'completed' : 'processing',
      fee: processingFee,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setIsPinModalOpen(false);
    setWithdrawalPin(['', '', '', '']);

    setWithdrawalSuccessMsg(
      `Withdrawal request of ₦${numAmount.toLocaleString()} to ${selectedBank.bankName} was successful!`
    );

    setTimeout(() => {
      setWithdrawalSuccessMsg(null);
    }, 5000);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccNum || newAccNum.length < 10) {
      alert('Please enter a valid 10-digit account number.');
      return;
    }

    const newBankObj: SavedBank = {
      id: `b-${Date.now()}`,
      bankName: newBankName,
      accountNumber: newAccNum,
      accountName: newAccName || user.name.toUpperCase(),
      isDefault: savedBanks.length === 0,
    };

    setSavedBanks((prev) => [...prev, newBankObj]);
    setSelectedBankId(newBankObj.id);
    setIsAddBankModalOpen(false);
    setNewAccNum('');
    setNewAccName('');
    triggerHaptic('light');
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />

      {/* Top Header */}
      <Header
        title="Account & Withdrawals"
        showBack
        onBack={() => onNavigate('settings')}
      />

      <div className="px-1 sm:px-3 space-y-4 mt-2">
        {/* Wallet & Account Summary Banner */}
        <div className="bg-gradient-to-br from-[#022434] via-[#1c3a4a] to-[#012f45] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-slate-700/60">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#77daa4]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-0.5 rounded-full text-[11px] font-bold font-outfit uppercase tracking-wider">
                  {user.role === 'doctor' ? 'Verified Doctor Account' : 'Patient Account'}
                </span>
                <span className="text-xs text-slate-300 font-nunito flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2FA Active</span>
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs text-slate-300 font-nunito block uppercase tracking-wider font-semibold">
                  Available Wallet Balance
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-white tracking-tight mt-0.5">
                  ₦{walletBalance.toLocaleString('en-NG')}
                </h2>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-0 border-white/10 pt-3 sm:pt-0">
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('withdrawal');
                }}
                className="px-5 py-2.5 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-bold font-outfit text-xs rounded-2xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw Funds</span>
              </button>

              <span className="text-[11px] text-slate-300 font-nunito">
                Lifetime Withdrawn: ₦{totalWithdrawn.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Financial Stats */}
          {user.role === 'doctor' && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10 text-xs font-nunito">
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <span className="text-slate-300">Pending Settlement:</span>
                <span className="font-bold text-amber-300">₦{pendingSettlement.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <span className="text-slate-300">Payout Bank:</span>
                <span className="font-bold text-emerald-300 truncate max-w-[120px]">
                  {savedBanks[0]?.bankName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Success Alert Banner */}
        {withdrawalSuccessMsg && (
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="text-xs sm:text-sm font-bold font-outfit">{withdrawalSuccessMsg}</p>
            </div>
            <button onClick={() => setWithdrawalSuccessMsg(null)}>
              <X className="w-4 h-4 opacity-80 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('details');
            }}
            className={`flex-1 min-w-[105px] py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-white text-[#022434] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Details</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('withdrawal');
            }}
            className={`flex-1 min-w-[115px] py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
              activeTab === 'withdrawal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>Withdrawal</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('history');
            }}
            className={`flex-1 min-w-[115px] py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-[#1c3a4a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>History</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNT DETAILS PROFILE */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold font-outfit text-base text-[#022434]">
                    Personal Information
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito">
                    Manage your verified contact details and clinical profile
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingProfile ? 'Save Details' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold font-outfit text-slate-500 block mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#022434] focus:outline-none focus:border-[#006c44] disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold font-outfit text-slate-500 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled={!isEditingProfile}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#022434] focus:outline-none focus:border-[#006c44] disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold font-outfit text-slate-500 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#022434] focus:outline-none focus:border-[#006c44] disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold font-outfit text-slate-500 block mb-1">
                    {user.role === 'doctor' ? 'Medical License Number' : 'Patient ID Code'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.role === 'doctor' ? 'MDCN/2019/88492' : 'PT-9948-2026'}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Security & Payout Setup Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="font-extrabold font-outfit text-sm text-[#022434]">
                Account Security & Payout Settings
              </h3>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 text-[#006c44] rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold font-outfit text-xs text-[#022434] block">
                      Two-Factor Authentication (2FA)
                    </span>
                    <span className="text-[11px] text-slate-500 font-nunito">
                      Required for high-value wallet withdrawals
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                    twoFactorEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED WITHDRAWAL PAGE */}
        {activeTab === 'withdrawal' && (
          <div className="space-y-5">
            {/* Withdrawal Card Form */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold font-outfit text-base text-[#022434] flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                    <span>Request Fund Withdrawal</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito">
                    Transfer funds directly to your verified bank account or mobile wallet
                  </p>
                </div>

                <span className="bg-emerald-100 text-[#006c44] text-xs font-bold px-3 py-1 rounded-full font-outfit">
                  Instant Payout Ready
                </span>
              </div>

              {/* 1. Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-outfit text-slate-600 block">
                  Enter Withdrawal Amount (₦)
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-bold text-slate-400 font-outfit">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-extrabold font-outfit text-[#022434] focus:outline-none focus:border-[#006c44]"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[5000, 10000, 25000, walletBalance].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetAmount(amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-outfit border transition-all ${
                        numAmount === amt
                          ? 'bg-[#006c44] text-white border-[#006c44]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {amt === walletBalance ? 'Withdraw Max' : `₦${amt.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Destination Bank Account Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-outfit text-slate-600">
                    Select Destination Bank Account
                  </label>
                  <button
                    onClick={() => setIsAddBankModalOpen(true)}
                    className="text-xs font-bold text-[#006c44] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bank Account</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedBanks.map((bank) => {
                    const isSelected = selectedBankId === bank.id;
                    return (
                      <div
                        key={bank.id}
                        onClick={() => {
                          setSelectedBankId(bank.id);
                          triggerHaptic('selection');
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold font-outfit text-xs text-[#022434] block">
                              {bank.bankName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ****{bank.accountNumber.slice(-4)} • {bank.accountName}
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Payout Speed */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-outfit text-slate-600 block">
                  Select Payout Speed
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPayoutSpeed('instant')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      payoutSpeed === 'instant'
                        ? 'border-emerald-500 bg-emerald-50/50 font-bold'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-outfit text-[#022434]">Instant Payout</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                        Under 5 Mins
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-nunito block mt-1">
                      Fee: ₦50 processing charge
                    </span>
                  </div>

                  <div
                    onClick={() => setPayoutSpeed('standard')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      payoutSpeed === 'standard'
                        ? 'border-emerald-500 bg-emerald-50/50 font-bold'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-outfit text-[#022434]">Standard Payout</span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                        24 Hours
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-nunito block mt-1">
                      Fee: Free (₦0 charge)
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2 text-xs font-nunito">
                <div className="flex justify-between text-slate-600">
                  <span>Withdrawal Amount:</span>
                  <span className="font-bold text-slate-900">₦{numAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Processing Fee:</span>
                  <span className="font-bold text-slate-900">₦{processingFee}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold font-outfit text-[#022434]">
                  <span>Total Wallet Deduction:</span>
                  <span className="text-emerald-700">₦{totalDeduction.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleOpenPinModal}
                className="w-full py-4 bg-[#006c44] hover:bg-[#022434] text-white font-extrabold font-outfit text-sm rounded-2xl shadow-lg transition-all transform active:scale-98 flex items-center justify-center space-x-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>Confirm & Request Withdrawal</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: WITHDRAWAL HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold font-outfit text-base text-[#022434]">
                  Withdrawal Transaction Logs
                </h3>
                <p className="text-xs text-slate-500 font-nunito">
                  Historical record of all payout requests and bank transfers
                </p>
              </div>

              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full font-outfit">
                {transactions.length} Transactions
              </span>
            </div>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-[#006c44]">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-outfit text-sm text-[#022434]">
                          ₦{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                          {tx.referenceNo}
                        </span>
                      </div>

                      <span className="text-xs text-slate-500 font-nunito block mt-0.5">
                        Sent to {tx.bankName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-nunito">{tx.dateStr}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        tx.status === 'completed'
                          ? 'bg-emerald-100 text-[#006c44]'
                          : tx.status === 'processing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-nunito block mt-1">
                      Fee: ₦{tx.fee}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: PIN VERIFICATION MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-[#006c44] rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold font-outfit text-lg text-[#022434]">
                Security PIN Verification
              </h4>
              <p className="text-xs text-slate-500 font-nunito mt-1">
                Enter your 4-digit security PIN to authorize ₦{numAmount.toLocaleString()} withdrawal
              </p>
            </div>

            {/* Dummy PIN Dots */}
            <div className="flex justify-center space-x-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-10 h-12 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center text-lg font-bold font-mono text-[#022434]"
                >
                  ●
                </div>
              ))}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold font-outfit text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithdrawal}
                className="flex-1 py-3 bg-[#006c44] text-white font-bold font-outfit text-xs rounded-xl shadow"
              >
                Authorize Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BANK ACCOUNT MODAL */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold font-outfit text-base text-[#022434] flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Add Payout Bank Account</span>
              </h4>
              <button onClick={() => setIsAddBankModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-3 text-xs font-nunito">
              <div>
                <label className="font-bold font-outfit text-slate-600 block mb-1">
                  Select Bank
                </label>
                <select
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-outfit text-slate-800 focus:outline-none"
                >
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="Kuda Microfinance Bank">Kuda Microfinance Bank</option>
                  <option value="OPay Digital Bank">OPay Digital Bank</option>
                </select>
              </div>

              <div>
                <label className="font-bold font-outfit text-slate-600 block mb-1">
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 0123456789"
                  value={newAccNum}
                  onChange={(e) => setNewAccNum(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-[#022434] focus:outline-none focus:border-[#006c44]"
                />
              </div>

              <div>
                <label className="font-bold font-outfit text-slate-600 block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder={user.name.toUpperCase()}
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold font-outfit text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#006c44] text-white font-bold font-outfit text-xs rounded-xl shadow"
                >
                  Verify & Save Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
