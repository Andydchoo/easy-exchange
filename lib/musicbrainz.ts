export type ReleaseGroupResult = {
  id: string;
  title: string;
  artist: string;
  firstReleaseDate?: string;
  genre?: string;
};

type MusicBrainzReleaseGroup = {
  id: string;
  title: string;
  "first-release-date"?: string;
  "artist-credit"?: { name: string; joinphrase?: string }[];
  tags?: { name: string; count: number }[];
};

const SEARCH_URL = "https://musicbrainz.org/ws/2/release-group";
const RESULT_LIMIT = 5;

export class MusicBrainzError extends Error {}

function userAgent() {
  const contact = process.env.MUSICBRAINZ_CONTACT;
  return contact ? `EasyExchange/0.1.0 ( ${contact} )` : "EasyExchange/0.1.0";
}

// Escapes Lucene special characters and wraps the value as a phrase.
function phrase(value: string) {
  return `"${value.replace(/[\\"]/g, "\\$&")}"`;
}

function normalize(group: MusicBrainzReleaseGroup): ReleaseGroupResult {
  const artist = (group["artist-credit"] ?? [])
    .map((credit) => credit.name + (credit.joinphrase ?? ""))
    .join("");
  const topTag = [...(group.tags ?? [])].sort((a, b) => b.count - a.count)[0];

  return {
    id: group.id,
    title: group.title,
    artist,
    firstReleaseDate: group["first-release-date"] || undefined,
    genre: topTag?.name,
  };
}

export async function searchReleaseGroups(
  artist: string,
  album: string,
): Promise<ReleaseGroupResult[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set(
    "query",
    `releasegroup:${phrase(album)} AND artist:${phrase(artist)}`,
  );
  url.searchParams.set("limit", String(RESULT_LIMIT));
  url.searchParams.set("fmt", "json");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": userAgent() },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new MusicBrainzError("MusicBrainz could not be reached.");
  }

  if (!response.ok) {
    throw new MusicBrainzError(
      response.status === 503
        ? "MusicBrainz is busy. Please try again in a moment."
        : "MusicBrainz search failed.",
    );
  }

  const body = (await response.json()) as {
    "release-groups"?: MusicBrainzReleaseGroup[];
  };

  return (body["release-groups"] ?? []).slice(0, RESULT_LIMIT).map(normalize);
}
