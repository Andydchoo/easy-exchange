import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlbumCover } from "@/components/AlbumCover";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONDITION_LABELS = {
  MINT: "Mint",
  VERY_GOOD: "Very good",
  GOOD: "Good",
  FAIR: "Fair",
} as const;

type ProfileRow = { id: string; display_name: string };
type ProfileEmbed = ProfileRow | ProfileRow[] | null;

type CdRow = {
  id: string;
  owner_id: string;
  musicbrainz_release_group_id: string;
  artist: string;
  album_title: string;
  genre: string;
  condition: keyof typeof CONDITION_LABELS;
  description: string | null;
  is_available: boolean;
  profiles: ProfileEmbed;
};

function readOwner(profiles: ProfileEmbed): ProfileRow | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

async function CdDetail({
  params,
}: {
  params: PageProps<"/cd/[id]">["params"];
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createClient();
  const [cdResult, user] = await Promise.all([
    supabase
      .from("cds")
      .select(
        "id, owner_id, musicbrainz_release_group_id, artist, album_title, genre, condition, description, is_available, profiles(id, display_name)",
      )
      .eq("id", id)
      .maybeSingle(),
    getCurrentUser(),
  ]);

  if (cdResult.error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load this CD. Please try again.
      </p>
    );
  }

  if (!cdResult.data) notFound();

  const cd = cdResult.data as CdRow;
  const owner = readOwner(cd.profiles);
  const isOwner = Boolean(user && user.id === cd.owner_id);

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <AlbumCover
        releaseGroupId={cd.musicbrainz_release_group_id}
        alt={`${cd.album_title} cover`}
        size="large"
      />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{cd.album_title}</h1>
          <p className="text-base">{cd.artist}</p>
          <p className="text-sm text-gray-500">{cd.genre}</p>
        </div>

        <p className="text-sm">
          Condition: {CONDITION_LABELS[cd.condition]}
        </p>
        <p
          className={
            cd.is_available
              ? "text-sm font-medium text-green-700"
              : "text-sm font-medium text-gray-500"
          }
        >
          {cd.is_available ? "Available" : "Unavailable"}
        </p>

        {cd.description && (
          <p className="text-sm whitespace-pre-wrap">{cd.description}</p>
        )}

        {owner && (
          <p className="text-sm">
            Listed by{" "}
            <Link
              href={`/profile/${cd.owner_id}`}
              className="underline"
            >
              {owner.display_name}
            </Link>
          </p>
        )}

        <div className="mt-4">
          {isOwner ? (
            <Link
              href={`/collection/${cd.id}/edit`}
              className="inline-block rounded border px-3 py-2 text-sm"
            >
              Edit Listing
            </Link>
          ) : !cd.is_available ? (
            <p className="text-sm text-gray-600">
              This CD is not currently available for trade.
            </p>
          ) : user ? (
            <details className="rounded border border-gray-300 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Offer a Trade
              </summary>
              <p className="mt-2 text-sm text-gray-600">
                Trade selection is coming soon. You will be able to choose one
                of your available CDs to offer in exchange.
              </p>
            </details>
          ) : (
            <Link
              href="/login"
              className="inline-block rounded bg-black px-3 py-2 text-sm text-white"
            >
              Log in to offer a trade
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CdDetailPage({ params }: PageProps<"/cd/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Suspense>
        <CdDetail params={params} />
      </Suspense>
    </main>
  );
}
