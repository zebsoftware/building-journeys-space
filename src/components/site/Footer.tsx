import { Facebook, Instagram, Twitter } from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.53V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  );
}

const SOCIALS = [
  { label: "Twitter / X", href: "https://twitter.com", Icon: Twitter },
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "Facebook", href: "https://facebook.com", Icon: Facebook },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 px-6 py-8 sm:grid-cols-4">
        {SOCIALS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-foreground/20 bg-muted/30 py-8 text-foreground transition-colors hover:bg-muted"
          >
            <Icon className="size-6 transition-transform group-hover:scale-110" />
            <span className="text-sm font-medium">{label}</span>
          </a>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] items-center px-6 py-5 text-xs text-foreground">
          <span>© {new Date().getFullYear()} The Founder. Made for the process.</span>
        </div>
      </div>
    </footer>
  );
}

