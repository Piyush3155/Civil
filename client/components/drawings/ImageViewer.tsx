"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";

interface ImageViewerProps {
  fileUrl: string;
  title?: string;
}

export default function ImageViewer({ fileUrl, title }: ImageViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.25));
  }

  function rotate() {
    setRotation((prev) => (prev + 90) % 360);
  }

  function openFullscreen() {
    window.open(fileUrl, "_blank");
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
        <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.25}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
        <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button variant="outline" size="sm" onClick={rotate}>
          <RotateCw className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button variant="outline" size="sm" onClick={openFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-auto w-full flex justify-center items-center">
        <div
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: "transform 0.2s ease",
          }}
          className="relative"
        >
          <Image
            src={fileUrl}
            alt={title || "Drawing"}
            width={800}
            height={600}
            className="rounded-lg shadow-lg object-contain"
            style={{ maxWidth: "100%", height: "auto" }}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
