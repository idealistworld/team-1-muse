import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "@/types";
import { getSpeechRecognition } from "@/types";

interface UseSpeechRecognitionOptions {
  /** Silence timeout in seconds before auto-stopping (default: 3) */
  silenceTimeout?: number;
  /** Callback when final transcript is ready */
  onTranscript?: (transcript: string) => void;
  /** Callback when silence timeout triggers auto-submit */
  onSilenceTimeout?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  isVoiceMode: boolean;
  isListening: boolean;
  silenceCountdown: number | null;
  transcript: string;
  setTranscript: (value: string) => void;
  toggleVoiceMode: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { silenceTimeout = 3, onTranscript, onSilenceTimeout } = options;

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const interimTranscriptRef = useRef("");
  const isRecognitionRunningRef = useRef(false);
  const isStartingRef = useRef(false);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecognitionRunningRef.current = true;
      isStartingRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (interimTranscript) {
        interimTranscriptRef.current = interimTranscript;
        setTranscript(interimTranscript);
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        interimTranscriptRef.current = "";
        onTranscript?.(finalTranscript);

        // Clear existing timers
        clearTimers();

        // Start countdown
        let timeLeft = silenceTimeout;
        setSilenceCountdown(timeLeft);

        countdownIntervalRef.current = setInterval(() => {
          timeLeft -= 0.1;
          if (timeLeft <= 0) {
            clearTimers();
            setSilenceCountdown(null);
          } else {
            setSilenceCountdown(Number(timeLeft.toFixed(1)));
          }
        }, 100);

        // Set silence timeout
        silenceTimeoutRef.current = setTimeout(() => {
          setIsListening(false);
          recognitionRef.current?.stop();
          setSilenceCountdown(null);
          clearTimers();

          if (finalTranscript.trim()) {
            onSilenceTimeout?.(finalTranscript);
          }
        }, silenceTimeout * 1000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      isRecognitionRunningRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      setSilenceCountdown(null);
      clearTimers();

      switch (event.error) {
        case "no-speech":
          toast.error("No speech detected. Please try again.");
          break;
        case "not-allowed":
          toast.error("Microphone permission denied. Please allow microphone access.");
          setIsVoiceMode(false);
          break;
        case "aborted":
          // Silently ignore aborted errors
          break;
        case "network":
          toast.error("Speech service unavailable. Check your connection or try Chrome/Edge.");
          setIsVoiceMode(false);
          break;
        case "service-not-allowed":
          toast.error("Speech recognition blocked. Check browser permissions.");
          setIsVoiceMode(false);
          break;
        default:
          toast.error(`Voice input failed: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      setSilenceCountdown(null);
      clearTimers();
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
      clearTimers();
    };
  }, [silenceTimeout, onTranscript, onSilenceTimeout, clearTimers]);

  const toggleVoiceMode = useCallback(() => {
    setIsVoiceMode((prev) => {
      if (prev && isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      return !prev;
    });
  }, [isListening]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      toast.error("Voice input not supported. Try Chrome or Edge.");
      return;
    }

    if (isListening || isStartingRef.current || isRecognitionRunningRef.current) {
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "denied") {
        toast.error("Microphone access denied. Enable it in browser settings.");
        setIsVoiceMode(false);
        return;
      }

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        toast.error("Could not access microphone. Please grant permission.");
        setIsVoiceMode(false);
        return;
      }

      isStartingRef.current = true;

      if (isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      clearTimers();
      setIsListening(true);
      setTranscript("");
      setSilenceCountdown(null);

      try {
        recognitionRef.current.start();
        toast.info("Listening... Speak now!");
      } catch (error) {
        isStartingRef.current = false;
        setIsListening(false);
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.includes("already started")) {
          toast.error("Voice recognition is already active. Please wait.");
        } else {
          toast.error("Failed to start voice input. Please try again.");
        }
      }
    } catch {
      isStartingRef.current = false;
      setIsListening(false);
      toast.error("Failed to initialize voice input. Please try again.");
    }
  }, [isListening, clearTimers]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    interimTranscriptRef.current = "";
  }, []);

  return {
    isVoiceMode,
    isListening,
    silenceCountdown,
    transcript,
    setTranscript,
    toggleVoiceMode,
    startListening,
    stopListening,
    resetTranscript,
  };
}
