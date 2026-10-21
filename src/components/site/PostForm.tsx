
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { Editor } from "@/components/site/Editor";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { readingMinutes, slugify } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadCoverImage } from "@/lib/cover-upload";
import type { PostRow } from "@/lib/posts";

export type PostDraft = {
  title: string;
  subtitle: string;
  category: CategorySlug;
  tags: string;
  coverImage: string;
  reflectionPrompt: string;
  dayNumber: string;
  content: string;
};

function toDraft(post?: PostRow | null): PostDraft {
  return {
    title: post?.title ?? "",
    subtitle: post?.subtitle ?? "",
    category: (post?.category as CategorySlug) ?? "stories",
    tags: post?.tags?.join(", ") ?? "",
    coverImage: post?.cover_image ?? "",
    reflectionPrompt: post?.reflection_prompt ?? "",
    dayNumber: post?.day_number ? String(post.day_number) : "",
    content: post?.content ?? "",
  };
}

export function PostForm({ existing }: { existing?: PostRow | null }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<PostDraft>(() => toDraft(existing));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const [uploading, setUploading] = useState(false);
  const [editorUploading, setEditorUploading] = useState(false);
  const editorUploadingRef = useRef(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const set = <K extends keyof PostDraft>(
    key: K,
    value: PostDraft[K]
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleEditorUploading = (isUploading: boolean) => {
    editorUploadingRef.current = isUploading;
    setEditorUploading(isUploading);
  };

  const chooseImage = (file?: File) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must not exceed 5 MB.");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const save = async (status: "draft" | "published") => {
    if (busyRef.current) return;

    if (editorUploadingRef.current) {
      toast.error("Please finish uploading the blog image first.");
      return;
    }

    if (!user) {
      toast.error("Please sign in first.");
      return;
    }

    if (!draft.title.trim()) {
      toast.error("Give your post a title.");
      return;
    }

    busyRef.current = true;
    setBusy(true);

    try {
      let coverImage = draft.coverImage.trim();

      // Upload cover image from the user's gallery.
      if (selectedImage) {
        setUploading(true);

        coverImage = await uploadCoverImage(
          selectedImage,
          user.id
        );

        setUploading(false);
      }

      const payload = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        category: draft.category,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        cover_image: coverImage || null,
        reflection_prompt: draft.reflectionPrompt.trim() || null,
        day_number: draft.dayNumber
          ? Number(draft.dayNumber)
          : null,
        content: draft.content,
        read_minutes: readingMinutes(draft.content),
        status,
        published_at:
          status === "published"
            ? existing?.published_at ?? new Date().toISOString()
            : null,
      };

      if (existing) {
        const { error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", existing.id);

        if (error) throw error;

        toast.success(
          status === "published"
            ? "Post updated successfully"
            : "Draft saved successfully"
        );

        void navigate({
          to: "/post/$slug",
          params: { slug: existing.slug },
        });
      } else {
        const slug = `${slugify(draft.title)}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;

        const { error } = await supabase
          .from("posts")
          .insert({
            ...payload,
            slug,
            author_id: user.id,
          });

        if (error) throw error;

        toast.success(
          status === "published"
            ? "Post published successfully"
            : "Draft saved successfully"
        );

        void navigate(
          status === "published"
            ? {
                to: "/post/$slug",
                params: { slug },
              }
            : {
                to: "/",
              }
        );
      }

      set("coverImage", coverImage);
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Post save error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't save your post."
      );
    } finally {
      setUploading(false);
      setBusy(false);
      busyRef.current = false;
    }
  };

  const field =
    "mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  const labelClass =
    "text-xs uppercase tracking-[0.15em] text-inksoft";

  if (loading) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center text-sm text-inksoft">
          Loading…
        </Container>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <Container className="max-w-[520px] py-24 text-center">
          <h1 className="font-display text-3xl">
            Sign in to write
          </h1>

          <p className="mt-3 text-sm text-inksoft">
            You need an account to publish on The Founder.
          </p>

          <button
            type="button"
            onClick={() => void navigate({ to: "/auth" })}
            className="mt-7 rounded-full bg-ink px-6 py-3 text-sm text-background"
          >
            Sign in
          </button>
        </Container>
      </SiteLayout>
    );
  }

  const savingDisabled = busy || uploading || editorUploading;

  return (
    <SiteLayout>
      <Container className="max-w-[880px] py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">
            {existing ? "Edit post" : "Write a post"}
          </h1>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={savingDisabled}
              onClick={() => void save("draft")}
              className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save draft"}
            </button>

            <button
              type="button"
              disabled={savingDisabled}
              onClick={() => void save("published")}
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {uploading || editorUploading
                ? "Uploading image…"
                : busy
                  ? "Saving…"
                  : existing?.status === "published"
                    ? "Update"
                    : "Publish"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Title</span>

            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className={field}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Subtitle</span>

            <input
              value={draft.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              className={field}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Category</span>

            <select
              value={draft.category}
              onChange={(e) =>
                set("category", e.target.value as CategorySlug)
              }
              className={field}
            >
              {CATEGORIES.map((category) => (
                <option
                  key={category.slug}
                  value={category.slug}
                >
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>
              Tags (comma separated)
            </span>

            <input
              value={draft.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={field}
            />
          </label>

          {/* COVER IMAGE UPLOAD */}
          <div className="block">
            <label
              htmlFor="cover-image-upload"
              className={labelClass}
            >
              Cover image from gallery
            </label>

            <input
              id="cover-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={savingDisabled}
              onChange={(e) =>
                chooseImage(e.target.files?.[0])
              }
              className={field}
            />

            <p className="mt-2 text-xs text-inksoft">
              Choose an image from your device (maximum 5 MB).
            </p>

            {(previewUrl || draft.coverImage) && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-inksoft">
                  Image preview
                </p>

                <img
                  src={previewUrl || draft.coverImage}
                  alt="Selected blog cover"
                  className="h-48 w-full rounded-xl border border-line object-cover"
                />
              </div>
            )}

            {uploading && (
              <p className="mt-2 text-sm text-inksoft">
                Uploading cover image…
              </p>
            )}
          </div>

          <label className="block">
            <span className={labelClass}>
              Day number (journeys)
            </span>

            <input
              type="number"
              value={draft.dayNumber}
              onChange={(e) =>
                set("dayNumber", e.target.value)
              }
              className={field}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>
              Reflection prompt
            </span>

            <input
              value={draft.reflectionPrompt}
              onChange={(e) =>
                set("reflectionPrompt", e.target.value)
              }
              className={field}
            />
          </label>
        </div>

        {/* BLOG CONTENT EDITOR WITH GALLERY UPLOAD */}
        <div className="mt-8">
          <Editor
            value={draft.content}
            onChange={(html) => set("content", html)}
            onUploadingChange={handleEditorUploading}
          />

          {editorUploading && (
            <p className="mt-3 text-sm text-inksoft">
              Uploading image inside your blog.
              Publishing is temporarily disabled.
            </p>
          )}
        </div>
      </Container>
    </SiteLayout>
  );
}
