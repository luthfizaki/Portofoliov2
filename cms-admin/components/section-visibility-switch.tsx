"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiUrl } from "../lib/api";

export function SectionVisibilitySwitch({
  sectionId,
  label,
  initialVisible,
  compact = false,
}: {
  sectionId: string;
  label: string;
  initialVisible: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isSaving, setIsSaving] = useState(false);

  async function toggle() {
    const nextVisible = !isVisible;
    setIsVisible(nextVisible);
    setIsSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/pages/sections/${sectionId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVisible: nextVisible }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setIsVisible(!nextVisible);
        return;
      }
      router.refresh();
    } catch {
      setIsVisible(!nextVisible);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      className={`cms-section-switch${isVisible ? " is-on" : ""}${compact ? " is-compact" : ""}`}
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
      disabled={isSaving}
      aria-pressed={isVisible}
      aria-label={`${isVisible ? "Hide" : "Show"} ${label}`}
      title={`${isVisible ? "Hide" : "Show"} ${label}`}
    >
      <i />
      <span>{isSaving ? "Saving" : isVisible ? "Shown" : "Hidden"}</span>
    </button>
  );
}
