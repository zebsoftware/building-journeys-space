import { Link, useNavigate } from "@tanstack/react-router";
import { InitialAvatar } from "@/components/site/InitialAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export default function AccountMenu() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="ml-1 flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm outline-none ring-offset-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <InitialAvatar name={profile?.display_name ?? "You"} url={profile?.avatar_url} size={32} />
        <span className="hidden sm:inline">Profile</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {profile?.username ? (
          <DropdownMenuItem asChild>
            <Link to="/u/$username" params={{ username: profile.username }}>
              My profile
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>Loading profile…</DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/bookmarks">Bookmarks</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/write">Write a post</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin">Admin dashboard</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            const { supabase } = await import("@/integrations/supabase/client");
            await supabase.auth.signOut();
            void navigate({ to: "/" });
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
