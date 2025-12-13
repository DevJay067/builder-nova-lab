"use client"
import { useState } from "react"
import { Heart, Menu, X } from "lucide-react"

export function FloatingNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
      setIsOpen(false)
    }
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
      <div className="mx-auto max-w-7xl rounded-2xl border-2 border-white/20 bg-white/15 px-6 py-4 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollToSection("home")} className="cursor-pointer">
            <div className="flex items-center gap-2 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              <Heart className="w-6 h-6 text-red-400" />
              <span className="hidden sm:inline text-lg font-bold">HealthChain</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("bmax")}
              className="text-sm font-semibold text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              B-max
            </button>
            <button
              onClick={() => scrollToSection("firstaid")}
              className="text-sm font-semibold text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Emergency
            </button>
            <button
              onClick={() => scrollToSection("legal")}
              className="text-sm font-semibold text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Privacy & Legal
            </button>
          </div>

          {/* Mobile menu icon button for small screens */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile menu dropdown that rolls down */}
        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => scrollToSection("bmax")}
              className="block w-full text-left px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              B-max
            </button>
            <button
              onClick={() => scrollToSection("firstaid")}
              className="block w-full text-left px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Emergency
            </button>
            <button
              onClick={() => scrollToSection("legal")}
              className="block w-full text-left px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Privacy & Legal
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
