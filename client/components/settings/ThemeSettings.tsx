"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Return null to avoid layout shift, or a skeleton that matches the below

  const themes = [
    {
      id: "light",
      label: "Light",
      icon: Sun,
      visual: (
        <div className="relative h-full w-full bg-neutral-100 p-2">
          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm border border-neutral-200/50">
            <div className="h-2 w-[80px] rounded-full bg-neutral-200" />
            <div className="h-2 w-[50px] rounded-full bg-neutral-200" />
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-md bg-white p-2 shadow-sm border border-neutral-200/50">
             <div className="h-4 w-4 rounded-full bg-neutral-200" />
             <div className="h-2 w-[60px] rounded-full bg-neutral-200" />
          </div>
        </div>
      )
    },
    {
      id: "dark",
      label: "Dark",
      icon: Moon,
      visual: (
        <div className="relative h-full w-full bg-slate-950 p-2">
          <div className="space-y-2 rounded-md bg-slate-900 p-2 border border-slate-800">
            <div className="h-2 w-[80px] rounded-full bg-slate-800" />
            <div className="h-2 w-[50px] rounded-full bg-slate-800" />
          </div>
           <div className="mt-2 flex items-center gap-2 rounded-md bg-slate-900 p-2 border border-slate-800">
             <div className="h-4 w-4 rounded-full bg-slate-800" />
             <div className="h-2 w-[60px] rounded-full bg-slate-800" />
          </div>
        </div>
      )
    },
    {
      id: "system",
      label: "System",
      icon: Monitor,
      visual: (
        <div className="relative h-full w-full overflow-hidden">
          <div className="absolute inset-0 flex">
             {/* Light Half */}
            <div className="w-1/2 bg-neutral-100 p-2 border-r border-neutral-200/50">
               <div className="h-2 w-[40px] rounded-full bg-neutral-200 mb-2" />
               <div className="h-8 rounded-md bg-white shadow-sm border border-neutral-200/50" />
            </div>
             {/* Dark Half */}
            <div className="w-1/2 bg-slate-950 p-2">
               <div className="h-2 w-[40px] rounded-full bg-slate-800 mb-2" />
               <div className="h-8 rounded-md bg-slate-900 border border-slate-800" />
            </div>
          </div>
        </div>
      )
    },
  ]

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Select the theme for the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {themes.map((item) => {
          const isActive = theme === item.id
          
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => setTheme(item.id)}
                className={cn(
                  "group relative flex w-full flex-col items-center gap-3 rounded-xl border p-1 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary",
                  isActive 
                    ? "border-primary/50" 
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                {/* Visual Preview Window */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border/50 shadow-sm transition-all group-hover:shadow-md">
                    {item.visual}
                    
                    {/* Active State Overlay (Subtle Glow) */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 mix-blend-multiply dark:mix-blend-lighten" />
                    )}
                </div>

                {/* Label Section */}
                <div className="flex w-full items-center justify-between px-2 pb-2">
                   <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn("text-sm font-medium", isActive && "text-primary")}>
                        {item.label}
                    </span>
                   </div>
                   
                   {/* Animated Checkmark */}
                   {isActive && (
                     <motion.div
                       layoutId="theme-check"
                       className="rounded-full bg-primary p-1 text-primary-foreground"
                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                     >
                       <Check className="h-3 w-3" />
                     </motion.div>
                   )}
                </div>

                {/* Active Ring Animation (Optional, for that 'outline' movement) */}
                {isActive && (
                  <motion.div
                    layoutId="theme-outline"
                    className="absolute inset-0 -z-10 rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}