import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Lock, FileCheck, Eye, ChevronDown, ChevronUp } from "lucide-react";

export default function PrivacyNotice() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            Medical Records Privacy & Security Notice
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your health information is protected under federal law. All data in this platform is kept strictly confidential in compliance with HIPAA, HITECH, and applicable federal and state regulations.
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-blue-600 hover:text-blue-700 mt-2 px-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
            {expanded ? "Show less" : "Read full notice"}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-3 text-xs text-muted-foreground">
              <PrivacySection
                icon={Lock}
                title="Data Encryption"
                text="All medical records are encrypted in transit (TLS 1.2+) and at rest. Your data is stored using industry-standard AES-256 encryption, ensuring that only authorized parties can access your information."
              />
              <PrivacySection
                icon={Shield}
                title="HIPAA Compliance"
                text="This platform complies with the Health Insurance Portability and Accountability Act (HIPAA). Your Protected Health Information (PHI) is handled according to federal privacy and security rules, and is never shared with third parties without your explicit written consent."
              />
              <PrivacySection
                icon={FileCheck}
                title="HITECH Act"
                text="We adhere to the Health Information Technology for Economic and Clinical Health (HITECH) Act, which strengthens the civil and criminal enforcement of HIPAA rules and promotes the secure adoption of electronic health records."
              />
              <PrivacySection
                icon={Eye}
                title="Access Controls"
                text="Access to your medical records is strictly limited to you and healthcare providers you explicitly authorize. You control who can view your records through the Clinician Access and Record Share features. All access is logged and auditable."
              />
              <PrivacySection
                icon={ShieldCheck}
                title="Your Rights"
                text="Under federal law, you have the right to: (1) access your medical records at any time, (2) request amendments to incorrect information, (3) receive an accounting of disclosures, (4) request restrictions on certain uses and disclosures, and (5) revoke any previously granted access to your records."
              />
              <div className="pt-2 border-t border-blue-100">
                <p className="text-[11px] text-blue-700 font-medium">
                  Questions about your privacy? Contact your care team or reach out to the platform administrator. This notice is provided in accordance with 45 CFR § 164.520.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function PrivacySection({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5">{text}</p>
      </div>
    </div>
  );
}