import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Home, Stethoscope, HeartPulse, Users, Pill, FileText,
  Sparkles, Shield, User, Menu, X, LogOut, Activity, Phone,
  Smile, Dumbbell, Heart, LifeBuoy, PawPrint, Bell, BellRing, ClipboardCheck, Ear, Eye, Scan,
  KeyRound, MapPin, Settings as SettingsIcon, Users as UsersIcon, History, Siren,
  Share2, TrendingUp, Contact, Star, Info, Syringe, Activity as ActivityIcon, ClipboardList, MessagesSquare, Trophy, Flower2,
  Video, Globe, CalendarDays, FileBadge, Boxes, Tent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/layout/GlobalSearch";
import ProfileSwitcher from "@/components/layout/ProfileSwitcher";
import RefillAlertBanner from "@/components/pharmacy/RefillAlertBanner";
import { useRecordNotifications } from "@/hooks/useRecordNotifications";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/ai-doctor", label: "AI Doctor", icon: Stethoscope },
  { path: "/ai-nurse", label: "AI Nurse", icon: HeartPulse },
  { path: "/specialists", label: "Specialists", icon: Users },
  { path: "/dental-care", label: "Dental Care", icon: Smile },
  { path: "/physical-therapy", label: "Physical Therapy", icon: Dumbbell },
  { path: "/senior-care", label: "Senior Care", icon: Heart },
  { path: "/assisted-living", label: "Assisted Living", icon: LifeBuoy },
  { path: "/pet-care", label: "Pet Care", icon: PawPrint },
  { path: "/sports-medicine", label: "Sports Medicine", icon: Dumbbell },
  { path: "/fitness-center", label: "AI Fitness", icon: Dumbbell },
  { path: "/family-fitness", label: "Family Challenge", icon: Trophy },
  { path: "/eye-doctor", label: "Eye Doctor", icon: Eye },
  { path: "/ear-nose-doctor", label: "Ear & Nose", icon: Ear },
  { path: "/ear-care", label: "Ear Care", icon: Ear },
  { path: "/dermatology", label: "Dermatology", icon: Scan },
  { path: "/emergency-room", label: "AI ER", icon: Siren },
  { path: "/pharmacy", label: "Pharmacy", icon: Pill },
  { path: "/records", label: "Records", icon: FileText },
  { path: "/appointment-history", label: "Visit History", icon: History },
  { path: "/appointment-dashboard", label: "Appointments", icon: CalendarDays },
  { path: "/wellness", label: "Wellness", icon: Sparkles },
  { path: "/wellness-spa", label: "Wellness Spa", icon: Flower2 },
  { path: "/wellness-trends", label: "Trends", icon: TrendingUp },
  { path: "/dashboard", label: "Dashboard", icon: Activity },
  { path: "/provider-dashboard", label: "Provider", icon: ClipboardCheck },
  { path: "/clinician-dashboard", label: "Clinician Access", icon: KeyRound },
  { path: "/doctor-records", label: "Doctor Records", icon: Share2 },
  { path: "/doctor-directory", label: "Doctor Directory", icon: Contact },
  { path: "/medical-forum", label: "Pro Forum", icon: MessagesSquare },
  { path: "/specialist-feedback", label: "Specialist Feedback", icon: Star },
  { path: "/immunization", label: "Immunization", icon: Syringe },
  { path: "/surgical-recovery", label: "Surgical Recovery", icon: ActivityIcon },
  { path: "/3d-eye-exam", label: "3D Eye Exam", icon: Boxes },
  { path: "/primary-doctor-report", label: "Doctor Report", icon: FileBadge },
  { path: "/wilderness-guide", label: "Wilderness Guide", icon: Tent },
  { path: "/home-doctor-visit", label: "Home Visit", icon: Home },
  { path: "/intake-forms", label: "Intake Forms", icon: ClipboardList },
  { path: "/family-management", label: "Family", icon: UsersIcon },
  { path: "/caregiver-dashboard", label: "Caregiver", icon: UsersIcon },
  { path: "/health-locator", label: "Find Care", icon: MapPin },
  { path: "/virtual-consultations", label: "Virtual Visits", icon: Video },
  { path: "/language-directory", label: "Languages", icon: Globe },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/about", label: "About Us", icon: Info },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { permission, requestPermission } = useRecordNotifications();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setShowBanner(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    await requestPermission();
    setShowBanner(false);
  };

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border fixed h-full z-30">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight">Health Me Medical Center</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Health Intelligence</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-50 text-sky-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-sky-600" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            to="/emergency"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all mb-1"
          >
            <Phone className="w-[18px] h-[18px]" />
            Emergency
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-border flex items-center justify-between px-4 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm">Health Me Medical</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-display font-bold">Health Me Medical Center</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="px-3 pt-3">
              <ProfileSwitcher />
            </div>
            <nav className="p-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive ? "bg-sky-50 text-sky-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-sky-600" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/emergency"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <Phone className="w-[18px] h-[18px]" />
                Emergency
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {showBanner && (
          <div className="fixed top-14 lg:top-0 left-0 right-0 lg:left-64 z-20 bg-sky-600 text-white px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 shrink-0" />
              <p className="text-xs sm:text-sm truncate">Enable notifications to get alerted when new medical records or lab results are uploaded.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleEnableNotifications}>
                <BellRing className="w-3 h-3 mr-1" /> Enable
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-sky-700" onClick={() => setShowBanner(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
        <div className="pt-14 lg:pt-0">
          <div className="sticky top-14 lg:top-0 z-20 bg-white border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-xl">
              <GlobalSearch />
            </div>
            <ProfileSwitcher />
          </div>
          <div className="px-4 pt-3">
            <RefillAlertBanner compact />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}