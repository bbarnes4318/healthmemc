import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading">Order Confirmed!</h1>
          <p className="text-muted-foreground text-sm">
            Your payment has been processed successfully. Your physical Medical ID Card will be mailed to your address within 5-7 business days.
          </p>
        </div>
        <Button asChild className="bg-sky-600 hover:bg-sky-700">
          <Link to="/profile">Back to Profile</Link>
        </Button>
      </div>
    </div>
  );
}