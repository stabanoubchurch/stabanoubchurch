import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Parish Admin" },
      { name: "description", content: "Sign in to manage the embeddable parish pages." },
      { property: "og:title", content: "Sign In — Parish Admin" },
      { property: "og:description", content: "Sign in to manage the embeddable parish pages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        setMessage("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <span className="block h-px w-12 bg-gold" />
        <h1 className="mt-4 text-3xl text-primary">
          {mode === "signin" ? "Admin sign in" : "Create admin account"}
        </h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold text-primary">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-slate disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-gold hover:underline"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}