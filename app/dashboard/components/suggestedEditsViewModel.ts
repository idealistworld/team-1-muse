import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface GeneratedVersion {
  suggestedText: string;
  additions: number;
  deletions: number;
  timestamp: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export function useSuggestedEditsViewModel(
  externalContent: string = "",
  userContext?: {
    company?: string;
    industry?: string;
    targetAudience?: string;
    personalExperience?: string;
    writingStyle?: string;
  }
) {
  const [inputText, setInputText] = useState(externalContent);
  const [feedbackText, setFeedbackText] = useState("");
  const [currentVersion, setCurrentVersion] = useState<GeneratedVersion | null>(
    null
  );
  const [versionHistory, setVersionHistory] = useState<GeneratedVersion[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const interimTranscriptRef = useRef("");

  // Sync with external content
  useEffect(() => {
    setInputText(externalContent);
    // Reset conversation when new content is loaded
    setConversationHistory([]);
    setCurrentVersion(null);
  }, [externalContent]);

  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI = (window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    }).SpeechRecognition || (window as Window & {
      webkitSpeechRecognition?: new () => SpeechRecognition;
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.log("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show interim results
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log("Speech recognition result:", event);

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results in real-time
      if (interimTranscript) {
        interimTranscriptRef.current = interimTranscript;
        setFeedbackText(interimTranscript);
      }

      // When we get a final result
      if (finalTranscript) {
        console.log("Final transcript:", finalTranscript);
        setFeedbackText(finalTranscript);
        interimTranscriptRef.current = "";

        // Clear any existing silence timeout and countdown
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }

        // Start countdown from 3 seconds
        let timeLeft = 3.0;
        setSilenceCountdown(timeLeft);

        countdownIntervalRef.current = setInterval(() => {
          timeLeft -= 0.1;
          if (timeLeft <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            setSilenceCountdown(null);
          } else {
            setSilenceCountdown(Number(timeLeft.toFixed(1)));
          }
        }, 100);

        // Set a timeout to stop listening after 3 seconds of silence
        silenceTimeoutRef.current = setTimeout(() => {
          console.log("Stopping due to silence...");
          setIsListening(false);
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          setSilenceCountdown(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }

          // Trigger auto-generation
          if (finalTranscript.trim()) {
            setShouldAutoGenerate(true);
          }
        }, 3000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error, event);
      setIsListening(false);
      setSilenceCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        toast.error(
          "Microphone permission denied. Please allow microphone access."
        );
      } else if (event.error === "aborted") {
        toast.info("Voice input cancelled");
      } else if (event.error === "network") {
        toast.error("Connection issue. Check your internet and try again.");
      } else {
        toast.error(`Voice input failed: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
      setSilenceCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceMode = () => {
    const newVoiceMode = !isVoiceMode;
    setIsVoiceMode(newVoiceMode);

    // If turning off voice mode, stop listening
    if (!newVoiceMode && isListening) {
      stopListening();
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error(
        "Voice input not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    try {
      setIsListening(true);
      setFeedbackText("");
      setSilenceCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      console.log("Starting speech recognition...");
      recognitionRef.current.start();
      toast.info("Listening... Speak now!");
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
      toast.error("Failed to start voice input. Please try again.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const generateEdit = async () => {
    if (!inputText.trim() || !feedbackText.trim()) return;

    setIsGenerating(true);
    try {
      // Add user's feedback to conversation
      const updatedHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: "user", content: feedbackText }
      ];

      const response = await fetch("/api/ai/generate-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          prompt: feedbackText,
          context: userContext,
          conversationHistory: updatedHistory,
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

      // Add AI's response to conversation
      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: data.suggestedText }
      ]);

      setCurrentVersion(newVersion);
      setVersionHistory((prev) => [...prev, newVersion]);
      setFeedbackText(""); // Clear feedback for next iteration
      toast.success("Content edited!");
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

  // Auto-generate after voice input
  useEffect(() => {
    if (shouldAutoGenerate && feedbackText.trim() && inputText.trim()) {
      setShouldAutoGenerate(false);
      setTimeout(() => {
        generateEdit();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoGenerate, feedbackText, inputText]);

  const playTextToSpeech = async (text: string) => {
    try {
      setIsPlaying(true);

      const response = await fetch("/api/ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
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

  const handlePlay = async () => {
    if (!currentVersion) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    await playTextToSpeech(currentVersion.suggestedText);
  };

  const handleReset = () => {
    setCurrentVersion(null);

    // In voice mode, auto-start listening for next edit
    if (isVoiceMode) {
      setTimeout(() => {
        startListening();
      }, 500);
    }
  };

  const handleClearAll = () => {
    setFeedbackText("");
    setCurrentVersion(null);
    setVersionHistory([]);
    setConversationHistory([]);
  };

  const handleCopyVersion = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return {
    // State
    inputText,
    feedbackText,
    currentVersion,
    versionHistory,
    isGenerating,
    isPlaying,
    isVoiceMode,
    isListening,
    silenceCountdown,

    // Computed
    isAiActive: isGenerating || isPlaying,

    // Actions
    setInputText,
    setFeedbackText,
    generateEdit,
    handlePlay,
    handleReset,
    handleClearAll,
    handleCopyVersion,
    toggleVoiceMode,
    startListening,
    stopListening,
  };
}
