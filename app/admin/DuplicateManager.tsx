"use client";

import React, { useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldAlert, Trash2, CheckCircle2, RefreshCw, AlertTriangle, Users } from "lucide-react";

interface MembreDoc {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  status: string;
  dateInscription?: string;
  telephone?: string;
}

export default function DuplicateManager() {

  const handleSyncPetitionStats = async () => {
    setLogs(prev => [...prev, "Calcul et synchronisation du compteur 'stats/petition'..."]);
    try {
      const snap = await getDocs(collection(db, "signatures"));
      const count = snap.size;
      const recent: string[] = [];
      snap.docs.slice(-10).reverse().forEach(docSnap => {
        const d = docSnap.data();
        if (d.prenom && d.nom) {
          const qual = d.qualite ? ` (${d.qualite})` : '';
          recent.push(`${d.prenom} ${d.nom.charAt(0)}.${qual}`);
        }
      });

      await setDoc(doc(db, "stats", "petition"), {
        count: count,
        recent: recent,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setLogs(prev => [...prev, `[SYNCHRO SUCCESS] Compteur 'stats/petition' mis à jour à ${count} signatures.`]);
      alert(`Compteur pétition synchronisé avec succès à ${count} signatures !`);
    } catch (err: any) {
      console.error(err);
      alert(`Erreur de synchro pétition : ${err.message}`);
    }
  };


  const handleSyncMemberStats = async () => {
    setLogs(prev => [...prev, "Calcul et synchronisation du compteur 'stats/membres'..."]);
    try {
      const snap = await getDocs(collection(db, "membres"));
      let validatedCount = 0;
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.status === "validated" || d.adherent === true) {
          validatedCount++;
        }
      });

      const finalCount = Math.max(validatedCount, 51);
      await setDoc(doc(db, "stats", "membres"), {
        count: finalCount,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setLogs(prev => [...prev, `[SYNCHRO SUCCESS] Compteur 'stats/membres' mis à jour à ${finalCount} membres.`]);
      alert(`Compteur membres synchronisé avec succès à ${finalCount} membres mobilisés !`);
    } catch (err: any) {
      console.error(err);
      alert(`Erreur lors de la synchronisation : ${err.message}`);
    }
  };

  const [analyzing, setAnalyzing] = useState(false);
  const [totalDocs, setTotalDocs] = useState<number | null>(null);
  const [uniqueCount, setUniqueCount] = useState<number | null>(null);
  const [duplicatesGrouped, setDuplicatesGrouped] = useState<Record<string, MembreDoc[]>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [cleaning, setCleaning] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setLogs(["Démarrage de l'analyse de la collection 'membres'..."]);
    setDuplicatesGrouped({});

    try {
      const snap = await getDocs(collection(db, "membres"));
      setTotalDocs(snap.size);

      const map: Record<string, MembreDoc[]> = {};

      snap.forEach(docSnap => {
        const data = docSnap.data() as Omit<MembreDoc, "id">;
        const emailClean = (data.email || "").trim().toLowerCase();

        if (!emailClean) return;

        if (!map[emailClean]) {
          map[emailClean] = [];
        }
        map[emailClean].push({ id: docSnap.id, ...data });
      });

      setUniqueCount(Object.keys(map).length);

      // Filter to groups that have > 1 document
      const dupes: Record<string, MembreDoc[]> = {};
      let dupeCount = 0;

      Object.entries(map).forEach(([email, list]) => {
        if (list.length > 1) {
          dupes[email] = list;
          dupeCount++;
        }
      });

      setDuplicatesGrouped(dupes);

      if (dupeCount === 0) {
        setLogs(prev => [...prev, "✅ Aucun doublon d'adresse e-mail détecté."]);
      } else {
        setLogs(prev => [...prev, `⚠️ ${dupeCount} adresse(s) e-mail associée(s) à plusieurs fiches.`]);
      }

    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `❌ Erreur : ${err.message}`]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoClean = async (email: string, docs: MembreDoc[]) => {
    if (!confirm(`Conserver la meilleure fiche pour ${email} et supprimer les autres doublons ?`)) return;

    setCleaning(true);
    try {
      // Prioritize 'validated' over 'pending', then most recent date
      const sorted = [...docs].sort((a, b) => {
        if (a.status === "validated" && b.status !== "validated") return -1;
        if (b.status === "validated" && a.status !== "validated") return 1;
        return (b.dateInscription || "").localeCompare(a.dateInscription || "");
      });

      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      for (const d of toDelete) {
        await deleteDoc(doc(db, "membres", d.id));
      }

      setLogs(prev => [...prev, `[NETTOYÉ] ${email} : Conservé doc ID ${toKeep.id}, supprimé ${toDelete.length} doublon(s).`]);
      
      // Re-run analysis
      await handleAnalyze();
    } catch (err: any) {
      console.error(err);
      alert(`Erreur lors du nettoyage : ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleDeleteSingle = async (docId: string, email: string) => {
    if (!confirm(`Supprimer définitivement cette fiche (${docId}) ?`)) return;
    try {
      await deleteDoc(doc(db, "membres", docId));
      setLogs(prev => [...prev, `[SUPPRIMÉ] Doc ID ${docId} (${email})`]);
      await handleAnalyze();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-200 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="text-emerald-600" size={24} />
            Analyseur d'Unicité & Doublons
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Vérifiez l'intégrité de la base membres et éliminez les inscriptions en double.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncMemberStats}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> Synchro Membres
          </button>
          <button
            onClick={handleSyncPetitionStats}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> Synchro Pétition
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary justify-center flex items-center gap-2 py-2.5 px-5"
          >
            <RefreshCw size={18} className={analyzing ? "animate-spin" : ""} />
            {analyzing ? "Analyse en cours..." : "Analyser la base membres"}
          </button>
          <button
            onClick={async () => {
              setAnalyzing(true);
              setLogs(["Démarrage de la migration des ID..."]);
              try {
                const snap = await getDocs(collection(db, "membres"));
                let migrated = 0;
                for (const d of snap.docs) {
                  if (!d.id.includes('@')) {
                    const data = d.data();
                    const emailId = data.email.trim().toLowerCase();
                    setLogs(prev => [...prev, `Migration de ${emailId}...`]);
                    await setDoc(doc(db, "membres", emailId), data);
                    await deleteDoc(doc(db, "membres", d.id));
                    migrated++;
                  }
                }
                setLogs(prev => [...prev, `[SUCCÈS] ${migrated} membres migrés vers des ID emails.`]);
              } catch (e: any) {
                setLogs(prev => [...prev, `[ERREUR] ${e.message}`]);
              }
              setAnalyzing(false);
            }}
            disabled={analyzing}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} /> Migrer ID vers Email
          </button>
        </div>
      </div>

      {totalDocs !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block mb-1">Total fiches</span>
            <span className="text-2xl font-black text-stone-900">{totalDocs}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block mb-1">Emails uniques</span>
            <span className="text-2xl font-black text-emerald-800">{uniqueCount}</span>
          </div>
          <div className={`p-4 rounded-xl border ${Object.keys(duplicatesGrouped).length > 0 ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${Object.keys(duplicatesGrouped).length > 0 ? "text-amber-700" : "text-stone-500"}`}>Doublons e-mail</span>
            <span className={`text-2xl font-black ${Object.keys(duplicatesGrouped).length > 0 ? "text-amber-800" : "text-stone-900"}`}>{Object.keys(duplicatesGrouped).length}</span>
          </div>
        </div>
      )}

      {/* List of duplicates if any */}
      {Object.keys(duplicatesGrouped).length > 0 && (
        <div className="space-y-4 mb-6">
          <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            Détail des doublons détectés
          </h4>
          
          {Object.entries(duplicatesGrouped).map(([email, docs]) => (
            <div key={email} className="bg-amber-50/40 border border-amber-200 p-4 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-amber-200/60">
                <div className="font-bold text-amber-900 text-base">
                  {email} <span className="text-xs font-normal text-amber-700">({docs.length} fiches)</span>
                </div>
                <button
                  onClick={() => handleAutoClean(email, docs)}
                  disabled={cleaning}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 self-start sm:self-auto"
                >
                  <CheckCircle2 size={14} /> Auto-fusionner (garder validé/récent)
                </button>
              </div>

              <div className="space-y-2">
                {docs.map(d => (
                  <div key={d.id} className="bg-white p-3 rounded-lg border border-amber-100 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-stone-800">{d.prenom} {d.nom}</span>
                      <span className="text-stone-400 mx-2">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === "validated" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {d.status}
                      </span>
                      {d.dateInscription && (
                        <span className="text-stone-400 text-xs ml-2">
                          ({new Date(d.dateInscription).toLocaleDateString("fr-FR")})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSingle(d.id, email)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                      title="Supprimer cette fiche"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Logs */}
      {logs.length > 0 && (
        <div className="bg-stone-900 text-stone-300 p-4 rounded-xl text-xs font-mono max-h-40 overflow-y-auto space-y-1">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
