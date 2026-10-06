import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | undefined;
};

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  // Session checks compare token expiry with the current time, so they must
  // run at request time rather than during prerendering or prefetching.
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return { id: data.claims.sub, email: data.claims.email };
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
