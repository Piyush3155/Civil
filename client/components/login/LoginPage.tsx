"use client";

import Image from "next/image"
import { LoginForm } from "../../components/login-form"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background font-sans overflow-hidden">
      {/* Left Column: Form & Navigation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col h-full relative z-10 bg-background/50 backdrop-blur-3xl"
      >
        {/* Header */}
        <div className="p-6 md:p-10 flex justify-between items-center">
          <a href="#" className="flex items-center gap-3 transition-transform hover:scale-105 duration-200">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/20">
              <Image 
                src="/ios/loader.png" 
                alt="Civil Desk Logo" 
                width={28} 
                height={28} 
                className="w-7 h-7"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none text-foreground">
                CIVIL DESK
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                Engineering Portal
              </span>
            </div>
          </a>
          <AnimatedThemeToggler />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[400px] space-y-6"
          >
            <LoginForm />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-xs text-muted-foreground/60">
          <p>© {new Date().getFullYear()} Civil Desk. Engineered for Excellence.</p>
        </div>
      </motion.div>

      {/* Right Column: Visual Hero */}
      <div className="relative hidden lg:flex h-full flex-col justify-end p-10 bg-muted overflow-hidden">
        {/* Background Image with Parallax-like scale */}
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src="/hero.png"
            alt="Civil engineering workspace"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-20 max-w-lg mb-10"
        >
          <div className="w-12 h-1 bg-white/50 mb-6 rounded-full" />
          <blockquote className="space-y-4">
            <p className="text-3xl font-bold leading-tight text-white drop-shadow-sm">
              &quot;We shape our buildings; thereafter they shape us.&quot;
            </p>
            <footer className="text-sm text-white/80 font-medium tracking-wide flex items-center gap-2">
              <span className="w-8 h-[1px] bg-white/50 inline-block"/> Winston Churchill
            </footer>
          </blockquote>
        </motion.div>
      </div>
    </div>
  )
}