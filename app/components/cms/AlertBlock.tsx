import React from "react";
import { AlertCircle, Info } from "lucide-react";

export interface AlertBlockProps {
  data: {
    style: "warning" | "info";
    title?: string;
    text: string;
  };
}

export default function AlertBlock({ data }: AlertBlockProps) {
  const isWarning = data.style === "warning";
  const bgClass = isWarning
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-sky-50 border-sky-200 text-sky-900";
  const Icon = isWarning ? AlertCircle : Info;
  const iconColor = isWarning ? "text-amber-600" : "text-sky-700";

  return (
    <div
      className={`${bgClass} border px-5 py-4 rounded-xl mb-6 flex flex-col md:flex-row items-center gap-3 text-sm font-medium shadow-sm max-w-2xl mx-4 md:mx-auto text-left`}
    >
      <Icon size={20} className={`${iconColor} shrink-0`} />
      <div>
        {data.title && (
          <strong className={`block mb-1 text-${isWarning ? "amber" : "sky"}-950`}>
            {data.title}
          </strong>
        )}
        {/* On gère le gras avec un regex simple ou markdown si besoin, ici on rend en texte simple ou dangerouslySetInnerHTML selon les besoins futurs */}
        <p
          dangerouslySetInnerHTML={{
            __html: data.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
          }}
        />
      </div>
    </div>
  );
}
