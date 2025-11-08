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
      // Speech recognition started
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
        } else {
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

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error(
        "Voice input not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    // Don't start if already listening
    if (isListening) {
      return;
    }

    try {
      setIsListening(true);
      setCurrentAnswer("");
      setSilenceCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
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
      } else {
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
