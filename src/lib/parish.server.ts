import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Priest = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
};

export type ParishEvent = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
};

export type ServiceTime = {
  id: string;
  day_of_week: number;
  start_time: string;
  note: string | null;
  location: string | null;
  recurring: boolean;
};

export type ParishService = {
  id: string;
  name: string;
  description: string;
  times: ServiceTime[];
};

export type SpotlightPost = {
  id: string;
  title: string;
  caption: string;
  image_url: string | null;
  service_name: string | null;
  posted_on: string;
  hearts: number;
  thumbsups: number;
};

export function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const BUCKET = "parish-media";

/** Turns stored storage paths into temporary readable URLs. */
export async function signMedia(
  client: ReturnType<typeof publicClient>,
  paths: (string | null)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p && !p.startsWith("http")))];
  if (unique.length === 0) return {};
  const { data } = await client.storage.from(BUCKET).createSignedUrls(unique, 60 * 60 * 24);
  const map: Record<string, string> = {};
  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  });
  return map;
}

export async function loadPriests(): Promise<Priest[]> {
  const client = publicClient();
  const { data, error } = await client
    .from("priests")
    .select("id, name, role, bio, photo_url, email, phone, sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const signed = await signMedia(client, rows.map((r) => r.photo_url));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    photo_url: r.photo_url ? (signed[r.photo_url] ?? r.photo_url) : null,
    email: r.email,
    phone: r.phone,
  }));
}

export async function loadEvents(month: string): Promise<ParishEvent[]> {
  const start = `${month}-01`;
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 1));
  const end = endDate.toISOString().slice(0, 10);
  const client = publicClient();
  const { data, error } = await client
    .from("events")
    .select("id, title, description, location, event_date, start_time, end_time")
    .eq("published", true)
    .gte("event_date", start)
    .lt("event_date", end)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return data ?? [];
}

export async function loadServices(): Promise<ParishService[]> {
  const client = publicClient();
  const { data, error } = await client
    .from("services")
    .select(
      "id, name, description, sort_order, service_times ( id, day_of_week, start_time, note, location, recurring, sort_order )",
    )
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    times: [...(s.service_times ?? [])]
      .sort((a, b) =>
        a.day_of_week === b.day_of_week
          ? a.start_time.localeCompare(b.start_time)
          : a.day_of_week - b.day_of_week,
      )
      .map((t) => ({
        id: t.id,
        day_of_week: t.day_of_week,
        start_time: t.start_time,
        note: t.note,
        location: t.location,
        recurring: t.recurring,
      })),
  }));
}

export async function loadSpotlight(): Promise<SpotlightPost[]> {
  const client = publicClient();
  const { data, error } = await client
    .from("spotlight_posts")
    .select("id, title, caption, image_url, service_name, posted_on")
    .eq("published", true)
    .order("posted_on", { ascending: false })
    .limit(60);
  if (error) throw error;
  const rows = data ?? [];
  const ids = rows.map((r) => r.id);
  const signed = await signMedia(client, rows.map((r) => r.image_url));
  let reactions: { post_id: string; kind: string }[] = [];
  if (ids.length) {
    const { data: reactionRows } = await client
      .from("spotlight_reactions")
      .select("post_id, kind")
      .in("post_id", ids);
    reactions = reactionRows ?? [];
  }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    caption: r.caption,
    image_url: r.image_url ? (signed[r.image_url] ?? r.image_url) : null,
    service_name: r.service_name,
    posted_on: r.posted_on,
    hearts: reactions.filter((x) => x.post_id === r.id && x.kind === "heart").length,
    thumbsups: reactions.filter((x) => x.post_id === r.id && x.kind === "thumbsup").length,
  }));
}

export async function toggleReactionForVisitor(input: {
  postId: string;
  visitorId: string;
  kind: "heart" | "thumbsup";
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: post } = await supabaseAdmin
    .from("spotlight_posts")
    .select("id, published")
    .eq("id", input.postId)
    .maybeSingle();
  if (!post || !post.published) throw new Error("Post not available");

  const { data: existing } = await supabaseAdmin
    .from("spotlight_reactions")
    .select("id")
    .eq("post_id", input.postId)
    .eq("visitor_id", input.visitorId)
    .eq("kind", input.kind)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("spotlight_reactions").delete().eq("id", existing.id);
  } else {
    await supabaseAdmin.from("spotlight_reactions").insert({
      post_id: input.postId,
      visitor_id: input.visitorId,
      kind: input.kind,
    });
  }

  const { count } = await supabaseAdmin
    .from("spotlight_reactions")
    .select("id", { count: "exact", head: true })
    .eq("post_id", input.postId)
    .eq("kind", input.kind);

  return { active: !existing, count: count ?? 0 };
}