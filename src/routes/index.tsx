import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const PAGES = [
  {
    to: "/embed/priests" as const,
    title: "Parish Priests",
    blurb: "Photos, bios and contact details for the clergy.",
  },
  {
    to: "/embed/calendar" as const,
    title: "Calendar",
    blurb: "Monthly grid with a per-day breakdown of events.",
  },
  {
    to: "/embed/services" as const,
    title: "Services",
    blurb: "Every service explained, with the times it runs.",
  },
  {
    to: "/embed/spotlight" as const,
    title: "Service Spotlight",
    blurb: "Weekly photo feed with hearts and thumbs-up.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parish Embeds — Pages for Your App" },
      {
        name: "description",
        content:
          "Four ready-to-embed parish pages — priests, calendar, services and spotlight — managed from one admin editor.",
      },
      { property: "og:title", content: "Parish Embeds — Pages for Your App" },
      {
        property: "og:description",
        content: "Four ready-to-embed parish pages, managed from one admin editor.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <span className="block h-px w-12 bg-gold" />
        <h1 className="mt-4 text-5xl text-primary">Parish Embeds</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Four standalone pages you can drop into your existing app with an iframe. Edit all of
          their content from the admin area.
        </p>
        <Link
          to="/admin"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-slate"
        >
          Open admin editor
        </Link>

        <div className="mt-12 space-y-5">
          {PAGES.map((page) => (
            <section key={page.to} className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-2xl text-primary">{page.title}</h2>
                <Link to={page.to} className="text-sm font-semibold text-gold hover:underline">
                  Preview page →
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{page.blurb}</p>
              <pre className="mt-4 overflow-x-auto rounded-md bg-secondary p-3 text-xs text-primary">
                {`<iframe src="${origin}${page.to}" width="100%" height="800" style="border:0" title="${page.title}"></iframe>`}
              </pre>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Each embed posts its height to the host page as{" "}
          <code>{`{ type: "parish-embed:height", height }`}</code>, so you can auto-size the iframe
          from a <code>message</code> listener.
        </p>
      </div>
    </main>
  );
}
