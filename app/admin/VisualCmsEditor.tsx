"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Settings2, GripVertical, AlertCircle } from "lucide-react";

export default function VisualCmsEditor({ pageId = "historique" }) {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "pages", pageId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPageData(snap.data());
      } else {
        setError("Page introuvable.");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "pages", pageId), pageData);
      alert("Modifications enregistrées avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const updateBlock = (index: number, newBlock: any) => {
    const newBlocks = [...pageData.blocks];
    newBlocks[index] = newBlock;
    setPageData({ ...pageData, blocks: newBlocks });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pageData.blocks.length - 1) return;
    const newBlocks = [...pageData.blocks];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setPageData({ ...pageData, blocks: newBlocks });
  };

  if (loading) return <div>Chargement de l'éditeur...</div>;
  if (!pageData) return <div>{error}</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 mt-8">
      <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
        <div>
          <h3 className="font-bold text-stone-900">Éditeur Visuel : Page Historique</h3>
          <p className="text-sm text-stone-500">Modifiez simplement les textes de la page.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {pageData.blocks.map((block: any, index: number) => (
          <div key={index} className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-stone-100 px-4 py-3 border-b border-stone-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GripVertical size={18} className="text-stone-400" />
                <span className="font-bold text-stone-700 capitalize">{block.type.replace('_', ' ')}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => moveBlock(index, 'up')} className="p-1.5 hover:bg-stone-200 rounded"><ArrowUp size={16} /></button>
                <button onClick={() => moveBlock(index, 'down')} className="p-1.5 hover:bg-stone-200 rounded"><ArrowDown size={16} /></button>
              </div>
            </div>
            
            <div className="p-4 bg-white">

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

