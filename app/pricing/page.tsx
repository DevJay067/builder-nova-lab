import { LiquidMetalBackground } from "@/components/liquid-metal-background"
import { FloatingNavbar } from "@/components/floating-navbar"
import { BentoPricing } from "@/components/ui/bento-pricing"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  return (
    <main className="relative min-h-screen">
      <LiquidMetalBackground />

      {/* Dark opacity mask */}
      <div className="fixed inset-0 z-[5] bg-black/50" />

      {/* Dots pattern overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[6] size-full",
          "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]",
          "bg-[size:12px_12px]",
          "opacity-30",
        )}
      />

      <FloatingNavbar />

      {/* Pricing Section */}
      <section className="relative z-10 flex min-h-screen items-center px-4 py-20">
        <div className="mx-auto w-full max-w-5xl">
          {/* Heading */}
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] font-open-sans-custom">
              Plans and Pricing
            </h1>
            <p className="text-gray-300 mt-4 text-sm md:text-base font-open-sans-custom [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
              Choose the perfect plan for your needs. From individual creators to enterprise teams, we have flexible
              pricing options to help you succeed.
            </p>
          </div>
          <BentoPricing />
        </div>
      </section>
    </main>
  )
}
