import { Link } from "@tanstack/react-router";
import { Menu, Moon, PenLine, Search, Sun, X } from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
const AccountMenu = lazy(() => import("./AccountMenu"));

export function Header() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-xl font-medium tracking-tight"
        >
          <img
            src="/founder-logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-sm object-contain"
          />
          <span>The Founder</span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 text-sm text-inksoft lg:flex"
        >
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              to={category.path}
              className="underline-link transition-colors hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              {category.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/search"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full text-inksoft transition-colors hover:bg-muted hover:text-ink"
          >
            <Search className="size-4" />
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid size-9 place-items-center rounded-full text-inksoft transition-colors hover:bg-muted hover:text-ink"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {user ? (
            <Suspense
              fallback={<span aria-hidden="true" className="ml-1 size-9 rounded-full bg-muted" />}
            >
              <AccountMenu />
            </Suspense>
          ) : (
            <Link
              to="/auth"
              className="ml-2 hidden rounded-full border border-line px-4 py-2 text-sm transition-colors hover:bg-muted sm:block"
            >
              Sign in
            </Link>
          )}

          <Link
            to="/write"
            className="ml-1 hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-background transition-opacity hover:opacity-90 md:inline-flex"
          >
            <PenLine className="size-3.5" />
            Write
          </Link>

          <button
            type="button"
            className="ml-1 grid size-9 place-items-center rounded-full text-inksoft lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Mobile navigation"
        hidden={!open}
        className="border-t border-line bg-background lg:hidden"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              to={category.path}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-sm text-inksoft hover:bg-muted hover:text-ink"
            >
              {category.label}
            </Link>
          ))}
          <Link
            to="/write"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2 text-sm text-inksoft hover:bg-muted hover:text-ink"
          >
            Write a post
          </Link>
          {!user ? (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-sm text-inksoft hover:bg-muted hover:text-ink"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
