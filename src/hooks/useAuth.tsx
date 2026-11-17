import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<{
    userId: string;
    profile: Profile | null;
    isAdmin: boolean;
  } | null>(null);
  const profileRequest = useRef(0);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void import("@/integrations/supabase/client")
      .then(({ supabase }) => {
        if (!active) return;
        // Supabase reports the initial session as well as subsequent auth events.
        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!active) return;
          setSession(nextSession);
          setLoading(false);
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch((error: unknown) => {
        console.error("Could not initialize authentication", error);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const loadProfile = useMemo(
    () => async (id: string | null) => {
      const request = ++profileRequest.current;
      if (!id) {
        setIdentity(null);
        return;
      }
      const { supabase } = await import("@/integrations/supabase/client");
      if (request !== profileRequest.current) return;
      const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", id),
      ]);
      if (request !== profileRequest.current) return;
      setIdentity({
        userId: id,
        profile: (profileRow as Profile | null) ?? null,
        isAdmin: Boolean(roleRows?.some((row) => row.role === "admin")),
      });
    },
    [],
  );

  useEffect(() => {
    void loadProfile(userId);
  }, [userId, loadProfile]);

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile: identity?.userId === userId ? identity.profile : null,
    isAdmin: identity?.userId === userId ? identity.isAdmin : false,
    loading,
    refreshProfile: () => loadProfile(userId),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
