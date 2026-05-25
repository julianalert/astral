# Agent Instructions

## Mixpanel Analytics

Seraphova uses **Mixpanel** for product analytics via the `mixpanel-browser` SDK (client-side only).

### Configuration

- **Token env var:** `NEXT_PUBLIC_MIXPANEL_TOKEN` (see `.env.local`)
- **Init:** `lib/mixpanel.ts` — called from `components/MixpanelProvider.tsx` on app load
- **Provider:** `components/MixpanelProvider.tsx` — mounted in `app/layout.tsx`

### Identity

| Action | Where | Calls |
|--------|-------|-------|
| Login / session restore | `components/MixpanelProvider.tsx` | `identifyUser(userId, { email })` |
| Email signup | `app/(auth)/signup/page.tsx` | `trackSignUpCompleted(userId, "email")` |
| Google signup | `components/MixpanelProvider.tsx` | `trackSignUpCompleted(userId, "google")` on recent OAuth sign-in |
| Logout | `components/MixpanelProvider.tsx` | `resetMixpanel()` on `SIGNED_OUT` |

Use the Supabase user UUID as `distinct_id` — never email.

### Tracking Plan (Quick Start)

| Event | Trigger | Properties |
|-------|---------|------------|
| `sign_up_completed` | Successful signup | `sign_up_method` (`email` \| `google`), `platform` (`web`) |
| `onboarding_completed` | Onboarding context step succeeds | `platform` (`web`), `focus_area`, `has_situation` (boolean) |
| `chat_message_sent` | User sends a chat message | `platform` (`web`), `is_new_conversation` (boolean) |
| `briefing_viewed` | Daily briefing loads successfully | `platform` (`web`), `is_today` (boolean), `briefing_date` (YYYY-MM-DD) |
| `relationship_added` | User creates a relationship profile | `platform` (`web`), `has_birth_time` (boolean), `has_birth_location` (boolean) |

Page views are auto-tracked via `track_pageview: true` in SDK init.

### Naming Conventions

- Event names: `snake_case` verbs (`sign_up_completed`, `chat_message_sent`)
- Property names: `snake_case`
- Always include `platform: "web"` on custom events

### Adding New Events

1. Add a typed helper or direct `track()` call at the user action site (client components only).
2. Use `identifyUser()` before people-profile properties; use `track()` for events.
3. Do not track PII beyond `$email` on the user profile.
4. Verify in Mixpanel Live View after deploying.

### Anti-patterns

- Do not import `mixpanel-browser` in server components or API routes.
- Do not call `identify()` on every page load — only on auth state changes.
- Do not use email as `distinct_id`.
- Do not duplicate `sign_up_completed` — use `trackSignUpCompleted()` which deduplicates via localStorage.
