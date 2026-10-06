# Easy Exchange — Project Context

## Product

Easy Exchange is a web app for exchanging physical CDs.

Users can create accounts, list CDs they own, browse CDs available from other users, and propose one-for-one CD trades.

The MVP focuses on a complete trade workflow rather than buying, selling, messaging, shipping, or social features.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Vercel
- MusicBrainz API for album metadata
- Cover Art Archive for album covers

Do not add major libraries or services unless required.

## Data Model

### profiles

- id: uuid, references auth.users
- display_name: text
- created_at

### cds

- id: uuid
- owner_id: uuid
- musicbrainz_release_group_id: uuid
- artist: text
- album_title: text
- genre: text
- condition: MINT | VERY_GOOD | GOOD | FAIR
- description: optional text
- is_available: boolean
- created_at
- updated_at

### trades

- id: uuid
- requester_id: uuid
- recipient_id: uuid
- offered_cd_id: uuid
- requested_cd_id: uuid
- status: PENDING | ACCEPTED | DECLINED | CANCELLED | COMPLETED
- created_at
- updated_at

CD ownership does not transfer when a trade completes.

## Trade Rules

Valid transitions only:

PENDING -> ACCEPTED
PENDING -> DECLINED
PENDING -> CANCELLED
ACCEPTED -> COMPLETED

Rules:

- Users cannot trade with themselves.
- Offered CD must belong to requester.
- Requested CD must belong to recipient.
- Both CDs must be available when a trade is created.
- Recipient may accept or decline.
- Requester may cancel a pending trade.
- Either participant may complete an accepted trade.
- Users cannot modify unrelated trades.

Accepting a trade must be atomic:

1. Confirm both CDs are still available.
2. Set trade to ACCEPTED.
3. Set both CDs unavailable.
4. Cancel other pending trades involving either CD.

Do not implement this as multiple independent client requests.

## Authorization

Use Supabase RLS and database/server-side validation.

Never rely only on hidden or disabled UI controls for authorization.

Users may modify only their own CDs.

Trades may be viewed only by their requester or recipient.

Do not expose privileged Supabase credentials to client-side code.

## Music Metadata

When adding a CD:

1. User enters artist and album.
2. User explicitly searches MusicBrainz.
3. Server route queries MusicBrainz release groups.
4. Return approximately 5 normalized results containing only:
   - id
   - title
   - artist
   - firstReleaseDate when available
   - genre when available
5. User selects a result.
6. Store selected metadata in Supabase.

Do not call MusicBrainz whenever existing listings render.

Use a meaningful MusicBrainz User-Agent and respect its rate limits.

Album covers use Cover Art Archive based on the stored release-group MBID.

Use a reusable AlbumCover component with a fallback when no cover exists.

Do not implement image uploads.

## Routes

/ marketplace
/login login
/register registration
/collection user's CDs
/collection/new add CD
/collection/[id]/edit edit CD
/cd/[id] CD details
/trades incoming/outgoing/history
/profile/[id] public profile

API:

/api/musicbrainz/search

Do not introduce new routes unless technically necessary.

## Marketplace

Show available CDs only.

Support:

- search by artist or album
- genre filter
- CD details
- owner profile link

Users cannot offer trades for their own CDs.

Unauthenticated users may browse but cannot create listings or trades.

## UI

Keep UI simple, responsive, and reusable.

Use Tailwind CSS.

Prefer Server Components unless client-side interaction is required.

Add "use client" only when necessary.

Preferred reusable components:

- Navbar
- AlbumCover
- CDCard
- CDGrid
- SearchBar
- ConditionBadge
- TradeCard
- EmptyState

Do not create abstractions unless there is actual reuse.

## Out of Scope

Do not implement unless requirements are explicitly changed:

- payments
- buying/selling
- auctions
- multi-CD trades
- messaging/chat
- ratings/reviews
- shipping
- addresses
- wishlists
- notifications
- social login
- AI recommendations
- admin dashboard
- user-uploaded cover images

## Development Rules

Work on one scoped task at a time.

Do not attempt to build the entire application from this document.

For each task:

- inspect only relevant files
- make the smallest complete change
- reuse existing code
- avoid unrelated refactors
- avoid unnecessary dependencies
- do not implement future features
- preserve this specification unless I explicitly change it

When a task uses a Cursor Skill, follow that Skill's workflow.

Keep completion responses concise:

- files changed
- what was implemented
- verification result
- unresolved issue, if any

If a requested change requires an architectural decision not defined here, ask before inventing one.

Do not implement anything yet. Treat this document as the project's source of truth and wait for a scoped task.
