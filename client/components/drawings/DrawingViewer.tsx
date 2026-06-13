"use client";

import dynamic from "next/dynamic";
import { FileText, AlertCircle, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic import for PDF viewer to avoid SSR issues
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 sm:h-56 md:h-64">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

const ImageViewer = dynamic(() => import("./ImageViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 sm:h-56 md:h-64">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

const DwgViewer = dynamic(() => import("./DwgViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 sm:h-56 md:h-64">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

const PebViewer = dynamic(() => import("./PebViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 sm:h-56 md:h-64 bg-slate-900 rounded-lg">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-slate-400">Loading 3D Engine...</p>
      </div>
    </div>
  ),
});

const PlanViewer = dynamic(() => import("./PlanViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 sm:h-56 md:h-64 bg-slate-900 rounded-lg">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-slate-400">Loading 3D Engine...</p>
      </div>
    </div>
  ),
});

interface DrawingViewerProps {
  fileUrl: string;
  fileType: string;
  title?: string;
  description?: string; // Used for PEB config parsing
  urn?: string; // For Autodesk Forge viewer (DWG files)
  accessToken?: string; // For Autodesk Forge viewer
  id?: string; // Drawing ID
}

// CDN URL for file downloads
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://localhost:3000";

export default function DrawingViewer({
  fileUrl,
  fileType,
  title,
  description,
  urn,
  accessToken,
  id,
}: DrawingViewerProps) {
  const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${CDN_URL}${fileUrl}`;

  function handleDownload() {
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = title || "drawing";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openInNewTab() {
    window.open(fullUrl, "_blank");
  }

  // Render appropriate viewer based on file type
  function renderViewer() {
    const type = fileType.toUpperCase();

    switch (type) {
      case "PDF":
        return <PdfViewer fileUrl={fullUrl} />;

      case "IMAGE":
      case "PNG":
      case "JPG":
      case "JPEG":
      case "GIF":
      case "WEBP":
        return <ImageViewer fileUrl={fullUrl} title={title} />;

      case "PEB":
        return <PebViewer description={description} />;

      case "PLAN":
        return <PlanViewer description={description} drawingId={id} />;

      case "DWG":
      case "DXF":
        // If URN and access token are provided, use Autodesk Forge viewer
        if (urn && accessToken) {
          return <DwgViewer urn={urn} accessToken={accessToken} />;
        }
        // Otherwise show fallback UI
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] bg-muted rounded-lg p-4 sm:p-6 md:p-8">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">{type} File</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md px-2">
              DWG/DXF files require Autodesk Forge Viewer to view in browser.
              You can download the file to view it in AutoCAD or a compatible viewer.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto px-4 sm:px-0">
              <Button onClick={handleDownload} size="sm" className="sm:size-default">
                <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Download File
              </Button>
              <Button variant="outline" size="sm" className="sm:size-default" asChild>
                <a
                  href="https://viewer.autodesk.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Open in Autodesk Viewer
                </a>
              </Button>
            </div>
          </div>
        );

      case "IFC":
      case "RVT":
        // These formats need specialized viewers
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] bg-muted rounded-lg p-4 sm:p-6 md:p-8">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">{type} File</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md px-2">
              {type === "IFC" ? "IFC (Industry Foundation Classes)" : "Revit"} files
              require specialized BIM viewers. You can download the file to view it
              in compatible software.
            </p>
            <div className="flex gap-2 w-full sm:w-auto px-4 sm:px-0">
              <Button onClick={handleDownload} size="sm" className="w-full sm:w-auto sm:size-default">
                <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Download File
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] bg-muted rounded-lg p-4 sm:p-6 md:p-8">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Unsupported Format</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md px-2">
              This file format ({type}) cannot be previewed in the browser.
              Please download the file to view it.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto px-4 sm:px-0">
              <Button onClick={handleDownload} size="sm" className="sm:size-default">
                <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Download File
              </Button>
              <Button variant="outline" size="sm" className="sm:size-default" onClick={openInNewTab}>
                <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {renderViewer()}
    </div>
  );
}
