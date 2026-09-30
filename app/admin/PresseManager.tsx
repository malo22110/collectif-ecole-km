"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit2, Trash2, Save, RefreshCw } from "lucide-react";

export default function PresseManager() {
  const [articles, setArticles] = useState<any[]>([]);
  const [journalistes, setJournalistes] = useState<{id: string, email: string}[]>([]);
  const [newJournaliste, setNewJournaliste] = useState("");

  const [loading, setLoading] = useState(true);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", url: "", source: "Le Télégramme", date: "", imageUrl: "" });

  useEffect(() => {
    fetchPresse();
    fetchJournalistes();
  }, []);

  const fetchPresse = async () => {
    try {
      const q = query(collection(db, "presse"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setArticles(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchJournalistes = async () => {
    try {
      const q = query(collection(db, "journalistes"));
      const snapshot = await getDocs(q);
      setJournalistes(snapshot.docs.map(d => ({ id: d.id, email: d.data().email })));
    } catch (err) {}
  };

  const handleFetchMetadata = async () => {
    if (!formData.url) return;
    setFetchingMeta(true);
    try {
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(formData.url)}`);
      const json = await response.json();
      
      if (json.status === 'success' && json.data) {
        const d = json.data;
        
        let parsedDate = null;
        if (d.date) {
          try {
            parsedDate = new Date(d.date).toISOString().split('T')[0];
          } catch(e){}
        }

        setFormData(prev => ({
          ...prev,
          title: d.title || prev.title,
          description: d.description || prev.description,
          imageUrl: (d.image && d.image.url) ? d.image.url : prev.imageUrl,
          source: d.publisher || prev.source,
          date: parsedDate || prev.date
        }));
      } else {
        alert("Impossible de récupérer les informations de ce lien automatiquement.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau lors de la récupération des données.");
    }
    setFetchingMeta(false);
  };

  const handleSave = async () => {
    try {
      if (editingId === "new") {
        await addDoc(collection(db, "presse"), formData);
      } else if (editingId) {
        await updateDoc(doc(db, "presse", editingId), formData);
      }
      setEditingId(null);
      fetchPresse();
    fetchJournalistes();
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    }
  };

  const handleAddJournaliste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournaliste.trim()) return;
    try {
      await addDoc(collection(db, "journalistes"), { email: newJournaliste.trim().toLowerCase() });
      setNewJournaliste("");
      const q = query(collection(db, "journalistes"));
      const snapshot = await getDocs(q);
      setJournalistes(snapshot.docs.map(d => ({ id: d.id, email: d.data().email })));
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'ajout du journaliste");
    }
  };
  
  const handleDeleteJournaliste = async (id: string) => {
    if (confirm("Supprimer ce journaliste ?")) {
      await deleteDoc(doc(db, "journalistes", id));
      const q = query(collection(db, "journalistes"));
      const snapshot = await getDocs(q);
      setJournalistes(snapshot.docs.map(d => ({ id: d.id, email: d.data().email })));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet article de presse ?")) {
      await deleteDoc(doc(db, "presse", id));
      fetchPresse();
    fetchJournalistes();
    }
  };

  if (loading) return <div>Chargement de la presse...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-stone-900">Gestion de la Revue de Presse</h2>
        <button 
          onClick={() => {
            setFormData({ title: "", description: "", url: "", source: "Le Télégramme", date: new Date().toISOString().split('T')[0], imageUrl: "" });
            setEditingId("new");
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          Nouvel article
        </button>
      </div>

      <div className="space-y-4">
        {editingId === "new" && (
          <div className="border border-emerald-500 rounded-xl p-4 bg-emerald-50">
            <div className="flex gap-2 mb-3">
              <input 
                type="url" 
                placeholder="URL (https://...)"
                className="input-base flex-1"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                onBlur={() => {
                  if (formData.url && !formData.title && !formData.imageUrl) {
                    handleFetchMetadata();
                  }
                }}
              />
              <button 
                onClick={handleFetchMetadata} 
                disabled={fetchingMeta || !formData.url}
                className="btn-secondary whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={fetchingMeta ? "animate-spin" : ""} />
                Auto-remplir
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Titre de l'article"
              className="input-base mb-3"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <input 
              type="url" 
              placeholder="URL de l'image (optionnel)"
              className="input-base mb-3"
              value={formData.imageUrl || ""}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
            />
            <textarea 
              placeholder="Petite description / résumé"
              className="input-base mb-3 h-24"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 flex-1">
                <span>Source:</span>
                <input type="text" className="input-base w-full" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
              </label>
              <label className="flex items-center gap-2 flex-1">
                <span>Date:</span>
                <input type="date" className="input-base w-full" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="btn-secondary">Annuler</button>
              <button onClick={handleSave} className="btn-primary">
                <Save size={18}/> Enregistrer
              </button>
            </div>
          </div>
        )}

        {articles.map(article => (
          <div key={article.id} className="border border-stone-200 rounded-xl p-4">
            {editingId === article.id ? (
              <div className="bg-stone-50 p-2 rounded">
                <div className="flex gap-2 mb-3">
                  <input 
                    type="url" 
                    className="input-base flex-1"
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    onBlur={() => {
                      if (formData.url && !formData.imageUrl) handleFetchMetadata();
                    }}
                  />
                  <button 
                    onClick={handleFetchMetadata} 
                    disabled={fetchingMeta || !formData.url}
                    className="btn-secondary whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={fetchingMeta ? "animate-spin" : ""} />
                    Auto-remplir
                  </button>
                </div>
                <input 
                  type="text" 
                  className="input-base mb-3"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
                <input 
                  type="url" 
                  placeholder="URL de l'image (optionnel)"
                  className="input-base mb-3"
                  value={formData.imageUrl || ""}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
                <textarea 
                  className="input-base mb-3 h-24"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 flex-1">
                    <span>Source:</span>
                    <input type="text" className="input-base w-full" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
                  </label>
                  <label className="flex items-center gap-2 flex-1">
                    <span>Date:</span>
                    <input type="date" className="input-base w-full" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="btn-secondary">Annuler</button>
                  <button onClick={handleSave} className="btn-primary">
                    <Save size={18}/> Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{article.source}</span>
                    {article.title}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setFormData(article); setEditingId(article.id); }} className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(article.id)} className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-stone-600 text-sm whitespace-pre-wrap line-clamp-3 mb-2">{article.description}</p>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline">
                  {article.url}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-stone-50 p-6 rounded-2xl border border-stone-200">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Liste des journalistes (pour envois de presse)</h2>
        <form onSubmit={handleAddJournaliste} className="flex gap-2 mb-4">
          <input 
            type="email" 
            placeholder="Email du journaliste..."
            required
            className="input-base flex-1"
            value={newJournaliste}
            onChange={e => setNewJournaliste(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Ajouter
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {journalistes.map(j => (
            <div key={j.id} className="bg-white border border-stone-200 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm text-stone-700">
              {j.email}
              <button onClick={() => handleDeleteJournaliste(j.id)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
            </div>
          ))}
          {journalistes.length === 0 && <span className="text-stone-500 text-sm italic">Aucun journaliste enregistré.</span>}
        </div>
      </div>
    </div>
  );
}
