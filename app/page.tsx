import Link from "next/link";
import { Suspense } from "react";
import { CDCard, type CDCardData } from "@/components/CDCard";
import { createClient } from "@/lib/supabase/server";

type ProfileEmbed =
  | { display_name?: string }
  | { display_name?: string }[]
  | null;

type ListingRow = {
  id: string;
  musicbrainz_release_group_id: string;
  artist: string;
  album_title: string;
  genre: string;
  condition: CDCardData["condition"];
  is_available: boolean;
  profiles: ProfileEmbed;
};

function readOwnerName(profiles: ProfileEmbed): string | undefined {
  if (!profiles) return undefined;
  return Array.isArray(profiles)
    ? profiles[0]?.display_name
    : profiles.display_name;
}

async function Marketplace({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim();
  const genre = (typeof params.genre === "string" ? params.genre : "").trim();

  const supabase = await createClient();

  let listingsQuery = supabase
    .from("cds")
    .select(
      "id, musicbrainz_release_group_id, artist, album_title, genre, condition, is_available, profiles(display_name)",
    )
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (q) {
    // Strip characters that would break PostgREST's .or() syntax and the
    // wrapping quote itself, then use the quoted form so a literal comma or
    // parenthesis in the user input still works.
    const safe = q.replace(/["%*\\]/g, " ").trim();
    if (safe) {
      const pattern = `%${safe}%`;
      listingsQuery = listingsQuery.or(
        `artist.ilike."${pattern}",album_title.ilike."${pattern}"`,
      );
    }
  }

  if (genre) {
    listingsQuery = listingsQuery.eq("genre", genre);
  }

  const [listingsResult, genresResult] = await Promise.all([
    listingsQuery,
    supabase.from("cds").select("genre").eq("is_available", true),
  ]);

  const error = listingsResult.error ?? genresResult.error;

  const cds: CDCardData[] = ((listingsResult.data ?? []) as ListingRow[]).map(
    (row) => ({
      id: row.id,
      musicbrainz_release_group_id: row.musicbrainz_release_group_id,
      artist: row.artist,
      album_title: row.album_title,
      genre: row.genre,
      condition: row.condition,
      is_available: row.is_available,
      ownerDisplayName: readOwnerName(row.profiles),
    }),
  );

  const genres = [
    ...new Set(
      ((genresResult.data ?? []) as { genre: string }[]).map((row) => row.genre),
    ),
  ].sort();

  const hasFilters = Boolean(q || genre);

  return (
    <>
      <form className="mb-6 flex flex-wrap items-stretch gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search artist or album"
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          aria-label="Search artist or album"
        />
        <select
          name="genre"
          defaultValue={genre}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          aria-label="Filter by genre"
        >
          <option value="">All genres</option>
          {genres.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-sm text-white"
        >
          Search
        </button>
        {hasFilters && (
          <Link href="/" className="rounded border px-3 py-2 text-sm">
            Clear
          </Link>
        )}
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          Could not load the marketplace. Please try again.
        </p>
      ) : cds.length === 0 ? (
        hasFilters ? (
          <div className="rounded border border-dashed border-gray-300 p-8 text-center text-sm">
            <p className="mb-2">No CDs match your search.</p>
            <Link href="/" className="underline">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-300 p-8 text-center text-sm">
            <p>No CDs are available to trade yet. Check back soon.</p>
          </div>
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cds.map((cd) => (
            <li key={cd.id}>
              <CDCard cd={cd} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Find your next CD</h1>
      <p className="mb-6 text-sm text-gray-600">
        Browse CDs listed by other collectors and propose a one-for-one trade.
      </p>
      <Suspense>
        <Marketplace searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
