"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useContextGatheringViewModel } from "./contextGatheringViewModel";
import { CircularCountdown } from "../shared/CircularCountdown";
import { MuseAvatar } from "../shared/MuseAvatar";

interface ContextGatheringModalProps {
  isOpen: boolean;
  postContent: string;
  onComplete: (conversationHistory: Array<{ role: "assistant" | "user"; content: string }>) => void;
  onSkip: () => void;
}

export function ContextGatheringModal({
  isOpen,
  postContent,
  onComplete,
  onSkip,
}: ContextGatheringModalProps) {
  const vm = useContextGatheringViewModel(postContent);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [vm.conversationHistory, vm.isAskingQuestion]);

  // When ready to generate, call onComplete
  useEffect(() => {
    if (vm.isReadyToGenerate && isOpen) {
      onComplete(vm.conversationHistory);
      vm.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.isReadyToGenerate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-6">
          <div className="flex flex-col items-center gap-4">
            <MuseAvatar isActive={vm.isAskingQuestion} size="md" />

            <div className="text-center">
              <CardTitle className="text-lg font-semibold">Getting to know you</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {vm.isAskingQuestion
                  ? "Thinking..."
                  : "Answer a few questions to personalize your content"}
              </p>
              {vm.conversationHistory.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Question {Math.ceil(vm.conversationHistory.length / 2)} of ~5
                    </span>
                  </div>
                  <div className="w-full max-w-[200px] mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5578C8] transition-all duration-300"
                      style={{
                        width: `${Math.min((Math.ceil(vm.conversationHistory.length / 2) / 5) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Voice Mode Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Voice Mode</label>
              <button
                onClick={vm.toggleVoiceMode}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  vm.isVoiceMode ? "bg-[#5578C8]" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    vm.isVoiceMode ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500">Chrome browser required</p>
          </div>

          {/* Conversation */}
          <div className="space-y-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {vm.conversationHistory.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg",
                    message.role === "assistant"
                      ? "bg-[#F5F7FA] text-[#696969]"
                      : "bg-[#5578C8] text-white ml-8"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
              {vm.isAskingQuestion && (
                <div className="p-3 rounded-lg bg-[#F5F7FA] text-[#696969]">
                  <p className="text-sm animate-pulse">Thinking...</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Answer Input - only show if last message is from assistant */}
            {vm.conversationHistory.length > 0 &&
              vm.conversationHistory[vm.conversationHistory.length - 1]?.role === "assistant" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Your answer</label>
                      {vm.silenceCountdown !== null && (
                        <CircularCountdown countdown={vm.silenceCountdown} maxTime={1.5} />
                      )}
                    </div>
                    {vm.isVoiceMode && (
                      <button
                        onClick={vm.isListening ? vm.stopListening : vm.startListening}
                        disabled={vm.isAskingQuestion}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          vm.isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-[#5578C8] text-white hover:bg-[#4A6AB8]"
                        )}
                      >
                        {vm.isListening ? "🔴" : "🎤"}
                      </button>
                    )}
                  </div>
                  <Textarea
                    placeholder={vm.isVoiceMode ? "Click the mic to speak..." : "Type your answer..."}
                    value={vm.isListening ? "Listening..." : vm.currentAnswer}
                    onChange={(e) => vm.setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        vm.handleSubmitAnswer();
                      }
                    }}
                    disabled={vm.isListening || vm.isAskingQuestion}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        vm.handleSkip();
                        onSkip();
                      }}
                      disabled={vm.isAskingQuestion}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={vm.handleSubmitAnswer}
                      disabled={!vm.currentAnswer.trim() || vm.isAskingQuestion}
                      className="flex-1"
                    >
                      {vm.isAskingQuestion ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
