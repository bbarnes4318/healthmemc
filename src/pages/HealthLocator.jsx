import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Phone, Star, Loader2, Navigation, Hospital,
  Stethoscope, PawPrint, Pill, Clock, Locate, CalendarPlus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const categories = [
  { value: "hospital", label: "Hospitals & ER", icon: Hospital, color: "bg-red-50 text-red-600" },
  { value: "specialist", label: "Medical Specialists", icon: Stethoscope, color: "bg-sky-50 text-sky-600" },
  { value: "veterinarian", label: "Veterinarians", icon: PawPrint, color: "bg-amber-50 text-amber-600" },
  { value: "pharmacy", label: "Pharmacies", icon: Pill, color: "bg-emerald-50 text-emerald-600" },
  { value: "urgent_care", label: "Urgent Care", icon: Hospital, color: "bg-violet-50 text-violet-600" },
  { value: "all", label: "All Health Services", icon: Search, color: "bg-gray-50 text-gray-600" },
];

export default function HealthLocator() {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("hospital");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [booking, setBooking] = useState(false);
  const { toast } = useToast();

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

  const handleSearch = async () => {
    if (!location.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const catLabel = categories.find((c) => c.value === category)?.label || "health services";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Find real ${catLabel} near "${location}". List actual places with their real addresses, phone numbers, operating hours, and ratings. Include well-known hospitals, medical centers, clinics, and individual practitioners. Provide a Google Maps link for each.`,
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
                  type: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  rating: { type: "number" },
                  hours: { type: "string" },
                  description: { type: "string" },
                  maps_url: { type: "string" },
                },
              },
            },
          },
        },
      });
      setResults(response.results || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectedCat = categories.find((c) => c.value === category);

  const handleBook = async () => {
    if (!bookingDate || !bookingTime) return;
    setBooking(true);
    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      await base44.entities.Appointment.create({
        title: `Appointment at ${bookingProvider.name}`,
        date: dateTime.toISOString(),
        type: "specialist",
        status: "pending",
        provider: bookingProvider.name,
        notes: bookingReason || undefined,
      });
      toast({
        title: "Appointment requested",
        description: `Your appointment with ${bookingProvider.name} has been saved. Call them to confirm.`,
      });
      setBookingProvider(null);
      setBookingDate("");
      setBookingTime("");
      setBookingReason("");
    } catch (e) {
      toast({ title: "Failed to book appointment", variant: "destructive" });
    }
    setBooking(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Find Health Services</h1>
          <p className="text-sm text-muted-foreground">Locate hospitals, specialists, pharmacies & more near you</p>
        </div>
      </div>

      {/* Search Form */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter city, zip code, or address..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={useMyLocation} disabled={locating} title="Use my location">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
          </Button>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <selectedCat.icon className="w-3.5 h-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={!location.trim() || loading} className="bg-sky-600 hover:bg-sky-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-3" />
          <p className="text-sm text-muted-foreground">Searching for {selectedCat.label.toLowerCase()} near you...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card className="p-12 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No results found. Try a different location or category.</p>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{results.length} {selectedCat.label.toLowerCase()} found near "{location}"</p>
          {results.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedCat.color}`}>
                  <selectedCat.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{r.name}</h3>
                    {r.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {r.rating}
                      </span>
                    )}
                  </div>
                  {r.type && <Badge className="text-[10px] mt-0.5 bg-muted text-muted-foreground">{r.type}</Badge>}
                  {r.address && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />{r.address}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="text-xs text-sky-600 flex items-center gap-1 hover:underline">
                        <Phone className="w-3 h-3" />{r.phone}
                      </a>
                    )}
                    {r.hours && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{r.hours}
                      </span>
                    )}
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                  <div className="flex gap-2 mt-2">
                    {r.maps_url ? (
                      <a href={r.maps_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Navigation className="w-3 h-3 mr-1" /> Directions
                        </Button>
                      </a>
                    ) : (
                      <a href={`https://www.google.com/maps/search/${encodeURIComponent(r.name + " " + (r.address || location))}`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Navigation className="w-3 h-3 mr-1" /> Directions
                        </Button>
                      </a>
                    )}
                    {r.phone && (
                      <a href={`tel:${r.phone}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Phone className="w-3 h-3 mr-1" /> Call
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-sky-600 hover:bg-sky-700"
                      onClick={() => setBookingProvider(r)}
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

      {!loading && !searched && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card
              key={cat.value}
              className="p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              onClick={() => setCategory(cat.value)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${cat.color}`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">{cat.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!bookingProvider} onOpenChange={(v) => !v && setBookingProvider(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
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
              <div>
                <Label className="text-xs">Reason for Visit (optional)</Label>
                <Input placeholder="e.g., Annual checkup, specific concern..." value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                This saves the appointment to your calendar. Call the provider to confirm your time slot.
              </p>
              <Button onClick={handleBook} disabled={!bookingDate || !bookingTime || booking} className="w-full bg-sky-600 hover:bg-sky-700">
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