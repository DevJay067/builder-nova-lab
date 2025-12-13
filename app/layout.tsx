import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"

import {
  Poppins,
  Open_Sans,
  Rubik,
  Instrument_Serif,
  Geist as V0_Font_Geist,
  Source_Serif_4 as V0_Font_Source_Serif_4,
} from "next/font/google"

// Initialize fonts
const _geist = V0_Font_Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})
const _geistMono = V0_Font_Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
}) // Corrected duplicate import
const _sourceSerif_4 = V0_Font_Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
})

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-instrument",
  display: "swap",
})

export const metadata: Metadata = {
  title: "HealthChain - AI Healthcare with Blockchain Security",
  description:
    "Next-generation healthcare platform with AI-powered insights, secure blockchain storage, and comprehensive health management tools.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${poppins.variable} ${openSans.variable} ${rubik.variable} ${instrumentSerif.variable}`}
      >
        <Suspense fallback={null}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
