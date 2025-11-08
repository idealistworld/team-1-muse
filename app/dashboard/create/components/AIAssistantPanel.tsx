"use client";

import { MuseAvatar } from "@/app/dashboard/components/shared/MuseAvatar";
import { CircularCountdown } from "@/app/dashboard/components/shared/CircularCountdown";
import { Button } from "@/components/ui/button";

interface AIAssistantPanelProps {
  isAiActive: boolean;
  isVoiceMode: boolean;
  toggleVoiceMode: () => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  silenceCountdown: number | null;
  isGenerating: boolean;
  canGenerate: boolean;
  generateEdit: () => void;
  versionHistoryCount: number;
  onClearAll: () => void;
}

export function AIAssistantPanel({
  isAiActive,
  isVoiceMode,
  toggleVoiceMode,
  isListening,
  startListening,
  stopListening,
  feedbackText,
  setFeedbackText,
  silenceCountdown,
  isGenerating,
  canGenerate,
  generateEdit,
  versionHistoryCount,
  onClearAll,
}: AIAssistantPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E1E1E1] p-4">
      <div className="flex flex-col items-center gap-4 mb-6">
        <MuseAvatar isActive={isAiActive} size="md" />

        <div className="text-center">
          <h3 className="text-lg font-semibold">Muse - AI Assistant</h3>
          {isAiActive && (
            <p className="text-sm text-muted-foreground mt-0.5">
              ✨ Working on it...
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Voice Mode Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Voice Mode</label>
          <button
            onClick={toggleVoiceMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isVoiceMode ? "bg-[#5578C8]" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isVoiceMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Feedback Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">What would you like to change?</label>
              {silenceCountdown !== null && (
                <CircularCountdown countdown={silenceCountdown} maxTime={3.0} />
              )}
            </div>
            {isVoiceMode && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isGenerating}
                className={`p-2 rounded-full transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[#5578C8] text-white hover:bg-[#4A6AB8]"
                }`}
              >
                {isListening ? "🔴" : "🎤"}
              </button>
            )}
          </div>
          <textarea
            placeholder={isVoiceMode ? "Click the mic to speak..." : "e.g., Make it more professional, shorter, add emojis..."}
            value={isListening ? "Listening..." : feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={isListening}
            className="w-full min-h-[100px] text-sm text-[#696969] bg-transparent border border-[#E1E1E1] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#5578C8] leading-relaxed disabled:opacity-50"
          />
        </div>

        {/* Edit Button */}
        <div className="flex gap-2">
          <Button
            onClick={generateEdit}
            disabled={!canGenerate || isGenerating}
            className="flex-1"
          >
            {isGenerating ? "Editing..." : "✨ Edit Content"}
          </Button>
          {versionHistoryCount > 0 && (
            <Button
              variant="ghost"
              onClick={onClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
