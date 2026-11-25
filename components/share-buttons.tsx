"use client";
import { Copy, MessageCircle } from "lucide-react";
import { copyWithToast, whatsappHref } from "@/components/toast";

export function ShareButtons({ text, copyLabel, shareLabel, copied }: { text: string; copyLabel: string; shareLabel: string; copied: string }) {
  return (
    <div className="phone-actions">
      <button type="button" className="btn btn-primary" onClick={() => copyWithToast(text, copied)}>
        <Copy size={18} aria-hidden="true" />
        {copyLabel}
      </button>
      <a className="btn btn-secondary" href={whatsappHref(text)} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={18} aria-hidden="true" />
        {shareLabel}
      </a>
    </div>
  );
}
