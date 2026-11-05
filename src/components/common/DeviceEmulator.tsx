import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Tablet,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  Layers,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Wifi,
  WifiOff,
  Sparkles,
  Info,
  Check,
  Compass,
} from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export interface DeviceProfile {
  id: string;
  name: string;
  category: 'phone' | 'tablet';
  width: number;
  height: number;
  borderRadius: number;
  hasDynamicIsland?: boolean;
  hasPunchHole?: boolean;
  bezelWidth: number;
  label: string;
}

export const DEVICES: DeviceProfile[] = [
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    category: 'phone',
    width: 393,
    height: 852,
    borderRadius: 54,
    hasDynamicIsland: true,
    bezelWidth: 12,
    label: 'Apple iPhone 16 Pro (393 × 852)',
  },
  {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    category: 'phone',
    width: 412,
    height: 915,
    borderRadius: 44,
    hasPunchHole: true,
    bezelWidth: 12,
    label: 'Google Pixel 8 (412 × 915)',
  },
  {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    category: 'phone',
    width: 360,
    height: 780,
    borderRadius: 40,
    hasPunchHole: true,
    bezelWidth: 11,
    label: 'Galaxy S24 (360 × 780)',
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    width: 768,
    height: 1024,
    borderRadius: 32,
    bezelWidth: 16,
    label: 'iPad Mini (768 × 1024)',
  },
];

export const ALL_APP_SCREENS: { id: ScreenId; title: string; category: 'auth' | 'patient' | 'doctor' | 'admin' | 'clinical' }[] = [
  { id: 'welcome', title: '1. Welcome & Onboarding', category: 'auth' },
  { id: 'login', title: '2. Log In & Biometrics', category: 'auth' },
  { id: 'signup', title: '3. Create Account', category: 'auth' },
  { id: 'terms', title: '4. Terms of Care & Agreement', category: 'auth' },
  { id: 'patient-home', title: '5. Patient Home Dashboard', category: 'patient' },
  { id: 'book-consultation', title: '6. Book Consultation & Triage', category: 'patient' },
  { id: 'doctor-discovery', title: '7. All Doctors Discovery Roster', category: 'patient' },
  { id: 'doctor-profile', title: '8. Doctor Verified Profile', category: 'patient' },
  { id: 'payment', title: '9. Payment Gateway & Invoicing', category: 'patient' },
  { id: 'active-chat', title: '10. Active Chat Consultation', category: 'clinical' },
  { id: 'video-call', title: '11. HD Video & Audio Consultation', category: 'clinical' },
  { id: 'health-records', title: '12. Health Records & Medical Wallet', category: 'patient' },
  { id: 'new-prescription', title: '13. Issue E-Prescription (Doctor)', category: 'doctor' },
  { id: 'prescription-detail', title: '14. Prescription Detail & Seal', category: 'clinical' },
  { id: 'doctor-home', title: '15. Doctor Clinical Dashboard', category: 'doctor' },
  { id: 'admin-dashboard', title: '16. Administrator Command Center', category: 'admin' },
  { id: 'family-account', title: '17. Family Dependents Account', category: 'patient' },
  { id: 'settings', title: '18. Account & Biometric Settings', category: 'patient' },
  { id: 'security-center', title: '19. Trust & Security Center', category: 'patient' },
  { id: 'account-details', title: '20. Account Profile Details', category: 'patient' },
  { id: 'withdrawal', title: '21. Earnings & Withdrawal (Doctor)', category: 'doctor' },
  { id: 'post-consultation-journey', title: '22. Post-Consultation Recovery', category: 'patient' },
  { id: 'service-router', title: '23. Service Router & Triage', category: 'patient' },
  { id: 'upload-media', title: '24. Upload Clinical Media', category: 'patient' },
];

interface DeviceEmulatorProps {
  children: React.ReactNode;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  isEmulatorActive: boolean;
  onToggleEmulator: () => void;
  isOfflineMode?: boolean;
}

export const DeviceEmulator: React.FC<DeviceEmulatorProps> = ({
  children,
  currentScreen,
  onNavigate,
  role,
  onRoleChange,
  isEmulatorActive,
  onToggleEmulator,
  isOfflineMode = false,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceProfile>(DEVICES[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState<number>(1);
  const [isScreenMenuOpen, setIsScreenMenuOpen] = useState(false);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  // Clock in status bar
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      } catch {
        setCurrentTime('9:41');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute active dimensions
  const activeWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
  const activeHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

  // Auto-fit scale on viewport change if enabled
  useEffect(() => {
    if (!isEmulatorActive) return;
    const calculateAutoFit = () => {
      const availableHeight = window.innerHeight - 140; // Subtract top control bar
      const availableWidth = window.innerWidth - 60;
      const targetHeight = activeHeight + selectedDevice.bezelWidth * 2;
      const targetWidth = activeWidth + selectedDevice.bezelWidth * 2;

      const scaleY = availableHeight / targetHeight;
      const scaleX = availableWidth / targetWidth;
      const fit = Math.min(1, Math.min(scaleX, scaleY) * 0.96);
      if (fit < 0.95) {
        setScale(Number(fit.toFixed(2)));
      } else {
        setScale(1);
      }
    };

    calculateAutoFit();
    window.addEventListener('resize', calculateAutoFit);
    return () => window.removeEventListener('resize', calculateAutoFit);
  }, [selectedDevice, isLandscape, isEmulatorActive, activeHeight, activeWidth]);

  // If emulator mode is inactive, return standard responsive layout with quick-toggle floating button
  if (!isEmulatorActive) {
    return (
      <div className="min-h-screen relative">
        {children}

        {/* Floating Switch-to-Emulator Button (only on desktop/tablets where an emulator frame is useful) */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onToggleEmulator();
          }}
          className="fixed bottom-6 right-6 z-50 hidden sm:flex items-center space-x-2 bg-[#022434] hover:bg-[#1c3a4a] text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-400/40 transition-all transform active:scale-95 group cursor-pointer"
          title="Open Device Emulator Preview"
        >
          <Smartphone className="w-4 h-4 text-[#77daa4] group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold font-outfit tracking-wide">
            Preview in Emulator
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-nunito">
      {/* ========================================================================= */}
      {/* 1. TOP EMULATOR WORKSPACE CONTROL BAR                                     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl text-xs gap-2 flex-wrap">
        {/* Left: Brand & Device Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#006c44] flex items-center justify-center text-white shadow-xs">
              <Smartphone className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold font-outfit text-white block text-[13px] leading-tight">
                Device Emulator
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block">
                {activeWidth} × {activeHeight} pt • {Math.round(scale * 100)}% zoom
              </span>
            </div>
          </div>

          {/* Device Model Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsDeviceMenuOpen(!isDeviceMenuOpen);
                setIsScreenMenuOpen(false);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-outfit font-semibold transition-colors cursor-pointer"
            >
              <span>{selectedDevice.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDeviceMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Choose Emulated Hardware
                </div>
                {DEVICES.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedDevice(dev);
                      setIsDeviceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-outfit text-xs transition-colors cursor-pointer ${
                      selectedDevice.id === dev.id
                        ? 'bg-[#006c44] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="block">{dev.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {dev.width} × {dev.height} px
                      </span>
                    </div>
                    {selectedDevice.id === dev.id && <Check className="w-4 h-4 text-emerald-300 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Screen Jump Menu & Quick Role Switcher */}
        <div className="flex items-center space-x-2">
          {/* Screen Jump Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsScreenMenuOpen(!isScreenMenuOpen);
                setIsDeviceMenuOpen(false);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-outfit font-bold transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {ALL_APP_SCREENS.find((s) => s.id === currentScreen)?.title || currentScreen}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isScreenMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 text-[10px] font-bold font-outfit uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>Jump Directly to Screen (24)</span>
                  <span className="text-slate-500 font-mono">Live Nav</span>
                </div>

                <div className="py-1 space-y-0.5">
                  {ALL_APP_SCREENS.map((screen) => {
                    const isCurrent = currentScreen === screen.id;
                    return (
                      <button
                        key={screen.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          onNavigate(screen.id);
                          setIsScreenMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-outfit transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#006c44] text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{screen.title}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Role Pill Switcher */}
          <div className="hidden md:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                triggerHaptic('selection');
                onRoleChange('patient');
                if (currentScreen === 'doctor-home' || currentScreen === 'admin-dashboard') {
                  onNavigate('patient-home');
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-outfit font-bold transition-all cursor-pointer ${
                role === 'patient'
                  ? 'bg-[#006c44] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onRoleChange('doctor');
                if (currentScreen === 'patient-home' || currentScreen === 'admin-dashboard') {
                  onNavigate('doctor-home');
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-outfit font-bold transition-all cursor-pointer ${
                role === 'doctor'
                  ? 'bg-[#006c44] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onRoleChange('admin');
                if (currentScreen === 'patient-home' || currentScreen === 'doctor-home') {
                  onNavigate('admin-dashboard');
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-outfit font-bold transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-[#006c44] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Right Controls: Rotate, Zoom, and Exit to Responsive */}
        <div className="flex items-center space-x-2">
          {/* Rotate Orientation Button */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setIsLandscape(!isLandscape);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title={`Rotate Device to ${isLandscape ? 'Portrait' : 'Landscape'}`}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Zoom In/Out Controls */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(1))))}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="px-2 py-1 text-[11px] font-mono font-bold text-slate-300 hover:text-white cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => setScale((s) => Math.min(1.2, Number((s + 0.1).toFixed(1))))}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Full-Screen / Exit Emulator */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onToggleEmulator();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-outfit font-bold transition-all cursor-pointer"
            title="Switch back to Responsive Full-Screen"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Exit Emulator</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. EMULATOR STAGE / CANVAS                                                */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] bg-slate-950">
        <div
          className="relative transition-transform duration-300 ease-out origin-center shrink-0"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {/* Realistic Hardware Chassis Outer Shell */}
          <div
            className="relative bg-[#1c2229] border-4 border-[#2b3542] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden"
            style={{
              width: activeWidth + selectedDevice.bezelWidth * 2,
              height: activeHeight + selectedDevice.bezelWidth * 2,
              borderRadius: selectedDevice.borderRadius + 8,
              padding: selectedDevice.bezelWidth,
            }}
          >
            {/* Outer Specular Edge Highlights */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit] border border-white/10"
              style={{
                borderRadius: selectedDevice.borderRadius + 8,
              }}
            />

            {/* Left Hardware Buttons (Volume Up/Down) on iPhone chassis */}
            {!isLandscape && selectedDevice.id.includes('iphone') && (
              <>
                <div className="absolute -left-[7px] top-28 w-[3px] h-12 bg-slate-600 rounded-l-xs shadow-xs" />
                <div className="absolute -left-[7px] top-44 w-[3px] h-12 bg-slate-600 rounded-l-xs shadow-xs" />
                <div className="absolute -right-[7px] top-36 w-[3px] h-16 bg-slate-600 rounded-r-xs shadow-xs" />
              </>
            )}

            {/* Inner Device Screen Viewport Container */}
            <div
              className="relative w-full h-full bg-[#f6fafd] overflow-hidden flex flex-col text-[#171c1f] select-text shadow-inner"
              style={{
                borderRadius: selectedDevice.borderRadius,
              }}
            >
              {/* Dynamic Island / Top Camera Bezel (Non-obtrusive overlay) */}
              {selectedDevice.hasDynamicIsland && !isLandscape && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center">
                  <div className="w-28 h-7 bg-black rounded-full shadow-md flex items-center justify-between px-3">
                    {/* Camera Lens */}
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-blue-900/60" />
                    </div>
                    {/* Face / Ambient Sensor & Active Indicator */}
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Punch Hole Camera (Android Phones) */}
              {selectedDevice.hasPunchHole && !isLandscape && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-900 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  </div>
                </div>
              )}

              {/* Active Scrollable App Screen Viewport */}
              <div
                id="emulator-viewport"
                className="w-full h-full overflow-y-auto overflow-x-hidden emulator-scroll relative"
                style={{
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {children}
              </div>

              {/* Bottom iOS / Android Home Indicator Swipe Bar */}
              {!isLandscape && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 pointer-events-none pb-1">
                  <div className="w-32 h-1 bg-slate-800/40 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. EMULATOR FOOTER STATUS TIP                                             */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Interactive Mobile Emulator Active</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            Hardware touch bounds & scroll containment enforced
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span>Active Role: <strong className="text-white uppercase">{role}</strong></span>
        </div>
      </footer>
    </div>
  );
};
