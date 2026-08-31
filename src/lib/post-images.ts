import coverUniversity from "@/assets/cover-university.jpg";
import coverBook from "@/assets/cover-book.jpg";
import coverCode from "@/assets/cover-code.jpg";
import coverTrail from "@/assets/cover-trail.jpg";
import artWatercolor from "@/assets/art-watercolor.jpg";
import artFog from "@/assets/art-fog.jpg";
import artPoem from "@/assets/art-poem.jpg";
import artSketch from "@/assets/art-sketch.jpg";
import artPoster from "@/assets/art-poster.jpg";

/** Cover art for the seeded demo posts, keyed by slug. */
const SEED_COVERS: Record<string, string> = {
  "the-morning-i-almost-quit-university": coverUniversity,
  "what-this-book-changed-about-how-i-think": coverBook,
  "day-47-built-it-without-a-tutorial": coverCode,
  "the-trail-that-taught-me-about-patience": coverTrail,
  "watercolor-study-in-terracotta": artWatercolor,
  "fog-series-coastal-cliffs": artFog,
  "still-a-poem": artPoem,
  "learning-to-paint-from-memory": artSketch,
  "what-if-universities-taught-failure": artPoster,
  "how-i-learned-to-stop-procrastinating": coverBook,
  "five-things-my-first-failure-taught-me": coverTrail,
};

export function coverFor(post: { slug: string; cover_image?: string | null }): string | null {
  if (post.cover_image) return post.cover_image;
  return SEED_COVERS[post.slug] ?? null;
}
