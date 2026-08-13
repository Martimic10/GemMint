"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CARD_ASSETS, type CardAssetId } from "@/lib/cards";
import { cn } from "@/lib/utils";

export type FeatureId = "corners" | "edges" | "centering" | "surface";

interface TradingCardVizProps {
  active: FeatureId;
  card?: CardAssetId;
  className?: string;
}

export function TradingCardViz({
  active,
  card = "griffey",
  className,
}: TradingCardVizProps) {
  const asset = CARD_ASSETS[card];
  const { photo, outer, viewBox } = asset;
  const heatId = `surfaceHeat-${card}`;
  const scanGradId = `scanBeam-${card}`;
  const filterId = `labelShadow-${card}`;
  const clipId = `photoClip-${card}`;

  const cornerPoints = [
    [outer.x + 8, outer.y + 8],
    [outer.x + outer.w - 8, outer.y + 8],
    [outer.x + 8, outer.y + outer.h - 8],
    [outer.x + outer.w - 8, outer.y + outer.h - 8],
  ] as const;

  const cornerRadius = viewBox.w * 0.028;
  const labelW = viewBox.w * 0.3;
  const labelH = viewBox.h * 0.055;
  const labelX = viewBox.w / 2 - labelW / 2;
  const labelY = photo.y + photo.h * 0.38;

  // Surface defect hotspots inside the photo frame (relative)
  const hotspots = [
    { x: photo.x + photo.w * 0.22, y: photo.y + photo.h * 0.18, r: viewBox.w * 0.022 },
    { x: photo.x + photo.w * 0.72, y: photo.y + photo.h * 0.28, r: viewBox.w * 0.018 },
    { x: photo.x + photo.w * 0.35, y: photo.y + photo.h * 0.62, r: viewBox.w * 0.02 },
    { x: photo.x + photo.w * 0.78, y: photo.y + photo.h * 0.72, r: viewBox.w * 0.016 },
  ] as const;

  const scanLineH = viewBox.h * 0.04;
  const gridGap = viewBox.w * 0.045;

  return (
    <div className={cn("relative mx-auto w-full max-w-[300px]", className)}>
      <div
        className="relative overflow-hidden rounded-[5px] bg-white shadow-[0_16px_48px_rgba(17,24,39,0.12)] ring-1 ring-black/8"
        style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
      >
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes="300px"
          className="object-contain object-center"
          priority={false}
        />

        <svg
          viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={photo.x}
                y={photo.y}
                width={photo.w}
                height={photo.h}
              />
            </clipPath>
            <linearGradient id={heatId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.08" />
              <stop offset="45%" stopColor="#2563EB" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id={scanGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0" />
              <stop offset="45%" stopColor="#16A34A" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#2563EB" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
            <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="2"
                floodColor="#000"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          {/* ——— Surface scanning ——— */}
          <motion.g
            clipPath={`url(#${clipId})`}
            initial={false}
            animate={{ opacity: active === "surface" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Tint */}
            <rect
              x={photo.x}
              y={photo.y}
              width={photo.w}
              height={photo.h}
              fill={`url(#${heatId})`}
            />

            {/* Scan grid */}
            {Array.from({ length: Math.ceil(photo.w / gridGap) + 1 }).map(
              (_, i) => (
                <line
                  key={`vx-${i}`}
                  x1={photo.x + i * gridGap}
                  y1={photo.y}
                  x2={photo.x + i * gridGap}
                  y2={photo.y + photo.h}
                  stroke="#16A34A"
                  strokeOpacity="0.2"
                  strokeWidth={viewBox.w * 0.002}
                />
              )
            )}
            {Array.from({ length: Math.ceil(photo.h / gridGap) + 1 }).map(
              (_, i) => (
                <line
                  key={`hy-${i}`}
                  x1={photo.x}
                  y1={photo.y + i * gridGap}
                  x2={photo.x + photo.w}
                  y2={photo.y + i * gridGap}
                  stroke="#2563EB"
                  strokeOpacity="0.15"
                  strokeWidth={viewBox.w * 0.002}
                />
              )
            )}

            {/* Sweeping scan beam */}
            <motion.rect
              x={photo.x}
              width={photo.w}
              height={scanLineH}
              fill={`url(#${scanGradId})`}
              initial={false}
              animate={
                active === "surface"
                  ? { y: [photo.y, photo.y + photo.h - scanLineH] }
                  : { y: photo.y }
              }
              transition={
                active === "surface"
                  ? {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "linear",
                      repeatType: "reverse",
                    }
                  : { duration: 0.2 }
              }
            />

            {/* Defect hotspots */}
            {hotspots.map((spot, i) => (
              <g key={i}>
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r={spot.r * 1.8}
                  fill="rgba(22,163,74,0.12)"
                  stroke="#16A34A"
                  strokeWidth={viewBox.w * 0.004}
                  strokeDasharray={`${viewBox.w * 0.01} ${viewBox.w * 0.008}`}
                />
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r={spot.r * 0.35}
                  fill="#16A34A"
                />
              </g>
            ))}
          </motion.g>

          <motion.g
            filter={`url(#${filterId})`}
            initial={false}
            animate={{ opacity: active === "surface" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <rect
              x={photo.x + photo.w * 0.06}
              y={photo.y + photo.h * 0.06}
              width={viewBox.w * 0.36}
              height={viewBox.h * 0.048}
              rx={viewBox.h * 0.012}
              fill="rgba(255,255,255,0.95)"
            />
            <text
              x={photo.x + photo.w * 0.06 + viewBox.w * 0.18}
              y={photo.y + photo.h * 0.06 + viewBox.h * 0.033}
              textAnchor="middle"
              fill="#16A34A"
              fontSize={viewBox.w * 0.036}
              fontWeight="700"
              fontFamily="var(--font-geist-sans), sans-serif"
            >
              Surface scan
            </text>
          </motion.g>

          {/* ——— Centering ——— */}
          <g>
            <motion.rect
              x={photo.x}
              y={photo.y}
              width={photo.w}
              height={photo.h}
              fill="none"
              stroke="#16A34A"
              strokeWidth={viewBox.w * 0.008}
              strokeDasharray={`${viewBox.w * 0.02} ${viewBox.w * 0.016}`}
              initial={false}
              animate={{ opacity: active === "centering" ? 1 : 0 }}
              transition={{ duration: 0.35 }}
            />
            <motion.g
              filter={`url(#${filterId})`}
              initial={false}
              animate={{ opacity: active === "centering" ? 1 : 0 }}
              transition={{ duration: 0.35 }}
            >
              <rect
                x={labelX}
                y={labelY}
                width={labelW}
                height={labelH}
                rx={labelH * 0.28}
                fill="rgba(255,255,255,0.95)"
              />
              <text
                x={viewBox.w / 2}
                y={labelY + labelH * 0.68}
                textAnchor="middle"
                fill="#16A34A"
                fontSize={viewBox.w * 0.048}
                fontWeight="700"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                55 / 45
              </text>
            </motion.g>
          </g>

          {/* ——— Edges ——— */}
          <motion.rect
            x={outer.x}
            y={outer.y}
            width={outer.w}
            height={outer.h}
            rx={viewBox.w * 0.012}
            fill="none"
            stroke="#2563EB"
            strokeWidth={viewBox.w * 0.012}
            initial={false}
            animate={{ opacity: active === "edges" ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          />

          {/* ——— Corners ——— */}
          {cornerPoints.map(([cx, cy], i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={cornerRadius}
              fill="rgba(22,163,74,0.2)"
              stroke="#16A34A"
              strokeWidth={viewBox.w * 0.01}
              initial={false}
              animate={{
                opacity: active === "corners" ? 1 : 0,
                scale: active === "corners" ? 1 : 0.65,
              }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
