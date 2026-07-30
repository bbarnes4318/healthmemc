import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, LogOut, Activity, Phone,
  Bell, BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/layout/GlobalSearch";
import ProfileSwitcher from "@/components/layout/ProfileSwitcher";
import RefillAlertBanner from "@/components/pharmacy/RefillAlertBanner";
import EmergencyCallBar from "@/components/layout/EmergencyCallBar";
import VoiceCommandMode from "@/components/layout/VoiceCommandMode";
import SidebarNavigation from "@/components/layout/SidebarNavigation";
import VoiceSelectorButton from "@/components/voice/VoiceSelectorButton";
import { useRecordNotifications } from "@/hooks/useRecordNotifications";



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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight">Health Me Medical Center</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Health Intelligence</p>
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNavigation location={location} />
        </div>
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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
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
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[300px] bg-white shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-display font-bold text-sm truncate">Health Me Medical</h1>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="px-3 pt-3 shrink-0">
              <ProfileSwitcher />
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNavigation location={location} onNavigate={() => setMobileOpen(false)} />
              <Link
                to="/emergency"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 mx-3 mb-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <Phone className="w-[18px] h-[18px]" />
                Emergency
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden">
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
          <div className="lg:sticky lg:top-0 z-20 bg-white border-b border-border px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-xl">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-2">
              <VoiceSelectorButton />
              <ProfileSwitcher />
            </div>
          </div>
          <EmergencyCallBar />
          <div className="px-4 pt-3">
            <RefillAlertBanner compact />
          </div>
          <Outlet />
        </div>
      </main>
      <VoiceCommandMode />
    </div>
  );
}