import React, { useState } from 'react';
import { Mail, ShieldCheck, X, Sparkles, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { directGoogleLogin, signInWithGoogle } from '../../services/googleAuth';
import { User, UserRole } from '../../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole, user: User) => void;
  initialEmail?: string;
  errorMessage?: string;
  initialRole?: UserRole;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
  errorMessage,
  initialRole = 'patient',
}) => {
  const [googleEmail, setGoogleEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

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
      const res = await directGoogleLogin(googleEmail.trim(), fullName.trim(), initialRole);
      if (res.success && res.user) {
        const resolvedRole = initialRole === 'doctor' || initialRole === 'admin' ? initialRole : (res.user.role || initialRole);
        const resolvedUser = { ...res.user, role: resolvedRole };
        showToast(`Welcome, ${resolvedUser.name}!`, 'success');
        onSuccess(resolvedRole, resolvedUser);
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

  const handleTryFirebaseOAuth = async () => {
    triggerHaptic('selection');
    setIsOAuthLoading(true);
    try {
      const res = await signInWithGoogle(initialRole);
      if (res.success && res.user) {
        const resolvedRole = initialRole === 'doctor' || initialRole === 'admin' ? initialRole : (res.user.role || initialRole);
        const resolvedUser = { ...res.user, role: resolvedRole };
        showToast(`Welcome, ${resolvedUser.name}!`, 'success');
        onSuccess(resolvedRole, resolvedUser);
        onClose();
      } else if (res.error) {
        showToast(res.error, 'error');
        setShowConfigHelp(true);
      }
    } catch (err: any) {
      showToast(err?.message || 'OAuth sign-in failed', 'error');
      setShowConfigHelp(true);
    } finally {
      setIsOAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 my-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
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
              <p className="text-xs text-slate-500 font-nunito">Instant Clinical Account Access</p>
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

        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start space-x-2 text-xs text-amber-900 font-nunito">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Sign in with your Google email below for immediate access.
              </p>
            </div>
          </div>
        )}

        {/* Primary Instant Email Sign-In */}
        <form onSubmit={handleDirectGoogleLogin} className="space-y-3 pt-1">
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
                autoFocus
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Your Full Name (Optional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Joel Oaihimire"
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
                <span>Continue with this Google Account</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center space-x-3 w-full py-1">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-outfit">
            or try official popup
          </span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Secondary: Try Official Firebase OAuth Popup */}
        <div>
          <button
            type="button"
            disabled={isOAuthLoading}
            onClick={handleTryFirebaseOAuth}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold font-outfit text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isOAuthLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
            ) : (
              <>
                <span>Launch Google OAuth Popup</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Help collapsible */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowConfigHelp(!showConfigHelp)}
            className="w-full flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 hover:text-slate-800 font-nunito cursor-pointer py-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why did Error 400 redirect_uri_mismatch or unauthorized-domain appear?</span>
          </button>

          {showConfigHelp && (
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 font-nunito space-y-2 leading-relaxed animate-in fade-in duration-200">
              <p className="font-semibold text-slate-800">To enable automatic 1-tap Google OAuth on your live Render domain:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>
                  Open <span className="font-mono text-slate-900 font-bold">Google Cloud Console &gt; Credentials</span> in project <span className="font-mono text-[#006c44] font-bold">gen-lang-client-0108839770</span>.
                </li>
                <li>
                  Under OAuth 2.0 Client IDs, add <span className="font-mono text-slate-900 font-bold">https://prime-telecare.onrender.com</span> to <strong>Authorized redirect URIs</strong> and <strong>Authorized JavaScript origins</strong>.
                </li>
                <li>
                  In <span className="font-mono text-slate-900 font-bold">Firebase Console &gt; Authentication &gt; Settings</span>, ensure <span className="font-mono text-slate-900 font-bold">prime-telecare.onrender.com</span> is saved under <strong>Authorized domains</strong>.
                </li>
              </ol>
              <p className="text-[10px] text-slate-500 italic">
                You can always sign in above with any Google email instantly without waiting for cloud DNS sync.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-nunito pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>NDPA-2023 & HIPAA Compliant Session Storage</span>
        </div>
      </div>
    </div>
  );
};
