"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlbumCover } from "@/components/AlbumCover";
import type { ReleaseGroupResult } from "@/lib/musicbrainz";
import { addCd, type AddCdState } from "./actions";

const CONDITION_OPTIONS = [
  { value: "MINT", label: "Mint" },
  { value: "VERY_GOOD", label: "Very good" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

const inputClass = "rounded border border-gray-300 px-3 py-2";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; results: ReleaseGroupResult[] };

export function AddCdForm() {
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [selected, setSelected] = useState<ReleaseGroupResult | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({
      artist: artist.trim(),
      album: album.trim(),
    });
    setSearch({ status: "loading" });

    try {
      const response = await fetch(`/api/musicbrainz/search?${params}`);
      const body = await response.json();
      if (!response.ok) {
        setSearch({ status: "error", message: body.error ?? "Search failed." });
        return;
      }
      setSearch({ status: "done", results: body.results });
    } catch {
      setSearch({ status: "error", message: "Search failed." });
    }
  }

  if (selected) {
    return (
      <CdDetailsForm release={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Artist
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Album
          <input
            value={album}
            onChange={(event) => setAlbum(event.target.value)}
            required
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={search.status === "loading"}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {search.status === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      {search.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {search.message}
        </p>
      )}

      {search.status === "done" && search.results.length === 0 && (
        <p className="text-sm">No albums found. Try a different spelling.</p>
      )}

      {search.status === "done" && search.results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {search.results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => setSelected(result)}
                className="flex w-full items-center gap-3 rounded border border-gray-300 p-2 text-left hover:bg-gray-50"
              >
                <AlbumCover
                  releaseGroupId={result.id}
                  alt={`${result.title} cover`}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{result.title}</span>
                  <span className="text-sm">{result.artist}</span>
                  {result.firstReleaseDate && (
                    <span className="text-sm text-gray-500">
                      {result.firstReleaseDate}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CdDetailsForm({
  release,
  onBack,
}: {
  release: ReleaseGroupResult;
  onBack: () => void;
}) {
  const [state, formAction, pending] = useActionState<AddCdState, FormData>(
    addCd,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <AlbumCover
          releaseGroupId={release.id}
          alt={`${release.title} cover`}
          size="large"
        />
        <div className="flex flex-col gap-1">
          <span className="font-medium">{release.title}</span>
          <span className="text-sm">{release.artist}</span>
          {release.firstReleaseDate && (
            <span className="text-sm text-gray-500">
              {release.firstReleaseDate}
            </span>
          )}
          <button
            type="button"
            onClick={onBack}
            className="mt-2 self-start text-sm underline"
          >
            Choose a different album
          </button>
        </div>
      </div>

      <input
        type="hidden"
        name="musicbrainz_release_group_id"
        value={release.id}
      />
      <input type="hidden" name="artist" value={release.artist} />
      <input type="hidden" name="album_title" value={release.title} />

      <label className="flex flex-col gap-1 text-sm">
        Condition
        <select name="condition" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select a condition
          </option>
          {CONDITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Genre
        <input
          name="genre"
          required
          defaultValue={release.genre ?? ""}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea name="description" rows={3} className={inputClass} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_available" defaultChecked />
        Available for trade
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add CD"}
      </button>
    </form>
  );
}
