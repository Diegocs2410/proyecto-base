"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          fontSize: "14px",
        },
        classNames: {
          success: "!border-green-200",
          error: "!border-red-200",
          warning: "!border-yellow-200",
        },
      }}
    />
  );
}
