import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Globe, ArrowLeft, Search, Languages, Copy, Check, Heart, Pill,
  AlertTriangle, Calendar, Phone, User
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "ru", name: "Russian", flag: "🇷🇺", nativeName: "Русский" },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", flag: "🇹🇭", nativeName: "ไทย" },
  { code: "pl", name: "Polish", flag: "🇵🇱", nativeName: "Polski" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", nativeName: "Nederlands" },
  { code: "el", name: "Greek", flag: "🇬🇷", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", nativeName: "עברית" },
  { code: "fa", name: "Persian", flag: "🇮🇷", nativeName: "فارسی" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", nativeName: "اردو" },
  { code: "bn", name: "Bengali", flag: "🇧🇩", nativeName: "বাংলা" },
  { code: "id", name: "Indonesian", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", nativeName: "Kiswahili" },
];

const medicalPhrases = {
  en: {
    greeting: "Hello, I need to see a doctor",
    pain: "I have pain in my chest",
    allergy: "I am allergic to penicillin",
    medication: "I take medication for blood pressure",
    emergency: "This is an emergency, please help",
    appointment: "I need to schedule an appointment",
    symptoms: "I have been feeling sick for three days",
    pregnant: "I am pregnant",
    history: "I have a history of diabetes",
    consent: "I understand and give my consent",
  },
  es: {
    greeting: "Hola, necesito ver a un médico",
    pain: "Tengo dolor en el pecho",
    allergy: "Soy alérgico a la penicilina",
    medication: "Tomo medicamento para la presión arterial",
    emergency: "Esto es una emergencia, por favor ayúdenme",
    appointment: "Necesito programar una cita",
    symptoms: "Me he sentido enfermo durante tres días",
    pregnant: "Estoy embarazada",
    history: "Tengo antecedentes de diabetes",
    consent: "Entiendo y doy mi consentimiento",
  },
  fr: {
    greeting: "Bonjour, j'ai besoin de voir un médecin",
    pain: "J'ai des douleurs à la poitrine",
    allergy: "Je suis allergique à la pénicilline",
    medication: "Je prends des médicaments pour la tension artérielle",
    emergency: "C'est une urgence, aidez-moi s'il vous plaît",
    appointment: "Je dois prendre rendez-vous",
    symptoms: "Je me sens malade depuis trois jours",
    pregnant: "Je suis enceinte",
    history: "J'ai des antécédents de diabète",
    consent: "Je comprends et je donne mon consentement",
  },
  zh: {
    greeting: "你好，我需要看医生",
    pain: "我胸口痛",
    allergy: "我对青霉素过敏",
    medication: "我服用血压药",
    emergency: "这是紧急情况，请帮助我",
    appointment: "我需要预约",
    symptoms: "我已经病了三天了",
    pregnant: "我怀孕了",
    history: "我有糖尿病史",
    consent: "我理解并给予同意",
  },
  ar: {
    greeting: "مرحباً، أحتاج لرؤية طبيب",
    pain: "لدي ألم في صدري",
    allergy: "أعاني من حساسية البنسلين",
    medication: "أتناول دواء لضغط الدم",
    emergency: "هذه حالة طارئة، أرجو المساعدة",
    appointment: "أحتاج لتحديد موعد",
    symptoms: "أشعر بالمرض منذ ثلاثة أيام",
    pregnant: "أنا حامل",
    history: "لدي تاريخ مرضي مع السكري",
    consent: "أفهم وأعطي موافقتي",
  },
};

const phraseIcons = {
  greeting: User, pain: AlertTriangle, allergy: AlertTriangle, medication: Pill,
  emergency: Heart, appointment: Calendar, symptoms: AlertTriangle, pregnant: Heart,
  history: Heart, consent: Check,
};

const phraseLabels = {
  greeting: "Need to see a doctor", pain: "Chest pain", allergy: "Allergy alert",
  medication: "Current medication", emergency: "Emergency help", appointment: "Schedule appointment",
  symptoms: "Describe symptoms", pregnant: "Pregnancy", history: "Medical history", consent: "Give consent",
};

export default function LanguageDirectory() {
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [copied, setCopied] = useState(null);
  const { toast } = useToast();

  const filteredLanguages = languages.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  const hasPhrases = medicalPhrases[selectedLang];
  const phrases = hasPhrases || medicalPhrases.en;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedLangInfo = languages.find((l) => l.code === selectedLang);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Language Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Essential medical phrases in 24+ languages for global health access</p>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Language Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {filteredLanguages.map((lang, i) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedLang(lang.code)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                selectedLang === lang.code
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-border hover:border-emerald-300 hover:bg-muted/50"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-xs font-medium">{lang.name}</span>
              <span className="text-[10px] text-muted-foreground">{lang.nativeName}</span>
            </motion.button>
          ))}
        </div>

        {/* Medical Phrases */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-sm">
                Medical Phrases — {selectedLangInfo?.flag} {selectedLangInfo?.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {hasPhrases ? "Tap any phrase to copy" : "Showing English (translations coming soon)"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(phrases).map(([key, text]) => {
              const Icon = phraseIcons[key] || User;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition cursor-pointer"
                  onClick={() => handleCopy(text, key)}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{phraseLabels[key]}</p>
                    <p className="text-sm font-medium">{text}</p>
                  </div>
                  {copied === key ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex items-start gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-4">
          <Phone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-800">
            In a medical emergency, always call your local emergency number (911 in the US). These phrases help communicate basic health information when language barriers exist. For professional medical translation services, contact your healthcare provider.
          </p>
        </div>
      </motion.div>
    </div>
  );
}