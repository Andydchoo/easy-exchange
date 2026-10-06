import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MusicBrainzError, searchReleaseGroups } from "@/lib/musicbrainz";

const MAX_QUERY_LENGTH = 200;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const artist = request.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const album = request.nextUrl.searchParams.get("album")?.trim() ?? "";

  if (!artist || !album) {
    return NextResponse.json(
      { error: "Artist and album are required." },
      { status: 400 },
    );
  }

  if (artist.length > MAX_QUERY_LENGTH || album.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: "Artist and album must be 200 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const results = await searchReleaseGroups(artist, album);
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof MusicBrainzError
        ? error.message
        : "MusicBrainz search failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
