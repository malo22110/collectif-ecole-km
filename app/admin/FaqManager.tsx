"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit2, Trash2, Check, X, Save } from "lucide-react";

export default function FaqManager() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ question: "", answer: "", order: 1, isActive: true });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const q = query(collection(db, "faqs"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFaqs(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingId === "new") {
        await addDoc(collection(db, "faqs"), formData);
      } else if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), formData);
      }
      setEditingId(null);
      fetchFaqs();
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette question ?")) {
      await deleteDoc(doc(db, "faqs", id));
      fetchFaqs();
    }
  };

  if (loading) return <div>Chargement de la FAQ...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-stone-900">Gestion de la FAQ</h2>
        <button 
          onClick={() => {
            setFormData({ question: "", answer: "", order: faqs.length + 1, isActive: true });
            setEditingId("new");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} />
          Nouvelle question
        </button>
      </div>

      <div className="space-y-4">
        {editingId === "new" && (
          <div className="border border-emerald-500 rounded-xl p-4 bg-emerald-50">
            <input 
              type="text" 
              placeholder="Question"
              className="w-full p-2 border border-stone-300 rounded-lg mb-3"
              value={formData.question}
              onChange={e => setFormData({...formData, question: e.target.value})}
            />
            <textarea 
              placeholder="Réponse"
              className="w-full p-2 border border-stone-300 rounded-lg mb-3 h-32"
              value={formData.answer}
              onChange={e => setFormData({...formData, answer: e.target.value})}
            />
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2">
                <span>Ordre:</span>
                <input type="number" className="p-2 border rounded-lg w-20" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                Actif
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2">
                <Save size={18}/> Enregistrer
              </button>
            </div>
          </div>
        )}

        {faqs.map(faq => (
          <div key={faq.id} className="border border-stone-200 rounded-xl p-4">
            {editingId === faq.id ? (
              <div className="bg-stone-50 p-2 rounded">
                <input 
                  type="text" 
                  className="w-full p-2 border border-stone-300 rounded-lg mb-3"
                  value={formData.question}
                  onChange={e => setFormData({...formData, question: e.target.value})}
                />
                <textarea 
                  className="w-full p-2 border border-stone-300 rounded-lg mb-3 h-32"
                  value={formData.answer}
                  onChange={e => setFormData({...formData, answer: e.target.value})}
                />
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <span>Ordre:</span>
                    <input type="number" className="p-2 border rounded-lg w-20" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                    Actif
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded-lg">Annuler</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2">
                    <Save size={18}/> Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="bg-stone-200 text-stone-600 text-xs px-2 py-1 rounded">#{faq.order}</span>
                    {faq.question}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setFormData(faq); setEditingId(faq.id); }} className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(faq.id)} className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-stone-600 text-sm whitespace-pre-wrap line-clamp-3">{faq.answer}</p>
                {!faq.isActive && <span className="inline-block mt-2 text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded">Désactivé</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
