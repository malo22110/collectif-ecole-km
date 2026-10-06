"use client";

/**
 * [SPEC-CMS-DRAFT-01] Panneau de révision des brouillons CMS.
 * Permet aux admins de voir le diff entre la version publiée et la version proposée,
 * puis d'approuver (publication) ou de rejeter (avec commentaire).
 */

import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { publishCmsPageRevision } from "@/lib/cmsRevisionClient";
import { normalizeHomeActionPlan } from "@/lib/homeActionPlan";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
} from "lucide-react";
import BlockRenderer from "../components/cms/BlockRenderer";

interface Draft {
  id: string;
  pageId: string;
  scope?: "homeActionPlan";
  baseVersion?: number;
  reviewNote?: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  submittedAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewComment?: string;
  data: any;
}

export default function DraftReviewPanel() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [liveData, setLiveData] = useState<any>(null);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    msg: string;
    ok: boolean;
  } | null>(null);
  const [isSimplified, setIsSimplified] = useState(false);

  // [SPEC-CMS-DRAFT-01] Écoute en temps réel des brouillons en attente
  useEffect(() => {
    const q = query(collection(db, "cms_drafts"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      setDrafts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Draft));
    });
    return () => unsub();
  }, []);

  // Charger la version publiée actuelle pour le diff
  useEffect(() => {
    getDoc(doc(db, "pages", "historique")).then((snap) => {
      if (snap.exists()) setLiveData(snap.data());
    });
  }, []);

  const approve = async (draft: Draft) => {
    setProcessingId(draft.id);
    try {
      // [SPEC-CMS-HISTORY-01] Toute publication approuvée archive aussi la version précédente.
      await publishCmsPageRevision(draft.data, "draft", draft.scope, draft.baseVersion);
      // Supprime le draft après publication
      await deleteDoc(doc(db, "cms_drafts", draft.id));
      setFeedback({
        id: draft.id,
        msg: "✅ Modification publiée avec succès !",
        ok: true,
      });
      setExpandedDraft(null);
    } catch (err: any) {
      setFeedback({ id: draft.id, msg: `Erreur : ${err.message}`, ok: false });
    }
    setProcessingId(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const reject = async (draft: Draft) => {
    if (!rejectComment.trim()) {
      alert("Veuillez saisir un motif de rejet avant de confirmer.");
      return;
    }
    setProcessingId(draft.id);
    try {
      await updateDoc(doc(db, "cms_drafts", draft.id), {
        status: "rejected",
        reviewComment: rejectComment.trim(),
        reviewedAt: Timestamp.now(),
      });
      setFeedback({
        id: draft.id,
        msg: "Révision rejetée. L'éditeur sera notifié.",
        ok: true,
      });
      setRejectComment("");
      setExpandedDraft(null);
    } catch (err: any) {
      setFeedback({ id: draft.id, msg: `Erreur : ${err.message}`, ok: false });
    }
    setProcessingId(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  if (drafts.length === 0) {
    return (
      <div className="flex items-center gap-3 text-stone-500 text-sm bg-stone-50 border border-stone-200 rounded-xl px-5 py-4">
        <CheckCircle2 size={18} className="text-emerald-500" />
        Aucune révision en attente — tout est à jour.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => {
        const isExpanded = expandedDraft === draft.id;
        const submittedAt = draft.submittedAt?.toDate?.();

        return (
          <div
            key={draft.id}
            className="border border-amber-200 rounded-2xl overflow-hidden shadow-sm bg-white"
          >
            {/* En-tête du brouillon */}
            <div className="bg-amber-50 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-stone-900 text-sm">
                    {draft.scope === "homeActionPlan"
                      ? "Révision du plan d’action de l’accueil"
                      : "Révision de la page"}{" "}
                    {draft.scope !== "homeActionPlan" && (
                      <span className="font-mono text-amber-700">{draft.pageId}</span>
                    )}
                    {draft.baseVersion !== undefined && (
                      <span className="ml-2 text-amber-800">v{draft.baseVersion + 1} proposée</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <User size={11} />
                    <span>{draft.submittedBy}</span>
                    {submittedAt && (
                      <>
                        <span>·</span>
                        <span>
                          {submittedAt.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExpandedDraft(isExpanded ? null : draft.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Masquer les détails" : "Voir les modifications"}
              >
                <FileText size={13} />
                {isExpanded ? "Masquer" : "Voir les modifications"}
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Feedback */}
            {feedback?.id === draft.id && (
              <div
                className={`px-5 py-3 text-sm font-medium ${feedback.ok ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200" : "bg-rose-50 text-rose-800 border-b border-rose-200"}`}
              >
                {feedback.msg}
              </div>
            )}

            {/* Zone de diff + actions */}
            {isExpanded && (
              <div className="p-5 space-y-5">
                {draft.reviewNote && (
                  <p
                    className="rounded-md border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                    role="note"
                  >
                    {draft.reviewNote}
                  </p>
                )}
                {/* Toggle résumé/détails pour le diff */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-stone-500">Mode aperçu :</span>
                  <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      onClick={() => setIsSimplified(false)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!isSimplified ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => setIsSimplified(true)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${isSimplified ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}
                    >
                      Résumé
                    </button>
                  </div>
                </div>

                {/* [SPEC-HOME-ACTION-PLAN-01] A scoped plan draft previews only its own field. */}
                {draft.scope === "homeActionPlan" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <PlanPreview title="Plan publié" value={liveData?.homeActionPlan} />
                    <PlanPreview title="Plan proposé" value={draft.data?.homeActionPlan} proposed />
                  </div>
                ) : (
                  /* Diff côte à côte */
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-stone-200">
                      {/* Colonne gauche : version publiée */}
                      <div>
                        <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center gap-2">
                          <Eye size={13} className="text-stone-500" />
                          <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                            Version actuelle (publiée)
                          </span>
                        </div>
                        <div className="overflow-x-hidden bg-stone-50">
                          {liveData?.blocks?.map((block: any, idx: number) => (
                            <div key={idx} className="border-b border-stone-100 last:border-0">
                              <BlockRenderer
                                block={block}
                                context={{
                                  isSimplified,
                                  setActiveTopic: () => {},
                                  commentCounts: {},
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Colonne droite : version proposée */}
                      <div>
                        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                          <Clock size={13} className="text-amber-600" />
                          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                            Version proposée
                          </span>
                        </div>
                        <div className="overflow-x-hidden bg-amber-50/30">
                          {draft.data?.blocks?.map((block: any, idx: number) => (
                            <div key={idx} className="border-b border-amber-100 last:border-0">
                              <BlockRenderer
                                block={block}
                                context={{
                                  isSimplified,
                                  setActiveTopic: () => {},
                                  commentCounts: {},
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zone de rejet */}
                <div className="space-y-2">
                  <label
                    className="text-xs font-medium text-stone-600"
                    htmlFor={`reject-comment-${draft.id}`}
                  >
                    Motif de rejet (obligatoire pour rejeter) :
                  </label>
                  <textarea
                    id={`reject-comment-${draft.id}`}
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Ex: Le montant affiché est incorrect, merci de corriger..."
                    className="input-base h-20 text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-stone-200">
                  <button
                    onClick={() => approve(draft)}
                    disabled={!!processingId}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                    aria-label="Approuver et publier les modifications"
                  >
                    <CheckCircle2 size={16} />
                    {processingId === draft.id ? "Publication..." : "Approuver et publier"}
                  </button>
                  <button
                    onClick={() => reject(draft)}
                    disabled={!!processingId}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-bold text-sm rounded-xl transition-colors"
                    aria-label="Rejeter les modifications"
                  >
                    <XCircle size={16} />
                    Rejeter
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlanPreview({
  title,
  value,
  proposed = false,
}: {
  title: string;
  value: unknown;
  proposed?: boolean;
}) {
  const entries = normalizeHomeActionPlan(value);

  return (
    <section
      aria-label={title}
      className={`border p-4 ${proposed ? "border-amber-200 bg-amber-50/30" : "border-stone-200 bg-stone-50"}`}
    >
      <h3 className="mb-3 text-sm font-bold text-stone-800">{title}</h3>
      {entries.length ? (
        <ol className="space-y-3">
          {entries.map((entry, index) => (
            <li key={`${entry.date}-${index}`} className="border-t border-stone-200 pt-3">
              <p className="text-xs font-semibold text-emerald-800">{entry.date}</p>
              <p className="font-bold text-stone-900">{entry.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{entry.description}</p>
              <p className="mt-1 text-xs text-stone-500">État : {entry.status}</p>
              {entry.linkUrl && (
                <p className="mt-1 break-all text-xs text-stone-500">Lien : {entry.linkUrl}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-stone-500">Aucune étape.</p>
      )}
    </section>
  );
}
