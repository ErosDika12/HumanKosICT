"use client";

import Image from "next/image";
import { PHOTO_DISCLAIMER, type Photo as PhotoData } from "@/lib/photos";
import { useI18n } from "@/components/LocaleProvider";

/**
 * A responsive, already-optimized photo (1280px / 640px JPEGs in
 * public/photos). Callers set positioning (`relative` or `absolute inset-0`). `illustrative` adds the honest label for photos that
 * illustrate a fictional 2036 activity; `credit` adds the license line.
 */
export function Photo({
  photo,
  sizes = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw",
  priority = false,
  small = false,
  illustrative = false,
  credit = false,
  className = "",
  imgClassName = "",
}: {
  photo: PhotoData;
  sizes?: string;
  priority?: boolean;
  /** Use the 640px variant (cards, thumbnails). */
  small?: boolean;
  illustrative?: boolean;
  credit?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const { t } = useI18n();
  return (
    <figure className={`overflow-hidden ${className}`}>
      <Image
        src={small ? photo.srcSm : photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className={`object-cover ${imgClassName}`}
      />
      {illustrative && (
        <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">
          {t("fact.illustrative")}
        </figcaption>
      )}
      {credit && (
        <figcaption className="absolute bottom-2 right-2 max-w-[70%] truncate rounded-full bg-black/70 px-2.5 py-1 text-[11px] text-white">
          {photo.author} · {photo.license}
        </figcaption>
      )}
    </figure>
  );
}

export { PHOTO_DISCLAIMER };
