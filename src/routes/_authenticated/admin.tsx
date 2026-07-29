import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { PriestsPanel } from "@/components/admin/PriestsPanel";
import { EventsPanel } from "@/components/admin/EventsPanel";
import { ServicesPanel } from "@/components/admin/ServicesPanel";
import { SpotlightPanel } from "@/components/admin/SpotlightPanel";

const TABS = [
  { id: "priests", label: "Priests" },
  { id: "events", label: "Calendar" },
  { id: "services", label: "Services" },
  { id: "spotlight", label: "Spotlight" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Parish Admin Editor" },
      { name: "description", content: "Edit priests, calendar events, services and spotlight posts." },
      { property: "og:title", content: "Parish Admin Editor" },
      {
        property: "og:description",
        content: "Edit priests, calendar events, services and spotlight posts.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("priests");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="block h-px w-12 bg-gold" />
            <h1 className="mt-3 text-4xl text-primary">Parish Admin</h1>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary"
            >
              Embed links
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary"
            >
              Sign out
            </button>
          </div>
        </div>

        {isAdmin === false ? (
          <p className="mt-8 rounded-lg border border-border bg-card p-6 text-sm text-slate">
            Your account is signed in but doesn't have the admin role yet, so saving will be
            rejected. Ask an existing admin to grant you the <strong>admin</strong> role.
          </p>
        ) : null}

        <nav className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-primary hover:bg-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {tab === "priests" ? <PriestsPanel /> : null}
          {tab === "events" ? <EventsPanel /> : null}
          {tab === "services" ? <ServicesPanel /> : null}
          {tab === "spotlight" ? <SpotlightPanel /> : null}
        </div>
      </div>
    </main>
  );
}