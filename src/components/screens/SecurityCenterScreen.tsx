import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Server, 
  FileText, 
  AlertTriangle, 
  Activity, 
  Users,
  EyeOff,
  Database,
  GlobeLock,
  CheckCircle2,
  ScanFace,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { ScreenId, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { getBiometricSettings, saveBiometricSettings, BiometricType } from '../../utils/biometrics';
import { showToast } from '../../utils/toast';

interface SecurityCenterScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
}

export const SecurityCenterScreen: React.FC<SecurityCenterScreenProps> = ({ user, onNavigate }) => {
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  
  // Biometric authentication state
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [biometricType, setBiometricType] = useState<BiometricType>('faceid');

  useEffect(() => {
    const settings = getBiometricSettings();
    setBiometricEnabled(settings.enabled);
    setBiometricType(settings.type);

    const handleUpdate = () => {
      const updated = getBiometricSettings();
      setBiometricEnabled(updated.enabled);
      setBiometricType(updated.type);
    };

    window.addEventListener('biometric-settings-updated', handleUpdate);
    return () => window.removeEventListener('biometric-settings-updated', handleUpdate);
  }, []);

  const handleToggleBiometric = () => {
    triggerHaptic('medium');
    const nextState = !biometricEnabled;
    setBiometricEnabled(nextState);
    saveBiometricSettings({
      enabled: nextState,
      type: biometricType,
    });
    showToast(
      nextState
        ? `Biometric Security Enabled (${biometricType === 'faceid' ? 'Face ID' : 'Finger Touch'})`
        : 'Biometric Security Disabled'
    );
  };

  const handleSelectBiometricType = (type: BiometricType) => {
    triggerHaptic('selection');
    setBiometricType(type);
    saveBiometricSettings({
      enabled: biometricEnabled,
      type,
    });
    showToast(`Switched authentication method to ${type === 'faceid' ? 'Face ID' : 'Finger Touch'}`);
  };

  const handleToggleMFA = () => {
    triggerHaptic('medium');
    setMfaEnabled(!mfaEnabled);
  };

  const handleTimeoutChange = (val: string) => {
    triggerHaptic('selection');
    setSessionTimeout(val);
  };

  const isClinicianOrAdmin = user.role === 'doctor' || user.role === 'admin';

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-4xl mx-auto text-[#171c1f]">
      <StatusBar />
      <Header title="Trust & Security Center" showBack onBack={() => onNavigate('settings')} />

      <div className="px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold font-outfit text-emerald-900">Enterprise-Grade Security & Privacy</h3>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Prime Telecare adheres to strict data protection regulations. Your medical data is encrypted in transit and at rest, and access is tightly controlled via Role-Based Access Controls (RBAC).
            </p>
          </div>
        </div>

        {/* Access Controls & Authentication */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center space-x-2">
            <Key className="w-5 h-5 text-slate-700" />
            <h3 className="font-extrabold font-outfit text-slate-800">Access Controls & Authentication</h3>
          </div>
          <div className="p-4 space-y-4">
            
            {/* RBAC Evidence */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-sm text-slate-800 block">Role-Based Access (RBAC)</span>
                <span className="text-xs text-slate-500">Your current role: <span className="uppercase font-bold text-emerald-600">{user.role}</span></span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded-md font-bold">Active</span>
            </div>

            {/* Biometric Authentication Method (Face ID & Finger Touch) */}
            <div className="border-b border-slate-100 pb-3 pt-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-800 block">Biometric Authentication</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-outfit border ${
                        biometricEnabled
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {biometricEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Use Face ID or Finger Touch for sign-in and unlocking records
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={biometricEnabled} 
                    onChange={handleToggleBiometric}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006c44]"></div>
                </label>
              </div>

              {biometricEnabled && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold font-outfit">Selected Authentication Method:</span>
                    <span className="text-[#006c44] font-bold flex items-center space-x-1 font-outfit">
                      <Sparkles className="w-3 h-3" />
                      <span>Hardware Active</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectBiometricType('faceid')}
                      className={`py-2 px-3 rounded-xl font-bold font-outfit text-xs flex items-center justify-center space-x-2 transition-all ${
                        biometricType === 'faceid'
                          ? 'bg-[#022434] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Face ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBiometricType('fingerprint')}
                      className={`py-2 px-3 rounded-xl font-bold font-outfit text-xs flex items-center justify-center space-x-2 transition-all ${
                        biometricType === 'fingerprint'
                          ? 'bg-[#022434] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>Finger Touch</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MFA (For sensitive accounts) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-sm text-slate-800 block">Multi-Factor Authentication (MFA)</span>
                <span className="text-xs text-slate-500">
                  {isClinicianOrAdmin ? 'Mandatory for clinical accounts' : 'Optional for patients'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={mfaEnabled} 
                  onChange={handleToggleMFA}
                  disabled={isClinicianOrAdmin}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006c44]"></div>
              </label>
            </div>

            {/* Session Timeout */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="font-bold text-sm text-slate-800 block">Session Timeout</span>
                <span className="text-xs text-slate-500">Auto-lock idle sessions</span>
              </div>
              <select 
                value={sessionTimeout}
                onChange={(e) => handleTimeoutChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg py-1 px-2 focus:outline-none focus:border-[#006c44]"
              >
                <option value="5">5 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
              </select>
            </div>
            
            <div className="pt-2">
              <button 
                onClick={() => triggerHaptic('light')}
                className="w-full text-center text-xs font-bold text-[#006c44] bg-emerald-50 hover:bg-emerald-100 py-2.5 rounded-xl transition-colors"
              >
                Initiate Secure Password Reset
              </button>
            </div>
          </div>
        </div>

        {/* Data Protection & Encryption */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center space-x-2">
            <GlobeLock className="w-5 h-5 text-slate-700" />
            <h3 className="font-extrabold font-outfit text-slate-800">Data Protection & Privacy</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Lock className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-xs font-bold text-slate-800 block">In Transit</span>
                <span className="text-[10px] text-slate-500">TLS 1.3 Encryption</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Database className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-xs font-bold text-slate-800 block">At Rest</span>
                <span className="text-[10px] text-slate-500">AES-256 Encryption</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Data Privacy Impact Assessment (DPIA)</span>
                  <span className="text-[11px] text-slate-500">Completed Q3 2026. Available upon request.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Data Retention Rules</span>
                  <span className="text-[11px] text-slate-500">Clinical records retained for 7 years post-discharge.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Third-Party Processor Register & Transfers</span>
                  <span className="text-[11px] text-slate-500">Cross-border transfer assessments validated for AWS (EU-West).</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure & Audit */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center space-x-2">
            <Server className="w-5 h-5 text-slate-700" />
            <h3 className="font-extrabold font-outfit text-slate-800">Infrastructure & Monitoring</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-start space-x-2.5">
                <EyeOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm text-slate-800 block">Environment Separation</span>
                  <span className="text-[11px] text-slate-500">Strict dev/test/prod isolation. No production data in lower environments.</span>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm text-slate-800 block">Vulnerability & Incident Response</span>
                  <span className="text-[11px] text-slate-500">Quarterly pentesting. 1-hour P1 incident response SLA.</span>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="pt-1">
              <span className="font-bold text-sm text-slate-800 block mb-2 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-slate-500" />
                <span>Recent Audit Logs</span>
              </span>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 font-mono text-[9px] text-slate-600 space-y-1 h-24 overflow-y-auto">
                <div className="flex space-x-2"><span className="text-slate-400">10:42:12</span><span className="text-emerald-600">[AUTH]</span><span>Successful login: {user.email} (IP: 192.168.1.1)</span></div>
                <div className="flex space-x-2"><span className="text-slate-400">10:41:05</span><span className="text-blue-600">[DATA]</span><span>Encrypted backup verified in EU-West-2</span></div>
                <div className="flex space-x-2"><span className="text-slate-400">09:15:00</span><span className="text-amber-600">[SYS]</span><span>Automated security scan completed. 0 critical vulnerabilities.</span></div>
                <div className="flex space-x-2"><span className="text-slate-400">08:00:22</span><span className="text-purple-600">[MFA]</span><span>Token validated for User ID: {user.id.substring(0,6)}...</span></div>
                <div className="flex space-x-2"><span className="text-slate-400">07:59:10</span><span className="text-emerald-600">[AUTH]</span><span>Session timeout triggered for inactive user</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
