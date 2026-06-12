"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  Save,
  Ruler,
  Triangle,
  Columns3,
  Eye,
  Sparkles,
} from "lucide-react";
import type { PebParams } from "./PebCanvas3D";

// ──────────────────────────────────────────────
// Presets
// ──────────────────────────────────────────────
interface Preset {
  name: string;
  params: Partial<PebParams>;
}

const PRESETS: Preset[] = [
  {
    name: "Small Warehouse (15×30m)",
    params: {
      width: 15,
      length: 30,
      eaveHeight: 6,
      roofSlope: 10,
      bays: 4,
      purlinsPerSlope: 3,
      girtsPerWall: 2,
      showPurlins: true,
      showGirts: true,
      showBracing: true,
    },
  },
  {
    name: "Medium Workshop (20×40m)",
    params: {
      width: 20,
      length: 40,
      eaveHeight: 7,
      roofSlope: 8,
      bays: 5,
      purlinsPerSlope: 4,
      girtsPerWall: 3,
      showPurlins: true,
      showGirts: true,
      showBracing: true,
    },
  },
  {
    name: "Large Factory (30×60m)",
    params: {
      width: 30,
      length: 60,
      eaveHeight: 9,
      roofSlope: 6,
      bays: 8,
      purlinsPerSlope: 5,
      girtsPerWall: 3,
      showPurlins: true,
      showGirts: true,
      showBracing: true,
    },
  },
  {
    name: "Aircraft Hangar (40×80m)",
    params: {
      width: 40,
      length: 80,
      eaveHeight: 12,
      roofSlope: 5,
      bays: 10,
      purlinsPerSlope: 6,
      girtsPerWall: 4,
      showPurlins: true,
      showGirts: true,
      showBracing: true,
    },
  },
];

const DEFAULT_PARAMS: PebParams = {
  width: 20,
  length: 40,
  eaveHeight: 7,
  roofSlope: 10,
  bays: 5,
  purlinsPerSlope: 3,
  girtsPerWall: 2,
  showPurlins: true,
  showGirts: true,
  showBracing: true,
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
interface PebControlPanelProps {
  params: PebParams;
  onChange: (params: PebParams) => void;
  onSave: () => void;
  isSaving: boolean;
}

export { DEFAULT_PARAMS };

export default function PebControlPanel({
  params,
  onChange,
  onSave,
  isSaving,
}: PebControlPanelProps) {
  const update = (key: keyof PebParams, value: number | boolean) => {
    onChange({ ...params, [key]: value });
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (preset) {
      onChange({ ...DEFAULT_PARAMS, ...preset.params });
    }
  };

  const reset = () => {
    onChange({ ...DEFAULT_PARAMS });
  };

  const ridgeRise =
    (params.width / 2) * Math.tan((params.roofSlope * Math.PI) / 180);
  const ridgeHeight = params.eaveHeight + ridgeRise;
  const baySpacing = params.length / params.bays;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-hide">
      {/* Presets */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Select onValueChange={applyPreset}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a preset..." />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Building Dimensions */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Ruler className="h-4 w-4 text-blue-500" />
            Building Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="peb-width" className="text-xs text-muted-foreground">
                Width (m)
              </Label>
              <Input
                id="peb-width"
                type="number"
                min={5}
                max={80}
                step={1}
                value={params.width}
                onChange={(e) => update("width", Math.max(5, Number(e.target.value) || 5))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peb-length" className="text-xs text-muted-foreground">
                Length (m)
              </Label>
              <Input
                id="peb-length"
                type="number"
                min={5}
                max={200}
                step={1}
                value={params.length}
                onChange={(e) => update("length", Math.max(5, Number(e.target.value) || 5))}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="peb-eave" className="text-xs text-muted-foreground">
              Eave Height (m)
            </Label>
            <Input
              id="peb-eave"
              type="number"
              min={3}
              max={30}
              step={0.5}
              value={params.eaveHeight}
              onChange={(e) => update("eaveHeight", Math.max(3, Number(e.target.value) || 3))}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roof Configuration */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Triangle className="h-4 w-4 text-red-500" />
            Roof Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="peb-slope" className="text-xs text-muted-foreground">
              Roof Slope (°)
            </Label>
            <Input
              id="peb-slope"
              type="number"
              min={1}
              max={45}
              step={1}
              value={params.roofSlope}
              onChange={(e) => update("roofSlope", Math.max(1, Math.min(45, Number(e.target.value) || 1)))}
              className="h-9"
            />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            Ridge Height: <span className="font-semibold text-foreground">{ridgeHeight.toFixed(2)}m</span>
            <span className="mx-2">•</span>
            Rise: <span className="font-semibold text-foreground">{ridgeRise.toFixed(2)}m</span>
          </div>
        </CardContent>
      </Card>

      {/* Bay Configuration */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-purple-500" />
            Bay Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="peb-bays" className="text-xs text-muted-foreground">
                Number of Bays
              </Label>
              <Input
                id="peb-bays"
                type="number"
                min={1}
                max={30}
                step={1}
                value={params.bays}
                onChange={(e) => update("bays", Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bay Spacing</Label>
              <div className="h-9 flex items-center px-3 bg-muted/50 rounded-md text-sm font-medium">
                {baySpacing.toFixed(2)}m
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="peb-purlins" className="text-xs text-muted-foreground">
                Purlins / Slope
              </Label>
              <Input
                id="peb-purlins"
                type="number"
                min={0}
                max={12}
                step={1}
                value={params.purlinsPerSlope}
                onChange={(e) => update("purlinsPerSlope", Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peb-girts" className="text-xs text-muted-foreground">
                Girts / Wall
              </Label>
              <Input
                id="peb-girts"
                type="number"
                min={0}
                max={10}
                step={1}
                value={params.girtsPerWall}
                onChange={(e) => update("girtsPerWall", Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Toggles */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-500" />
            Member Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <Label htmlFor="toggle-purlins" className="text-sm cursor-pointer">
                Purlins
              </Label>
            </div>
            <Switch
              id="toggle-purlins"
              checked={params.showPurlins}
              onCheckedChange={(v) => update("showPurlins", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <Label htmlFor="toggle-girts" className="text-sm cursor-pointer">
                Girts
              </Label>
            </div>
            <Switch
              id="toggle-girts"
              checked={params.showGirts}
              onCheckedChange={(v) => update("showGirts", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <Label htmlFor="toggle-bracing" className="text-sm cursor-pointer">
                Cross Bracing
              </Label>
            </div>
            <Switch
              id="toggle-bracing"
              checked={params.showBracing}
              onCheckedChange={(v) => update("showBracing", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Color Legend</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-muted-foreground">Columns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500 rounded" />
              <span className="text-muted-foreground">Rafters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500 rounded" />
              <span className="text-muted-foreground">Purlins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-orange-500 rounded" />
              <span className="text-muted-foreground">Girts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-purple-500 rounded" />
              <span className="text-muted-foreground">Ridge</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-yellow-500 rounded" />
              <span className="text-muted-foreground">Bracing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-500 rounded" />
              <span className="text-muted-foreground">Base</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2 pb-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full h-10 font-semibold"
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save to Drawings"}
        </Button>
        <Button
          variant="outline"
          onClick={reset}
          className="w-full h-9"
          size="sm"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
