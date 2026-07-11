import { useState, useEffect, useCallback } from "react";

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setIsSupported(available))
        .catch(() => setIsSupported(false));
    }
    setIsRegistered(!!localStorage.getItem("biometric_email"));
  }, []);

  const register = useCallback(async (email, password) => {
    if (!window.PublicKeyCredential) return false;
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Health Me Medical Center" },
          user: { id: userId, name: email, displayName: email },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { userVerification: "required", authenticatorAttachment: "platform" },
          timeout: 60000,
        },
      });
      localStorage.setItem("biometric_email", email);
      localStorage.setItem("biometric_password", btoa(password));
      setIsRegistered(true);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const authenticate = useCallback(async () => {
    if (!isRegistered) return null;
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        },
      });
      const email = localStorage.getItem("biometric_email");
      const password = atob(localStorage.getItem("biometric_password") || "");
      return { email, password };
    } catch (e) {
      return null;
    }
  }, [isRegistered]);

  const unregister = useCallback(() => {
    localStorage.removeItem("biometric_email");
    localStorage.removeItem("biometric_password");
    setIsRegistered(false);
  }, []);

  return { isSupported, isRegistered, register, authenticate, unregister };
}