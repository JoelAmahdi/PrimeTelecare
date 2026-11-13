import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw, ShieldCheck, ArrowLeft, Eye } from 'lucide-react';
import { ScreenId, UserRole, User, BookingSummary } from './types';
import { currentUserPatient, currentUserDoctor, currentUserAdmin, mockDoctors } from './data/mockData';

// Screens
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { TermsScreen } from './components/screens/TermsScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { CreateAccountScreen } from './components/screens/CreateAccountScreen';
import { PatientHomeDashboard } from './components/screens/PatientHomeDashboard';
import { DoctorHomeDashboard } from './components/screens/DoctorHomeDashboard';
import { BookConsultationScreen } from './components/screens/BookConsultationScreen';
import { PaymentScreen } from './components/screens/PaymentScreen';
import { ActiveChatScreen } from './components/screens/ActiveChatScreen';
import { VideoCallScreen } from './components/screens/VideoCallScreen';
import { UploadMediaScreen } from './components/screens/UploadMediaScreen';
import { NewPrescriptionScreen } from './components/screens/NewPrescriptionScreen';
import { PrescriptionDetailScreen } from './components/screens/PrescriptionDetailScreen';
import { HealthRecordsScreen } from './components/screens/HealthRecordsScreen';
import { DoctorProfileScreen } from './components/screens/DoctorProfileScreen';
import { DoctorDiscoveryScreen } from './components/screens/DoctorDiscoveryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AccountDetailsScreen } from './components/screens/AccountDetailsScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { SecurityCenterScreen } from './components/screens/SecurityCenterScreen';
import { ServiceRoutingScreen } from './components/screens/ServiceRoutingScreen';
import { PostConsultationJourneyScreen } from './components/screens/PostConsultationJourneyScreen';
import { FamilyAccountScreen } from './components/screens/FamilyAccountScreen';
import { WireframeScreen } from './components/screens/WireframeScreen';
import { ToastManager } from './components/common/ToastManager';
import { LogoutModal } from './components/screens/LogoutModal';
import { BottomNav } from './components/common/BottomNav';
import { RecoveryPushNotificationBanner } from './components/common/RecoveryPushNotificationBanner';
import { RecoveryFollowUpModal } from './components/common/RecoveryFollowUpModal';
import { PostConsultationReminder } from './utils/postConsultationReminders';
import { OfflineStatusBar } from './components/common/OfflineStatusBar';
import { useOfflineStatus } from './utils/useOfflineStatus';
import { DesktopNavbar } from './components/common/DesktopNavbar';
import { checkGoogleRedirectResult } from './services/googleAuth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth as firebaseAuth } from './firebase';
import { primeApi } from './services/apiClient';
import { showToast } from './utils/toast';
import { QuickUnlockScreen } from './components/common/QuickUnlockScreen';
import { QuickLoginSetupModal } from './components/common/QuickLoginSetupModal';
import { AccessDeniedScreen } from './components/common/AccessDeniedScreen';
import { triggerHaptic } from './utils/haptics';
import {
  isSessionLocked,
  setSessionLocked,
  recordAppActivity,
  isIdleOver15Minutes,
} from './utils/sessionLock';

// Strict Role-Based Screen Access List
// Each account created strictly and solely accesses the dashboard and features intended for its role
const ROLE_ALLOWED_SCREENS: Record<UserRole, ScreenId[]> = {
  patient: [
    'patient-home',
    'book-consultation',
    'doctor-discovery',
    'doctor-profile',
    'payment',
    'active-chat',
    'video-call',
    'upload-media',
    'health-records',
    'settings',
    'security-center',
    'account-details',
    'family-account',
    'service-router',
    'post-consultation-journey',
  ],
  doctor: [
    'doctor-home',
    'active-chat',
    'video-call',
    'upload-media',
    'new-prescription',
    'prescription-detail',
    'doctor-profile',
    'withdrawal',
    'settings',
    'security-center',
    'account-details',
    'service-router',
    'post-consultation-journey',
  ],
  admin: [
    'admin-dashboard',
    'doctor-discovery',
    'doctor-profile',
    'settings',
    'security-center',
    'account-details',
    'service-router',
  ],
};

const getDefaultDashboardForRole = (r: UserRole): ScreenId => {
  if (r === 'doctor') return 'doctor-home';
  if (r === 'admin') return 'admin-dashboard';
  return 'patient-home';
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    try {
      const savedUser = localStorage.getItem('prime_telecare_user');
      const savedScreen = localStorage.getItem('prime_telecare_screen') as ScreenId;
      if (savedUser) {
        if (savedScreen && !['welcome', 'login', 'signup'].includes(savedScreen)) {
          return savedScreen;
        }
        const savedRole = localStorage.getItem('prime_telecare_role');
        return savedRole === 'doctor'
          ? 'doctor-home'
          : savedRole === 'admin'
          ? 'admin-dashboard'
          : 'patient-home';
      }
      if (savedScreen) return savedScreen;
    } catch {}
    return 'welcome';
  });
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('prime_telecare_role') as UserRole;
      if (saved) return saved;
    } catch {}
    return 'patient';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('prime_telecare_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Session Lock State (requires shorter log in after first login on close or 15m idle)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const hasSavedUser = !!localStorage.getItem('prime_telecare_user');
      if (hasSavedUser) {
        // App was closed or reloaded or left idle -> require quick unlock
        return isSessionLocked() || isIdleOver15Minutes() || true;
      }
    } catch {}
    return false;
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-anya');
  const [currentBookingSummary, setCurrentBookingSummary] = useState<BookingSummary | undefined>(undefined);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showQuickLoginSetup, setShowQuickLoginSetup] = useState<boolean>(false);
  const [isNetworkIssue, setIsNetworkIssue] = useState<boolean>(false);
  const [showWireframeFallback, setShowWireframeFallback] = useState<boolean>(false);
  const [isChatSessionActive, setIsChatSessionActive] = useState<boolean>(false);

  const { isOffline, isSimulatedOffline } = useOfflineStatus();
  const effectiveOffline = isNetworkIssue || isOffline;

  // Screens that have local persistence cached in IndexedDB
  const isOfflineSupportedScreen = [
    'patient-home',
    'doctor-home',
    'admin-dashboard',
    'health-records',
    'prescription-detail',
    'doctor-profile',
    'settings',
    'account-details',
    'security-center',
    'family-account',
    'welcome',
    'terms',
    'login',
    'signup',
  ].includes(currentScreen);

  // 24-Hour Recovery Follow-Up System State
  const [selectedRecoveryReminder, setSelectedRecoveryReminder] = useState<PostConsultationReminder | null>(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    try {
      return localStorage.getItem('prime_telecare_terms_accepted') === 'true';
    } catch {
      return false;
    }
  });

  // Listen for real browser offline/online status
  useEffect(() => {
    const handleOnline = () => setIsNetworkIssue(false);
    const handleOffline = () => setIsNetworkIssue(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setIsNetworkIssue(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Google OAuth redirect result and active Firebase session
  useEffect(() => {
    checkGoogleRedirectResult().then((res) => {
      if (res && res.success && res.user) {
        const pendingRole = (localStorage.getItem('prime_pending_login_role') as UserRole) || 'patient';
        const resolvedRole = (pendingRole === 'doctor' || pendingRole === 'admin') ? pendingRole : (res.user.role || pendingRole);
        const resolvedUser: User = { ...res.user, role: resolvedRole };
        setCurrentUser(resolvedUser);
        setRole(resolvedRole);
        localStorage.setItem('prime_telecare_user', JSON.stringify(resolvedUser));
        localStorage.setItem('prime_telecare_role', resolvedRole);
        const homeScreen: ScreenId = getDefaultDashboardForRole(resolvedRole);
        localStorage.setItem('prime_telecare_screen', homeScreen);
        setCurrentScreen(homeScreen);
        setSessionLocked(false);
        setIsLocked(false);
        recordAppActivity();
        showToast(`Welcome back, ${resolvedUser.name}!`, 'success');
        if (localStorage.getItem('prime_telecare_quick_login_setup') !== 'true') {
          setShowQuickLoginSetup(true);
        }
      }
    });

    // Listen for Firebase Auth state changes (crucial for mobile Safari redirects)
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const storedUser = localStorage.getItem('prime_telecare_user');
        if (!storedUser) {
          try {
            const pendingRole = (localStorage.getItem('prime_pending_login_role') as UserRole) || (localStorage.getItem('prime_telecare_role') as UserRole) || 'patient';
            const apiRes = await primeApi.googleAuth({
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              avatarUrl: fbUser.photoURL || undefined,
              googleUid: fbUser.uid,
              role: pendingRole,
            });
            if (apiRes.user) {
              const resolvedRole = (pendingRole === 'doctor' || pendingRole === 'admin') ? pendingRole : (apiRes.user.role || pendingRole);
              const resolvedUser: User = { ...apiRes.user, role: resolvedRole };
              setCurrentUser(resolvedUser);
              setRole(resolvedRole);
              localStorage.setItem('prime_telecare_user', JSON.stringify(resolvedUser));
              localStorage.setItem('prime_telecare_role', resolvedRole);
              const homeScreen: ScreenId = getDefaultDashboardForRole(resolvedRole);
              localStorage.setItem('prime_telecare_screen', homeScreen);
              setCurrentScreen(homeScreen);
              setSessionLocked(false);
              setIsLocked(false);
              recordAppActivity();
              showToast(`Welcome, ${resolvedUser.name}!`, 'success');
              if (localStorage.getItem('prime_telecare_quick_login_setup') !== 'true') {
                setShowQuickLoginSetup(true);
              }
            }
          } catch (err) {
            console.warn('Auto Google login error on auth state change:', err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 15-Minute Idle Timer & App Close / Session Lock Listeners
  useEffect(() => {
    if (!currentUser) return;

    // Record activity on user interactions
    const handleUserActivity = () => {
      if (!isLocked) {
        recordAppActivity();
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check idle timeout every 15 seconds
    const idleCheckInterval = setInterval(() => {
      if (currentUser && !isLocked && isIdleOver15Minutes()) {
        setSessionLocked(true);
        setIsLocked(true);
      }
    }, 15000);

    // Lock session when app or tab is closed / unloaded
    const handleAppClose = () => {
      if (currentUser) {
        setSessionLocked(true);
      }
    };

    window.addEventListener('pagehide', handleAppClose);
    window.addEventListener('beforeunload', handleAppClose);

    // Check lock when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        if (isSessionLocked() || isIdleOver15Minutes()) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(idleCheckInterval);
      window.removeEventListener('pagehide', handleAppClose);
      window.removeEventListener('beforeunload', handleAppClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, isLocked]);

  // Authenticated Role of the current user (strictly locked to account details)
  const effectiveRole: UserRole = (currentUser?.role as UserRole) || role;

  const navigateTo = (nextScreen: ScreenId) => {
    // Unauthenticated / Auth screens
    if (['welcome', 'terms', 'login', 'signup'].includes(nextScreen)) {
      if (nextScreen !== 'active-chat') {
        setIsChatSessionActive(false);
      }
      try {
        localStorage.setItem('prime_telecare_screen', nextScreen);
      } catch {}
      setCurrentScreen(nextScreen);
      return;
    }

    let targetScreen = nextScreen;

    // Resolve generic 'patient-home' navigation requests to user's authorized dashboard
    if (targetScreen === 'patient-home') {
      targetScreen = getDefaultDashboardForRole(effectiveRole);
    }

    // Role-Based Access Control (RBAC): Enforce strict single-role dashboard access
    const allowed = ROLE_ALLOWED_SCREENS[effectiveRole] || ROLE_ALLOWED_SCREENS.patient;
    if (!allowed.includes(targetScreen)) {
      const fallbackDashboard = getDefaultDashboardForRole(effectiveRole);
      triggerHaptic('error');
      const requiredRoleName =
        targetScreen === 'doctor-home' || targetScreen === 'new-prescription' || targetScreen === 'withdrawal'
          ? 'Doctor'
          : targetScreen === 'admin-dashboard'
          ? 'Administrator'
          : 'Patient';
      showToast(
        `Access Denied: Your ${effectiveRole} account cannot access the ${requiredRoleName} portal. An account only accesses the dashboard it was created for.`,
        'error'
      );
      setCurrentScreen(fallbackDashboard);
      try {
        localStorage.setItem('prime_telecare_screen', fallbackDashboard);
      } catch {}
      return;
    }

    if (targetScreen !== 'active-chat') {
      setIsChatSessionActive(false);
    }

    try {
      localStorage.setItem('prime_telecare_screen', targetScreen);
    } catch {}

    setCurrentScreen(targetScreen);
  };

  // Active user data: If logged in, strictly use the authenticated user (no mock doctor overwrite)
  const activeUser: User =
    currentUser ||
    (effectiveRole === 'admin'
      ? currentUserAdmin
      : effectiveRole === 'doctor'
      ? currentUserDoctor
      : currentUserPatient);

  // Continuous RBAC Guard: Ensure active screen matches authenticated user's role permissions
  useEffect(() => {
    if (['welcome', 'terms', 'login', 'signup'].includes(currentScreen)) return;
    const allowed = ROLE_ALLOWED_SCREENS[effectiveRole] || ROLE_ALLOWED_SCREENS.patient;
    if (!allowed.includes(currentScreen)) {
      const fallback = getDefaultDashboardForRole(effectiveRole);
      setCurrentScreen(fallback);
      try {
        localStorage.setItem('prime_telecare_screen', fallback);
      } catch {}
    }
  }, [effectiveRole, currentScreen]);

  const handleLoginSuccess = (newRole: UserRole, user?: User) => {
    const finalRole: UserRole = (newRole === 'doctor' || newRole === 'admin') ? newRole : (user?.role || newRole);
    setRole(finalRole);
    const resolvedUser: User = {
      ...(user || (finalRole === 'doctor' ? currentUserDoctor : finalRole === 'admin' ? currentUserAdmin : currentUserPatient)),
      role: finalRole,
    };
    setCurrentUser(resolvedUser);
    try {
      localStorage.setItem('prime_telecare_role', finalRole);
      localStorage.setItem('prime_telecare_user', JSON.stringify(resolvedUser));
      if (finalRole === 'doctor' || finalRole === 'admin') {
        localStorage.setItem('prime_telecare_terms_accepted', 'true');
      }
    } catch {}

    setSessionLocked(false);
    setIsLocked(false);
    recordAppActivity();

    const homeScreen = getDefaultDashboardForRole(finalRole);

    if (finalRole === 'admin' || finalRole === 'doctor' || hasAcceptedTerms) {
      try {
        localStorage.setItem('prime_telecare_screen', homeScreen);
      } catch {}
      setCurrentScreen(homeScreen);
      if (localStorage.getItem('prime_telecare_quick_login_setup') !== 'true') {
        setShowQuickLoginSetup(true);
      }
    } else {
      navigateTo('terms');
    }
  };

  const handleQuickUnlock = () => {
    setSessionLocked(false);
    setIsLocked(false);
    recordAppActivity();
  };

  const handleTermsAccepted = () => {
    setHasAcceptedTerms(true);
    try {
      localStorage.setItem('prime_telecare_terms_accepted', 'true');
    } catch (e) {
      console.error('Failed to save terms acceptance', e);
    }
    const currentRole = (localStorage.getItem('prime_telecare_role') as UserRole) || effectiveRole;
    const targetDashboard = getDefaultDashboardForRole(currentRole);
    try {
      localStorage.setItem('prime_telecare_screen', targetDashboard);
    } catch {}
    setCurrentScreen(targetDashboard);
    if (localStorage.getItem('prime_telecare_quick_login_setup') !== 'true') {
      setShowQuickLoginSetup(true);
    }
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    setCurrentUser(null);
    setSessionLocked(false);
    setIsLocked(false);
    signOut(firebaseAuth).catch(() => {});
    try {
      localStorage.removeItem('prime_telecare_user');
      localStorage.removeItem('prime_telecare_role');
      localStorage.removeItem('prime_telecare_terms_accepted');
      localStorage.removeItem('prime_telecare_app_locked');
      localStorage.removeItem('prime_telecare_screen');
      localStorage.removeItem('prime_telecare_quick_login_setup');
    } catch {}
    navigateTo('welcome');
  };

  const handleRetryConnection = () => {
    if (navigator.onLine) {
      setIsNetworkIssue(false);
    }
  };

  const screenDisplayNames: Record<ScreenId, string> = {
    'welcome': 'Welcome',
    'terms': 'Terms and Conditions',
    'login': 'Login',
    'signup': 'Sign Up',
    'patient-home': 'Patient Dashboard',
    'doctor-home': 'Doctor Dashboard',
    'admin-dashboard': 'Administrator Command Center',
    'book-consultation': 'Consultation Booking',
    'doctor-discovery': 'All Doctors on Platform',
    'payment': 'Payment Gateway',
    'active-chat': 'Active Consultation Chat',
    'video-call': 'Video Consultation',
    'upload-media': 'Upload Medical Records',
    'new-prescription': 'New Prescription',
    'prescription-detail': 'Prescription Detail',
    'health-records': 'Health Records & EHR',
    'doctor-profile': 'Doctor Profile',
    'settings': 'Account Settings',
    'security-center': 'Trust & Security Center',
    'account-details': 'Account Details',
    'withdrawal': 'Withdrawal & Payouts',
    'service-router': 'Service Router',
    'post-consultation-journey': 'Post-Consultation Journey',
    'family-account': 'Family Account',
  };

  const isAuthScreen = ['welcome', 'terms', 'login', 'signup'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#f6fafd] font-nunito selection:bg-emerald-200 selection:text-emerald-900 relative">
      {/* Full Screen Application Container */}
      <div className="w-full min-h-screen relative">
        {/* Offline Status Bar when network is disconnected or offline mode is simulated */}
        {effectiveOffline && (
          <OfflineStatusBar currentScreen={currentScreen} onNavigate={navigateTo} />
        )}

        <ToastManager />
        {/* Fallback to Wireframe only if screen is NOT cached locally or user explicitly opens wireframe */}
        {effectiveOffline && (!isOfflineSupportedScreen || showWireframeFallback) ? (
          <WireframeScreen
            targetScreenName={screenDisplayNames[currentScreen]}
            onRetry={handleRetryConnection}
            onNavigate={navigateTo}
            isSimulatedNetworkIssue={effectiveOffline}
          />
        ) : (
          /* Render Active Screen Directly (Cached or Live) */
          <div className={`w-full min-h-screen ${effectiveOffline ? 'pt-16 sm:pt-14' : ''}`}>
            {!isAuthScreen && (
              <DesktopNavbar
                currentScreen={currentScreen}
                onNavigate={navigateTo}
                role={effectiveRole}
                user={activeUser}
                onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, x: ['welcome', 'login', 'signup'].includes(currentScreen) ? 20 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: ['welcome', 'login', 'signup'].includes(currentScreen) ? -20 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full h-full"
              >
            {currentScreen === 'welcome' && (
              <WelcomeScreen onNavigate={navigateTo} />
            )}

            {currentScreen === 'terms' && (
              <TermsScreen
                onNavigate={navigateTo}
                onAcceptTerms={handleTermsAccepted}
                hasAcceptedTerms={hasAcceptedTerms}
              />
            )}

            {currentScreen === 'login' && (
              <LoginScreen
                onNavigate={navigateTo}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {currentScreen === 'signup' && (
              <CreateAccountScreen
                onNavigate={navigateTo}
                onSignupSuccess={handleLoginSuccess}
              />
            )}

            {currentScreen === 'patient-home' && (
              effectiveRole === 'patient' ? (
                <PatientHomeDashboard
                  user={activeUser}
                  onNavigate={navigateTo}
                  onSelectDoctor={setSelectedDoctorId}
                  onSaveBookingSummary={setCurrentBookingSummary}
                  isOfflineMode={effectiveOffline}
                />
              ) : (
                <AccessDeniedScreen
                  currentRole={effectiveRole}
                  requiredRole="patient"
                  targetScreenName="Patient Care Dashboard"
                  onNavigateHome={() => navigateTo(getDefaultDashboardForRole(effectiveRole))}
                  onLogout={handleLogoutConfirm}
                />
              )
            )}

            {currentScreen === 'doctor-home' && (
              effectiveRole === 'doctor' ? (
                <DoctorHomeDashboard
                  user={activeUser}
                  onNavigate={navigateTo}
                  isOfflineMode={effectiveOffline}
                />
              ) : (
                <AccessDeniedScreen
                  currentRole={effectiveRole}
                  requiredRole="doctor"
                  targetScreenName="Doctor Clinical Dashboard"
                  onNavigateHome={() => navigateTo(getDefaultDashboardForRole(effectiveRole))}
                  onLogout={handleLogoutConfirm}
                />
              )
            )}


            {currentScreen === 'service-router' && (
              <ServiceRoutingScreen
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'post-consultation-journey' && (
              <PostConsultationJourneyScreen
                onNavigate={navigateTo}
                doctorId={currentBookingSummary?.doctorId || selectedDoctorId}
                doctorName={
                  currentBookingSummary?.doctorName ||
                  mockDoctors.find((d) => d.id === (currentBookingSummary?.doctorId || selectedDoctorId))?.name ||
                  'Attending Physician'
                }
                patientName={activeUser.name}
              />
            )}

            {currentScreen === 'family-account' && (
              <FamilyAccountScreen
                user={activeUser}
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'book-consultation' && (
              <BookConsultationScreen
                user={activeUser}
                selectedDoctorId={selectedDoctorId}
                onNavigate={navigateTo}
                onSelectDoctor={setSelectedDoctorId}
                onSaveBookingSummary={setCurrentBookingSummary}
                role={role}
              />
            )}

            {currentScreen === 'payment' && (
              <PaymentScreen
                user={activeUser}
                bookingSummary={currentBookingSummary}
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'active-chat' && (
              <ActiveChatScreen
                onNavigate={navigateTo}
                role={role}
                onSaveBookingSummary={setCurrentBookingSummary}
                onActiveSessionChange={setIsChatSessionActive}
              />
            )}

            {currentScreen === 'video-call' && (
              <VideoCallScreen
                onNavigate={navigateTo}
                user={activeUser}
                doctorName={
                  currentBookingSummary?.doctorName ||
                  mockDoctors.find((d) => d.id === (currentBookingSummary?.doctorId || selectedDoctorId))?.name ||
                  'Attending Physician'
                }
              />
            )}

            {currentScreen === 'upload-media' && (
              <UploadMediaScreen
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'new-prescription' && (
              effectiveRole === 'doctor' ? (
                <NewPrescriptionScreen
                  onNavigate={navigateTo}
                  role={effectiveRole}
                />
              ) : (
                <AccessDeniedScreen
                  currentRole={effectiveRole}
                  requiredRole="doctor"
                  targetScreenName="Clinical Prescription Pad"
                  onNavigateHome={() => navigateTo(getDefaultDashboardForRole(effectiveRole))}
                  onLogout={handleLogoutConfirm}
                />
              )
            )}

            {currentScreen === 'prescription-detail' && (
              <PrescriptionDetailScreen
                onNavigate={navigateTo}
                role={role}
              />
            )}

            {currentScreen === 'health-records' && (
              <HealthRecordsScreen
                user={activeUser}
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'doctor-profile' && (
              <DoctorProfileScreen
                doctorId={selectedDoctorId}
                onNavigate={navigateTo}
                role={role}
                onSaveBookingSummary={setCurrentBookingSummary}
              />
            )}

            {currentScreen === 'doctor-discovery' && (
              <DoctorDiscoveryScreen
                onNavigate={navigateTo}
                onSelectDoctor={setSelectedDoctorId}
                role={role}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen
                user={activeUser}
                onNavigate={navigateTo}
                onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
              />
            )}

            {currentScreen === 'security-center' && (
              <SecurityCenterScreen
                user={activeUser}
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'account-details' && (
              <AccountDetailsScreen
                user={activeUser}
                onNavigate={navigateTo}
                initialTab="details"
              />
            )}

            {currentScreen === 'withdrawal' && (
              effectiveRole === 'doctor' ? (
                <AccountDetailsScreen
                  user={activeUser}
                  onNavigate={navigateTo}
                  initialTab="withdrawal"
                />
              ) : (
                <AccessDeniedScreen
                  currentRole={effectiveRole}
                  requiredRole="doctor"
                  targetScreenName="Clinician Earnings & Payouts"
                  onNavigateHome={() => navigateTo(getDefaultDashboardForRole(effectiveRole))}
                  onLogout={handleLogoutConfirm}
                />
              )
            )}

            {currentScreen === 'admin-dashboard' && (
              effectiveRole === 'admin' ? (
                <AdminDashboardScreen
                  user={activeUser}
                  onNavigate={navigateTo}
                />
              ) : (
                <AccessDeniedScreen
                  currentRole={effectiveRole}
                  requiredRole="admin"
                  targetScreenName="Administrator Command Center"
                  onNavigateHome={() => navigateTo(getDefaultDashboardForRole(effectiveRole))}
                  onLogout={handleLogoutConfirm}
                />
              )
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}



        {/* Persistent Bottom Navigation Bar - Hidden during consultation calls, checkout, media upload, active chat session, doctor profile, and auth screens */}
        {!isAuthScreen &&
          currentScreen !== 'video-call' &&
          currentScreen !== 'payment' &&
          currentScreen !== 'upload-media' &&
          currentScreen !== 'post-consultation-journey' &&
          currentScreen !== 'doctor-profile' &&
          !(currentScreen === 'active-chat' && isChatSessionActive) &&
          (!effectiveOffline || (!showWireframeFallback && isOfflineSupportedScreen)) && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            role={effectiveRole}
          />
        )}

        {/* Global Modals & Push Notifications */}
        <RecoveryPushNotificationBanner
          onOpenRecoveryModal={(reminder) => {
            setSelectedRecoveryReminder(reminder);
            setIsRecoveryModalOpen(true);
          }}
        />

        <RecoveryFollowUpModal
          isOpen={isRecoveryModalOpen}
          onClose={() => setIsRecoveryModalOpen(false)}
          reminder={selectedRecoveryReminder}
          onNavigate={navigateTo}
        />

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirmLogout={handleLogoutConfirm}
        />

        {/* Quick Unlock Screen (PIN / Face ID / Password) when app is locked after 15m idle or app re-opened */}
        {currentUser && isLocked && (
          <QuickUnlockScreen
            user={currentUser}
            onUnlock={handleQuickUnlock}
            onLogout={handleLogoutConfirm}
          />
        )}

        {/* Quick Login PIN & Face ID Setup Modal Prompt After Login */}
        <QuickLoginSetupModal
          isOpen={showQuickLoginSetup && !isLocked && !['welcome', 'login', 'signup'].includes(currentScreen)}
          onClose={() => setShowQuickLoginSetup(false)}
          onComplete={() => setShowQuickLoginSetup(false)}
          userRole={effectiveRole}
          userName={activeUser.name}
        />

      </div>
    </div>
  );
}
