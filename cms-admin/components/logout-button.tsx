"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiUrl } from "../lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      await fetch(`${apiUrl}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return <button className="cms-logout-button" onClick={signOut} disabled={isSigningOut} aria-label="Sign out" title="Sign out"><LogOut size={16} strokeWidth={1.7} /><span>{isSigningOut ? "Signing out" : "Sign out"}</span></button>;
}
