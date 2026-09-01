import type { ReactNode } from "react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 border-b border-line pb-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.2em] text-ember">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}
