"use client";

// [SPEC-HOME-ACTION-PLAN-01] The editorial role can submit plan-only changes for admin review.
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import VisualCmsEditor from "@/app/admin/VisualCmsEditor";
import { auth, db } from "@/lib/firebase";

export default function HomeActionPlanEditorPage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setRoles([]);
        setEmail("");
        setLoading(false);
        return;
      }

      setEmail(user.email);
      try {
        const member = await getDoc(doc(db, "membres", user.email));
        const data = member.data();
        const memberRoles = Array.isArray(data?.roles) ? data.roles : data?.role ? [data.role] : [];
        const isAdmin = memberRoles.includes("admin");
        setRoles(
          member.exists() &&
            (isAdmin || (data?.status === "validated" && memberRoles.includes("redacteur")))
            ? memberRoles
            : [],
        );
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p role="status" className="text-sm text-stone-500">
          Vérification de vos accès…
        </p>
      </main>
    );
  }

  if (!roles.includes("admin") && !roles.includes("redacteur")) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-3 p-8 text-center">
        <ShieldAlert size={36} className="text-amber-700" aria-hidden="true" />
        <h1 className="text-xl font-bold text-stone-900">Accès réservé au pôle rédaction</h1>
        <p className="text-sm text-stone-600">
          Un rôle de rédacteur est nécessaire pour proposer une modification du plan d’action.
        </p>
        <Link href="/espace-membre/redaction" className="btn-secondary mt-2 min-h-10 px-4">
          <ArrowLeft size={16} aria-hidden="true" /> Retour au pôle rédaction
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-full w-full max-w-6xl space-y-5 p-4 md:p-8">
      <header className="border-b border-stone-200 pb-5">
        <Link
          href="/espace-membre/redaction"
          className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Pôle rédaction
        </Link>
        <p className="mb-1 text-sm font-semibold uppercase text-emerald-800">Accueil</p>
        <h1 className="text-2xl font-black text-stone-900">Plan d’action</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Les propositions sont transmises aux administrateurs avant publication.
        </p>
      </header>
      <VisualCmsEditor homeActionPlanOnly isAdmin={roles.includes("admin")} userEmail={email} />
    </main>
  );
}
