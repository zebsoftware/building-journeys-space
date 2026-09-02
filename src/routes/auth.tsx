import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — The Founder" },
      { name: "description", content: "Sign in or create an account to write, comment and save posts on The Founder." },
      { property: "og:title", content: "Sign in — The Founder" },
      { property: "og:description", content: "Join a community writing about the process." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  const google = async () => {
    const { lovable } = await import("@/integrations/lovable");
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        const id = data.user?.id;
        if (id) {
          const base = slugify(displayName || email.split("@")[0]!).slice(0, 24);
          await supabase.from("profiles").insert({
            id,
            username: `${base}-${id.slice(0, 4)}`,
            display_name: displayName || email.split("@")[0]!,
          });
        }
        toast.success("Account created. Welcome to The Founder.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <Container className="flex max-w-[460px] flex-col py-20">
        <h1 className="font-display text-4xl tracking-tight">
          {mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-inksoft">
          {mode === "reset"
            ? "We'll email you a link to choose a new password."
            : "Everyone is building something. Bring yours here."}
        </p>

        <div className="mt-8 space-y-4">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-xs uppercase tracking-[0.15em] text-inksoft">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs uppercase tracking-[0.15em] text-inksoft">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {mode !== "reset" ? (
            <label className="block">
              <span className="text-xs uppercase tracking-[0.15em] text-inksoft">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full rounded-full bg-ink px-6 py-3 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
          </button>

          {mode !== "reset" ? (
            <>
              <div className="flex items-center gap-4 py-2 text-xs text-inksoft">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
              <button
                type="button"
                onClick={() => void google()}
                className="w-full rounded-full border border-line px-6 py-3 text-sm transition-colors hover:bg-muted"
              >
                Continue with Google
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm text-inksoft">
          {mode !== "signup" ? (
            <button type="button" className="text-left underline-link w-fit" onClick={() => setMode("signup")}>
              New here? Create an account
            </button>
          ) : null}
          {mode !== "signin" ? (
            <button type="button" className="text-left underline-link w-fit" onClick={() => setMode("signin")}>
              Already have an account? Sign in
            </button>
          ) : null}
          {mode !== "reset" ? (
            <button type="button" className="text-left underline-link w-fit" onClick={() => setMode("reset")}>
              Forgot your password?
            </button>
          ) : null}
          <Link to="/" className="w-fit underline-link">
            Back home
          </Link>
        </div>
      </Container>
    </SiteLayout>
  );
}
