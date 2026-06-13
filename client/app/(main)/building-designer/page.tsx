import { Suspense } from "react";
import BuildingDesignerPage from "@/components/building-designer/BuildingDesignerPage";
import Loader from "@/components/ui/loader";

export const metadata = {
  title: "Building Designer | Civil Desk",
  description: "3D building plan and interior mapping designer",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
          <Loader />
        </div>
      }
    >
      <BuildingDesignerPage />
    </Suspense>
  );
}
