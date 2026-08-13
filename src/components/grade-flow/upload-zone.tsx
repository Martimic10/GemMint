"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_GAMES, UPLOAD_TIPS } from "@/lib/grade-flow-data";
import { cn } from "@/lib/utils";

export interface UploadSlotState {
  preview: string | null;
  file?: File | null;
  isDemo?: boolean;
}

interface UploadZoneProps {
  front: UploadSlotState;
  back: UploadSlotState;
  onFiles: (files: FileList | null, side?: "front" | "back") => void;
  onClear: (side: "front" | "back") => void;
  onContinue: () => void;
  disabled?: boolean;
}

export function UploadZone({
  front,
  back,
  onFiles,
  onClear,
  onContinue,
  disabled,
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const bothReady = Boolean(front.preview && back.preview);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
          Step 1 · Upload
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          Capture your card
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Upload clear front and back photos. GemMint prepares a lab-grade
          inspection from your images.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-8 rounded-[1.75rem] border-2 border-dashed p-5 transition-all duration-300 sm:p-8",
          dragging
            ? "border-emerald bg-emerald/5 shadow-[0_0_0_4px_rgba(22,163,74,0.1)]"
            : "border-border bg-card hover:border-emerald/40"
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SideSlot
            label="Front"
            preview={front.preview}
            inputRef={frontRef}
            onPick={() => frontRef.current?.click()}
            onClear={() => onClear("front")}
            onChange={(files) => onFiles(files, "front")}
          />
          <SideSlot
            label="Back"
            preview={back.preview}
            inputRef={backRef}
            onPick={() => backRef.current?.click()}
            onClear={() => onClear("back")}
            onChange={(files) => onFiles(files, "back")}
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-border/70 pt-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-emerald shadow-sm ring-1 ring-border">
            <Upload className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Drag & drop front and back images
            </p>
            <p className="mt-1 text-xs text-muted">
              PNG, JPG, or WEBP · or browse files below
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => frontRef.current?.click()}
              disabled={disabled}
            >
              Browse front
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => backRef.current?.click()}
              disabled={disabled}
            >
              Browse back
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-center text-[11px] font-semibold tracking-wide text-muted uppercase">
          Supported games
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUPPORTED_GAMES.map((game) => (
            <span
              key={game}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted"
            >
              {game}
            </span>
          ))}
        </div>
      </div>

      <ul className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
        {UPLOAD_TIPS.map((tip) => (
          <li
            key={tip}
            className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-3.5 py-3 text-sm text-muted"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex justify-center">
        <Button
          size="xl"
          className="min-w-[220px]"
          disabled={!bothReady || disabled}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function SideSlot({
  label,
  preview,
  inputRef,
  onPick,
  onClear,
  onChange,
}: {
  label: string;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onClear: () => void;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-border bg-surface">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative aspect-[3/4]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`${label} preview`}
              className="h-full w-full object-contain bg-surface-muted"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent p-3">
              <span className="text-xs font-semibold text-white">{label}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald" />
            </div>
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-foreground shadow-sm"
              aria-label={`Remove ${label}`}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            type="button"
            onClick={onPick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 px-4 text-center transition-colors hover:bg-card"
          >
            <ImagePlus className="h-8 w-8 text-muted" />
            <span className="text-sm font-semibold text-foreground">
              {label}
            </span>
            <span className="text-xs text-muted">Tap to upload</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UploadThumb({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const isRemote = src.startsWith("/");
  if (isRemote) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="280px"
        />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-contain", className)}
    />
  );
}
