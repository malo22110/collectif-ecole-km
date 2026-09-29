"use client";

import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, ArrowUp, ArrowDown, GripVertical, CheckCircle2, Eye } from "lucide-react";
import BlockRenderer from "../components/cms/BlockRenderer";

const BLOCK_DEFAULTS: Record<string, any> = {
  financial_overview: {
    zoomTitle: "🔎 Zoom Financier : Comprendre les 127 110 € d'études et le risque de perte réelle (plus de 70 000 €)",
    zoomIntro: "Il est crucial de clarifier les chiffres liés aux études d'ingénierie pour sortir des approximations. Trois montants différents existent, ils sont tous justes mais ne correspondent pas à la même chose :",
    point1: "127 110 € HT (Le montant provisionné dans les PV)* : C'est la somme historique annoncée et figée dans les conseils municipaux à partir de septembre 2025. Elle représente l'enveloppe globale que la mairie a budgétée à ce moment-là. (C'est ce chiffre avec un astérisque qui figure dans la frise chronologique ci-dessous par souci de fidélité aux PV).",
    point2: "133 533 € HT (Le détail réel jusqu'à la fin du chantier) : C'est le coût total exhaustif de toutes les études si le projet va à son terme. L'analyse des devis montre que cette somme, bien qu'impressionnante (24 % des travaux), est incontournable.",
    point3: "plus de 70 000 € HT (Le risque de perte sèche immédiate) : C'est le montant des prestations effectivement réalisées à ce jour (stade APD). Si la mairie annule le projet demain, elle ne paiera pas 133 000 €, mais elle devra obligatoirement payer ces 70 000 € au titre du \"service fait\". C'est cet argent qui sera jeté par les fenêtres en cas d'abandon.",
    subventionsTitle: "Subventions actées ou déposées : 340 000 €",
    subventionsIntro: "Le plan de financement repose sur trois leviers exigeant une rénovation globale (baisse de 40 % de la consommation d'énergie) :",
    sub1: "Département des Côtes-d'Armor (Sécurisé) : 99 405 €",
    sub2: "Région Bretagne (Sécurisé sous condition) : 60 450 € (Conditionné à la démarche BDB abordée plus haut).",
    sub3: "État - DETR / DSIL (Dossier déposé) : 180 145 € (Dossier n° 21386559 basé sur le projet ciblé à 550 000 € HT).",
    evolutionTitle: "L'évolution de l'estimation de la maîtrise d'œuvre (APD) : 735 489,05 € HT",
    evolutionText: "Alors que la commande initiale visait un projet à 550 000 € HT, les chiffrages successifs de l'Avant-Projet Définitif (APD) ont atteint 735 489 € HT (615 278 € pour la Phase 1 et 120 210 € pour la Phase 2), nécessitant le recadrage budgétaire actuel.",
    simplifiedRisk: "C'est le coût des études (diagnostics, architectes) déjà réalisées à ce jour. Si on abandonne l'école, la mairie devra quand même payer cette somme (règle légale du \"service fait\"). Au moins 70 000 € d'argent public seront perdus dans le vide.",
    simplifiedSolution: "Continuer le projet d'ajustement permet de rentabiliser ces plus de 70 000 € d'études et de sécuriser 340 000 € de subventions, ramenant le reste à charge des travaux à environ 212 000 €, ce qui est largement dans la capacité de la commune.",
  },
  options_comparison: {
    opt1Title: "Option 1 : L'ajustement (550 000 €)", opt1Desc: "L'avenant de 2 170 € permet d'intégrer les modifications techniques visant à ramener le coût des travaux au budget de 550 000 € HT déposé en Préfecture.", opt1Total: "212 170 € HT",
    opt2Title: "Option 2 : Refonte totale", opt2Desc: "Résiliation des contrats en cours et relance d'un nouveau projet réduit.", opt2Total: "~ 154 000 € HT min.",
    opt3Title: "Option 3 : Abandon de l'opération", opt3Desc: "Gel total des travaux et report à une date indéterminée.", opt3Total: "~ 74 000 € HT",
    opt4Title: "Option 4 : Le Saupoudrage", opt4Desc: "Travaux d'urgence (radon, électricité) sans traitement de l'enveloppe thermique.", opt4Total: "~ 120 000 € HT",
  },
  stress_test: {
    simplifiedSummary: "Quel que soit le scénario, abandonner ou refaire le projet à zéro coûte plus cher à la commune que de continuer, en raison des 70 000 € d'études déjà réalisées qu'il faudra payer en pure perte, et des 340 000 € de subventions qui seront annulées. L'Option 1 (Ajustement) est la seule viable financièrement.",
  },
  conclusion: {
    title: "Conclusion Objective : Pourquoi l'Option 1 s'impose",
    intro: "Toute analyse budgétaire rigoureuse menée sur ce dossier aboutit à la même conclusion technique et financière : l'Option 1 (l'ajustement à l'enveloppe initiale de 550 000 € HT) est la seule voie viable pour la commune, pour trois raisons mathématiques et légales :",
    reason1Title: "La valorisation des dépenses engagées :", reason1: "La commune a déjà contracté pour au minimum 70 000 € d'études et de diagnostics facturables au titre du service fait à ce stade du projet. Choisir l'abandon ou la refonte revient à solder ces factures avec les impôts locaux pour obtenir un résultat matériel nul. L'Option 1 est la seule qui transforme cette dépense inéluctable en investissement utile.",
    reason2Title: "L'effet levier des subventions :", reason2: "Les 340 000 € d'aides extérieures sont strictement conditionnés à une rénovation globale générant 40 % d'économie d'énergie. Abandonner l'Avant-Projet Définitif annule mécaniquement ces aides. Faire \"moins cher\" en rafistolant ou \"repartir de zéro\" obligerait la commune à payer la totalité des futurs travaux sur ses fonds propres, ce qui saturerait instantanément sa capacité d'emprunt de 400 000 €.",
    reason3Title: "L'incompressibilité des normes :", reason3: "Le bâtiment souffre de vulnérabilités légales et sanitaires avérées (radon, accessibilité, amiante/plomb, isolation). Le saupoudrage n'est qu'un expédient temporaire. L'État finira par exiger une mise aux normes complète, obligeant la commune à relancer un projet global dans quelques années, avec des coûts d'ingénierie à repayer de zéro et des coûts de construction gonflés par l'inflation.",
    summary: "Mathématiquement, le refus de l'Option 1 revient à endetter le village pour régler des frais d'architectes et des indemnités d'abandon, tout en conservant une école qui se dégrade. À l'inverse, l'Option 1 protège les finances locales en faisant financer plus de 60 % du chantier par la Région, le Département et l'État.",
    simplifiedText: "Refuser l'Option 1 revient à endetter le village d'au minimum 70 000 € dans le vide pour des plans inutilisés, tout en gardant une école qui se dégrade et perd ses subventions. À l'inverse, l'Option 1 protège les finances de la commune en faisant financer plus de 60 % du chantier par l'État, la Région et le Département.",
  },
};

function mergeBlocksWithDefaults(blocks: any[]): any[] {
  return blocks.map((block: any) => {
    const def = BLOCK_DEFAULTS[block.type];
    if (!def) return block;
    return { ...block, data: { ...def, ...(block.data || {}) } };
  });
}

export default function VisualCmsEditor({ pageId = "historique", onDirtyChange, onPageDataChange, showPreview = false, isSimplified = false }: { pageId?: string; onDirtyChange?: (dirty: boolean) => void; onPageDataChange?: (data: any) => void; showPreview?: boolean; isSimplified?: boolean }) {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalRef = useRef<string>("");

  useEffect(() => { fetchPage(); }, [pageId]);

  // Alerte navigateur si on quitte avec des modifications non sauvegardées
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "pages", pageId));
      if (snap.exists()) {
        const raw = snap.data();
        const merged = { ...raw, blocks: mergeBlocksWithDefaults(raw.blocks || []) };
        setPageData(merged);
        originalRef.current = JSON.stringify(merged);
        setIsDirty(false);
        onPageDataChange?.(merged);
      } else {
        setError("Page introuvable.");
      }
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "pages", pageId), pageData);
      setSaved(true);
      setIsDirty(false);
      originalRef.current = JSON.stringify(pageData);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const updateBlock = (index: number, newBlock: any) => {
    const newBlocks = [...pageData.blocks];
    newBlocks[index] = newBlock;
    const next = { ...pageData, blocks: newBlocks };
    setPageData(next);
    setIsDirty(JSON.stringify(next) !== originalRef.current);
    onPageDataChange?.(next);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pageData.blocks.length - 1) return;
    const newBlocks = [...pageData.blocks];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    const next = { ...pageData, blocks: newBlocks };
    setPageData(next);
    setIsDirty(JSON.stringify(next) !== originalRef.current);
    onPageDataChange?.(next);
  };


  if (loading) return <div className="p-6 text-stone-500">Chargement de l'éditeur...</div>;
  if (!pageData) return <div className="p-6 text-rose-500">{error}</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 mt-8">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-stone-900">Éditeur Visuel : Page Historique</h3>
          {isDirty && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
              Modifications non sauvegardées
            </span>
          )}
          {saved && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> Sauvegardé !
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDirty ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
        >
          <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>


      {/* Block list: each block renders editor + preview in the same row */}
      <div className="divide-y divide-stone-200">
        {pageData.blocks.map((block: any, index: number) => (
          <div key={index} className={`flex min-h-0 ${showPreview ? 'flex-row' : 'flex-col'}`}>

            {/* ── Left: editor form ── */}
            <div className={`${showPreview ? 'w-1/2 border-r border-stone-200' : 'w-full'} flex flex-col`}>
              {/* Block header */}
              <div className="bg-stone-100 px-4 py-3 border-b border-stone-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <GripVertical size={18} className="text-stone-400" />
                  <span className="font-bold text-stone-700 capitalize">{block.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => moveBlock(index, 'up')} className="p-1.5 hover:bg-stone-200 rounded" aria-label="Monter le bloc"><ArrowUp size={16} /></button>
                  <button onClick={() => moveBlock(index, 'down')} className="p-1.5 hover:bg-stone-200 rounded" aria-label="Descendre le bloc"><ArrowDown size={16} /></button>
                </div>
              </div>

              {/* Form body */}
              <div className="p-4 bg-white flex-1">

                {block.type === 'alert' && (
                  <div className="space-y-4">
                    <div>
                      <label className="input-label">Type d'alerte</label>
                      <select
                        value={block.data.style || 'info'}
                        onChange={e => updateBlock(index, { ...block, data: { ...block.data, style: e.target.value } })}
                        className="input-base"
                      >
                        <option value="info">Information (Bleu)</option>
                        <option value="warning">Avertissement (Jaune)</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Titre (optionnel)</label>
                      <input
                        type="text"
                        value={block.data.title || ''}
                        onChange={e => updateBlock(index, { ...block, data: { ...block.data, title: e.target.value } })}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="input-label">Texte</label>
                      <textarea
                        value={block.data.text || ''}
                        onChange={e => updateBlock(index, { ...block, data: { ...block.data, text: e.target.value } })}
                        className="input-base h-24"
                      />
                    </div>
                  </div>
                )}

                {block.type === 'financial_overview' && (
                  <div className="space-y-5">
                    <p className="text-xs text-stone-400 italic">Laissez un champ vide pour conserver la valeur par défaut.</p>
                    <Section label="🔎 Titre de la section Zoom Financier">
                      <textarea className="input-base h-16 text-sm" value={block.data.zoomTitle||''} placeholder="🔎 Zoom Financier : …" onChange={e=>updateBlock(index,{...block,data:{...block.data,zoomTitle:e.target.value}})}/>
                    </Section>
                    <Section label="Phrase d'introduction du Zoom">
                      <textarea className="input-base h-16 text-sm" value={block.data.zoomIntro||''} placeholder="Il est crucial de clarifier…" onChange={e=>updateBlock(index,{...block,data:{...block.data,zoomIntro:e.target.value}})}/>
                    </Section>
                    <Section label="Point 1 (127 110 €)">
                      <textarea className="input-base h-20 text-sm" value={block.data.point1||''} placeholder="127 110 € HT (Le montant…)" onChange={e=>updateBlock(index,{...block,data:{...block.data,point1:e.target.value}})}/>
                    </Section>
                    <Section label="Point 2 (133 533 €)">
                      <textarea className="input-base h-20 text-sm" value={block.data.point2||''} placeholder="133 533 € HT (Le détail…)" onChange={e=>updateBlock(index,{...block,data:{...block.data,point2:e.target.value}})}/>
                    </Section>
                    <Section label="Point 3 (plus de 70 000 €)">
                      <textarea className="input-base h-24 text-sm" value={block.data.point3||''} placeholder="plus de 70 000 € HT (Le risque…)" onChange={e=>updateBlock(index,{...block,data:{...block.data,point3:e.target.value}})}/>
                    </Section>
                    <Section label="Titre Subventions">
                      <input className="input-base text-sm" value={block.data.subventionsTitle||''} placeholder="Subventions actées…" onChange={e=>updateBlock(index,{...block,data:{...block.data,subventionsTitle:e.target.value}})}/>
                    </Section>
                    <Section label="Intro Subventions">
                      <textarea className="input-base h-16 text-sm" value={block.data.subventionsIntro||''} placeholder="Le plan de financement…" onChange={e=>updateBlock(index,{...block,data:{...block.data,subventionsIntro:e.target.value}})}/>
                    </Section>
                    {(['sub1','sub2','sub3'] as const).map((k,i) => (
                      <Section key={k} label={`Subvention ${i+1}`}>
                        <textarea className="input-base h-16 text-sm" value={block.data[k]||''} placeholder={`Subvention ${i+1}…`} onChange={e=>updateBlock(index,{...block,data:{...block.data,[k]:e.target.value}})}/>
                      </Section>
                    ))}
                    <Section label="Titre Évolution estimation APD">
                      <input className="input-base text-sm" value={block.data.evolutionTitle||''} placeholder="L'évolution de l'estimation…" onChange={e=>updateBlock(index,{...block,data:{...block.data,evolutionTitle:e.target.value}})}/>
                    </Section>
                    <Section label="Texte Évolution APD">
                      <textarea className="input-base h-20 text-sm" value={block.data.evolutionText||''} placeholder="Alors que la commande initiale…" onChange={e=>updateBlock(index,{...block,data:{...block.data,evolutionText:e.target.value}})}/>
                    </Section>
                    <div className="border-t border-stone-200 pt-4 mt-4">
                      <p className="text-xs font-bold text-stone-500 uppercase mb-3">Version Résumée (vue simplifiée)</p>
                      <Section label="Risque immédiat (résumé)">
                        <textarea className="input-base h-20 text-sm" value={block.data.simplifiedRisk||''} placeholder="C'est le coût des études…" onChange={e=>updateBlock(index,{...block,data:{...block.data,simplifiedRisk:e.target.value}})}/>
                      </Section>
                      <Section label="Solution Option 1 (résumé)">
                        <textarea className="input-base h-20 text-sm" value={block.data.simplifiedSolution||''} placeholder="Continuer le projet…" onChange={e=>updateBlock(index,{...block,data:{...block.data,simplifiedSolution:e.target.value}})}/>
                      </Section>
                    </div>
                  </div>
                )}

                {block.type === 'options_comparison' && (
                  <div className="space-y-5">
                    <p className="text-xs text-stone-400 italic">Vous pouvez modifier le titre et les descriptions de chacune des 4 options. Laissez un champ vide pour conserver les valeurs par défaut.</p>
                    {[
                      {key:'opt1Title', label:'Titre Option 1', ph:'Option 1 : L\'ajustement (550 000 €)'},
                      {key:'opt1Desc', label:'Description Option 1', ph:'L\'avenant de 2 170 €…', area:true},
                      {key:'opt1Total', label:'Reste à charge Option 1', ph:'212 170 € HT'},
                      {key:'opt2Title', label:'Titre Option 2', ph:'Option 2 : Refonte totale'},
                      {key:'opt2Desc', label:'Description Option 2', ph:'Résiliation des contrats…', area:true},
                      {key:'opt2Total', label:'Reste à charge Option 2', ph:'~ 154 000 € HT min.'},
                      {key:'opt3Title', label:'Titre Option 3', ph:'Option 3 : Abandon'},
                      {key:'opt3Desc', label:'Description Option 3', ph:'Gel total des travaux…', area:true},
                      {key:'opt3Total', label:'Reste à charge Option 3', ph:'~ 74 000 € HT'},
                      {key:'opt4Title', label:'Titre Option 4', ph:'Option 4 : Le Saupoudrage'},
                      {key:'opt4Desc', label:'Description Option 4', ph:'Travaux d\'urgence…', area:true},
                      {key:'opt4Total', label:'Coût net Option 4', ph:'~ 120 000 € HT'},
                    ].map(({key,label,ph,area}) => (
                      <Section key={key} label={label}>
                        {area
                          ? <textarea className="input-base h-16 text-sm" value={block.data[key]||''} placeholder={ph} onChange={e=>updateBlock(index,{...block,data:{...block.data,[key]:e.target.value}})}/>
                          : <input className="input-base text-sm" value={block.data[key]||''} placeholder={ph} onChange={e=>updateBlock(index,{...block,data:{...block.data,[key]:e.target.value}})}/>
                        }
                      </Section>
                    ))}
                  </div>
                )}

                {block.type === 'stress_test' && (
                  <div className="space-y-4">
                    <p className="text-xs text-stone-400 italic">Modifiez le résumé du Stress Test (version simplifiée).</p>
                    <Section label="Résumé (vue Version Courte)">
                      <textarea className="input-base h-24 text-sm" value={block.data.simplifiedSummary||''} placeholder="Quel que soit le scénario, abandonner ou refaire le projet à zéro coûte plus cher…" onChange={e=>updateBlock(index,{...block,data:{...block.data,simplifiedSummary:e.target.value}})}/>
                    </Section>
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">Le tableau détaillé (vue Détails Complets) est volontairement non modifiable ici car ses colonnes sont interdépendantes. Utilisez le Mode Expert (JSON) si vous devez modifier les cellules du tableau.</p>
                  </div>
                )}

                {block.type === 'conclusion' && (
                  <div className="space-y-5">
                    <p className="text-xs text-stone-400 italic">Laissez un champ vide pour conserver la valeur par défaut.</p>
                    <Section label="Titre de la conclusion">
                      <input className="input-base text-sm" value={block.data.title||''} placeholder="Conclusion Objective : Pourquoi l'Option 1 s'impose" onChange={e=>updateBlock(index,{...block,data:{...block.data,title:e.target.value}})}/>
                    </Section>
                    <Section label="Phrase d'introduction">
                      <textarea className="input-base h-20 text-sm" value={block.data.intro||''} placeholder="Toute analyse budgétaire rigoureuse…" onChange={e=>updateBlock(index,{...block,data:{...block.data,intro:e.target.value}})}/>
                    </Section>
                    <Section label="Titre raison 1">
                      <input className="input-base text-sm" value={block.data.reason1Title||''} placeholder="La valorisation des dépenses engagées :" onChange={e=>updateBlock(index,{...block,data:{...block.data,reason1Title:e.target.value}})}/>
                    </Section>
                    <Section label="Texte raison 1">
                      <textarea className="input-base h-20 text-sm" value={block.data.reason1||''} placeholder="La commune a déjà contracté…" onChange={e=>updateBlock(index,{...block,data:{...block.data,reason1:e.target.value}})}/>
                    </Section>
                    <Section label="Titre raison 2">
                      <input className="input-base text-sm" value={block.data.reason2Title||''} placeholder="L'effet levier des subventions :" onChange={e=>updateBlock(index,{...block,data:{...block.data,reason2Title:e.target.value}})}/>
                    </Section>
                    <Section label="Texte raison 2">
                      <textarea className="input-base h-20 text-sm" value={block.data.reason2||''} placeholder="Les 340 000 € d'aides extérieures…" onChange={e=>updateBlock(index,{...block,data:{...block.data,reason2:e.target.value}})}/>
                    </Section>
                    <Section label="Titre raison 3">
                      <input className="input-base text-sm" value={block.data.reason3Title||''} placeholder="L'incompressibilité des normes :" onChange={e=>updateBlock(index,{...block,data:{...block.data,reason3Title:e.target.value}})}/>
                    </Section>
                    <Section label="Texte raison 3">
                      <textarea className="input-base h-20 text-sm" value={block.data.reason3||''} placeholder="Le bâtiment souffre de vulnérabilités…" onChange={e=>updateBlock(index,{...block,data:{...block.data,reason3:e.target.value}})}/>
                    </Section>
                    <Section label="Phrase de synthèse finale (détails)">
                      <textarea className="input-base h-20 text-sm" value={block.data.summary||''} placeholder="Mathématiquement, le refus de l'Option 1…" onChange={e=>updateBlock(index,{...block,data:{...block.data,summary:e.target.value}})}/>
                    </Section>
                    <div className="border-t border-stone-200 pt-4 mt-4">
                      <p className="text-xs font-bold text-stone-500 uppercase mb-3">Version Résumée (vue simplifiée)</p>
                      <Section label="Texte résumé de la conclusion">
                        <textarea className="input-base h-20 text-sm" value={block.data.simplifiedText||''} placeholder="Refuser l'Option 1 revient à…" onChange={e=>updateBlock(index,{...block,data:{...block.data,simplifiedText:e.target.value}})}/>
                      </Section>
                    </div>
                  </div>
                )}

                {block.type === 'lexicon' && (
                  <div className="space-y-4">
                    {block.data.items?.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={item.title}
                            placeholder="Terme (ex: AMO)"
                            onChange={e => {
                              const newItems = [...block.data.items];
                              newItems[i].title = e.target.value;
                              updateBlock(index, { ...block, data: { ...block.data, items: newItems } });
                            }}
                            className="input-base font-bold"
                          />
                          <textarea
                            value={item.desc}
                            placeholder="Définition..."
                            onChange={e => {
                              const newItems = [...block.data.items];
                              newItems[i].desc = e.target.value;
                              updateBlock(index, { ...block, data: { ...block.data, items: newItems } });
                            }}
                            className="input-base h-20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {block.type === 'timeline' && (
                  <div className="space-y-4">
                    <p className="text-sm text-stone-500 mb-4">Modifiez les textes ci-dessous. L'ajout d'une nouvelle étape nécessite le mode expert.</p>
                    {block.data.items?.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-stone-50 rounded-lg border border-stone-200 mb-4">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="input-label text-xs">Date</label>
                            <input type="text" value={item.date || ''} onChange={e => {
                              const newItems = [...block.data.items];
                              newItems[i].date = e.target.value;
                              updateBlock(index, { ...block, data: { ...block.data, items: newItems } });
                            }} className="input-base py-1.5 text-sm" />
                          </div>
                          <div>
                            <label className="input-label text-xs">Titre de l'étape</label>
                            <input type="text" value={item.title || ''} onChange={e => {
                              const newItems = [...block.data.items];
                              newItems[i].title = e.target.value;
                              updateBlock(index, { ...block, data: { ...block.data, items: newItems } });
                            }} className="input-base py-1.5 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="input-label text-xs">Description détaillée (Vue "Détails")</label>
                            <textarea value={item.description || ''} onChange={e => {
                              const newItems = [...block.data.items];
                              newItems[i].description = e.target.value;
                              updateBlock(index, { ...block, data: { ...block.data, items: newItems } });
                            }} className="input-base h-24 text-sm" />
                          </div>
                          <div>
                            <label className="input-label text-xs">Description résumée (Vue "Résumé")</label>
                            <textarea value={item.simplifiedDescription || ''} onChange={e => {
                              const newItems = [...block.data.items];
                              newItems[i].simplifiedDescription = e.target.value;
                              updateBlock(index, { ...block, data: { ...block.data, items: newItems } });
                            }} className="input-base h-16 text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* ── Right: inline preview (only when showPreview=true) ── */}
            {showPreview && (
              <div className="w-1/2 bg-stone-50 overflow-x-hidden">
                <div className="bg-stone-200/60 px-4 py-2 border-b border-stone-200 flex items-center gap-2">
                  <Eye size={14} className="text-stone-500" />
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Aperçu</span>
                </div>
                <div className="overflow-auto">
                  <BlockRenderer
                    block={block}
                    context={{ isSimplified, setActiveTopic: () => {}, commentCounts: {} }}
                  />
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

// Petit helper pour les labels de section
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label text-xs">{label}</label>
      {children}
    </div>
  );
}

