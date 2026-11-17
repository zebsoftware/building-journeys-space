import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle } from "lucide-react";

import { PostImage } from "@/components/site/PostImage";
import { InitialAvatar } from "@/components/site/InitialAvatar";
import { categoryLabel } from "@/lib/categories";
import { compactNumber, timeAgo } from "@/lib/format";
import { coverFor } from "@/lib/post-images";
import type { PostSummary } from "@/lib/posts";

function Meta({ post }: { post: PostSummary }) {
  return (
    <div className="flex items-center gap-3 text-xs text-inksoft">
      <InitialAvatar
        name={post.author?.display_name ?? "Anonymous"}
        url={post.author?.avatar_url}
        size={24}
      />
      <span className="text-ink">{post.author?.display_name ?? "Anonymous"}</span>
      <span aria-hidden>·</span>
      <span>{timeAgo(post.published_at ?? post.created_at)}</span>
      <span aria-hidden>·</span>
      <span>{post.read_minutes} min</span>
      <span className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Heart className="size-3.5" /> {compactNumber(post.like_count)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="size-3.5" /> {compactNumber(post.comment_count)}
        </span>
      </span>
    </div>
  );
}

export function PostCard({ post, featured = false }: { post: PostSummary; featured?: boolean }) {
  const cover = coverFor(post);

  return (
    <article className={`group ${featured ? "flex h-full flex-col" : ""}`}>
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block">
        {cover ? (
          <div className="overflow-hidden rounded-xl bg-muted">
            <PostImage
              src={cover}
              alt={post.title}
              sizes="(min-width: 1024px) 560px, (min-width: 768px) 48vw, 94vw"
              loading="lazy"
              className={`zoom-media w-full object-cover ${featured ? "aspect-[16/10]" : "aspect-[4/3]"}`}
            />
          </div>
        ) : featured ? (
          <div className="aspect-[16/10] w-full rounded-xl bg-muted" aria-hidden="true" />
        ) : null}
        <div className={cover || featured ? "pt-5" : ""}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ember">
            {categoryLabel(post.category)}
          </p>
          <h3
            className={`mt-2 font-display font-medium leading-snug ${featured ? "line-clamp-2 text-2xl sm:text-3xl" : "text-xl"}`}
          >
            {post.title}
          </h3>
          {post.subtitle && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-inksoft">
              {post.subtitle}
            </p>
          )}
        </div>
      </Link>
      <div className={featured ? "mt-auto pt-4" : "mt-4"}>
        <Meta post={post} />
      </div>
    </article>
  );
}

export function JourneyCard({ post }: { post: PostSummary }) {
  return (
    <article className="group rounded-xl border border-line bg-card p-6 transition-shadow hover:shadow-soft">
      <Link to="/post/$slug" params={{ slug: post.slug }}>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-ember/10 px-3 py-1 font-display text-xs text-emberdeep">
            {post.day_number ? `Day ${post.day_number}` : "Ongoing"}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-inksoft">
            {categoryLabel(post.category)}
          </span>
        </div>
        <h3 className="mt-4 font-display text-xl font-medium leading-snug">{post.title}</h3>
        {post.subtitle && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-inksoft">{post.subtitle}</p>
        )}
      </Link>
      <div className="mt-5 border-t border-line pt-4">
        <Meta post={post} />
      </div>
    </article>
  );
}

export function CreativityCard({ post }: { post: PostSummary }) {
  const cover = coverFor(post);
  return (
    <article className="group mb-6 break-inside-avoid">
      <Link to="/post/$slug" params={{ slug: post.slug }}>
        {cover ? (
          <div className="overflow-hidden rounded-xl bg-muted">
            <PostImage
              src={cover}
              alt={post.title}
              sizes="(min-width: 1024px) 560px, (min-width: 768px) 48vw, 94vw"
              loading="lazy"
              className="zoom-media aspect-[4/3] w-full object-cover"
            />
          </div>
        ) : null}
        <h3 className="mt-3 font-display text-lg font-medium leading-snug">{post.title}</h3>
        <p className="mt-1 text-xs text-inksoft">{post.author?.display_name ?? "Anonymous"}</p>
      </Link>
    </article>
  );
}

export function PostRowItem({ post }: { post: PostSummary }) {
  return (
    <article className="group border-b border-line py-6 last:border-b-0">
      <Link to="/post/$slug" params={{ slug: post.slug }} className="flex gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ember">
            {categoryLabel(post.category)}
          </p>
          <h3 className="mt-2 font-display text-xl font-medium leading-snug">{post.title}</h3>
          {post.subtitle && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-inksoft">
              {post.subtitle}
            </p>
          )}
          <div className="mt-4">
            <Meta post={post} />
          </div>
        </div>
        {coverFor(post) ? (
          <div className="hidden size-32 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
            <PostImage
              variant="thumbnail"
              sizes="128px"
              src={coverFor(post)!}
              alt={post.title}
              loading="lazy"
              className="zoom-media size-full object-cover"
            />
          </div>
        ) : null}
      </Link>
    </article>
  );
}
