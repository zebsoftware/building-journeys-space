export function timeAgo(input: string | null | undefined): string {
  if (!input) return "";
  const then = new Date(input).getTime();
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  if (seconds < 60) return "just now";
  for (let i = 1; i < units.length; i++) {
    const [limit] = units[i]!;
    if (seconds < limit) {
      const [prevLimit, name] = units[i - 1]!;
      const value = Math.floor(seconds / prevLimit);
      return `${value} ${name}${value === 1 ? "" : "s"} ago`;
    }
  }
  const years = Math.floor(seconds / 31557600);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function formatDate(input: string | null | undefined): string {
  if (!input) return "";
  return new Date(input).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function compactNumber(value: number | null | undefined): string {
  const n = value ?? 0;
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 70) || "untitled"
  );
}

export function readingMinutes(html: string): number {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function excerptFrom(html: string, length = 160): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
