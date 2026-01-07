import Image from "next/image"

import { LoginForm } from "../../components/login-form"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      <div className="flex flex-col gap-6 p-6 md:p-10 bg-background">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-3 font-semibold text-lg hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-border to-border/80 text-primary-foreground shadow-lg">
                <Image src="/ios/loader.png" alt="Civil Desk Logo" width={40} height={40} />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              CIVIL DESK
            </span>
          </a>
          <div className="flex flex-1 items-center justify-end">
            <AnimatedThemeToggler />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent z-10" />
        <Image
          src="/hero.png"
          alt="Civil engineering workspace"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    </div>
  )
}