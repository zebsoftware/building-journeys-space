import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.53V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 1 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  );
}

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Stories", to: "/stories" },
  { label: "Journeys", to: "/journeys" },
] as const;

// Add your real social profile URLs here later.
const SOCIALS = [
  { label: "X", href: "", Icon: Twitter },
  { label: "Instagram", href: "", Icon: Instagram },
  { label: "Facebook", href: "", Icon: Facebook },
  { label: "TikTok", href: "", Icon: TikTokIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 py-7">
          {/* Brand */}
          <Link to="/" className="font-display text-2xl font-medium tracking-tight text-foreground">
            The Founder
          </Link>

          {/* Quick links - single row */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {QUICK_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-[13px] text-inksoft transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Small social icons */}
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ label, href, Icon }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="text-inksoft transition-colors hover:text-foreground"
                >
                  <Icon className="size-[16px]" />
                </a>
              ) : (
                <span
                  key={label}
                  title={`${label} coming soon`}
                  aria-label={`${label} coming soon`}
                  className="cursor-default text-inksoft opacity-50"
                >
                  <Icon className="size-[16px]" />
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-3 text-center text-[11px] text-inksoft">
          © {new Date().getFullYear()} The Founder. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
