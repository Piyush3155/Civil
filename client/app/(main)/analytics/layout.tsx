"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import {ArrowRight} from "lucide-react";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const getBreadcrumbTitle = () => {
    if (pathname.includes("/overview")) return <div className="flex gap-2 items-center justify-center"><ArrowRight /> Overview</div>;
    if (pathname.includes("/progress")) return <div className="flex gap-2 items-center"><ArrowRight /> Progress</div>;
    if (pathname.includes("/materials")) return <div className="flex gap-2 items-center"><ArrowRight /> Materials</div>;
    if (pathname.includes("/procurement")) return <div className="flex gap-2 items-center"><ArrowRight /> Procurement</div>;
    if (pathname.includes("/billing")) return <div className="flex gap-2 items-center"><ArrowRight /> Billing</div>;
    if (pathname.includes("/qc")) return <div className="flex gap-2 items-center"><ArrowRight /> Quality Control</div>;
    if (pathname.includes("/labour")) return <div className="flex gap-2 items-center"><ArrowRight /> Labour</div>;
    if (pathname.includes("/diary")) return <div className="flex gap-2 items-center"><ArrowRight /> Site Diary</div>;
    if (pathname.includes("/reports")) return <div className="flex gap-2 items-center"><ArrowRight /> Reports</div>;
    return <div className="flex gap-2 items-center"><ArrowRight /> Analytics</div>;
  };
  
  return (
        <><header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
          {pathname !== "/analytics" && (
            <>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{getBreadcrumbTitle()}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header><div className="flex-1">
        {children}
      </div></>
  );
}
