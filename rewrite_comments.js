const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

// Update props
code = code.replace(
  'export default function Comments() {',
  'export default function Comments({ topic }: { topic?: string }) {'
);

// Update fetch
code = code.replace(
  'const q = query(collection(db, "commentaires"), orderBy("createdAt", "desc"));\n      const snapshot = await getDocs(q);\n      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n      setComments(data);',
  `const q = query(collection(db, "commentaires"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (topic) {
        data = data.filter((c: any) => c.topic === topic);
      }
      setComments(data);`
);

// Update addDoc
code = code.replace(
  `        createdAt: serverTimestamp(),\n      });`,
  `        createdAt: serverTimestamp(),\n        topic: topic || "Général",\n      });`
);

// Grouping logic for rendering comments
const oldRenderList = `{comments.length === 0 ? (
          <p className="text-stone-500 text-center py-4 bg-white rounded-xl border border-stone-100">Aucun commentaire pour le moment. Lancez le débat !</p>
        ) : (
          comments.map(c => {
            const isMyComment = user && user.email === c.authorEmail;
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-sm">{c.authorName}</span>
                    {c.editedAt && <span className="text-[10px] text-stone-400 italic">(modifié)</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                    </span>
                    {isMyComment && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button onClick={() => handleEdit(c.id, c.text)} className="text-stone-400 hover:text-emerald-600 transition-colors" title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-stone-400 hover:text-rose-600 transition-colors" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="mt-3">
                    <textarea 
                      className="w-full p-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 text-stone-900 text-sm min-h-[80px]"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg flex items-center gap-1 transition-colors">
                        <X size={14} /> Annuler
                      </button>
                      <button onClick={() => handleSaveEdit(c.id)} className="px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors">
                        <Check size={14} /> Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-700 whitespace-pre-wrap">{c.text}</p>
                )}
              </div>
            );
          })
        )}`;

const newRenderList = `{comments.length === 0 ? (
          <p className="text-stone-500 text-center py-4 bg-white rounded-xl border border-stone-100">Aucun commentaire pour le moment. Lancez le débat !</p>
        ) : (
          (() => {
            const grouped = comments.reduce((acc, c) => {
              const t = c.topic || "Général";
              if (!acc[t]) acc[t] = [];
              acc[t].push(c);
              return acc;
            }, {});
            
            return (topic ? [[topic, grouped[topic] || []]] : Object.entries(grouped)).map(([groupTopic, groupComments]) => {
              if (groupComments.length === 0) return null;
              return (
                <div key={groupTopic} className="mb-6 last:mb-0">
                  {!topic && (
                    <h4 className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block mb-3 text-sm border border-emerald-100">
                      Sur : {groupTopic}
                    </h4>
                  )}
                  <div className="space-y-4">
                    {groupComments.map(c => {
                      const isMyComment = user && user.email === c.authorEmail;
                      const isEditing = editingId === c.id;

                      return (
                        <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-800 text-sm">{c.authorName}</span>
                              {c.editedAt && <span className="text-[10px] text-stone-400 italic">(modifié)</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-stone-400">
                                {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                              </span>
                              {isMyComment && !isEditing && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <button onClick={() => handleEdit(c.id, c.text)} className="text-stone-400 hover:text-emerald-600 transition-colors" title="Modifier">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDelete(c.id)} className="text-stone-400 hover:text-rose-600 transition-colors" title="Supprimer">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <div className="mt-3">
                              <textarea 
                                className="w-full p-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 text-stone-900 text-sm min-h-[80px]"
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg flex items-center gap-1 transition-colors">
                                  <X size={14} /> Annuler
                                </button>
                                <button onClick={() => handleSaveEdit(c.id)} className="px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors">
                                  <Check size={14} /> Enregistrer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-stone-700 whitespace-pre-wrap">{c.text}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()
        )}`;

code = code.replace(oldRenderList, newRenderList);

// Small UI tweaks for the drawer
code = code.replace(
  '<div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 md:p-8 mt-16 max-w-4xl mx-auto shadow-sm">',
  '<div className={`bg-stone-50 border border-stone-200 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm ${!topic ? "mt-16" : ""}`}>'
);

code = code.replace(
  '<h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">',
  '<h3 className={`${topic ? "text-xl" : "text-2xl"} font-bold text-stone-900 mb-6 flex items-center gap-3`}>'
);

// Make sure to add MessageCircle import if not there, wait it's MessageSquare.
fs.writeFileSync(path, code);
console.log('Comments updated correctly');
