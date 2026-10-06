"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AddCdState = {
  error?: string;
};

const CONDITIONS = ["MINT", "VERY_GOOD", "GOOD", "FAIR"] as const;
type Condition = (typeof CONDITIONS)[number];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addCd(
  _prevState: AddCdState,
  formData: FormData,
): Promise<AddCdState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in to add a CD." };
  }

  const releaseGroupId = getField(formData, "musicbrainz_release_group_id");
  const artist = getField(formData, "artist");
  const albumTitle = getField(formData, "album_title");
  const genre = getField(formData, "genre");
  const condition = getField(formData, "condition");
  const description = getField(formData, "description");
  const isAvailable = formData.get("is_available") === "on";

  if (!UUID_PATTERN.test(releaseGroupId) || !artist || !albumTitle) {
    return { error: "Select an album from the search results." };
  }

  if (!CONDITIONS.includes(condition as Condition)) {
    return { error: "Select a condition." };
  }

  if (!genre) {
    return { error: "Genre is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cds").insert({
    owner_id: user.id,
    musicbrainz_release_group_id: releaseGroupId,
    artist,
    album_title: albumTitle,
    genre,
    condition: condition as Condition,
    description: description || null,
    is_available: isAvailable,
  });

  if (error) {
    return { error: "Could not save the CD. Please try again." };
  }

  redirect("/collection");
}
