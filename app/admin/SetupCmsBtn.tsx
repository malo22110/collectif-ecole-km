"use client";

import React, { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import timelineData from "@/data/timeline.json";

export default function SetupCmsBtn() {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const pageData = {
        header: {
          title: "Historique & Analyse du Projet",
          subtitle: "Chronologie des décisions et analyse financière complète basée exclusivement sur les actes officiels de la mairie (procès-verbaux du conseil municipal, arrêtés de subventions, et dossiers de demande à l'État)."
        },
        blocks: [
          {
            type: "alert",
            data: {
              style: "warning",
              text: "Ce document de synthèse est **en cours de validation par la communauté**. Les membres du collectif peuvent apporter leurs corrections et débattre en utilisant les boutons \"Commenter\" disponibles à chaque section, ou dans l'espace général en bas de page."
            }
          },
          {
            type: "alert",
            data: {
              style: "info",
              title: "📌 Transparence et périmètre de l'analyse",
              text: "L'étude financière et la chronologie présentées ci-dessous s'appuient rigoureusement sur les actes officiels et les contrats validés jusqu'en mars 2026, date de fin de la précédente mandature. Le collectif a désormais pour mission de se rapprocher de l'actuelle municipalité afin d'obtenir les éventuelles factures et délibérations des six derniers mois (d'avril à septembre 2026). Ces documents permettront d'actualiser le chiffrage exact des dépenses déjà engagées, sachant que toute nouvelle facture réglée depuis le printemps ne fera qu'augmenter le montant de la perte sèche estimée aujourd'hui à plus de 70 000 €."
            }
          },
          {
            type: "financial",
            data: {}
          },
          {
            type: "timeline",
            data: { items: timelineData }
          },
          {
            type: "lexicon",
            data: {
              items: [
                { title: "AMO (Assistant à Maîtrise d'Ouvrage)", desc: "Expert technique/financier accompagnant la mairie dans le pilotage du projet et la recherche de subventions." },
                { title: "Maîtrise d'Œuvre (Architectes, BET)", desc: "Équipe concevant les plans et dirigeant les travaux." },
                { title: "APS & APD", desc: "**APS :** Avant-Projet Sommaire (Esquisses/1er chiffrage).<br/>**APD :** Avant-Projet Définitif (Plans détaillés/Budget final)." },
                { title: "DETR / DSIL", desc: "Subvention de l'État exigeant des performances énergétiques strictes. L'école est éligible via le Fonds Vert." },
                { title: "BDB (Bâtiment Durable Breton)", desc: "Démarche qualitative valorisant l'écoconstruction, conditionnant les 60 450 € d'aides régionales." },
                { title: "SCIC (Koad COB)", desc: "Réseau local de chaleur au bois." }
              ]
            }
          }
        ]
      };

      await setDoc(doc(db, "pages", "historique"), pageData);
      alert("✅ Migration CMS réussie ! La base de données est initialisée.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la migration CMS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-amber-50 rounded-2xl shadow-sm border border-amber-200 overflow-hidden p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-bold text-amber-900 text-lg">Setup CMS (Mode Développeur)</h3>
        <p className="text-amber-700 text-sm mt-1">
          Génère le document `pages/historique` dans Firestore avec les données en dur actuelles. À n'utiliser qu'une seule fois.
        </p>
      </div>
      <button 
        onClick={handleSetup}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 shrink-0"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
        Lancer la migration CMS
      </button>
    </div>
  );
}
