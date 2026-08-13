import Image from "next/image";
import { CARD_ASSETS, type CardAssetId } from "@/lib/cards";
import { cn } from "@/lib/utils";

interface CardImageProps {
  card?: CardAssetId;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function CardImage({
  card = "griffey",
  className,
  sizes = "160px",
  priority = false,
}: CardImageProps) {
  const asset = CARD_ASSETS[card];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[5px] bg-white shadow-sm ring-1 ring-black/8",
        className
      )}
      style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        className="object-cover object-center"
        priority={priority}
      />
    </div>
  );
}
