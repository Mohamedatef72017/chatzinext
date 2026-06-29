import React from 'react';
import { FaWhatsapp, FaFacebookMessenger, FaInstagram } from 'react-icons/fa';

export function FormattedText({ children }: { children: string | React.ReactNode }) {
  if (typeof children !== 'string') return <>{children}</>;

  const regex = /(WhatsApp|Messenger|Instagram)/gi;
  const parts = children.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        if (lowerPart === 'whatsapp') {
          return (
            <span key={i} className="inline-flex items-center justify-center gap-1.5 font-extrabold text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-md mx-0.5 whitespace-nowrap" dir="ltr">
              <FaWhatsapp size={14} /> WhatsApp
            </span>
          );
        } else if (lowerPart === 'messenger') {
          return (
            <span key={i} className="inline-flex items-center justify-center gap-1.5 font-extrabold text-[#0084FF] bg-[#0084FF]/10 px-2 py-0.5 rounded-md mx-0.5 whitespace-nowrap" dir="ltr">
              <FaFacebookMessenger size={14} /> Messenger
            </span>
          );
        } else if (lowerPart === 'instagram') {
          return (
            <span key={i} className="inline-flex items-center justify-center gap-1.5 font-extrabold text-[#E1306C] bg-[#E1306C]/10 px-2 py-0.5 rounded-md mx-0.5 whitespace-nowrap" dir="ltr">
              <FaInstagram size={14} /> Instagram
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
