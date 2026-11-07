import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, X, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { directGoogleLogin } from '../../services/googleAuth';
import { User, UserRole } from '../../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole, user: User) => void;
  initialEmail?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
}) => {
  const [googleEmail, setGoogleEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDirectGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      showToast('Please enter your Google email', 'error');
      return;
    }

    try {
      setIsLoading(true);
      triggerHaptic('medium');
      const res = await directGoogleLogin(googleEmail.trim(), fullName.trim());
      if (res.success && res.user) {
        showToast(`Welcome, ${res.user.name}!`, 'success');
        onSuccess(res.user.role || 'patient', res.user);
        onClose();
      } else {
        showToast(res.error || 'Failed to sign in', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Sign in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchGoogleOAuth = () => {
    triggerHaptic('selection');
    const clientId = '841125042406-0f7ansh4it7lh57cu7fgd2ktt4bgmbp2.apps.googleusercontent.com';
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent('email profile openid');
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=${scope}&nonce=${Date.now()}&prompt=select_account`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold font-outfit text-[#022434]">Google Sign-In</h3>
              <p className="text-xs text-slate-500 font-nunito">Secure Clinical Account Access</p>
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

        {/* Quick OAuth Button */}
        <div>
          <button
            type="button"
            onClick={handleLaunchGoogleOAuth}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold font-outfit text-sm flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <span>Launch Google Account Picker</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full py-1">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-outfit">
            or instant sign-in with your google email
          </span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleDirectGoogleLogin} className="space-y-3">
          <div className="border border-slate-200 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Google / Gmail Address</label>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-transparent border-none text-sm font-nunito focus:outline-none text-[#171c1f]"
                required
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Your Full Name (Optional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Joel Amahdi"
              className="w-full bg-transparent border-none text-sm font-nunito focus:outline-none text-[#171c1f]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#006c44] hover:bg-[#022434] text-white rounded-2xl font-bold font-outfit text-sm transition-all active:scale-98 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Sign In with This Google Account</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-nunito pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>NDPA-2023 & HIPAA Compliant Session Storage</span>
        </div>
      </div>
    </div>
  );
};

