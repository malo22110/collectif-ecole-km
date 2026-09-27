"use client";

import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Save, X, Plus, Edit, Trash2 } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  imageUrl?: string;
  status: 'draft' | 'published';
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-stone-200 bg-stone-50 rounded-t-xl">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('bold') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('italic') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('bulletList') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
      >
        <List size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('orderedList') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
      >
        <ListOrdered size={18} />
      </button>
    </div>
  );
};

export default function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: currentArticle.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      setCurrentArticle(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // Mettre à jour le contenu de l'éditeur quand currentArticle change (mode édition)
  useEffect(() => {
    if (editor && currentArticle.content !== editor.getHTML()) {
      editor.commands.setContent(currentArticle.content || '');
    }
  }, [currentArticle.id, editor]);

  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("publishedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
      setArticles(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalImageUrl = currentArticle.imageUrl;

      // Upload image if selected
      if (imageFile) {
        const fileRef = ref(storage, `articles/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        finalImageUrl = await getDownloadURL(fileRef);
      }

      const articleData = {
        title: currentArticle.title || "Nouvel article",
        content: currentArticle.content || "",
        publishedAt: currentArticle.publishedAt || new Date().toISOString().split('T')[0],
        status: currentArticle.status || 'draft',
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
      };

      if (currentArticle.id) {
        await updateDoc(doc(db, "articles", currentArticle.id), articleData);
      } else {
        await addDoc(collection(db, "articles"), articleData);
      }

      setIsEditing(false);
      setCurrentArticle({});
      setImageFile(null);
      if (editor) editor.commands.setContent('');
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet article ?")) {
      await deleteDoc(doc(db, "articles", id));
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-stone-900">{currentArticle.id ? "Modifier l'article" : "Nouvel article"}</h2>
          <button type="button" onClick={() => setIsEditing(false)} className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="input-label">Titre</label>
            <input 
              required 
              type="text" 
              value={currentArticle.title || ''} 
              onChange={e => setCurrentArticle({...currentArticle, title: e.target.value})}
              className="input-base" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date de publication</label>
              <input 
                required 
                type="date" 
                value={currentArticle.publishedAt ? currentArticle.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0]} 
                onChange={e => setCurrentArticle({...currentArticle, publishedAt: e.target.value})}
                className="input-base" 
              />
            </div>
            <div>
              <label className="input-label">Statut</label>
              <select 
                value={currentArticle.status || 'draft'} 
                onChange={e => setCurrentArticle({...currentArticle, status: e.target.value as 'draft' | 'published'})}
                className="input-base"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Image mise en avant (Optionnelle)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
            />
            {currentArticle.imageUrl && !imageFile && (
              <div className="mt-2 text-sm text-stone-500">Image actuelle : {currentArticle.imageUrl.split('/').pop()?.split('?')[0]}</div>
            )}
          </div>

          <div>
            <label className="input-label">Contenu</label>
            <div className="border border-stone-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
              <MenuBar editor={editor} />
              <div className="bg-white">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? "Sauvegarde..." : <><Save size={18} /> Sauvegarder</>}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-stone-900">Articles du Blog</h2>
        <button 
          onClick={() => {
            setCurrentArticle({ publishedAt: new Date().toISOString().split('T')[0], status: 'draft' });
            setImageFile(null);
            setIsEditing(true);
            if (editor) editor.commands.setContent('');
          }}
          className="btn-primary"
        >
          <Plus size={18} /> Nouvel article
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-stone-500">Aucun article pour le moment.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {articles.map(article => (
              <div key={article.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-stone-900">{article.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                      <span>{article.publishedAt}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${article.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
                        {article.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setCurrentArticle(article);
                      setImageFile(null);
                      setIsEditing(true);
                    }}
                    className="p-2 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
                    aria-label="Modifier"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
