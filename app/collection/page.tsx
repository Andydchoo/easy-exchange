import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

async function CollectionContent() {
  const user = await requireUser();

  return (
    <>
      <p className="mb-4 text-sm">Signed in as {user.email}</p>
      <Link
        href="/collection/new"
        className="mb-4 inline-block rounded bg-black px-3 py-2 text-white"
      >
        Add CD
      </Link>
      <form action={logout}>
        <button type="submit" className="rounded border px-3 py-2">
          Log out
        </button>
      </form>
    </>
  );
}

export default function CollectionPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">My collection</h1>
      <Suspense>
        <CollectionContent />
      </Suspense>
    </main>
  );
}
