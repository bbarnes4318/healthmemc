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
import AISeniorCare from '@/pages/AISeniorCare';
import AIAssistedLiving from '@/pages/AIAssistedLiving';
import AIVeterinary from '@/pages/AIVeterinary';
import ProviderDashboard from '@/pages/ProviderDashboard';
import ClinicianDashboard from '@/pages/ClinicianDashboard';
import ClinicianView from '@/pages/ClinicianView';
import HealthLocator from '@/pages/HealthLocator';

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

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ai-doctor" element={<AIDoctor />} />
          <Route path="/ai-nurse" element={<AINurse />} />
          <Route path="/specialists" element={<Specialists />} />
          <Route path="/dental-care" element={<AIDentalCare />} />
          <Route path="/physical-therapy" element={<AIPhysicalTherapy />} />
          <Route path="/senior-care" element={<AISeniorCare />} />
          <Route path="/assisted-living" element={<AIAssistedLiving />} />
          <Route path="/pet-care" element={<AIVeterinary />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/clinician-dashboard" element={<ClinicianDashboard />} />
          <Route path="/health-locator" element={<HealthLocator />} />
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