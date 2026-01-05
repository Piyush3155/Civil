import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbList, 
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NewProjectPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="hidden md:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">New Project</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 bg-muted/30">
        <CreateProjectForm />
      </main>
    </div>
  );
}
