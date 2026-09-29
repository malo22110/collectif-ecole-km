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
                  <p className="text-sm text-stone-500 mb-4">Pour simplifier, vous pouvez modifier les textes ici. L'ajout d'une nouvelle étape complexe nécessite le mode expert pour le moment.</p>
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

              {['financial_overview', 'options_comparison', 'stress_test', 'conclusion'].includes(block.type) && (
                <div className="flex items-center gap-3 text-stone-500 bg-stone-50 p-4 rounded-lg">
                  <Settings2 size={20} />
                  <span>
                    Ce bloc contient des données complexes et une mise en page spécifique. 
                    Il n'est pas modifiable depuis l'interface simplifiée pour garantir la mise en page.
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
