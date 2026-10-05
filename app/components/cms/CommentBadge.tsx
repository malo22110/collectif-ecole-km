import React from "react";
import { MessageCircle } from "lucide-react";

export default function CommentBadge({
  topic,
  count,
  onOpen,
}: {
  topic: string;
  count: number;
  onOpen: () => void;
}) {
  const label = count > 0 ? `${count} commentaire${count > 1 ? "s" : ""}` : "Commenter";
  return (
    <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 rounded-full text-sm font-medium transition-colors border border-stone-200 shadow-sm"
      >
        <MessageCircle size={16} />
        <span>{label}</span>
      </button>
    </div>
  );
}
