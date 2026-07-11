import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useRefillAlerts } from "@/hooks/useRefillAlerts";
import {
  Pill, AlertTriangle, Mail, Loader2, MapPin, Phone, Star,
  Navigation, Clock, CalendarPlus, Locate, Search, Package, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RefillActionPanel() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { refillAlerts, loading, refresh } = useRefillAlerts(true);
  const { toast } = useToast();

  const [emailing, setEmailing] = useState(null);
  const [bookingMed, setBookingMed] = useState(null);
  const [location, setLocation] = useState("");
  const [pharmacies, setPharmacies] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [booking, setBooking] = useState(false);

  const memberAlerts = refillAlerts.filter((m) => {
    if (!currentMemberId) return !m.family_member_id;
    return m.family_member_id === currentMemberId;
  });

  const handlePharmacyRequest = async (med) => {
    setEmailing(med.id);
    try {
      const user = await base44.auth.me();
      const recipient = user?.email || "";
      const subject = `Prescription Refill Request: ${med.name} ${med.dosage}`;
      const body = `Hello,

I am requesting a refill for the following prescription:

  Medication: ${med.name} ${med.dosage}
  Frequency: ${med.frequency}
  Prescribing Provider: ${med.prescribing_provider || "N/A"}
  Remaining Supply: ${med.remaining} pills (approximately ${med.daysRemaining} day${med.daysRemaining === 1 ? "" : "s"})

Please process this refill request at your earliest convenience.

Patient: ${user?.full_name || currentMemberName}
Sent from Health Me Medical Center`;

      await base44.integrations.Core.SendEmail({ to: recipient, subject, body });
      toast({
        title: "Pharmacy request sent",
        description: `A refill request for ${med.name} has been emailed to ${recipient}.`,
      });
    } catch (e) {
      toast({ title: "Failed to send request", variant: "destructive" });
      console.error(e);
    }
    setEmailing(null);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const searchPharmacies = async (overrideLoc) => {
    const loc = overrideLoc || location;
    if (!loc.trim()) return;
    setSearching(true);
    setSearched(true);
    setPharmacies([]);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Find real pharmacies near "${loc}". List actual pharmacy locations with their real addresses, phone numbers, operating hours, and ratings. Include chain pharmacies (CVS, Walgreens, Rite Aid, Walmart, etc.) and independent pharmacies. Provide a Google Maps link for each.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  rating: { type: "number" },
                  hours: { type: "string" },
                  maps_url: { type: "string" },
                },
              },
            },
          },
        },
      });
      setPharmacies(response.results || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to find pharmacies", variant: "destructive" });
    }
    setSearching(false);
  };

  const handleBookAppointment = async () => {
    if (!bookingDate || !bookingTime) return;
    setBooking(true);
    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      await base44.entities.Appointment.create({
        title: `Refill Appointment: ${bookingMed.name} at ${bookingProvider.name}`,
        date: dateTime.toISOString(),
        type: "specialist",
        status: "pending",
        provider: bookingProvider.name,
        notes: `Refill for ${bookingMed.name} ${bookingMed.dosage}. ${bookingProvider.address || ""} ${bookingProvider.phone || ""}`.trim(),
        family_member_id: currentMemberId || undefined,
      });
      toast({
        title: "Refill appointment scheduled",
        description: `Appointment at ${bookingProvider.name} saved. Call them to confirm.`,
      });
      setBookingProvider(null);
      setBookingDate("");
      setBookingTime("");
      setBookingMed(null);
      setPharmacies([]);
      setSearched(false);
      refresh();
    } catch (e) {
      toast({ title: "Failed to book appointment", variant: "destructive" });
      console.error(e);
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (memberAlerts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">All medications well stocked</p>
        <p className="text-xs text-muted-foreground mt-1">
          You have more than 7 days of supply for all active medications{currentMemberName !== "You" ? ` for ${currentMemberName}` : ""}.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          {memberAlerts.length} {memberAlerts.length === 1 ? "medication needs" : "medications need"} a refill. Request a pharmacy refill by email or schedule a refill appointment at a nearby pharmacy below.
        </p>
      </div>

      {/* Low Supply Medications */}
      {memberAlerts.map((med) => (
        <motion.div
          key={med.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-4 ${med.isCritical ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${med.isCritical ? "bg-red-100" : "bg-amber-100"}`}>
                <Pill className={`w-5 h-5 ${med.isCritical ? "text-red-600" : "text-amber-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">{med.name}</h3>
                  <span className="text-xs text-muted-foreground">{med.dosage}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {med.remaining} pills left · {med.dosesPerDay}×/day ·{" "}
                  <span className={`font-medium ${med.isCritical ? "text-red-600" : "text-amber-700"}`}>
                    {med.daysRemaining} {med.daysRemaining === 1 ? "day" : "days"} until empty
                  </span>
                </p>
                {med.prescribing_provider && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Prescribed by: {med.prescribing_provider}</p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={emailing === med.id}
                    onClick={() => handlePharmacyRequest(med)}
                  >
                    {emailing === med.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Pharmacy Request
                  </Button>
                  <Button
                    size="sm"
                    className={`h-8 text-xs ${med.isCritical ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
                    onClick={() => { setBookingMed(med); setSearched(false); setPharmacies([]); setLocation(""); }}
                  >
                    <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                    Schedule Refill Appointment
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Pharmacy Search Dialog for Refill Appointment */}
      <Dialog open={!!bookingMed} onOpenChange={(v) => { if (!v) { setBookingMed(null); setPharmacies([]); setSearched(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-amber-600" /> Schedule Refill Appointment
            </DialogTitle>
          </DialogHeader>
          {bookingMed && (
            <div className="space-y-4 mt-2">
              {/* Medication Summary */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium">{bookingMed.name} {bookingMed.dosage}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bookingMed.remaining} pills · {bookingMed.daysRemaining} {bookingMed.daysRemaining === 1 ? "day" : "days"} until empty
                </p>
              </div>

              {/* Location Search */}
              <div>
                <Label className="text-xs">Enter your location to find nearby pharmacies</Label>
                <div className="flex gap-2 mt-1.5">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="City, zip, or address..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchPharmacies()}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={useMyLocation} disabled={locating} title="Use my location">
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                  </Button>
                  <Button onClick={() => searchPharmacies()} disabled={!location.trim() || searching} className="bg-amber-600 hover:bg-amber-700">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Pharmacy Results */}
              {searching && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                  <p className="text-xs text-muted-foreground">Finding pharmacies near you...</p>
                </div>
              )}

              {!searching && searched && pharmacies.length === 0 && (
                <div className="py-6 text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">No pharmacies found. Try a different location.</p>
                </div>
              )}

              {!searching && pharmacies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{pharmacies.length} pharmacies found</p>
                  {pharmacies.map((p, i) => (
                    <Card key={i} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Pill className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate">{p.name}</h4>
                            {p.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {p.rating}
                              </span>
                            )}
                          </div>
                          {p.address && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />{p.address}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {p.phone && (
                              <a href={`tel:${p.phone}`} className="text-xs text-sky-600 flex items-center gap-1 hover:underline">
                                <Phone className="w-3 h-3" />{p.phone}
                              </a>
                            )}
                            {p.hours && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />{p.hours}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {p.maps_url ? (
                              <a href={p.maps_url} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  <Navigation className="w-3 h-3 mr-1" /> Directions
                                </Button>
                              </a>
                            ) : (
                              <a href={`https://www.google.com/maps/search/${encodeURIComponent(p.name + " " + (p.address || location))}`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  <Navigation className="w-3 h-3 mr-1" /> Directions
                                </Button>
                              </a>
                            )}
                            {p.phone && (
                              <a href={`tel:${p.phone}`}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  <Phone className="w-3 h-3 mr-1" /> Call
                                </Button>
                              </a>
                            )}
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                              onClick={() => setBookingProvider(p)}
                            >
                              <CalendarPlus className="w-3 h-3 mr-1" /> Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Booking Dialog */}
      <Dialog open={!!bookingProvider} onOpenChange={(v) => { if (!v) setBookingProvider(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Book Refill Appointment</DialogTitle>
          </DialogHeader>
          {bookingProvider && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{bookingProvider.name}</p>
                {bookingProvider.address && <p className="text-xs text-muted-foreground mt-0.5">{bookingProvider.address}</p>}
                {bookingProvider.phone && <p className="text-xs text-sky-600 mt-0.5">{bookingProvider.phone}</p>}
              </div>
              <div>
                <Label className="text-xs">Preferred Date</Label>
                <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label className="text-xs">Preferred Time</Label>
                <Input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Refill for {bookingMed?.name} {bookingMed?.dosage}. This saves the appointment to your calendar. Call the pharmacy to confirm.
              </p>
              <Button onClick={handleBookAppointment} disabled={!bookingDate || !bookingTime || booking} className="w-full bg-amber-600 hover:bg-amber-700">
                {booking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
                Save Appointment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}