import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, Heart, Loader2, Save, Crown, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import InsuranceSection from "@/components/profile/InsuranceSection";

const membershipTiers = [
  { value: "free", label: "Free", desc: "Basic health information", price: "Free" },
  { value: "basic", label: "Basic Care", desc: "AI consultations + records", price: "$9.99/mo" },
  { value: "family", label: "Family", desc: "Up to 5 family members", price: "$19.99/mo" },
  { value: "chronic_care", label: "Chronic Care", desc: "Specialized monitoring", price: "$29.99/mo" },
  { value: "premium", label: "Premium Complete", desc: "All features + priority support", price: "$49.99/mo" },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date_of_birth: "",
    gender: "prefer_not_to_say",
    height_cm: "",
    weight_kg: "",
    blood_type: "unknown",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    insurance_provider: "",
    insurance_id: "",
    notification_medications: true,
    notification_appointments: true,
    notification_screenings: true,
    notification_wellness: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const profiles = await base44.entities.HealthProfile.filter({ created_by_id: u.id });
        if (profiles.length > 0) {
          setProfile(profiles[0]);
          setForm({
            date_of_birth: profiles[0].date_of_birth || "",
            gender: profiles[0].gender || "prefer_not_to_say",
            height_cm: profiles[0].height_cm || "",
            weight_kg: profiles[0].weight_kg || "",
            blood_type: profiles[0].blood_type || "unknown",
            emergency_contact_name: profiles[0].emergency_contact_name || "",
            emergency_contact_phone: profiles[0].emergency_contact_phone || "",
            emergency_contact_relationship: profiles[0].emergency_contact_relationship || "",
            insurance_provider: profiles[0].insurance_provider || "",
            insurance_id: profiles[0].insurance_id || "",
            notification_medications: profiles[0].notification_medications ?? true,
            notification_appointments: profiles[0].notification_appointments ?? true,
            notification_screenings: profiles[0].notification_screenings ?? true,
            notification_wellness: profiles[0].notification_wellness ?? true,
          });
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      };

      if (profile) {
        await base44.entities.HealthProfile.update(profile.id, data);
      } else {
        const newProfile = await base44.entities.HealthProfile.create(data);
        setProfile(newProfile);
      }
      toast({ title: "Profile saved", description: "Your health profile has been updated." });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 mb-6">
          <TabsTrigger value="personal"><User className="w-3.5 h-3.5 mr-1.5" /> Personal</TabsTrigger>
          <TabsTrigger value="emergency"><Shield className="w-3.5 h-3.5 mr-1.5" /> Emergency</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-3.5 h-3.5 mr-1.5" /> Alerts</TabsTrigger>
          <TabsTrigger value="insurance"><CreditCard className="w-3.5 h-3.5 mr-1.5" /> Insurance</TabsTrigger>
          <TabsTrigger value="membership"><Crown className="w-3.5 h-3.5 mr-1.5" /> Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Height (cm)</Label>
                  <Input type="number" placeholder="170" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input type="number" placeholder="70" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Blood Type</Label>
                <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Insurance Provider</Label>
                  <Input placeholder="Provider name" value={form.insurance_provider} onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Insurance ID</Label>
                  <Input placeholder="ID number" value={form.insurance_id} onChange={(e) => setForm({ ...form, insurance_id: e.target.value })} />
                </div>
              </div>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="emergency">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-5 space-y-4">
              <div>
                <Label className="text-xs">Emergency Contact Name</Label>
                <Input placeholder="Full name" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input placeholder="Phone number" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Relationship</Label>
                <Input placeholder="e.g., Spouse, Parent, Sibling" value={form.emergency_contact_relationship} onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })} />
              </div>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-5 space-y-5">
              {[
                { key: "notification_medications", label: "Medication Reminders", desc: "Get reminders for your medications" },
                { key: "notification_appointments", label: "Appointment Reminders", desc: "Upcoming appointment alerts" },
                { key: "notification_screenings", label: "Screening Reminders", desc: "Preventive care and vaccination reminders" },
                { key: "notification_wellness", label: "Wellness Goals", desc: "Daily wellness tips and goals" },
              ].map((notif) => (
                <div key={notif.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{notif.label}</p>
                    <p className="text-xs text-muted-foreground">{notif.desc}</p>
                  </div>
                  <Switch checked={form[notif.key]} onCheckedChange={(v) => setForm({ ...form, [notif.key]: v })} />
                </div>
              ))}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="insurance">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InsuranceSection />
          </motion.div>
        </TabsContent>

        <TabsContent value="membership">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-3">
              {membershipTiers.map((tier) => {
                const isCurrent = (profile?.membership_tier || "free") === tier.value;
                return (
                  <Card key={tier.value} className={`p-4 ${isCurrent ? "ring-2 ring-sky-500 bg-sky-50/50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{tier.label}</h3>
                          {isCurrent && <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tier.desc}</p>
                      </div>
                      <span className="font-display font-bold text-sm">{tier.price}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700" size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}