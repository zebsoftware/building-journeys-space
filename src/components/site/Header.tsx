import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Moon, PenLine, Search, Sun, X } from "lucide-react";
import { useState } from "react";

import { CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { InitialAvatar } from "@/components/site/InitialAvatar";
import founderLogo from "@/assets/founder-logo.png.asset.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { theme, toggle } = useTheme();
  const { user, profile, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 font-display text-xl font-medium tracking-tight">
          <img src={founderLogo.url} alt="" className="size-10 rounded-sm object-contain" />
          <span>The Founder</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-inksoft lg:flex">
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
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm outline-none ring-offset-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                <InitialAvatar name={profile?.display_name ?? "You"} url={profile?.avatar_url} size={32} />
                <span className="hidden sm:inline">Profile</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/u/$username" params={{ username: profile?.username ?? "" }}>
                    My profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/bookmarks">Bookmarks</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/write">Write a post</Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin dashboard</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-background lg:hidden">
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
        </div>
      ) : null}
    </header>
  );
}
