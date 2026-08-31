export type CategorySlug = "stories" | "journeys" | "ideas" | "creativity" | "learning";

export type CategoryMeta = {
  slug: CategorySlug;
  index: string;
  label: string;
  tagline: string;
  path: "/stories" | "/journeys" | "/ideas" | "/creativity" | "/learning";
  blurb: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "stories",
    index: "01",
    label: "Stories",
    tagline: "Share the moments that made you.",
    path: "/stories",
    blurb:
      "Real experiences and memorable moments — university, childhood, friendships, travel, the difficult days and the funny ones.",
  },
  {
    slug: "journeys",
    index: "02",
    label: "Journeys",
    tagline: "Document where you're going.",
    path: "/journeys",
    blurb:
      "Things people are pursuing over time: careers, studies, skills, fitness, long projects, and the slow work of transformation.",
  },
  {
    slug: "ideas",
    index: "03",
    label: "Ideas",
    tagline: "Explore what you're imagining.",
    path: "/ideas",
    blurb:
      "Thoughts and possibilities — startups, opinions, problems worth solving, and every 'what if?' that won't leave you alone.",
  },
  {
    slug: "creativity",
    index: "04",
    label: "Creativity",
    tagline: "Show what you create.",
    path: "/creativity",
    blurb: "Art, photography, sketches, poetry, music, design and the creative projects behind them.",
  },
  {
    slug: "learning",
    index: "05",
    label: "Learning & Growth",
    tagline: "Share what you're becoming.",
    path: "/learning",
    blurb: "Books, skills, lessons, mistakes, mindset and the quiet discipline of getting better.",
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryMeta> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.slug] = category;
    return acc;
  },
  {} as Record<CategorySlug, CategoryMeta>,
);

export function categoryLabel(slug: string): string {
  return CATEGORY_BY_SLUG[slug as CategorySlug]?.label ?? slug;
}
