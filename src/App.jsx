import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App pages
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import AIDoctor from '@/pages/AIDoctor';
import AINurse from '@/pages/AINurse';
import Specialists from '@/pages/Specialists';
import Pharmacy from '@/pages/Pharmacy';
import MedicalRecords from '@/pages/MedicalRecords';
import Wellness from '@/pages/Wellness';
import HealthDashboard from '@/pages/HealthDashboard';
import Emergency from '@/pages/Emergency';
import Profile from '@/pages/Profile';
import AIDentalCare from '@/pages/AIDentalCare';
import AIPhysicalTherapy from '@/pages/AIPhysicalTherapy';
import AIEyeDoctor from '@/pages/AIEyeDoctor';
import AIEarNoseDoctor from '@/pages/AIEarNoseDoctor';
import EarCare from '@/pages/EarCare';
import AIDermatology from '@/pages/AIDermatology';
import AISeniorCare from '@/pages/AISeniorCare';
import AIAssistedLiving from '@/pages/AIAssistedLiving';
import AIVeterinary from '@/pages/AIVeterinary';
import AIProSportsMedicine from '@/pages/AIProSportsMedicine';
import ProviderDashboard from '@/pages/ProviderDashboard';
import ClinicianDashboard from '@/pages/ClinicianDashboard';
import ClinicianView from '@/pages/ClinicianView';
import HealthLocator from '@/pages/HealthLocator';
import Settings from '@/pages/Settings';
import CaregiverDashboard from '@/pages/CaregiverDashboard';
import ThankYou from '@/pages/ThankYou';
import AppointmentHistory from '@/pages/AppointmentHistory';
import AIEmergencyRoom from '@/pages/AIEmergencyRoom';
import DoctorRecordsPortal from '@/pages/DoctorRecordsPortal';
import DoctorDirectory from '@/pages/DoctorDirectory';
import WellnessTrends from '@/pages/WellnessTrends';
import SpecialistFeedback from '@/pages/SpecialistFeedback';
import AboutUs from '@/pages/AboutUs';
import HomeDoctorVisit from '@/pages/HomeDoctorVisit';
import ImmunizationHistory from '@/pages/ImmunizationHistory';
import SurgicalRecovery from '@/pages/SurgicalRecovery';
import IntakeFormTemplates from '@/pages/IntakeFormTemplates';
import FamilyManagementPage from '@/pages/FamilyManagementPage';
import MedicalForum from '@/pages/MedicalForum';
import AIFitnessCenter from '@/pages/AIFitnessCenter';
import FamilyFitnessChallenge from '@/pages/FamilyFitnessChallenge';
import AIWellnessSpa from '@/pages/AIWellnessSpa';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/clinician-view" element={<ClinicianView />} />
      <Route path="/thank-you" element={<ThankYou />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ai-doctor" element={<AIDoctor />} />
          <Route path="/ai-nurse" element={<AINurse />} />
          <Route path="/specialists" element={<Specialists />} />
          <Route path="/dental-care" element={<AIDentalCare />} />
          <Route path="/physical-therapy" element={<AIPhysicalTherapy />} />
          <Route path="/eye-doctor" element={<AIEyeDoctor />} />
          <Route path="/ear-nose-doctor" element={<AIEarNoseDoctor />} />
          <Route path="/ear-care" element={<EarCare />} />
          <Route path="/dermatology" element={<AIDermatology />} />
          <Route path="/senior-care" element={<AISeniorCare />} />
          <Route path="/assisted-living" element={<AIAssistedLiving />} />
          <Route path="/pet-care" element={<AIVeterinary />} />
          <Route path="/sports-medicine" element={<AIProSportsMedicine />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/clinician-dashboard" element={<ClinicianDashboard />} />
          <Route path="/health-locator" element={<HealthLocator />} />
          <Route path="/caregiver-dashboard" element={<CaregiverDashboard />} />
          <Route path="/appointment-history" element={<AppointmentHistory />} />
          <Route path="/emergency-room" element={<AIEmergencyRoom />} />
          <Route path="/doctor-records" element={<DoctorRecordsPortal />} />
          <Route path="/doctor-directory" element={<DoctorDirectory />} />
          <Route path="/wellness-trends" element={<WellnessTrends />} />
          <Route path="/specialist-feedback" element={<SpecialistFeedback />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/home-doctor-visit" element={<HomeDoctorVisit />} />
          <Route path="/immunization" element={<ImmunizationHistory />} />
          <Route path="/surgical-recovery" element={<SurgicalRecovery />} />
          <Route path="/intake-forms" element={<IntakeFormTemplates />} />
          <Route path="/family-management" element={<FamilyManagementPage />} />
          <Route path="/medical-forum" element={<MedicalForum />} />
          <Route path="/fitness-center" element={<AIFitnessCenter />} />
          <Route path="/family-fitness" element={<FamilyFitnessChallenge />} />
          <Route path="/wellness-spa" element={<AIWellnessSpa />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/records" element={<MedicalRecords />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/dashboard" element={<HealthDashboard />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App