"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { Volume2, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type AccessibilityContextType = {
  fontSize: number
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  highContrast: boolean
  toggleHighContrast: () => void
  speakText: (text: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(16)
  const [highContrast, setHighContrast] = useState(false)

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 1, 24))
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 1, 12))
  const resetFontSize = () => setFontSize(16)
  const toggleHighContrast = () => setHighContrast((prev) => !prev)

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`

    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }

    return () => {
      document.documentElement.style.fontSize = ""
      document.documentElement.classList.remove("high-contrast")
    }
  }, [fontSize, highContrast])

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        highContrast,
        toggleHighContrast,
        speakText,
      }}
    >
      {children}
      <AccessibilityControls />
    </AccessibilityContext.Provider>
  )
}

function AccessibilityControls() {
  const { increaseFontSize, decreaseFontSize, toggleHighContrast, speakText } = useAccessibility()

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 md:flex-row">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={increaseFontSize}
              className="bg-background border-2 border-primary"
              aria-label="Increase font size"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Increase font size</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={decreaseFontSize}
              className="bg-background border-2 border-primary"
              aria-label="Decrease font size"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Decrease font size</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleHighContrast}
              className="bg-background border-2 border-primary"
              aria-label="Toggle high contrast mode"
            >
              <span className="font-bold">HC</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle high contrast</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => speakText("Screen reader activated. Use tab to navigate.")}
              className="bg-background border-2 border-primary"
              aria-label="Activate screen reader"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Activate screen reader</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

