import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Users, Loader2, Shield, Bell } from "lucide-react";
import TrustedContactForm from "@/components/settings/TrustedContactForm";
import TrustedContactList from "@/components/settings/TrustedContactList";
import RecordShareManager from "@/components/settings/RecordShareManager";
import BiometricSettings from "@/components/settings/BiometricSettings";

export default function Settings() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.TrustedContact.list("-created_date", 50);
      setContacts(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage trusted contacts and automated alerts</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200 mb-6">
        <Shield className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-800">
          Trusted contacts receive automated email alerts when you miss medication doses or trigger an emergency event. You can pause or remove contacts at any time.
        </p>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-600" /> Add Trusted Contact
        </h2>
        <TrustedContactForm onSaved={load} />
      </Card>

      <div>
        <h2 className="font-display font-semibold text-sm mb-3">Your Trusted Contacts</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <TrustedContactList contacts={contacts} onChanged={load} />
        )}
      </div>

      <div className="mt-6">
        <RecordShareManager />
      </div>

      <div className="mt-6">
        <BiometricSettings />
      </div>
    </div>
  );
}