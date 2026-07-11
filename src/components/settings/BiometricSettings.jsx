import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Loader2, CheckCircle, XCircle, ShieldCheck, Trash2 } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useToast } from "@/components/ui/use-toast";

export default function BiometricSettings() {
  const { isSupported, isRegistered, register, unregister } = useBiometricAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleEnable = async () => {
    if (!email.trim() || !password) return;
    setEnrolling(true);
    const success = await register(email.trim(), password);
    if (success) {
      toast({ title: "Biometric login enabled", description: "You can now log in with fingerprint or face ID." });
      setEmail("");
      setPassword("");
    } else {
      toast({ title: "Setup failed", description: "Biometric enrollment was cancelled or not supported.", variant: "destructive" });
    }
    setEnrolling(false);
  };

  const handleDisable = async () => {
    setRemoving(true);
    unregister();
    toast({ title: "Biometric login disabled", description: "Your stored credentials have been removed." });
    setRemoving(false);
  };

  if (!isSupported) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Biometric Authentication</h3>
        </div>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Biometric authentication is not supported on this device. Use a device with fingerprint or face ID capability.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
          <Fingerprint className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Biometric Authentication</h3>
          <p className="text-xs text-muted-foreground">Log in securely with fingerprint or face ID</p>
        </div>
      </div>

      {isRegistered ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-medium text-emerald-800">Biometric login is active</p>
              <p className="text-[10px] text-emerald-700">Your fingerprint or face ID can be used to log in.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={removing}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {removing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
            Disable Biometric Login
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
            <ShieldCheck className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-800">
              Enable biometric login to securely access your account with fingerprint or face ID instead of typing your password each time.
            </p>
          </div>
          <div>
            <Label className="text-xs">Account Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Your credentials are stored securely on this device only. You'll be prompted to verify with your fingerprint or face ID.
          </p>
          <Button
            onClick={handleEnable}
            disabled={!email.trim() || !password || enrolling}
            className="w-full bg-sky-600 hover:bg-sky-700"
          >
            {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Fingerprint className="w-4 h-4 mr-2" />}
            {enrolling ? "Enrolling..." : "Enable Biometric Login"}
          </Button>
        </div>
      )}
    </Card>
  );
}