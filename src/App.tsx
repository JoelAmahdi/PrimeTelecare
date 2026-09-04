import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { ScreenId, UserRole, User } from './types';
import { currentUserPatient, currentUserDoctor } from './data/mockData';

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
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AccountDetailsScreen } from './components/screens/AccountDetailsScreen';
import { WireframeScreen } from './components/screens/WireframeScreen';
import { LogoutModal } from './components/screens/LogoutModal';
import { BottomNav } from './components/common/BottomNav';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('welcome');
  const [role, setRole] = useState<UserRole>('patient');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-anya');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNetworkIssue, setIsNetworkIssue] = useState<boolean>(false);

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

  const navigateTo = (nextScreen: ScreenId) => {
    setCurrentScreen(nextScreen);
  };

  const activeUser: User = role === 'doctor' ? currentUserDoctor : currentUserPatient;

  const handleLoginSuccess = (newRole: UserRole) => {
    setRole(newRole);
    if (hasAcceptedTerms) {
      if (newRole === 'doctor') {
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
    if (role === 'doctor') {
      navigateTo('doctor-home');
    } else {
      navigateTo('patient-home');
    }
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
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
    'book-consultation': 'Consultation Booking',
    'payment': 'Payment Gateway',
    'active-chat': 'Active Consultation Chat',
    'video-call': 'Video Consultation',
    'upload-media': 'Upload Medical Records',
    'new-prescription': 'New Prescription',
    'prescription-detail': 'Prescription Detail',
    'health-records': 'Health Records & EHR',
    'doctor-profile': 'Doctor Profile',
    'settings': 'Account Settings',
    'account-details': 'Account Details',
    'withdrawal': 'Withdrawal & Payouts',
  };

  const isAuthScreen = ['welcome', 'terms', 'login', 'signup'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#f6fafd] font-nunito selection:bg-emerald-200 selection:text-emerald-900 relative">
      {/* Full Screen Application Container */}
      <div className="w-full min-h-screen relative">
        {/* Wireframe Skeleton View when Browser is Offline */}
        {isNetworkIssue ? (
          <WireframeScreen
            targetScreenName={screenDisplayNames[currentScreen]}
            onRetry={handleRetryConnection}
            onNavigate={navigateTo}
            isSimulatedNetworkIssue={isNetworkIssue}
          />
        ) : (
          /* Render Active Screen Directly */
          <div className="w-full min-h-screen">
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
              />
            )}

            {currentScreen === 'doctor-home' && (
              <DoctorHomeDashboard
                user={activeUser}
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'book-consultation' && (
              <BookConsultationScreen
                selectedDoctorId={selectedDoctorId}
                onNavigate={navigateTo}
                onSelectDoctor={setSelectedDoctorId}
                role={role}
              />
            )}

            {currentScreen === 'payment' && (
              <PaymentScreen
                user={activeUser}
                onNavigate={navigateTo}
              />
            )}

            {currentScreen === 'active-chat' && (
              <ActiveChatScreen
                onNavigate={navigateTo}
                role={role}
              />
            )}

            {currentScreen === 'video-call' && (
              <VideoCallScreen
                onNavigate={navigateTo}
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
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen
                user={activeUser}
                onNavigate={navigateTo}
                onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
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
          </div>
        )}

        {/* Persistent Bottom Navigation Bar - Stays mounted across all page transitions */}
        {!isAuthScreen && !isNetworkIssue && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            role={role}
          />
        )}

        {/* Global Modals */}
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirmLogout={handleLogoutConfirm}
        />
      </div>
    </div>
  );
}
