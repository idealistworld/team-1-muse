"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSuggestedEditsViewModel } from "./suggestedEditsViewModel"

interface SuggestedEditsCardProps {
  className?: string
}

export function SuggestedEditsCard({ className }: SuggestedEditsCardProps) {
  const vm = useSuggestedEditsViewModel();

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="pb-6">
        <div className="flex items-center gap-4">
          {/* AI Avatar */}
          <div className="relative h-12 w-12 shrink-0">
            {/* Background circle */}
            <div className={cn(
              "absolute inset-0 rounded-full transition-all duration-500",
              vm.isAiActive
                ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
                : "bg-gradient-to-br from-blue-400 to-cyan-400 shadow-md shadow-blue-400/20"
            )}>
              {/* Glossy overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
            </div>

            {/* Spinning ring when active */}
            {vm.isAiActive && (
              <div
                className="absolute -inset-1 rounded-full border-2 border-transparent border-t-blue-300/60 border-r-blue-300/40"
                style={{ animation: "spin 1.5s linear infinite" }}
              />
            )}

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className={cn(
                  "h-6 w-6 text-white transition-transform duration-500",
                  vm.isAiActive && "scale-110"
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M12 8V4m0 16v-4" />
                <path d="M17 12h4M3 12h4" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">AI Content Variations</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {vm.isAiActive ? "Generating..." : "Create different versions of your content"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Source Content</label>
            {vm.versionHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={vm.handleClearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Paste content to generate variations..."
            value={vm.inputText}
            onChange={(e) => vm.setInputText(e.target.value)}
            className="min-h-[150px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={vm.generateEdit}
              disabled={!vm.inputText.trim() || vm.isGenerating}
              className="flex-1"
            >
              {vm.isGenerating ? "Generating..." : vm.versionHistory.length > 0 ? "Generate Another Version" : "Generate Version"}
            </Button>
          </div>
        </div>

        {/* Current Version */}
        {vm.currentVersion && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                LATEST VERSION • +{vm.currentVersion.additions} -{vm.currentVersion.deletions}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={vm.handleReset}
              >
                Clear
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">Original:</div>
                <p className="text-sm line-through decoration-2 text-muted-foreground p-3 bg-muted/30 rounded">
                  {vm.inputText}
                </p>
              </div>

              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">AI Generated Version:</div>
                <div className="flex items-start gap-2 p-3 bg-primary/5 rounded border border-primary/20">
                  <p className="text-sm leading-relaxed flex-1">
                    {vm.currentVersion.suggestedText}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={vm.handlePlay}
                    disabled={vm.isPlaying}
                    className="shrink-0"
                  >
                    {vm.isPlaying ? "⏸" : "🔊"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={vm.generateEdit}
                disabled={vm.isGenerating}
              >
                Try Another Version
              </Button>
              <Button
                className="flex-1"
                onClick={() => vm.handleCopyVersion(vm.currentVersion!.suggestedText)}
              >
                Copy Version
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Version History */}
      {vm.versionHistory.length > 1 && (
        <CardContent className="pt-0">
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">All Generated Versions</h3>
              <span className="text-xs text-muted-foreground">
                {vm.versionHistory.length} versions
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              All variations generated from the same source content
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vm.versionHistory.map((version, index) => (
                <div key={version.timestamp} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Version #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        +{version.additions} -{version.deletions}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => vm.handleCopyVersion(version.suggestedText)}
                        className="h-6 text-xs"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm p-2 bg-background rounded border border-border line-clamp-3">
                    {version.suggestedText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
