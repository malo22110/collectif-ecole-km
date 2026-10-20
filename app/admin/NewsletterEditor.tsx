"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Link,
  Unlink,
  ImagePlus,
  Check,
  X,
} from "lucide-react";

type Props = {
  disabled: boolean;
  resetKey: number;
  onChange: (html: string, text: string) => void;
};

// [SPEC-NEWSLETTER-CONTENT-01] Rich editing uses Tiptap; the server independently sanitizes every save.
export default function NewsletterEditor({ disabled, resetKey, onChange }: Props) {
  const [panel, setPanel] = useState<"link" | "image" | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, defaultProtocol: "https" },
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Message de la newsletter",
        "aria-multiline": "true",
        class:
          "prose prose-stone max-w-none min-h-[280px] p-4 focus:outline-none [&_img]:max-w-full [&_img]:h-auto break-words",
      },
    },
    onUpdate: ({ editor: current }) =>
      onChange(
        current.getHTML(),
        current.getText().trim() || (current.getHTML().includes("<img") ? "Image" : ""),
      ),
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    editor?.commands.setContent("<p></p>");
    setPanel(null);
  }, [editor, resetKey]);

  if (!editor)
    return (
      <p role="status" className="text-sm text-stone-600">
        Chargement de l'éditeur…
      </p>
    );

  const openPanel = (mode: "link" | "image") => {
    setPanel(mode);
    setUrl(mode === "link" ? editor.getAttributes("link").href || "" : "");
    setAlt("");
    setError("");
  };
  const insert = () => {
    try {
      const parsed = new URL(url.trim());
      const protocols = panel === "image" ? ["https:"] : ["https:", "http:", "mailto:"];
      if (!protocols.includes(parsed.protocol)) throw Error("Adresse non autorisée.");
      if (panel === "image") {
        if (!alt.trim())
          throw Error("Décrivez l'image pour les lecteurs utilisant un lecteur d'écran.");
        editor
          .chain()
          .focus()
          .setImage({ src: parsed.href, alt: alt.trim().slice(0, 300) })
          .run();
      } else if (editor.state.selection.empty) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: parsed.href,
            marks: [{ type: "link", attrs: { href: parsed.href } }],
          })
          .run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: parsed.href }).run();
      }
      setPanel(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Adresse invalide.");
    }
  };

  const tools = [
    {
      label: "Gras",
      Icon: Bold,
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italique",
      Icon: Italic,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Souligné",
      Icon: Underline,
      active: editor.isActive("underline"),
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Barré",
      Icon: Strikethrough,
      active: editor.isActive("strike"),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Titre",
      Icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Sous-titre",
      Icon: Heading3,
      active: editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Liste à puces",
      Icon: List,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Liste numérotée",
      Icon: ListOrdered,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Citation",
      Icon: Quote,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Insérer ou modifier un lien",
      Icon: Link,
      active: editor.isActive("link"),
      run: () => openPanel("link"),
    },
    {
      label: "Supprimer le lien",
      Icon: Unlink,
      active: false,
      run: () => editor.chain().focus().unsetLink().run(),
    },
    { label: "Insérer une image", Icon: ImagePlus, active: false, run: () => openPanel("image") },
    {
      label: "Annuler",
      Icon: Undo2,
      active: false,
      run: () => editor.chain().focus().undo().run(),
    },
    {
      label: "Rétablir",
      Icon: Redo2,
      active: false,
      run: () => editor.chain().focus().redo().run(),
    },
  ];
  return (
    <div className="min-w-0 rounded border border-stone-300 bg-white focus-within:ring-2 focus-within:ring-emerald-700">
      <div
        role="group"
        aria-label="Mise en forme du message"
        className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 p-2"
      >
        {tools.map(({ label, Icon, active, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={run}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-50 ${active ? "bg-emerald-100 text-emerald-900" : "text-stone-700 hover:bg-stone-200"}`}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      {panel && (
        <div
          className="space-y-3 border-b border-stone-200 p-3"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!disabled) insert();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setPanel(null);
            }
          }}
        >
          <label className="block text-sm font-medium">
            {panel === "image" ? "URL HTTPS de l'image" : "Adresse du lien"}
            <input
              type="text"
              autoFocus
              disabled={disabled}
              value={url}
              maxLength={2000}
              onChange={(event) => setUrl(event.target.value)}
              className="input-base mt-1 w-full"
            />
          </label>
          {panel === "image" && (
            <label className="block text-sm font-medium">
              Description de l'image
              <input
                disabled={disabled}
                value={alt}
                maxLength={300}
                onChange={(event) => setAlt(event.target.value)}
                className="input-base mt-1 w-full"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={disabled} className="btn-secondary" onClick={insert}>
              <Check size={16} aria-hidden="true" /> Insérer
            </button>
            <button
              type="button"
              disabled={disabled}
              className="btn-secondary"
              onClick={() => setPanel(null)}
            >
              <X size={16} aria-hidden="true" /> Annuler
            </button>
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
