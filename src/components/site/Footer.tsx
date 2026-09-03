import { Link } from "@tanstack/react-router";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

const SOCIALS = [
  { label: "Twitter / X", href: "https://twitter.com", Icon: Twitter },
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: Linkedin },
  { label: "GitHub", href: "https://github.com", Icon: Github },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-3xl font-medium tracking-tight">The Founder</p>
          <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-inksoft">
            Everyone is building something. A place for the process, not just the finish line.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Link to="/write" className="underline-link text-inksoft">
            Start Writing
          </Link>
          <Link to="/search" className="underline-link text-inksoft">
            Search
          </Link>
          <Link to="/stories" className="underline-link text-inksoft">
            Stories
          </Link>
          <Link to="/journeys" className="underline-link text-inksoft">
            Journeys
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 text-xs text-inksoft">
          <span>© {new Date().getFullYear()} The Founder. Made for the process.</span>
          <span className="uppercase tracking-[0.15em]">Issue No. 01</span>
        </div>
      </div>
    </footer>
  );
}
