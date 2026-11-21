"use client";

import { useEffect, useRef, useState } from "react";

/** Show a short status message. Auto-dismisses after 3.5 s. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("sc:toast", { detail: message }));
}

export function Toaster() {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const onToast = (event: Event) => {
      setMessage((previous) => ({ id: (previous?.id ?? 0) + 1, text: (event as CustomEvent<string>).detail }));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), 3500);
    };
    window.addEventListener("sc:toast", onToast);
    return () => {
      window.removeEventListener("sc:toast", onToast);
      window.clearTimeout(timer.current);
    };
  }, []);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <p className="toast" key={message.id}>
          {message.text}
        </p>
      )}
    </div>
  );
}

/** Copy text and confirm with a toast. Returns true on success. */
export async function copyWithToast(text: string, done = "Copied. Paste it into WhatsApp or SMS.") {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
    return true;
  } catch {
    toast("Couldn't copy here. Select the text and copy it yourself.");
    return false;
  }
}

/** WhatsApp share link: opens WhatsApp with the text filled in. Nothing is sent automatically. */
export function whatsappHref(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
