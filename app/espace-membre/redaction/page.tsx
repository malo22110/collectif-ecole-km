"use client";

// [SPEC-REDACTION-HUB-01] One entry point for article, FAQ, and press tools, filtered by assigned roles.
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowRight, BookOpenText, HelpCircle, Newspaper, UserRoundCog } from "lucide-react";
import { auth, db } from "@/lib/firebase";

const tools = [
  {
    role: "redacteur",
    href: "/espace-membre/articles",
    title: "Articles",
    description: "Rédiger et gérer les actualités du collectif.",
    action: "Gérer les articles",
    icon: BookOpenText,
    color: "bg-sky-100 text-sky-900",
  },
  {
    role: "faq",
    href: "/espace-membre/faq",
    title: "FAQ",
    description: "Mettre à jour les réponses aux questions fréquentes.",
    action: "Gérer la FAQ",
    icon: HelpCircle,
    color: "bg-amber-100 text-amber-900",
  },
  {
    role: "presse",
    href: "/espace-membre/presse",
    title: "Presse",
    description: "Gérer les articles de presse et les relations médias.",
    action: "Gérer la presse",
    icon: Newspaper,
    color: "bg-emerald-100 text-emerald-900",
  },
];

export default function RedactionHubPage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setRoles([]);
        setLoading(false);
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, "membres", user.email));
        const data = snapshot.data();
        setRoles(Array.isArray(data?.roles) ? data.roles : data?.role ? [data.role] : []);
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const availableTools = tools.filter((tool) => isAdmin || roles.includes(tool.role));

  return (
    <main className="mx-auto min-h-full w-full max-w-6xl space-y-6 p-4 md:p-8">
      <header className="border-b border-stone-200 pb-5">
        <p className="mb-2 text-sm font-semibold uppercase text-emerald-800">Espace membre</p>
        <h1 className="text-2xl font-black text-stone-900 md:text-3xl">Pôle rédaction</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Articles, réponses aux questions et informations presse, selon vos rôles.
        </p>
      </header>

      {loading ? (
        <p role="status" className="py-8 text-center text-sm text-stone-500">
          Chargement de vos accès…
        </p>
      ) : availableTools.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {availableTools.map(({ href, title, description, action, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-48 flex-col border border-stone-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              <span className={`mb-4 grid size-10 place-items-center rounded-lg ${color}`}>
                <Icon size={19} aria-hidden="true" />
              </span>
              <h2 className="font-bold text-stone-900">{title}</h2>
              <p className="mt-1 flex-1 text-sm leading-5 text-stone-600">{description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
                {action}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-y border-stone-200 py-6">
          <p className="font-semibold text-stone-900">
            Aucun outil rédactionnel n’est associé à votre compte pour le moment.
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Vous pouvez demander un rôle depuis la page des équipes du collectif.
          </p>
          <Link
            href="/espace-membre/equipe"
            className="btn-secondary mt-4 min-h-10 px-4 py-2 text-sm"
          >
            <UserRoundCog size={16} aria-hidden="true" />
            Voir les équipes
          </Link>
        </div>
      )}
    </main>
  );
}
