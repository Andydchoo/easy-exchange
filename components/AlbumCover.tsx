"use client";

import Image from "next/image";
import { useState } from "react";

const SIZES = {
  small: { pixels: 64, variant: "front-250" },
  large: { pixels: 250, variant: "front-500" },
} as const;

type AlbumCoverProps = {
  releaseGroupId: string;
  alt: string;
  size?: keyof typeof SIZES;
};

export function AlbumCover({
  releaseGroupId,
  alt,
  size = "small",
}: AlbumCoverProps) {
  const [failedId, setFailedId] = useState<string | null>(null);
  const { pixels, variant } = SIZES[size];

  if (failedId === releaseGroupId) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{ width: pixels, height: pixels }}
        className="flex shrink-0 items-center justify-center bg-gray-200 text-center text-xs text-gray-500"
      >
        No cover
      </div>
    );
  }

  return (
    <Image
      src={`https://coverartarchive.org/release-group/${releaseGroupId}/${variant}`}
      alt={alt}
      width={pixels}
      height={pixels}
      unoptimized
      onError={() => setFailedId(releaseGroupId)}
      className="shrink-0 bg-gray-100 object-cover"
      style={{ width: pixels, height: pixels }}
    />
  );
}
