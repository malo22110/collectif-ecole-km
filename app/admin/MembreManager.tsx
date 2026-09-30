"use client";

import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, CheckCircle2, XCircle, Clock, Edit2, Trash2 } from "lucide-react";

interface Membre {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  status: "pending" | "validated" | "rejected";
  dateInscription: string;
  role?: string;
  roleRequest?: string;
}

export default function MembreManager() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Membre>>({});

  useEffect(() => {
    const q = query(collection(db, "membres"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Membre[];
      
      // Trier par date d'inscription (plus récent d'abord)
      data.sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime());
      
      setMembres(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredMembres = membres.filter(m => {
    const search = searchTerm.toLowerCase();
    return (
      m.email.toLowerCase().includes(search) ||
      m.prenom.toLowerCase().includes(search) ||
      m.nom.toLowerCase().includes(search) ||
      (m.telephone && m.telephone.includes(search))
    );
  });

  const handleStatusChange = async (id: string, newStatus: "pending" | "validated" | "rejected") => {
    await updateDoc(doc(db, "membres", id), { status: newStatus });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateDoc(doc(db, "membres", editingId), editForm);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce membre ?")) {
      await deleteDoc(doc(db, "membres", id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'validated': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Validé</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Rejeté</span>;
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12}/> En attente</span>;
      default: return <span className="bg-stone-100 text-stone-700 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-stone-900">Tous les membres</h3>
          <p className="text-sm text-stone-500">Gérez la base de données des membres ({membres.length} au total)</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher (nom, email...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base pl-10 py-2 text-sm"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
            <tr>
              <th className="p-4 font-medium">Membre</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Inscription</th>
              <th className="p-4 font-medium">Rôle</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredMembres.map(membre => (
              <tr key={membre.id} className="hover:bg-stone-50/50">
                <td className="p-4">
                  {editingId === membre.id ? (
                    <div className="space-y-2">
                      <input type="text" className="input-base py-1 px-2 text-xs" value={editForm.prenom} onChange={e => setEditForm({...editForm, prenom: e.target.value})} />
                      <input type="text" className="input-base py-1 px-2 text-xs" value={editForm.nom} onChange={e => setEditForm({...editForm, nom: e.target.value})} />
                    </div>
                  ) : (
                    <div className="font-bold text-stone-900">{membre.prenom} {membre.nom}</div>
                  )}
                </td>
                <td className="p-4 text-stone-600">
                  {editingId === membre.id ? (
                    <div className="space-y-2">
                      <input type="email" className="input-base py-1 px-2 text-xs" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                      <input type="text" className="input-base py-1 px-2 text-xs" value={editForm.telephone || ""} onChange={e => setEditForm({...editForm, telephone: e.target.value})} placeholder="Téléphone" />
                    </div>
                  ) : (
                    <>
                      <div className="text-stone-900">{membre.email}</div>
                      <div className="text-xs text-stone-400">{membre.telephone || '—'}</div>
                    </>
                  )}
                </td>                <td className="p-4 text-stone-500">
                  {new Date(membre.dateInscription).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4">
                  {editingId === membre.id ? (
                    <select 
                      className="input-base py-1 px-2 text-xs" 
                      value={editForm.role || 'membre'} 
                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                    >
                      <option value="membre">Membre</option>
                      <option value="redacteur">Rédacteur</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-xs uppercase bg-stone-100 px-2 py-0.5 rounded w-fit">{membre.role || 'membre'}</span>
                      {membre.roleRequest && (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                          Demande: {membre.roleRequest}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {editingId === membre.id ? (
                    <select 
                      className="input-base py-1 px-2 text-xs" 
                      value={editForm.status} 
                      onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                    >
                      <option value="pending">En attente</option>
                      <option value="validated">Validé</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  ) : (
                    getStatusBadge(membre.status)
                  )}
                </td>
                <td className="p-4 text-right">
                  {editingId === membre.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-800 font-bold">Enregistrer</button>
                      <button onClick={() => setEditingId(null)} className="text-stone-500 hover:text-stone-700">Annuler</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 items-center">
                      {membre.status !== 'validated' && (
                        <button title="Valider" onClick={() => handleStatusChange(membre.id, "validated")} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><CheckCircle2 size={16}/></button>
                      )}
                      {membre.status !== 'rejected' && (
                        <button title="Rejeter" onClick={() => handleStatusChange(membre.id, "rejected")} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><XCircle size={16}/></button>
                      )}
                      {membre.status !== 'pending' && (
                        <button title="Repasser en attente" onClick={() => handleStatusChange(membre.id, "pending")} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"><Clock size={16}/></button>
                      )}
                      <button title="Éditer" onClick={() => { setEditingId(membre.id); setEditForm(membre); }} className="p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 rounded ml-2"><Edit2 size={16}/></button>
                      <button title="Supprimer" onClick={() => handleDelete(membre.id)} className="p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredMembres.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-stone-500">
                  Aucun membre trouvé pour cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
