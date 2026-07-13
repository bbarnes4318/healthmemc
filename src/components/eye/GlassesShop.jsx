import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Glasses, Check, ShoppingBag, MapPin } from "lucide-react";

const FRAMES = [
  { id: "f1", name: "Classic Round", brand: "Vision Pro", price: 89, color: "Tortoise", shape: "round", image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=200&h=200&fit=crop" },
  { id: "f2", name: "Modern Rectangle", brand: "EyeStyle", price: 129, color: "Black", shape: "rectangle", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&h=200&fit=crop" },
  { id: "f3", name: "Aviator Titanium", brand: "SkyView", price: 199, color: "Gold", shape: "aviator", image: "https://images.unsplash.com/photo-1572632131-d6599d9b5c0d?w=200&h=200&fit=crop" },
  { id: "f4", name: "Cat-Eye Chic", brand: "Luna", price: 149, color: "Rose", shape: "cat-eye", image: "https://images.unsplash.com/photo-1585634186123-5d5e3e5e5e5e?w=200&h=200&fit=crop" },
  { id: "f5", name: "Sport Wrap", brand: "ActiveEye", price: 119, color: "Matte Black", shape: "wrap", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&h=200&fit=crop" },
  { id: "f6", name: "Rimless Minimal", brand: "Pure", price: 159, color: "Silver", shape: "rimless", image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=200&h=200&fit=crop" },
];

const CONTACTS = [
  { id: "c1", name: "Daily Comfort", brand: "Acuvue", price: 45, type: "Daily", wear: "1-day", color: "Clear" },
  { id: "c2", name: "Monthly Breathable", brand: "Air Optix", price: 35, type: "Monthly", wear: "30-day", color: "Clear" },
  { id: "c3", name: "Color Enhance - Blue", brand: "FreshLook", price: 55, type: "Monthly", wear: "30-day", color: "Blue" },
  { id: "c4", name: "Color Enhance - Green", brand: "FreshLook", price: 55, type: "Monthly", wear: "30-day", color: "Green" },
  { id: "c5", name: "Toric for Astigmatism", brand: "Acuvue", price: 65, type: "Monthly", wear: "30-day", color: "Clear" },
  { id: "c6", name: "Multifocal", brand: "Biotrue", price: 59, type: "Monthly", wear: "30-day", color: "Clear" },
];

export default function GlassesShop({ examData, onSelect, onBookDoctor }) {
  const [tab, setTab] = useState("frames");
  const [selected, setSelected] = useState(null);

  const handleSelect = (item, type) => {
    const eyewear = { ...item, type: type === "frames" ? "Glasses" : "Contacts" };
    setSelected(eyewear);
    onSelect?.(eyewear);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-indigo-600" />
        <h3 className="font-display font-semibold text-sm">Recommended Eyewear</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant={tab === "frames" ? "default" : "outline"}
          onClick={() => setTab("frames")}
          className={tab === "frames" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
        >
          <Glasses className="w-3.5 h-3.5 mr-1.5" /> Glasses Frames
        </Button>
        <Button
          size="sm"
          variant={tab === "contacts" ? "default" : "outline"}
          onClick={() => setTab("contacts")}
          className={tab === "contacts" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
        >
          Eyeglass Contacts
        </Button>
      </div>

      {tab === "frames" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FRAMES.map((frame) => (
            <div
              key={frame.id}
              className={`rounded-xl border-2 p-3 cursor-pointer transition ${
                selected?.id === frame.id ? "border-indigo-500 bg-indigo-50" : "border-border hover:border-indigo-300"
              }`}
              onClick={() => handleSelect(frame, "frames")}
            >
              <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden flex items-center justify-center">
                <Glasses className="w-12 h-12 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-semibold truncate">{frame.name}</p>
              <p className="text-[10px] text-muted-foreground">{frame.brand}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-indigo-600">${frame.price}</span>
                <Badge variant="secondary" className="text-[9px]">{frame.color}</Badge>
              </div>
              {selected?.id === frame.id && (
                <div className="mt-1.5 flex items-center justify-center bg-indigo-600 rounded-md py-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONTACTS.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-xl border-2 p-3 cursor-pointer transition ${
                selected?.id === contact.id ? "border-indigo-500 bg-indigo-50" : "border-border hover:border-indigo-300"
              }`}
              onClick={() => handleSelect(contact, "contacts")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{contact.name}</p>
                  <p className="text-[10px] text-muted-foreground">{contact.brand} · {contact.type}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[9px]">{contact.wear}</Badge>
                    <Badge variant="secondary" className="text-[9px]">{contact.color}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">${contact.price}</p>
                  <p className="text-[9px] text-muted-foreground">/box</p>
                </div>
              </div>
              {selected?.id === contact.id && (
                <div className="mt-1.5 flex items-center justify-center bg-indigo-600 rounded-md py-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-800 mb-2">
            <strong>Selected:</strong> {selected.type} — {selected.name} (${selected.price})
          </p>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 w-full" onClick={onBookDoctor}>
            <MapPin className="w-3.5 h-3.5 mr-1.5" /> Confirm with Eye Doctor Near Me
          </Button>
        </div>
      )}
    </Card>
  );
}