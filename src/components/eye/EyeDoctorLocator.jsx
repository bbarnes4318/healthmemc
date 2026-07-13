import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Loader2, Phone, ExternalLink, Stethoscope } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EyeDoctorLocator({ selectedEyewear }) {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!location.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Find optometrists and ophthalmologists near "${location}". Return a JSON array of 6-8 nearby eye doctors with their name, practice/clinic name, address, phone number, specialty (optometrist or ophthalmologist), approximate distance in miles, and whether they accept walk-ins. Include realistic practice names and phone numbers for the area.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            doctors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  practice: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  specialty: { type: "string" },
                  distance_miles: { type: "number" },
                  walk_ins: { type: "boolean" },
                  rating: { type: "number" },
                },
              },
            },
          },
        },
      });
      setDoctors(res.doctors || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-indigo-600" />
        <h3 className="font-display font-semibold text-sm">Find an Eye Doctor Near You</h3>
      </div>

      {selectedEyewear && (
        <div className="mb-4 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
          <p className="text-xs text-indigo-800">
            <strong>Your selection:</strong> {selectedEyewear.type} — {selectedEyewear.name} (${selectedEyewear.price})
          </p>
          <p className="text-[10px] text-indigo-600 mt-0.5">
            Bring your AI exam report and eyewear selection to your appointment for confirmation and fitting.
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Enter your zip code or city..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading || !location.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground ml-2">Finding eye doctors near you...</p>
        </div>
      )}

      {!loading && searched && doctors.length === 0 && (
        <div className="text-center py-8">
          <Stethoscope className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No eye doctors found. Try a different location.</p>
        </div>
      )}

      {!loading && doctors.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {doctors
            .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0))
            .map((doc, i) => (
              <div key={i} className="p-3 rounded-lg border border-border hover:border-indigo-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.practice}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.address}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">{doc.specialty}</Badge>
                      {doc.walk_ins && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Walk-ins OK</Badge>}
                      {doc.rating && (
                        <Badge variant="outline" className="text-[10px]">★ {doc.rating}</Badge>
                      )}
                      {doc.distance_miles != null && (
                        <Badge variant="outline" className="text-[10px]">{doc.distance_miles} mi</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {doc.phone && (
                      <a href={`tel:${doc.phone}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Phone className="w-3 h-3 mr-1" /> Call
                        </Button>
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.name + " " + doc.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" /> Map
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-8">
          <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Enter your zip code or city to find nearby optometrists and ophthalmologists.</p>
        </div>
      )}
    </Card>
  );
}