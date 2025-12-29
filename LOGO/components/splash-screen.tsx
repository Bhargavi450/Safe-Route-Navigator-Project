"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function SplashScreen() {
  const router = useRouter()
  const [fadingOut, setFadingOut] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    const displayDuration = 5500 // ~5.5 seconds as requested
    const fadeDuration = prefersReducedMotion ? 0 : 300

    timeoutRef.current = window.setTimeout(() => {
      if (!prefersReducedMotion) {
        setFadingOut(true)
        window.setTimeout(() => router.push("/dashboard"), fadeDuration)
      } else {
        router.push("/dashboard")
      }
    }, displayDuration)

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [router])

  return (
    <main
      className={cn(
        "flex min-h-dvh items-center justify-center bg-black px-6 text-white",
        "transition-opacity duration-300",
        fadingOut ? "opacity-0" : "opacity-100",
      )}
      aria-label="SafeRoute Navigator loading"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Logo with subtle accent ring and soft aura */}
        <div className="relative mb-6 rounded-2xl p-5 ring-1 ring-pink-400/40" aria-hidden="true">
          <ShieldPinLogo className="h-16 w-16 text-sky-400" />
          <span className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-sky-500/10 animate-pulse motion-reduce:animate-none" />
        </div>

        <h1 className="text-pretty font-sans text-xl font-semibold text-white">SafeRoute Navigator</h1>
        <p className="mt-1 text-pretty font-sans text-sm text-white/70">Your Safer Path, Always</p>

        {/* Gentle loading indicator */}
        <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-sky-400" />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-120%);
          }
          50% {
            transform: translateX(40%);
          }
          100% {
            transform: translateX(140%);
          }
        }
      `}</style>
    </main>
  )
}

function ShieldPinLogo({ className }: { className?: string }) {
  // Minimal shield outline with a map pin inside, color via currentColor
  return (
    <svg
      className={cn("animate-[fade_800ms_ease-out_1] motion-reduce:animate-none", className)}
      viewBox="0 0 64 64"
      role="img"
      aria-label="SafeRoute logo"
    >
      <defs>
        <clipPath id="shield-clip">
          <path d="M32 6c8 5 16 5 24 0v23c0 11-8.5 21.6-24 29C16.5 50.6 8 40 8 29V6c8 5 16 5 24 0z" />
        </clipPath>
      </defs>
      {/* Shield outline */}
      <path
        d="M32 6c8 5 16 5 24 0v23c0 11-8.5 21.6-24 29C16.5 50.6 8 40 8 29V6c8 5 16 5 24 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* Inner map pin (clipped to shield) */}
      <g clipPath="url(#shield-clip)">
        <path
          d="M32 19c-5.523 0-10 4.477-10 10 0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
          fill="currentColor"
          className="opacity-90"
        />
      </g>
      {/* Hint of pink accent */}
      <circle cx="47" cy="15" r="2" className="text-pink-400" fill="currentColor" />
      <style jsx>{`
        @keyframes fade {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </svg>
  )
}
