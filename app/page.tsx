"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FloatingNavbar } from "@/components/floating-navbar"
import { LiquidMetalBackground } from "@/components/liquid-metal-background"
import {
  Brain,
  History,
  TrendingUp,
  Activity,
  Heart,
  Shield,
  Lock,
  Globe,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  Star,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem("healthchain_user")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    }
  }

  const features = [
    {
      id: "bmax",
      title: "B-max AI Assistant",
      description:
        "Your personal AI health companion for intelligent medical insights and personalized recommendations.",
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
      route: "/bmax",
      highlight: true,
      bgTint: "bg-gradient-to-br from-blue-400/20 via-cyan-300/15 to-blue-400/10",
    },
    {
      id: "history",
      title: "Health History",
      description: "Comprehensive health records securely stored on blockchain with AI search capabilities.",
      icon: History,
      color: "from-green-500 to-emerald-500",
      route: "/history",
      bgTint: "bg-gradient-to-br from-white/25 via-white/15 to-white/10",
    },
    {
      id: "monitoring",
      title: "Real-time Monitoring",
      description: "Live health monitoring dashboard with IoT device integration and real-time vital signs.",
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-500",
      route: "/monitoring",
      bgTint: "bg-gradient-to-br from-white/25 via-white/15 to-white/10",
    },
    {
      id: "analytics",
      title: "Health Analytics",
      description: "Advanced analytics and insights from your health data with predictive AI modeling.",
      icon: Activity,
      color: "from-orange-500 to-red-500",
      route: "/health-analytics",
      bgTint: "bg-gradient-to-br from-white/25 via-white/15 to-white/10",
    },
    {
      id: "firstaid",
      title: "Emergency First Aid",
      description: "Instant access to emergency protocols, first aid guides, and emergency contacts.",
      icon: Heart,
      color: "from-red-500 to-pink-500",
      route: "/first-aid",
      urgent: true,
      bgTint: "bg-gradient-to-br from-red-400/20 via-pink-300/15 to-red-400/10",
    },
    {
      id: "legal",
      title: "Privacy & Legal",
      description: "Comprehensive privacy controls, data ownership, and HIPAA compliance documentation.",
      icon: Shield,
      color: "from-indigo-500 to-purple-500",
      route: "/legal",
      bgTint: "bg-gradient-to-br from-white/25 via-white/15 to-white/10",
    },
  ]

  const stats = [
    { label: "Data Security", value: "100%", icon: Lock, color: "text-cyan-400" },
    { label: "AI Assistant", value: "24/7", icon: Brain, color: "text-green-400" },
    { label: "Storage", value: "∞", icon: Globe, color: "text-purple-400" },
  ]

  return (
    <div className="relative min-h-screen text-gray-900 overflow-hidden bg-[#f0f8ff]">
      <LiquidMetalBackground />
      <FloatingNavbar />

      {/* Hero Section */}
      <section id="home" className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 md:space-y-8 mb-12 md:mb-16">
            <Badge className="mx-auto w-fit bg-slate-900/10 border border-slate-300 text-slate-900 hover:bg-slate-900/20 text-xs md:text-sm">
              <Stethoscope className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Next-Gen Healthcare Platform
            </Badge>

            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-slate-900">
                Your Health,{" "}
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Secured
                </span>
                <br />
                by{" "}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Blockchain
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
                Experience the future of healthcare with AI-powered insights, secure blockchain storage, and
                comprehensive health management tools designed for your wellbeing.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2 md:pt-4">
              <Link href="/bmax">
                <Button className="bg-white/15 backdrop-blur-md border border-white/20 text-slate-900 hover:bg-white/25 shadow-lg text-sm md:text-lg px-6 md:px-8 py-4 md:py-6 h-auto font-semibold w-full sm:w-auto">
                  <Brain className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Try B-max AI
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </Button>
              </Link>
              <Button className="bg-white/15 backdrop-blur-md border border-white/20 text-slate-900 hover:bg-white/25 shadow-lg text-sm md:text-lg px-6 md:px-8 py-4 md:py-6 h-auto font-semibold w-full sm:w-auto">
                <History className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                View History
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="flex justify-center mb-2 md:mb-4">
                  <div className="w-12 md:w-14 h-12 md:h-14 rounded-full bg-slate-900/10 border border-slate-300 flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
                    <stat.icon className={`w-6 md:w-7 h-6 md:h-7 ${stat.color}`} />
                  </div>
                </div>
                <div className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs md:text-sm font-semibold text-slate-900">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-slate-900">
              Comprehensive Health Solutions
            </h2>
            <p className="text-slate-700 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              Six powerful tools to transform your healthcare experience and keep you in control
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {features.map((feature) => (
              <Link key={feature.id} href={feature.route} className="group perspective">
                <div
                  className={`relative h-20 ${feature.bgTint} backdrop-blur-xl rounded-3xl shadow-xl transition-all duration-500 ease-out overflow-hidden
                    group-hover:h-64 group-hover:shadow-2xl group-hover:scale-105
                    border-2 border-white/30 
                    before:absolute before:inset-0 before:rounded-3xl before:p-[2px] before:bg-gradient-to-br before:from-white/40 before:via-white/20 before:to-transparent before:-z-10
                    after:absolute after:inset-0 after:rounded-3xl after:bg-gradient-to-t after:from-white/10 after:to-transparent after:opacity-50
                    ${feature.highlight ? "ring-2 ring-blue-400/60 ring-offset-2 ring-offset-[#f0f8ff]" : ""} 
                    ${feature.urgent ? "ring-2 ring-red-400/60 ring-offset-2 ring-offset-[#f0f8ff]" : ""}`}
                  id={feature.id}
                  style={{
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {/* Collapsed State - Icon and Title only */}
                  <div className="absolute inset-0 flex items-center px-6 pointer-events-none z-10">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg transition-all duration-500 group-hover:scale-110`}
                      style={{
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="ml-4 text-lg font-bold text-slate-900 transition-opacity duration-300 group-hover:opacity-0 drop-shadow-sm">
                      {feature.title}
                    </h3>
                  </div>

                  {/* Expanded State - Full Content */}
                  <div className="absolute inset-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 flex flex-col z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}
                        style={{
                          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        <feature.icon className="w-7 h-7" />
                      </div>
                      {feature.highlight && (
                        <Badge className="bg-cyan-500/30 backdrop-blur-sm text-cyan-700 border-cyan-400/40 text-xs shadow-sm">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {feature.urgent && (
                        <Badge className="bg-red-500/30 backdrop-blur-sm text-red-700 border-red-400/40 text-xs shadow-sm">
                          <Zap className="w-3 h-3 mr-1" />
                          Emergency
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 drop-shadow-sm">{feature.title}</h3>
                    <p className="text-sm text-slate-700 mb-6 flex-grow leading-relaxed">{feature.description}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></div>
                        <span className="text-sm font-medium text-slate-700">Active</span>
                      </div>
                      <div className="flex items-center text-cyan-600 font-semibold text-sm drop-shadow-sm">
                        Explore
                        <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-3xl pointer-events-none"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 text-slate-900">
              Ready to Transform Your Health?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-700">
              Join thousands of users managing their health with HealthChain. Secure, intelligent, and always in your
              control.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/bmax">
              <Button className="bg-white/15 backdrop-blur-md border border-white/20 text-slate-900 hover:bg-white/25 shadow-lg text-sm md:text-lg px-6 md:px-8 py-4 md:py-6 h-auto font-semibold w-full sm:w-auto">
                Get Started Now
              </Button>
            </Link>
            <Button className="bg-white/15 backdrop-blur-md border border-white/20 text-slate-900 hover:bg-white/25 shadow-lg text-sm md:text-lg px-6 md:px-8 py-4 md:py-6 h-auto font-semibold w-full sm:w-auto">
              Learn About Security
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-300 py-8 md:py-12 px-4 backdrop-blur-sm bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <Heart className="w-5 md:w-6 h-5 md:h-6 text-red-500" />
                <h3 className="text-base md:text-lg font-bold text-slate-900">HealthChain</h3>
              </div>
              <p className="text-xs md:text-sm text-slate-600">
                Next-generation healthcare powered by AI and blockchain.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-3 md:mb-4 text-sm md:text-base">Features</h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-600">
                <li>
                  <button
                    onClick={() => document.getElementById("bmax")?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-cyan-600 transition"
                  >
                    B-max Assistant
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById("firstaid")?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-cyan-600 transition"
                  >
                    Emergency First Aid
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-3 md:mb-4 text-sm md:text-base">Resources</h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-600">
                <li>
                  <Link href="/history" className="hover:text-cyan-600 transition">
                    Health History
                  </Link>
                </li>
                <li>
                  <Link href="/monitoring" className="hover:text-cyan-600 transition">
                    Monitoring
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-3 md:mb-4 text-sm md:text-base" id="legal">
                Legal
              </h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-600">
                <li>
                  <Link href="/legal" className="hover:text-cyan-600 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="hover:text-cyan-600 transition">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-300 pt-6 md:pt-8 text-center text-xs md:text-sm text-slate-600">
            <p>&copy; 2025 HealthChain. All rights reserved. Blockchain Secured Healthcare.</p>
            <p className="mt-2 text-xs text-slate-500">Developer: Jay Magar</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
