import { useState, useRef } from "react";
import { toast } from "react-toastify";

export interface GeneratedVersion {
  suggestedText: string;
  additions: number;
  deletions: number;
  timestamp: number;
}

export function useSuggestedEditsViewModel() {
  const [inputText, setInputText] = useState("");
  const [currentVersion, setCurrentVersion] = useState<GeneratedVersion | null>(null);
  const [versionHistory, setVersionHistory] = useState<GeneratedVersion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateEdit = async () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.suggestedText) {
        throw new Error("No suggested text returned from API");
      }

      const newVersion: GeneratedVersion = {
        suggestedText: data.suggestedText,
        additions: data.additions,
        deletions: data.deletions,
        timestamp: Date.now(),
      };

      setCurrentVersion(newVersion);
      setVersionHistory((prev) => [...prev, newVersion]);
      toast.success("New version generated!");
    } catch (error) {
      console.error("Generate edit error:", error);
      toast.error(
        `Failed to generate edits: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    if (!currentVersion) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);

      const response = await fetch("/api/ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: currentVersion.suggestedText,
          voice: "alloy",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("Text-to-speech error:", error);
      toast.error("Failed to play audio");
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setCurrentVersion(null);
  };

  const handleClearAll = () => {
    setInputText("");
    setCurrentVersion(null);
    setVersionHistory([]);
  };

  const handleCopyVersion = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return {
    // State
    inputText,
    currentVersion,
    versionHistory,
    isGenerating,
    isPlaying,

    // Computed
    isAiActive: isGenerating || isPlaying,

    // Actions
    setInputText,
    generateEdit,
    handlePlay,
    handleReset,
    handleClearAll,
    handleCopyVersion,
  };
}
