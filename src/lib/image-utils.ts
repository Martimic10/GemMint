/** Client-side image helpers for grading uploads. */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export async function pathToDataUrl(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load image: ${path}`);
  const blob = await res.blob();
  return fileToDataUrl(new File([blob], "card.jpg", { type: blob.type || "image/jpeg" }));
}

export async function resizeDataUrl(
  dataUrl: string,
  maxEdge = MAX_EDGE,
  quality = JPEG_QUALITY
): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function prepareImageForGrade(
  source: File | string
): Promise<{ dataUrl: string; width: number; height: number }> {
  const raw =
    typeof source === "string"
      ? source.startsWith("data:")
        ? source
        : await pathToDataUrl(source)
      : await fileToDataUrl(source);

  const resized = await resizeDataUrl(raw);
  const img = await loadImage(resized);
  return { dataUrl: resized, width: img.width, height: img.height };
}

/** Smaller payload for multi-photo lot pricing (names still readable). */
export async function prepareImageForLot(
  source: File | string
): Promise<{ dataUrl: string; width: number; height: number }> {
  const raw =
    typeof source === "string"
      ? source.startsWith("data:")
        ? source
        : await pathToDataUrl(source)
      : await fileToDataUrl(source);

  const resized = await resizeDataUrl(raw, 1280, 0.7);
  const img = await loadImage(resized);
  return { dataUrl: resized, width: img.width, height: img.height };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = src;
  });
}

export async function makeThumbnail(
  dataUrl: string,
  maxEdge = 720
): Promise<string> {
  try {
    return await resizeDataUrl(dataUrl, maxEdge, 0.86);
  } catch {
    return dataUrl;
  }
}

export async function getImageDimensions(
  source: File | string
): Promise<{ width: number; height: number }> {
  const raw =
    typeof source === "string"
      ? source.startsWith("data:") || source.startsWith("blob:")
        ? source
        : await pathToDataUrl(source)
      : await fileToDataUrl(source);
  const img = await loadImage(raw);
  return { width: img.width, height: img.height };
}

export function buildClientQualityChecks(front: {
  width: number;
  height: number;
}): import("@/lib/grade-flow-data").QualityCheck[] {
  const longEdge = Math.max(front.width, front.height);
  // Phone cameras are usually fine; never block grading on resolution.
  // Only warn when the capture is clearly soft for lab-style inspection.
  const resolutionStatus = longEdge >= 1000 ? "pass" : "warn";

  return [
    {
      id: "resolution",
      label: "Resolution",
      status: resolutionStatus,
      detail:
        longEdge >= 1000
          ? `Long edge is ${longEdge}px — good for grading.`
          : longEdge >= 500
            ? `Long edge is ${longEdge}px. Phone photos work — fill the frame and stay sharp for best results.`
            : `Long edge is only ${longEdge}px. Move closer and retake if the AI grade looks off.`,
    },
    {
      id: "lighting",
      label: "Lighting",
      status: "pass",
      detail: "AI will evaluate exposure and glare during inspection.",
    },
    {
      id: "perspective",
      label: "Perspective",
      status: "pass",
      detail: "Keep the card flat and parallel to the camera when possible.",
    },
    {
      id: "sharpness",
      label: "Sharpness",
      status: "pass",
      detail: "Focus will be assessed by the grading model.",
    },
    {
      id: "detection",
      label: "Card Detected",
      status: "pass",
      detail: "Front and back images ready for AI inspection.",
    },
  ];
}
