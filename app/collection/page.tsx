import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/auth/actions";
import { CDCard, type CDCardData } from "@/components/CDCard";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function CollectionContent() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cds")
    .select(
      "id, musicbrainz_release_group_id, artist, album_title, genre, condition, is_available",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const cds = (data ?? []) as CDCardData[];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">Signed in as {user.email}</p>
        <div className="flex items-center gap-2">
          <Link
            href="/collection/new"
            className="rounded bg-black px-3 py-2 text-white"
          >
            Add CD
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded border px-3 py-2">
              Log out
            </button>
          </form>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          Could not load your collection.
        </p>
      ) : cds.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-8 text-center">
          <p className="mb-4 text-sm">You have not added any CDs yet.</p>
          <Link
            href="/collection/new"
            className="inline-block rounded bg-black px-3 py-2 text-white"
          >
            Add your first CD
          </Link>
        </div>
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

export default function CollectionPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">My collection</h1>
      <Suspense>
        <CollectionContent />
      </Suspense>
    </main>
  );
}
