import Link from "next/link";
import { AlbumCover } from "@/components/AlbumCover";

export type CDCardData = {
  id: string;
  musicbrainz_release_group_id: string;
  artist: string;
  album_title: string;
  genre: string;
  condition: "MINT" | "VERY_GOOD" | "GOOD" | "FAIR";
  is_available: boolean;
};

const CONDITION_LABELS: Record<CDCardData["condition"], string> = {
  MINT: "Mint",
  VERY_GOOD: "Very good",
  GOOD: "Good",
  FAIR: "Fair",
};

export function CDCard({ cd }: { cd: CDCardData }) {
  return (
    <Link
      href={`/cd/${cd.id}`}
      className="flex flex-col gap-3 rounded border border-gray-300 p-3 hover:bg-gray-50"
    >
      <AlbumCover
        releaseGroupId={cd.musicbrainz_release_group_id}
        alt={`${cd.album_title} cover`}
        size="large"
      />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{cd.album_title}</span>
        <span className="text-sm">{cd.artist}</span>
        <span className="text-sm text-gray-500">{cd.genre}</span>
        <span className="text-sm">{CONDITION_LABELS[cd.condition]}</span>
        <span
          className={
            cd.is_available
              ? "text-sm text-green-700"
              : "text-sm text-gray-500"
          }
        >
          {cd.is_available ? "Available" : "Unavailable"}
        </span>
      </div>
    </Link>
  );
}
