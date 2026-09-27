const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add topic prop
code = code.replace(
  'export default function Comments() {',
  'export default function Comments({ topic, inline }: { topic?: string, inline?: boolean }) {'
);

// 2. Fetch logic
const fetchLogicOld = `const q = query(collection(db, "commentaires"), orderBy("createdAt", "desc"));`;
const fetchLogicNew = `
      let q;
      if (topic) {
        q = query(collection(db, "commentaires"), where("topic", "==", topic), orderBy("createdAt", "desc"));
      } else {
        q = query(collection(db, "commentaires"), orderBy("createdAt", "desc"));
      }
`;
code = code.replace(fetchLogicOld, fetchLogicNew.trim());

// 3. Add topic to addDoc
const addDocOld = `
      await addDoc(collection(db, "commentaires"), {
        text: newComment,
        authorId: user.uid,
        authorName: isMemberName,
        createdAt: serverTimestamp(),
      });
`;
const addDocNew = `
      await addDoc(collection(db, "commentaires"), {
        text: newComment,
        authorId: user.uid,
        authorName: isMemberName,
        createdAt: serverTimestamp(),
        topic: topic || "Général",
      });
`;
code = code.replace(addDocOld, addDocNew.trim());

// 4. Update the grouped rendering
// Replace the old map with grouped mapping if not inline
const renderOld = `{comments.map(c => {`;
const renderNew = `
        {!topic ? (
          // Vue Globale (Groupée par topic)
          Object.entries(
            comments.reduce((acc, c) => {
              const t = c.topic || "Général";
              if (!acc[t]) acc[t] = [];
              acc[t].push(c);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([groupTopic, groupComments]) => (
            <div key={groupTopic} className="mb-8 last:mb-0">
              <h4 className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block mb-4 text-sm border border-emerald-100">
                Sur : {groupTopic}
              </h4>
              <div className="space-y-4">
                {groupComments.map(c => {
                  const isMyComment = user && c.authorId === user.uid;
                  const isEditing = editingId === c.id;
                  return (
                    <div key={c.id} className="bg-white p-4 rounded-xl border border-stone-200 hover:border-emerald-200 transition-colors group shadow-sm">
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
                            className="input-base min-h-[80px] resize-y mb-3 text-sm p-3 bg-emerald-50/30"
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
          ))
        ) : (
          // Vue Contextuelle (Inline)
          comments.map(c => {
`;

code = code.replace(renderOld, renderNew);

const closeRenderOld = `})
        )}`;
const closeRenderNew = `})
        )}
        )}
`;
code = code.replace(closeRenderOld, closeRenderNew);

// In Firestore, querying by topic and ordering by createdAt requires a composite index.
// I will just fetch all comments and filter in memory if topic is provided to avoid index errors!
code = code.replace(
  fetchLogicNew.trim(),
  `const q = query(collection(db, "commentaires"), orderBy("createdAt", "desc"));`
);

// Memory filter
const filterLogic = `
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (topic) {
        data = data.filter((c: any) => c.topic === topic);
      }
      setComments(data);
`;

code = code.replace(
  `      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(data);`,
  filterLogic.trim()
);

fs.writeFileSync(path, code);
console.log('Comments component updated for topics');
