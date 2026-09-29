import React from "react";
import { BookOpen } from "lucide-react";

export interface LexiconBlockProps {
  data: {
    items: {
      title: string;
      desc: string;
    }[];
  };
}

export default function LexiconBlock({ data }: LexiconBlockProps) {
  return (
    <div className="bg-stone-50 rounded-2xl p-6 md:p-8 mt-12 mb-8 border border-stone-200">
      <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
        <BookOpen className="text-emerald-600" />
        Petit Lexique pour tout comprendre
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.items.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
            <h3 className="font-bold text-stone-900 mb-2">{item.title}</h3>
            <p className="text-sm text-stone-600" dangerouslySetInnerHTML={{ __html: item.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        ))}
      </div>
    </div>
  );
}
