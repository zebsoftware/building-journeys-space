import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { InitialAvatar } from "@/components/site/InitialAvatar";
import { PostRowItem } from "@/components/site/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { compactNumber } from "@/lib/format";
import { fetchAuthorPosts, fetchProfileByUsername } from "@/lib/posts";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — The Founder` },
      { name: "description", content: `Posts written by @${params.username} on The Founder.` },
      { property: "og:title", content: `@${params.username} — The Founder` },
      { property: "og:description", content: `Read what @${params.username} is building.` },
    ],
  }),
  component: ProfilePage,
});

const inputClass = "mt-2 w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function ProfilePage() {
  const { username } = useParams({ from: "/u/$username" });
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileByUsername(username),
  });
  const isOwner = Boolean(user && profile && user.id === profile.id);
  const { data: posts = [] } = useQuery({
    queryKey: ["author-posts", profile?.id, isOwner],
    queryFn: () => profile ? fetchAuthorPosts(profile.id, isOwner) : Promise.resolve([]),
    enabled: Boolean(profile?.id),
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!editing && profile) {
      setName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile, editing]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function chooseAvatar(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG or WebP picture.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile pictures must be 2 MB or smaller.");
      return;
    }
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function saveProfile() {
    if (!user || !profile || !isOwner || saving) return;
    const displayName = name.trim();
    if (displayName.length < 2 || displayName.length > 60) {
      toast.error("Display name must contain 2–60 characters.");
      return;
    }
    if (bio.length > 300) {
      toast.error("Bio must be 300 characters or less.");
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[avatarFile.type];
        const filename = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-avatars")
          .upload(filename, avatarFile, { contentType: avatarFile.type, upsert: false });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from("profile-avatars").getPublicUrl(filename).data.publicUrl;
      }

      const { error } = await supabase.from("profiles")
        .update({ display_name: displayName, bio: bio.trim() || null, avatar_url: avatarUrl })
        .eq("id", user.id);
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", username] }),
        refreshProfile(),
      ]);
      setAvatarFile(null);
      setPreviewUrl(null);
      setEditing(false);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return (
    <SiteLayout><Container className="py-24 text-center text-sm text-inksoft">Loading…</Container></SiteLayout>
  );

  if (!profile) return (
    <SiteLayout><Container className="py-24 text-center">
      <h1 className="font-display text-3xl">No writer here</h1>
      <Link to="/" className="mt-6 inline-block underline-link text-sm text-inksoft">Back home</Link>
    </Container></SiteLayout>
  );

  const totalLikes = posts.reduce((sum, post) => sum + (post.like_count ?? 0), 0);

  return (
    <SiteLayout>
      <section className="border-b border-line bg-card">
        <Container className="py-12">
          <div className="flex flex-wrap items-center gap-6">
            <InitialAvatar name={profile.display_name} url={profile.avatar_url} size={84} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl tracking-tight">{profile.display_name}</h1>
              <p className="mt-1 text-sm text-inksoft">@{profile.username}</p>
              {profile.bio ? <p className="mt-4 max-w-[56ch] whitespace-pre-wrap text-sm leading-relaxed text-inksoft">{profile.bio}</p> : null}
            </div>
            <div className="flex gap-8 text-sm">
              <div><p className="font-display text-2xl">{posts.length}</p><p className="text-xs uppercase tracking-[0.15em] text-inksoft">Posts</p></div>
              <div><p className="font-display text-2xl">{compactNumber(totalLikes)}</p><p className="text-xs uppercase tracking-[0.15em] text-inksoft">Likes</p></div>
            </div>
          </div>
          {isOwner && (
            <div className="mt-6">
              <button type="button" onClick={() => setEditing(!editing)} className="rounded-full border border-line px-5 py-2 text-sm hover:bg-muted">
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
          )}
          {isOwner && editing && (
            <div className="mt-6 max-w-[600px] rounded-2xl border border-line bg-background p-6">
              <h2 className="font-display text-xl">Update your profile</h2>
              <label className="mt-5 block text-sm">Profile picture
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={event => chooseAvatar(event.target.files?.[0])} className={inputClass} />
              </label>
              {previewUrl && <img src={previewUrl} alt="New profile picture preview" className="mt-3 size-20 rounded-full object-cover" />}
              <p className="mt-1 text-xs text-inksoft">JPG, PNG or WebP · up to 2 MB</p>
              <label className="mt-5 block text-sm">Display name
                <input value={name} maxLength={60} onChange={event => setName(event.target.value)} className={inputClass} />
              </label>
              <label className="mt-5 block text-sm">About you
                <textarea value={bio} maxLength={300} rows={4} onChange={event => setBio(event.target.value)} className={`${inputClass} resize-y`} placeholder="A little about what you're learning or building…" />
                <span className="mt-1 block text-right text-xs text-inksoft">{bio.length}/300</span>
              </label>
              <p className="mt-3 text-xs text-inksoft">Your username and profile URL stay the same.</p>
              <button type="button" disabled={saving} onClick={() => void saveProfile()} className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm text-background disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </Container>
      </section>
      <Container className="py-12">
        {posts.length === 0 ? <p className="py-12 text-sm text-inksoft">Nothing published yet.</p> : (
          <div className="grid gap-x-12 md:grid-cols-2">
            {posts.map(post => (
              <div key={post.id}>
                {post.status === "draft" ? <span className="mt-6 inline-block rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-inksoft">Draft</span> : null}
                <PostRowItem post={post} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
