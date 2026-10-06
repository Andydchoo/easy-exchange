import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Easy Exchange
        </Link>
        <ul className="flex flex-wrap items-center gap-4 text-sm">
          <li>
            <Link href="/">Marketplace</Link>
          </li>
          {user ? (
            <>
              <li>
                <Link href="/collection">My Collection</Link>
              </li>
              <li>
                <Link href="/trades">Trades</Link>
              </li>
              <li>
                <form action={logout}>
                  <button
                    type="submit"
                    className="rounded border px-2 py-1 text-sm"
                  >
                    Log Out
                  </button>
                </form>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login">Log In</Link>
              </li>
              <li>
                <Link href="/register">Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export function NavbarFallback() {
  return (
    <nav className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Easy Exchange
        </Link>
      </div>
    </nav>
  );
}
