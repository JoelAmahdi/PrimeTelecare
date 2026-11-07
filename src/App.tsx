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
import { showToast } from './utils/toast';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    try {
      const saved = localStorage.getItem('prime_telecare_screen') as ScreenId;
      if (saved) return saved;
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
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-anya');
  const [currentBookingSummary, setCurrentBookingSummary] = useState<BookingSummary | undefined>(undefined);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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

  // Listen for Google OAuth redirect result on mobile browsers
  useEffect(() => {
    checkGoogleRedirectResult().then((res) => {
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        const resolvedRole = res.user.role || 'patient';
        setRole(resolvedRole);
        localStorage.setItem('prime_telecare_user', JSON.stringify(res.user));
        localStorage.setItem('prime_telecare_role', resolvedRole);
        const homeScreen: ScreenId = resolvedRole === 'doctor' ? 'doctor-home' : resolvedRole === 'admin' ? 'admin-dashboard' : 'patient-home';
        localStorage.setItem('prime_telecare_screen', homeScreen);
        setCurrentScreen(homeScreen);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
      }
    });
  }, []);

  const navigateTo = (nextScreen: ScreenId) => {
    let targetScreen = nextScreen;

    // Role-based home resolution:
    // If navigating to the default home screen ('patient-home'), resolve to the current user's role dashboard
    // rather than inadvertently defaulting doctors to the patient dashboard
    if (targetScreen === 'patient-home') {
      if (role === 'doctor') {
        targetScreen = 'doctor-home';
      } else if (role === 'admin') {
        targetScreen = 'admin-dashboard';
      }
    }

    // Role synchronization when navigating explicitly to dedicated clinical or administrative screens:
    if (targetScreen === 'doctor-home' || targetScreen === 'new-prescription') {
      if (role !== 'admin' && role !== 'doctor') {
        setRole('doctor');
      }
    } else if (targetScreen === 'patient-home') {
      if (role !== 'admin' && role !== 'patient') {
        setRole('patient');
      }
    } else if (targetScreen === 'admin-dashboard') {
      if (role !== 'admin') {
        setRole('admin');
      }
    }

    if (targetScreen !== 'active-chat') {
      setIsChatSessionActive(false);
    }

    try {
      localStorage.setItem('prime_telecare_screen', targetScreen);
    } catch {}

    setCurrentScreen(targetScreen);
  };

  const activeUser: User =
    (currentUser && currentUser.role === role ? currentUser : null) ||
    currentUser ||
    (role === 'admin'
      ? currentUserAdmin
      : role === 'doctor' || currentScreen === 'doctor-home' || currentScreen === 'new-prescription'
      ? currentUserDoctor
      : currentUserPatient);

  // Guard against role/screen mismatch for home dashboards
  useEffect(() => {
    if (role === 'doctor' && currentScreen === 'patient-home') {
      setCurrentScreen('doctor-home');
    }
  }, [role, currentScreen]);

  const handleLoginSuccess = (newRole: UserRole, user?: User) => {
    setRole(newRole);
    try {
      localStorage.setItem('prime_telecare_role', newRole);
    } catch {}

    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem('prime_telecare_user', JSON.stringify(user));
      } catch {}
    }

    if (hasAcceptedTerms) {
      if (newRole === 'admin') {
        navigateTo('admin-dashboard');
      } else if (newRole === 'doctor') {
        navigateTo('doctor-home');
      } else {
        navigateTo('patient-home');
      }
    } else {
      navigateTo('terms');
    }
  };

  const handleTermsAccepted = () => {
    setHasAcceptedTerms(true);
    try {
      localStorage.setItem('prime_telecare_terms_accepted', 'true');
    } catch (e) {
      console.error('Failed to save terms acceptance', e);
    }
    if (role === 'admin') {
      navigateTo('admin-dashboard');
    } else if (role === 'doctor') {
      navigateTo('doctor-home');
    } else {
      navigateTo('patient-home');
    }
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem('prime_telecare_user');
      localStorage.removeItem('prime_telecare_role');
      localStorage.removeItem('prime_telecare_terms_accepted');
    } catch {}
    navigateTo('welcome');
  };

  const handleRetryConnection = () => {
    if (navigator.onLine) {
      setIsNetworkIssue(false);
    }
  };

  const handleSetRolePreview = (previewRole: UserRole, targetScreen: ScreenId) => {
    setRole(previewRole);
    navigateTo(targetScreen);
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
                role={role}
                onRoleChange={setRole}
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
              <PatientHomeDashboard
                user={activeUser}
                onNavigate={navigateTo}
                onSelectDoctor={setSelectedDoctorId}
                onSaveBookingSummary={setCurrentBookingSummary}
                isOfflineMode={effectiveOffline}
              />
            )}

            {currentScreen === 'doctor-home' && (
              <DoctorHomeDashboard
                user={activeUser}
                onNavigate={navigateTo}
                isOfflineMode={effectiveOffline}
              />
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
                  mockDoctors.find((d) => d.id === (currentBookingSummary?.doctorId || selectedDoctorId))?.name ||
                  'Dr. Sarah Johnson'
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
                  mockDoctors.find((d) => d.id === (currentBookingSummary?.doctorId || selectedDoctorId))?.name ||
                  'Dr. Sarah Johnson'
                }
              />
            )}

            {currentScreen === 'upload-media' && (
              <UploadMediaScreen
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'new-prescription' && (
              <NewPrescriptionScreen
                onNavigate={navigateTo}
                role={role}
              />
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
              <AccountDetailsScreen
                user={activeUser}
                onNavigate={navigateTo}
                initialTab="withdrawal"
              />
            )}

            {currentScreen === 'admin-dashboard' && (
              <AdminDashboardScreen
                user={activeUser}
                onNavigate={navigateTo}
                onSetRolePreview={handleSetRolePreview}
              />
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
            role={role === 'admin' ? 'admin' : (currentScreen === 'doctor-home' || currentScreen === 'new-prescription' ? 'doctor' : role)}
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

      </div>
    </div>
  );
}
