"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Save,
  X,
  Plus,
  Edit,
  Trash2,
  Paperclip,
  Download,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import {
  MAX_ARTICLE_ATTACHMENT_BYTES,
  MAX_ARTICLE_ATTACHMENTS,
  SUPPORTED_UPLOAD_TYPES,
} from "@/lib/uploadValidation";

interface ArticleAttachment {
  id: string;
  fileName: string;
  contentType: string;
  extension: string;
  size: number;
}

interface Article {
  id: string;
  title: string;
  slug?: string;
  content: string;
  publishedAt: string;
  imageUrl?: string;
  attachments?: ArticleAttachment[];
  status: "draft" | "published";
  authorEmail?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-stone-200 bg-stone-50 rounded-t-xl">
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive("bold") ? "bg-stone-200 text-stone-900" : "text-stone-600"}`}
        type="button"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive("italic") ? "bg-stone-200 text-stone-900" : "text-stone-600"}`}
        type="button"
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive("bulletList") ? "bg-stone-200 text-stone-900" : "text-stone-600"}`}
        type="button"
      >
        <List size={18} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive("orderedList") ? "bg-stone-200 text-stone-900" : "text-stone-600"}`}
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
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [pendingPublishStatus, setPendingPublishStatus] = useState<
    Article["status"] | null
  >(null);
  const [saveError, setSaveError] = useState("");

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: currentArticle.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      setCurrentArticle((prev) => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // Mettre à jour le contenu de l'éditeur quand currentArticle change (mode édition)
  useEffect(() => {
    if (editor && currentArticle.content !== editor.getHTML()) {
      editor.commands.setContent(currentArticle.content || "");
    }
  }, [currentArticle.id, editor]);

  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("publishedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Article[];
      setArticles(data);
    });
    return () => unsubscribe();
  }, []);

  const closeEditor = () => {
    setIsEditing(false);
    setCurrentArticle({});
    setImageFile(null);
    setAttachmentFiles([]);
    setPendingPublishStatus(null);
    setSaveError("");
    if (editor) editor.commands.setContent("");
  };

  const handleAttachmentSelection = (
    files: FileList | null,
    input: HTMLInputElement,
  ) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    const existingCount = currentArticle.attachments?.length || 0;
    if (
      existingCount + attachmentFiles.length + selectedFiles.length >
      MAX_ARTICLE_ATTACHMENTS
    ) {
      setSaveError(
        `Un article peut contenir au maximum ${MAX_ARTICLE_ATTACHMENTS} pièces jointes.`,
      );
      input.value = "";
      return;
    }
    const invalidFile = selectedFiles.find(
      (file) =>
        file.size < 1 ||
        file.size > MAX_ARTICLE_ATTACHMENT_BYTES ||
        Boolean(
          file.type &&
          !SUPPORTED_UPLOAD_TYPES.includes(
            file.type as (typeof SUPPORTED_UPLOAD_TYPES)[number],
          ),
        ),
    );
    if (invalidFile) {
      setSaveError(
        "Chaque pièce jointe doit être un PDF, JPEG, PNG ou WebP de 10 Mio maximum.",
      );
      input.value = "";
      return;
    }
    setSaveError("");
    setAttachmentFiles((current) => [...current, ...selectedFiles]);
    input.value = "";
  };

  const downloadAttachment = async (
    articleId: string,
    attachment: ArticleAttachment,
  ) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const url = `/api/articles/${encodeURIComponent(articleId)}/attachments?attachmentId=${encodeURIComponent(attachment.id)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          data?.error || "Impossible de télécharger la pièce jointe.",
        );
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Impossible de télécharger la pièce jointe.",
      );
    }
  };

  const removeAttachment = async (attachment: ArticleAttachment) => {
    if (!currentArticle.id || !auth.currentUser) return;
    setSaveError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(
        `/api/articles/${encodeURIComponent(currentArticle.id)}/attachments`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attachmentId: attachment.id }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          data?.error || "Impossible de retirer la pièce jointe.",
        );
      setCurrentArticle((current) => ({
        ...current,
        attachments: (current.attachments || []).filter(
          (item) => item.id !== attachment.id,
        ),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Impossible de retirer la pièce jointe.",
      );
    }
  };

  // [SPEC-ARTICLE-ATTACHMENTS-01] Uploads finish before a new article can be published.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    let articleId = currentArticle.id;
    let uploadedFileCount = 0;
    let deferredStatus: Article["status"] | null = null;
    try {
      let finalImageUrl = currentArticle.imageUrl;

      // Upload image if selected
      if (imageFile) {
        try {
          const options = {
            maxSizeMB: 0.3, // 300 Ko max pour les previews Signal/WhatsApp
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            initialQuality: 0.8,
          };
          const compressedFile = await imageCompression(imageFile, options);
          const fileRef = ref(
            storage,
            `articles/${Date.now()}_${compressedFile.name}`,
          );
          await uploadBytes(fileRef, compressedFile);
          finalImageUrl = await getDownloadURL(fileRef);
        } catch (error) {
          console.error("Erreur lors de la compression de l'image:", error);
          // Fallback on original if compression fails
          const fileRef = ref(
            storage,
            `articles/${Date.now()}_${imageFile.name}`,
          );
          await uploadBytes(fileRef, imageFile);
          finalImageUrl = await getDownloadURL(fileRef);
        }
      }

      // Generate URL-friendly slug from title
      const slug = (currentArticle.title || "Nouvel article")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
        .replace(/(^-|-$)+/g, ""); // Remove leading/trailing hyphens

      const desiredStatus =
        pendingPublishStatus || currentArticle.status || "draft";
      const statusAfterUploads =
        pendingPublishStatus ||
        (attachmentFiles.length &&
        (!articleId || currentArticle.status !== "published")
          ? desiredStatus
          : null);
      deferredStatus = statusAfterUploads;
      const articleData = {
        title: currentArticle.title || "Nouvel article",
        slug: currentArticle.slug || slug, // Keep existing slug if present, otherwise use generated
        content: currentArticle.content || "",
        publishedAt:
          currentArticle.publishedAt || new Date().toISOString().split("T")[0],
        status: statusAfterUploads ? ("draft" as const) : desiredStatus,
        authorEmail: currentArticle.authorEmail || auth.currentUser?.email,
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
      };

      if (articleId) {
        await updateDoc(doc(db, "articles", articleId), articleData);
      } else {
        const createdArticle = await addDoc(
          collection(db, "articles"),
          articleData,
        );
        articleId = createdArticle.id;
        setCurrentArticle((current) => ({ ...current, id: createdArticle.id }));
        if (statusAfterUploads) setPendingPublishStatus(statusAfterUploads);
      }

      if (articleId && attachmentFiles.length) {
        const token = await auth.currentUser?.getIdToken();
        if (!token)
          throw new Error("Votre session a expiré. Reconnectez-vous.");
        for (const file of attachmentFiles) {
          const response = await fetch(
            `/api/articles/${encodeURIComponent(articleId)}/attachments`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": file.type || "application/octet-stream",
                "X-File-Name": encodeURIComponent(file.name),
              },
              body: file,
            },
          );
          const data = await response.json().catch(() => null);
          if (!response.ok)
            throw new Error(
              data?.error || `Impossible d’envoyer ${file.name}.`,
            );
          uploadedFileCount += 1;
        }
        setAttachmentFiles([]);
      }

      if (articleId && statusAfterUploads) {
        await updateDoc(doc(db, "articles", articleId), {
          status: statusAfterUploads,
        });
        setPendingPublishStatus(null);
      }

      closeEditor();
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      if (uploadedFileCount)
        setAttachmentFiles((current) => current.slice(uploadedFileCount));
      if (deferredStatus) setPendingPublishStatus(deferredStatus);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet article ?")) {
      try {
        const article = articles.find((item) => item.id === id);
        if (article?.attachments?.length) {
          const token = await auth.currentUser?.getIdToken();
          if (!token)
            throw new Error("Votre session a expiré. Reconnectez-vous.");
          for (const attachment of article.attachments) {
            const response = await fetch(
              `/api/articles/${encodeURIComponent(id)}/attachments`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ attachmentId: attachment.id }),
              },
            );
            if (!response.ok)
              throw new Error(
                "Impossible de supprimer toutes les pièces jointes de l’article.",
              );
          }
        }
        await deleteDoc(doc(db, "articles", id));
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cet article.",
        );
      }
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-stone-900">
            {currentArticle.id ? "Modifier l'article" : "Nouvel article"}
          </h2>
          <button
            type="button"
            onClick={closeEditor}
            aria-label="Fermer l’éditeur"
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          {saveError && (
            <p
              role="alert"
              className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {saveError}
            </p>
          )}
          <div>
            <label className="input-label">Titre</label>
            <input
              required
              type="text"
              value={currentArticle.title || ""}
              onChange={(e) =>
                setCurrentArticle({ ...currentArticle, title: e.target.value })
              }
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date de publication</label>
              <input
                required
                type="date"
                value={
                  currentArticle.publishedAt
                    ? currentArticle.publishedAt.split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setCurrentArticle({
                    ...currentArticle,
                    publishedAt: e.target.value,
                  })
                }
                className="input-base"
              />
            </div>
            <div>
              <label className="input-label">Statut</label>
              <select
                value={currentArticle.status || "draft"}
                onChange={(e) => {
                  const status = e.target.value as "draft" | "published";
                  setCurrentArticle({ ...currentArticle, status });
                  if (pendingPublishStatus) setPendingPublishStatus(status);
                }}
                className="input-base"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">
              Image mise en avant (Optionnelle)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {currentArticle.imageUrl && !imageFile && (
              <div className="mt-2 text-sm text-stone-500">
                Image actuelle :{" "}
                {currentArticle.imageUrl.split("/").pop()?.split("?")[0]}
              </div>
            )}
          </div>

          <section
            className="space-y-3 border-y border-stone-200 py-4"
            aria-labelledby="article-attachments-title"
          >
            <div>
              <h3
                id="article-attachments-title"
                className="font-semibold text-stone-900"
              >
                Pièces jointes
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                PDF, JPEG, PNG ou WebP, 10 Mio maximum par fichier et{" "}
                {MAX_ARTICLE_ATTACHMENTS} fichiers par article.
              </p>
            </div>
            <label className="block text-sm font-medium text-stone-700">
              Ajouter des fichiers
              <input
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                disabled={
                  isSaving ||
                  (currentArticle.attachments?.length || 0) +
                    attachmentFiles.length >=
                    MAX_ARTICLE_ATTACHMENTS
                }
                onChange={(event) =>
                  handleAttachmentSelection(
                    event.currentTarget.files,
                    event.currentTarget,
                  )
                }
                className="mt-1 block w-full text-sm file:mr-4 file:min-h-10 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100"
              />
            </label>
            {attachmentFiles.length > 0 && (
              <ul className="divide-y divide-stone-200 border-y border-stone-200">
                {attachmentFiles.map((file, index) => (
                  <li
                    key={`${file.name}:${file.size}:${index}`}
                    className="flex min-h-12 items-center gap-3 py-2 text-sm"
                  >
                    <Paperclip
                      size={16}
                      className="shrink-0 text-stone-500"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {Math.ceil(file.size / 1024)} Ko
                    </span>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        setAttachmentFiles((files) =>
                          files.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      aria-label={`Retirer ${file.name} de la sélection`}
                      className="grid size-10 shrink-0 place-items-center rounded text-stone-600 hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {(currentArticle.attachments || []).length > 0 && (
              <ul
                className="divide-y divide-stone-200 border-y border-stone-200"
                aria-label="Pièces jointes déjà enregistrées"
              >
                {currentArticle.attachments?.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex min-h-12 items-center gap-3 py-2 text-sm"
                  >
                    <Paperclip
                      size={16}
                      className="shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {attachment.fileName}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {Math.ceil(attachment.size / 1024)} Ko
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void downloadAttachment(currentArticle.id!, attachment)
                      }
                      aria-label={`Télécharger ${attachment.fileName}`}
                      className="grid size-10 shrink-0 place-items-center rounded text-stone-700 hover:bg-stone-100"
                    >
                      <Download size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void removeAttachment(attachment)}
                      aria-label={`Supprimer ${attachment.fileName}`}
                      className="grid size-10 shrink-0 place-items-center rounded text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-stone-500">
              Les fichiers sont téléversés de façon sécurisée. Ils apparaissent
              sur la page de l’article lorsqu’il est publié.
            </p>
          </section>

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
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? (
                "Sauvegarde..."
              ) : (
                <>
                  <Save size={18} /> Sauvegarder
                </>
              )}
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
            setCurrentArticle({
              publishedAt: new Date().toISOString().split("T")[0],
              status: "draft",
            });
            setImageFile(null);
            setAttachmentFiles([]);
            setPendingPublishStatus(null);
            setSaveError("");
            setIsEditing(true);
            if (editor) editor.commands.setContent("");
          }}
          className="btn-primary"
        >
          <Plus size={18} /> Nouvel article
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            Aucun article pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-stone-900">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                      <span>{article.publishedAt}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${article.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"}`}
                      >
                        {article.status === "published"
                          ? "Publié"
                          : "Brouillon"}
                      </span>
                      {(article.attachments?.length || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                          <Paperclip size={13} aria-hidden="true" />
                          {article.attachments?.length} pièce(s) jointe(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentArticle(article);
                      setImageFile(null);
                      setAttachmentFiles([]);
                      setPendingPublishStatus(null);
                      setSaveError("");
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
