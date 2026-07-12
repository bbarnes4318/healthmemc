import React from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, CalendarClock } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export default function InsuranceExpiryBanner({ cards }) {
  if (!cards || cards.length === 0) return null;

  const today = new Date();
  const expiringCards = cards
    .filter((c) => c.termination_date)
    .map((c) => {
      const expiry = new Date(c.termination_date);
      const days = differenceInDays(expiry, today);
      return { ...c, daysUntilExpiry: days, expiryDate: expiry };
    })
    .filter((c) => c.daysUntilExpiry <= 30)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  if (expiringCards.length === 0) return null;

  const hasExpired = expiringCards.some((c) => c.daysUntilExpiry < 0);

  return (
    <Card className={`p-4 ${hasExpired ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasExpired ? "bg-red-100" : "bg-amber-100"}`}>
          {hasExpired ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CalendarClock className="w-5 h-5 text-amber-600" />}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${hasExpired ? "text-red-900" : "text-amber-900"}`}>
            {hasExpired ? "Insurance Card Expired" : "Insurance Card Expiring Soon"}
          </h3>
          <p className={`text-xs mt-0.5 ${hasExpired ? "text-red-800" : "text-amber-800"}`}>
            {hasExpired
              ? "Update your insurance details to avoid coverage disruptions:"
              : "Upload your renewed card before it expires:"}
          </p>
          <div className="space-y-1.5 mt-2">
            {expiringCards.map((card) => (
              <div key={card.id} className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium ${hasExpired ? "text-red-700" : "text-amber-700"}`}>
                  {card.provider_name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  card.daysUntilExpiry < 0
                    ? "bg-red-200 text-red-800"
                    : card.daysUntilExpiry <= 7
                    ? "bg-orange-200 text-orange-800"
                    : "bg-amber-200 text-amber-800"
                }`}>
                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                  {card.daysUntilExpiry < 0
                    ? `${Math.abs(card.daysUntilExpiry)}d ago`
                    : card.daysUntilExpiry === 0
                    ? "Today"
                    : `${card.daysUntilExpiry}d left`}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Expires {format(card.expiryDate, "MMM d, yyyy")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}