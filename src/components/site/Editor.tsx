
import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { uploadCoverImage } from "@/lib/cover-upload";

import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

export function Editor({
  value,
  onChange,
  placeholder = "Tell the story…",
  onUploadingChange,
}: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: "article-body min-h-[420px] outline-none",
      },
    },
  });

  const handleImageUpload = async (file?: File) => {
    if (!file || !editor || uploadingRef.current) return;

    if (!user) {
      toast.error("Please sign in before uploading images.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Select a JPG, PNG, WebP or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    uploadingRef.current = true;
    setUploading(true);
    onUploadingChange?.(true);

    // Remember where the image should appear.
    const position = editor.state.selection.from;

    try {
      // Upload file to Supabase Storage.
      const imageUrl = await uploadCoverImage(file, user.id);

      // Insert uploaded image inside the blog body.
      const insertPosition = Math.min(
        position,
        editor.state.doc.content.size
      );

      editor
        .chain()
        .focus()
        .insertContentAt(insertPosition, {
          type: "image",
          attrs: {
            src: imageUrl,
            alt: file.name,
          },
        })
        .run();

      toast.success("Image added to your blog!");
    } catch (error) {
      console.error("Image upload failed:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload image."
      );
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      onUploadingChange?.(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!editor) {
    return (
      <div className="min-h-[420px] rounded-xl border border-line bg-card" />
    );
  }

  const btn = (active: boolean) =>
    `grid size-9 place-items-center rounded-lg transition-colors ${
      active
        ? "bg-ink text-background"
        : "text-inksoft hover:bg-muted hover:text-ink"
    }`;

  return (
    <div className="rounded-xl border border-line bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
        <button
          type="button"
          className={btn(editor.isActive("bold"))}
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          aria-label="Bold"
        >
          <Bold className="size-4" />
        </button>

        <button
          type="button"
          className={btn(editor.isActive("italic"))}
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          aria-label="Italic"
        >
          <Italic className="size-4" />
        </button>

        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Heading 2"
        >
          <Heading2 className="size-4" />
        </button>

        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 3 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label="Heading 3"
        >
          <Heading3 className="size-4" />
        </button>

        <button
          type="button"
          className={btn(editor.isActive("bulletList"))}
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Bullet list"
        >
          <List className="size-4" />
        </button>

        <button
          type="button"
          className={btn(editor.isActive("orderedList"))}
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label="Numbered list"
        >
          <ListOrdered className="size-4" />
        </button>

        <button
          type="button"
          className={btn(editor.isActive("blockquote"))}
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          aria-label="Quote"
        >
          <Quote className="size-4" />
        </button>

        {/* Existing link functionality */}
        <button
          type="button"
          className={btn(editor.isActive("link"))}
          aria-label="Add link"
          onClick={() => {
            const url = window.prompt("Link URL");

            if (url) {
              editor.chain().focus().setLink({
                href: url,
              }).run();
            }
          }}
        >
          <LinkIcon className="size-4" />
        </button>

        {/* Gallery upload button */}
        <button
          type="button"
          disabled={uploading}
          className={`${btn(false)} disabled:opacity-50`}
          aria-label="Upload image from gallery"
          title="Upload image from gallery"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="size-4" />
        </button>

        {/* Hidden file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            void handleImageUpload(event.target.files?.[0]);
          }}
        />

        {uploading && (
          <span className="ml-2 text-xs text-inksoft">
            Uploading image…
          </span>
        )}
      </div>

      <div className="px-6 py-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
