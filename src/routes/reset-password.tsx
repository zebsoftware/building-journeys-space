import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — The Founder" },
      { name: "description", content: "Set a new password for your The Founder account." },
      { property: "og:title", content: "Choose a new password — The Founder" },
      { property: "og:description", content: "Finish resetting your account password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      void navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <Container className="max-w-[460px] py-20">
        <h1 className="font-display text-4xl tracking-tight">Choose a new password</h1>
        <label className="mt-8 block">
          <span className="text-xs uppercase tracking-[0.15em] text-inksoft">New password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          type="button"
          disabled={busy || password.length < 6}
          onClick={() => void submit()}
          className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm text-background disabled:opacity-50"
        >
          Update password
        </button>
      </Container>
    </SiteLayout>
  );
}
