"use client";

import { useEffect, useState } from "react";

const STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

export default function Toast({
  message,
  type = "success",
  duration = 5000,
}: {
  message: string;
  type?: "success" | "error";
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible || !message) return null;

  return (
    <div
      role="status"
      className={`fixed top-4 right-4 z-50 max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg ${STYLES[type]}`}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="leading-none opacity-60 hover:opacity-100"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
