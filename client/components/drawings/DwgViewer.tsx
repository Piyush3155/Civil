/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink } from "lucide-react";

interface DwgViewerProps {
  urn: string;
  accessToken?: string;
}

declare global {
  interface Window {
    Autodesk: any;
  }
}

export default function DwgViewer({ urn, accessToken }: DwgViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || !viewerRef.current || !urn) return;

    const loadViewer = async () => {
      try {
        const Autodesk = window.Autodesk;
        if (!Autodesk) {
          setError("Autodesk Viewer not loaded");
          return;
        }

        const options = {
          env: "AutodeskProduction",
          accessToken: accessToken,
        };

        Autodesk.Viewing.Initializer(options, () => {
          const viewer = new Autodesk.Viewing.GuiViewer3D(viewerRef.current!);
          viewer.start();
          setViewerLoaded(true);

          Autodesk.Viewing.Document.load(
            `urn:${urn}`,
            (doc: any) => {
              const defaultModel = doc.getRoot().getDefaultGeometry();
              viewer.loadDocumentNode(doc, defaultModel);
            },
            (errorCode: number, errorMessage: string) => {
              console.error("Error loading DWG:", errorCode, errorMessage);
              setError(`Failed to load document: ${errorMessage}`);
            }
          );
        });
      } catch (err) {
        console.error("Viewer initialization error:", err);
        setError("Failed to initialize viewer");
      }
    };

    loadViewer();
  }, [scriptLoaded, urn, accessToken]);

  // If no URN or access token, show a placeholder message
  if (!urn || !accessToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] bg-muted rounded-lg p-4 sm:p-6 md:p-8">
        <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">DWG Viewer Setup Required</h3>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md px-2">
          To view DWG files directly in the browser, you need to configure Autodesk Forge Viewer.
          This requires an Autodesk account and API credentials.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="sm:size-default" asChild>
            <a
              href="https://forge.autodesk.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Learn More
            </a>
          </Button>
        </div>
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background rounded-lg border w-full max-w-md">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong>Alternative:</strong> You can download the DWG file and open it with AutoCAD or a free DWG viewer like:
          </p>
          <ul className="text-xs sm:text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
            <li>Autodesk Online Viewer (free)</li>
            <li>DWG TrueView (free desktop app)</li>
            <li>LibreCAD (open source)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError("Failed to load Autodesk Viewer script")}
      />
      <link
        rel="stylesheet"
        href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css"
      />

      {error && (
        <div className="flex items-center justify-center h-48 sm:h-56 md:h-64 text-destructive px-4 text-center">
          <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      )}

      {!viewerLoaded && !error && (
        <div className="flex items-center justify-center h-48 sm:h-56 md:h-64">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div
        ref={viewerRef}
        className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] border rounded-lg"
        style={{ display: viewerLoaded ? "block" : "none" }}
      />
    </>
  );
}
