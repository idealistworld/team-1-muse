import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { aiClient } from "@/services/aiClient";

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
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

export function useContextGatheringViewModel(postContent: string) {
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    []
  );
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  // Voice mode
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const interimTranscriptRef = useRef("");
  const isRecognitionRunningRef = useRef(false);
  const isStartingRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      (
        window as Window & {
          SpeechRecognition?: new () => SpeechRecognition;
          webkitSpeechRecognition?: new () => SpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as Window & {
          webkitSpeechRecognition?: new () => SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return;
    }

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
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        interimTranscriptRef.current = interimTranscript;
        setCurrentAnswer(interimTranscript);
      }

      if (finalTranscript) {
        setCurrentAnswer(finalTranscript);
        interimTranscriptRef.current = "";

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }

        let timeLeft = 1.5;
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

        silenceTimeoutRef.current = setTimeout(() => {
          setIsListening(false);
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          setSilenceCountdown(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }

          // Trigger auto-submit
          if (finalTranscript.trim()) {
            setShouldAutoSubmit(true);
          }
        }, 1500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error, event);
      isRecognitionRunningRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      setSilenceCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        toast.error(
          "Microphone permission denied. Please allow microphone access in your browser settings."
        );
        setIsVoiceMode(false);
      } else if (event.error === "aborted") {
        // Silently ignore aborted errors (expected during cleanup)
      } else if (event.error === "network") {
        toast.error("Speech service unavailable. Try: 1) Check internet connection 2) Use Chrome/Edge 3) Ensure site is on HTTPS");
        setIsVoiceMode(false);
      } else if (event.error === "service-not-allowed") {
        toast.error("Speech recognition blocked. Check your browser permissions.");
        setIsVoiceMode(false);
      } else {
        toast.error(`Voice input failed: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;
      isStartingRef.current = false;
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

  // Start conversation when postContent changes
  useEffect(() => {
    if (!postContent || conversationHistory.length > 0) return;

    const startConversation = async () => {
      setIsAskingQuestion(true);

      try {
        const data = await aiClient.askQuestion({
          postContent,
          conversationHistory: [],
        });

        if (data.ready) {
          setIsReadyToGenerate(true);
        } else if (data.question) {
          setConversationHistory([
            { role: "assistant", content: data.question },
          ]);
        }
      } catch (error) {
        console.error("Failed to start conversation:", error);
        setIsReadyToGenerate(true);
      } finally {
        setIsAskingQuestion(false);
      }
    };

    startConversation();
  }, [postContent, conversationHistory.length]);

  const toggleVoiceMode = () => {
    const newVoiceMode = !isVoiceMode;
    setIsVoiceMode(newVoiceMode);

    if (!newVoiceMode && isListening) {
      stopListening();
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast.error(
        "Voice input not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    // Don't start if already listening or starting
    if (isListening || isStartingRef.current || isRecognitionRunningRef.current) {
      return;
    }

    try {
      // Check microphone permissions first
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName
      });

      if (permissionStatus.state === "denied") {
        toast.error("Microphone access denied. Please enable it in browser settings.");
        setIsVoiceMode(false);
        return;
      }

      // Request microphone access to ensure permission is granted
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permError) {
        console.error("Microphone permission error:", permError);
        toast.error("Could not access microphone. Please grant permission.");
        setIsVoiceMode(false);
        return;
      }

      isStartingRef.current = true;

      // Ensure recognition is fully stopped before starting
      if (isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
        // Wait for it to fully stop
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Clear any existing timers
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      setIsListening(true);
      setCurrentAnswer("");
      setSilenceCountdown(null);

      // Start recognition
      try {
        recognitionRef.current.start();
        toast.info("Listening... Speak now!");
      } catch (error) {
        console.error("Failed to start recognition:", error);
        isStartingRef.current = false;
        setIsListening(false);

        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.includes("already started")) {
          toast.error("Voice recognition is already active. Please wait.");
        } else {
          toast.error("Failed to start voice input. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to prepare recognition:", error);
      isStartingRef.current = false;
      setIsListening(false);
      toast.error("Failed to initialize voice input. Please try again.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const updatedHistory = [
      ...conversationHistory,
      { role: "user" as const, content: currentAnswer },
    ];

    setConversationHistory(updatedHistory);
    setCurrentAnswer("");
    setIsAskingQuestion(true);

    try {
      const data = await aiClient.askQuestion({
        postContent,
        conversationHistory: updatedHistory,
      });

      if (data.ready) {
        setIsReadyToGenerate(true);
      } else if (data.question) {
        setConversationHistory([
          ...updatedHistory,
          { role: "assistant", content: data.question },
        ]);

        // In voice mode, auto-start listening for next answer
        if (isVoiceMode) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Failed to get next question:", error);
      setIsReadyToGenerate(true);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleSkip = () => {
    setIsReadyToGenerate(true);
  };

  // Auto-submit when triggered by voice timeout
  useEffect(() => {
    if (shouldAutoSubmit && currentAnswer.trim()) {
      setShouldAutoSubmit(false);
      handleSubmitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoSubmit, currentAnswer]);

  const reset = () => {
    setConversationHistory([]);
    setCurrentAnswer("");
    setIsReadyToGenerate(false);
    setIsAskingQuestion(false);
    setIsVoiceMode(false);
    setIsListening(false);
  };

  return {
    conversationHistory,
    currentAnswer,
    setCurrentAnswer,
    isAskingQuestion,
    isReadyToGenerate,
    isVoiceMode,
    isListening,
    silenceCountdown,
    handleSubmitAnswer,
    handleSkip,
    toggleVoiceMode,
    startListening,
    stopListening,
    reset,
  };
}
