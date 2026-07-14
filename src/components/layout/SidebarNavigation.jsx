import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Stethoscope, HeartPulse, Users, Pill, FileText,
  Sparkles, Shield, User, Activity, Phone,
  Smile, Dumbbell, Heart, LifeBuoy, PawPrint, BellRing,
  ClipboardCheck, Ear, Eye, Scan, KeyRound, MapPin,
  Settings as SettingsIcon, Users as UsersIcon, History, Siren,
  Share2, TrendingUp, Contact, Star, Info, Syringe,
  Activity as ActivityIcon, ClipboardList, MessagesSquare, Trophy,
  Flower2, Video, Globe, CalendarDays, FileBadge, Boxes, Tent,
  Baby, Watch, ChevronDown, Calendar,
} from "lucide-react";

const navGroups = [
  {
    title: "AI Consultations",
    items: [
      { path: "/ai-doctor", label: "AI Doctor", icon: Stethoscope },
      { path: "/virtual-consultations", label: "Virtual Visits", icon: Video },
      { path: "/personal-physician", label: "Personal Physician", icon: Stethoscope },
      { path: "/ai-nurse", label: "AI Nurse", icon: HeartPulse },
      { path: "/specialists", label: "Specialists", icon: Users },
      { path: "/emergency-room", label: "AI ER", icon: Siren },
    ],
  },
  {
    title: "Specialty Care",
    items: [
      { path: "/dental-care", label: "Dental Care", icon: Smile },
      { path: "/physical-therapy", label: "Physical Therapy", icon: Dumbbell },
      { path: "/eye-doctor", label: "Eye Doctor", icon: Eye },
      { path: "/3d-eye-exam", label: "3D Eye Exam", icon: Boxes },
      { path: "/ear-nose-doctor", label: "Ear & Nose", icon: Ear },
      { path: "/ear-care", label: "Ear Care", icon: Ear },
      { path: "/dermatology", label: "Dermatology", icon: Scan },
    ],
  },
  {
    title: "Family & Care",
    items: [
      { path: "/newborn-care", label: "Newborn Care", icon: Baby },
      { path: "/senior-care", label: "Senior Care", icon: Heart },
      { path: "/assisted-living", label: "Assisted Living", icon: LifeBuoy },
      { path: "/family-management", label: "Family", icon: UsersIcon },
      { path: "/caregiver-dashboard", label: "Caregiver", icon: UsersIcon },
      { path: "/pet-care", label: "Pet Care", icon: PawPrint },
    ],
  },
  {
    title: "Wellness & Fitness",
    items: [
      { path: "/wellness", label: "Wellness", icon: Sparkles },
      { path: "/wellness-spa", label: "Wellness Spa", icon: Flower2 },
      { path: "/fitness-center", label: "AI Fitness", icon: Dumbbell },
      { path: "/family-fitness", label: "Family Challenge", icon: Trophy },
      { path: "/sports-medicine", label: "Sports Medicine", icon: Dumbbell },
    ],
  },
  {
    title: "Health Tracking",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: Activity },
      { path: "/wellness-trends", label: "Trends", icon: TrendingUp },
      { path: "/master-wellness", label: "Master Wellness", icon: TrendingUp },
      { path: "/health-trends-explorer", label: "Trends Explorer", icon: Activity },
      { path: "/vital-thresholds", label: "Vital Alerts", icon: BellRing },
      { path: "/wearable-sync", label: "Wearable Sync", icon: Watch },
    ],
  },
  {
    title: "Records & Pharmacy",
    items: [
      { path: "/pharmacy", label: "Pharmacy", icon: Pill },
      { path: "/records", label: "Records", icon: FileText },
      { path: "/immunization", label: "Immunization", icon: Syringe },
      { path: "/surgical-recovery", label: "Surgical Recovery", icon: ActivityIcon },
      { path: "/appointment-history", label: "Visit History", icon: History },
      { path: "/appointment-dashboard", label: "Appointments", icon: CalendarDays },
    ],
  },
  {
    title: "Insurance & Privacy",
    items: [
      { path: "/insurance-tracker", label: "Insurance", icon: Shield },
      { path: "/privacy-dashboard", label: "Privacy", icon: Shield },
    ],
  },
  {
    title: "Provider Tools",
    items: [
      { path: "/provider-dashboard", label: "Provider", icon: ClipboardCheck },
      { path: "/clinician-dashboard", label: "Clinician Access", icon: KeyRound },
      { path: "/doctor-records", label: "Doctor Records", icon: Share2 },
      { path: "/doctor-directory", label: "Doctor Directory", icon: Contact },
      { path: "/medical-forum", label: "Pro Forum", icon: MessagesSquare },
      { path: "/specialist-feedback", label: "Specialist Feedback", icon: Star },
      { path: "/primary-doctor-report", label: "Doctor Report", icon: FileBadge },
    ],
  },
  {
    title: "Resources",
    items: [
      { path: "/home-doctor-visit", label: "Home Visit", icon: Home },
      { path: "/intake-forms", label: "Intake Forms", icon: ClipboardList },
      { path: "/health-locator", label: "Find Care", icon: MapPin },
      { path: "/language-directory", label: "Languages", icon: Globe },
      { path: "/wilderness-guide", label: "Wilderness Guide", icon: Tent },
    ],
  },
  {
    title: "Account",
    items: [
      { path: "/settings", label: "Settings", icon: SettingsIcon },
      { path: "/profile", label: "Profile", icon: User },
      { path: "/about", label: "About Us", icon: Info },
    ],
  },
];

export default function SidebarNavigation({ location, onNavigate }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  // Auto-expand the group containing the active route
  useEffect(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some((item) => item.path === location.pathname)
    );
    if (activeGroup) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup.title]: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (title) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <nav className="p-3 space-y-1">
      {/* Home link - always visible */}
      <Link
        to="/"
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          location.pathname === "/"
            ? "bg-sky-50 text-sky-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Home className={`w-[18px] h-[18px] ${location.pathname === "/" ? "text-sky-600" : ""}`} />
        Home
      </Link>

      {navGroups.map((group) => {
        const isExpanded = expandedGroups[group.title];
        const hasActive = group.items.some((item) => item.path === location.pathname);

        return (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                hasActive ? "text-sky-700" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {group.title}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pb-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onNavigate}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-sky-50 text-sky-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <item.icon className={`w-[16px] h-[16px] ${isActive ? "text-sky-600" : ""}`} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}