import { useEffect, useRef, type ReactNode } from "react";

/**
 * Bare wrapper for iframe-embedded pages. Reports its height to the host page
 * via postMessage so the host iframe can auto-size.
 */
export function EmbedShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const post = () => {
      window.parent?.postMessage(
        { type: "parish-embed:height", height: node.scrollHeight, path: window.location.pathname },
        "*",
      );
    };
    post();
    const observer = new ResizeObserver(post);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 text-center">
          <span className="mx-auto block h-px w-12 bg-gold" />
          <h1 className="mt-4 text-4xl text-primary sm:text-5xl">{title}</h1>
          {intro ? <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{intro}</p> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/60 p-10 text-center text-muted-foreground">
      {message}
    </div>
  );
}