## Goal

Four standalone pages, each designed to be dropped into your existing app via an iframe, with content you manage yourself from an admin editor in this project.

## Pages (each on its own route, iframe-safe)

- `/embed/priests` — Parish priests: photo, name, role, bio, contact (email/phone), as a card list.
- `/embed/calendar` — Monthly grid overview. Days with events show markers; clicking a day opens a time-ordered breakdown of that day's events (time, title, location, description).
- `/embed/services` — All church services listed with a description and the times they're available (e.g. grouped by day).
- `/embed/spotlight` — Instagram-style feed of weekly posts: photo, caption, date, plus "heart" and "thumbs up" reaction buttons with live counts.

Each page renders bare (no site nav/footer), sized to fill the iframe, with the host page able to autosize via a small postMessage height signal.

`/` becomes a simple index that previews all four pages and shows the exact `<iframe>` snippet to paste into your app for each one.

## Content management

Lovable Cloud (database + image storage + login) gets enabled for this project.

- `/admin` — password-protected editor (email/password sign-in, admin role stored server-side). From there you can add/edit/delete priests, calendar events, services and their times, and spotlight posts, including uploading photos.
- Reactions on spotlight posts are open to anonymous viewers (one heart / one thumbs-up per browser, so counts can't be spammed by a single visitor).
- The embed pages are public read-only; nothing but published content is exposed.

## Look

Palette and type applied as design tokens across all pages:

- Deep teal `#223B4A` (primary), slate `#3D4E56`, gold `#C9994A` (accent), cream `#F7EFE3` (background), pale blue `#D9E2F1` (surface), grey `#7B7B7B` (muted), white.
- Cormorant Garamond Bold for headings, SF Pro Display Semibold/Regular for UI and body (with a system fallback stack, since SF Pro isn't a web-served font — I'll load a close web substitute for non-Apple devices).

## Technical notes

- Tables: `priests`, `events`, `services`, `service_times`, `spotlight_posts`, `spotlight_reactions`, plus `user_roles` for admin checks. Row-level security: public read on published content, writes restricted to admins.
- Photos stored in a public storage bucket, uploaded from the admin editor.
- Embed routes exclude the root chrome and set permissive framing so they render inside your app; reads go through public server functions so they still work when framed without a session.

## Assumptions I'd like flagged if wrong

- Your existing app's "calendar tab" and "services tab" will point at these iframe URLs rather than me editing that app directly.
- Events are entered manually in the admin editor (no Google Calendar sync).
