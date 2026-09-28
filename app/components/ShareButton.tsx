"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ 
  url, 
  title, 
  text, 
  className = "inline-flex items-center justify-center gap-2 font-bold px-6 py-4 rounded-2xl transition-all text-base border", 
  variant = "primary" 
}: { 
  url: string; 
  title: string; 
  text: string; 
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const shareData = { title, text, url };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Erreur de partage:", err);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-md hover:shadow-lg";
      case "secondary":
        return "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-100 shadow-sm hover:shadow-md";
      case "outline":
        return "bg-transparent hover:bg-white/10 text-white border-white/30";
      default:
        return "";
    }
  };

  return (
    <button 
      onClick={handleShare}
      className={`${className} ${getVariantClasses()} hover:scale-105 active:scale-95`}
      title="Partager la pétition"
    >
      {copied ? <Check size={20} /> : <Share2 size={20} className={variant === 'secondary' ? 'text-emerald-700' : ''} />}
      {copied ? "Lien copié !" : "Partager"}
    </button>
  );
}
