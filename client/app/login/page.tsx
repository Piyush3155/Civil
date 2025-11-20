import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"

import { LoginForm } from "../../components/login-form"
import { ModeToggle } from "@/components/theme"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      <div className="flex flex-col gap-4 p-6 md:p-10 border-2 border-border rounded:none md:rounded-lg bg-background p-4">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
           CIVIL DESK
          </a>
          <div className="flex flex-1 items-center justify-end">
            <ModeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block h-full">
        <Image
          src="/civil.webp"
          alt="Image"
          fill
          className="object-cover "
          priority
        />
      </div>
    </div>
  
  )
}
