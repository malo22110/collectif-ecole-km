"use client";

import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
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
  roles?: string[];
  roleRequest?: string;
  roleRequests?: string[];
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

  const handleApproveRole = async (membre: Membre) => {
    try {
      const currentRoles = Array.isArray(membre.roles) ? membre.roles : (membre.role && membre.role !== 'membre' ? [membre.role] : []);
      const reqs = Array.isArray(membre.roleRequests) ? membre.roleRequests : (membre.roleRequest ? [membre.roleRequest] : []);
      
      const newRoles = Array.from(new Set([...currentRoles, ...reqs]));
      
      await updateDoc(doc(db, "membres", membre.id), {
        roles: newRoles,
        role: newRoles.length > 0 ? newRoles[0] : 'membre',
        roleRequest: deleteField(),
        roleRequests: deleteField()
      });
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'approbation.");
    }
  };
  
  const handleRejectRole = async (membre: Membre) => {
    try {
      await updateDoc(doc(db, "membres", membre.id), {
        roleRequest: deleteField(),
        roleRequests: deleteField()
      });
    } catch (e) {
      console.error(e);
      alert("Erreur lors du refus.");
    }
  };

  const membersWithRequests = membres.filter(m => (Array.isArray(m.roleRequests) && m.roleRequests.length > 0) || m.roleRequest);

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
    const updates: any = { ...editForm };
    // Toujours nettoyer les demandes en attente lorsqu'un admin sauvegarde l'édition
    updates.roleRequest = deleteField();
    updates.roleRequests = deleteField();
    
    await updateDoc(doc(db, "membres", editingId), updates);
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
    <>
      {/* Encart Demandes de Rôles */}
      {membersWithRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden mt-8">
          <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50">
            <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Demandes de rôles en attente
            </h3>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
              {membersWithRequests.length} demande(s)
            </span>
          </div>
          <div className="divide-y divide-emerald-50">
            {membersWithRequests.map(membre => {
              const reqs = Array.isArray(membre.roleRequests) ? membre.roleRequests : [membre.roleRequest];
              return (
                <div key={`req-${membre.id}`} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-emerald-50/30 transition-colors">
                  <div>
                    <h4 className="font-bold text-stone-900">{membre.prenom} {membre.nom}</h4>
                    <p className="text-stone-500 text-sm">{membre.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-stone-400">Rôle(s) actuel(s) :</span>
                      {(Array.isArray(membre.roles) ? membre.roles : [membre.role]).filter(Boolean).map(r => (
                        <span key={r} className="text-[10px] uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-600">Demande :</span>
                      {reqs.filter(Boolean).map(req => (
                        <span key={req} className="text-[11px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-md border border-amber-200">
                          {req}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleApproveRole(membre)}
                        className="btn-primary py-1.5 px-4 text-sm"
                      >
                        Approuver
                      </button>
                      <button 
                        onClick={() => handleRejectRole(membre)}
                        className="btn-secondary py-1.5 px-4 text-sm text-stone-500 border-stone-200"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    <div className="flex flex-col gap-2 bg-stone-50 p-2 rounded border border-stone-200">
                      {['admin', 'redacteur', 'mail'].map(r => {
                        const currentRoles = Array.isArray(editForm.roles) ? editForm.roles : (editForm.role && editForm.role !== 'membre' ? [editForm.role] : []);
                        const isChecked = currentRoles.includes(r);
                        return (
                          <label key={r} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                let newRoles = [...currentRoles];
                                if (e.target.checked) newRoles.push(r);
                                else newRoles = newRoles.filter(x => x !== r);
                                setEditForm({...editForm, roles: newRoles, role: newRoles.length > 0 ? newRoles[0] : 'membre'});
                              }}
                              className="w-3 h-3 text-emerald-600 rounded border-stone-300"
                            />
                            <span className="capitalize">{r}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(membre.roles) && membre.roles.length > 0) ? membre.roles.map(r => (
                          <span key={r} className="font-semibold text-[10px] uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 border border-stone-200">{r}</span>
                        )) : (membre.role && membre.role !== 'membre' ? (
                          <span className="font-semibold text-[10px] uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 border border-stone-200">{membre.role}</span>
                        ) : (
                          <span className="font-semibold text-[10px] uppercase bg-stone-50 px-1.5 py-0.5 rounded text-stone-400 border border-stone-100">Membre</span>
                        ))}
                      </div>
                      
                      {((Array.isArray(membre.roleRequests) && membre.roleRequests.length > 0) || membre.roleRequest) && (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {(Array.isArray(membre.roleRequests) ? membre.roleRequests : [membre.roleRequest]).filter(Boolean).map(req => (
                            <span key={req} className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200 w-fit">
                              + {req}
                            </span>
                          ))}
                        </div>
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
    </>
  );
}
