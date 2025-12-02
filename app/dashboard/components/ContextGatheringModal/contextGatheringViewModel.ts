import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { aiClient } from "@/services/aiClient";
import { useAuth } from "@/hooks";
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "@/types";
import { getSpeechRecognition } from "@/types";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

type ModalStep = "initial" | "analyzing" | "questioning" | "ready";

interface AnalysisQuestion {
  field: string;
  question: string;
  why: string;
}

interface PostAnalysis {
  analysis: string;
  dataPoints: string[];
  questions: AnalysisQuestion[];
}

export function useContextGatheringViewModel(postContent: string) {
  const { user, supabase } = useAuth();
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    []
  );
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("analyzing");
  const [profileData, setProfileData] = useState<Record<string, string>>({});
  const [editableProfileData, setEditableProfileData] = useState<Record<string, string>>({});
  const [checkedProfileFields, setCheckedProfileFields] = useState<Record<string, boolean>>({});
  const [postAnalysis, setPostAnalysis] = useState<PostAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const hasAnalyzedRef = useRef(false);

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

  // Load profile data from Supabase
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_data")
          .select("data")
          .eq("user_id", user.id)
          .eq("key", "personal_info")
          .single();

        if (data?.data) {
          setProfileData(data.data);
          setEditableProfileData(data.data); // Initialize editable copy

          // Auto-check all fields that have data
          const initialChecked: Record<string, boolean> = {};
          Object.entries(data.data).forEach(([key, value]) => {
            if (value && String(value).trim()) {
              initialChecked[key] = true;
            }
          });
          setCheckedProfileFields(initialChecked);
        }
      } catch {
        // No profile data yet, that's fine
      }
    }

    loadProfile();
  }, [user, supabase]);

  // Auto-start personalization when we have post content and profile data is loaded
  useEffect(() => {
    if (!postContent || hasAnalyzedRef.current) return;

    // Small delay to ensure profile data is loaded
    const timer = setTimeout(() => {
      if (!hasAnalyzedRef.current) {
        hasAnalyzedRef.current = true;
        startPersonalization();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [postContent, profileData]);

  // Run the analysis using AI
  const runAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // Use AI to analyze what the post needs
      const response = await fetch('/api/ai/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent, existingProfile: profileData }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();

      setPostAnalysis({
        analysis: data.analysis || "General post",
        dataPoints: data.dataPoints || [],
        questions: data.questions || [],
      });
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback
      setPostAnalysis({
        analysis: "Unable to analyze - will use basic personalization",
        dataPoints: [],
        questions: [],
      });
    } finally {
      setIsAnalyzing(false);
      setModalStep("initial");
    }
  };

  // Get what profile fields are filled vs missing
  const getProfileSummary = () => {
    const keyFields = ['fullName', 'currentTitle', 'companyName', 'industry', 'productName', 'targetCustomer'];
    const filled = keyFields.filter(key => profileData[key]?.trim());
    const missing = keyFields.filter(key => !profileData[key]?.trim());
    return { filled, missing, hasData: filled.length > 0 };
  };

  // Toggle a profile field checkbox
  const toggleProfileField = (key: string) => {
    setCheckedProfileFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Update a profile field value
  const updateProfileField = (key: string, value: string) => {
    setEditableProfileData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get checked profile data only (uses editable data)
  const getCheckedProfileData = () => {
    const checked: Record<string, string> = {};
    Object.entries(editableProfileData).forEach(([key, value]) => {
      if (checkedProfileFields[key] && value && String(value).trim()) {
        checked[key] = value;
      }
    });
    return checked;
  };

  // Start with personalization - ask the LLM what's needed (it knows profile data)
  const startPersonalization = async () => {
    setModalStep("questioning");
    setIsAskingQuestion(true);

    try {
      // Pass checked profile data so AI knows what we already have
      const checkedData = getCheckedProfileData();
      const data = await aiClient.askQuestion({
        postContent,
        conversationHistory: [],
        existingContext: checkedData,
      });

      if (data.ready) {
        // If AI says we have enough, generate immediately
        setIsReadyToGenerate(true);
      } else if (data.question) {
        // AI asks first question about what's missing
        setConversationHistory([
          { role: "assistant", content: data.question },
        ]);
      }
    } catch (error) {
      console.error("Failed to start personalization:", error);
      // Fallback: just use profile data
      applyCurrentInfo();
    } finally {
      setIsAskingQuestion(false);
    }
  };

  // Apply current profile data directly (only checked fields)
  const applyCurrentInfo = () => {
    // Convert CHECKED profile data to conversation format so content generation can use it
    const contextMessages: ChatMessage[] = [];
    const checkedData = getCheckedProfileData();

    if (checkedData.fullName) contextMessages.push({ role: "user", content: `My name is ${checkedData.fullName}` });
    if (checkedData.currentTitle) contextMessages.push({ role: "user", content: `I'm a ${checkedData.currentTitle}` });
    if (checkedData.companyName) contextMessages.push({ role: "user", content: `At ${checkedData.companyName}` });
    if (checkedData.industry) contextMessages.push({ role: "user", content: `In the ${checkedData.industry} industry` });
    if (checkedData.productName) contextMessages.push({ role: "user", content: `Building ${checkedData.productName}` });
    if (checkedData.targetCustomer) contextMessages.push({ role: "user", content: `For ${checkedData.targetCustomer}` });
    if (checkedData.productDescription) contextMessages.push({ role: "user", content: `Which ${checkedData.productDescription}` });

    setConversationHistory(contextMessages);
    setIsReadyToGenerate(true);
  };

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
        } catch {
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
      // Pass checked profile data as existing context
      const checkedData = getCheckedProfileData();
      const data = await aiClient.askQuestion({
        postContent,
        conversationHistory: updatedHistory,
        existingContext: checkedData,
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
    setModalStep("analyzing");
    setPostAnalysis(null);
    setIsAnalyzing(true);
    hasAnalyzedRef.current = false;
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
    modalStep,
    profileData,
    editableProfileData,
    checkedProfileFields,
    postAnalysis,
    isAnalyzing,
    getProfileSummary,
    toggleProfileField,
    updateProfileField,
    getCheckedProfileData,
    handleSubmitAnswer,
    handleSkip,
    toggleVoiceMode,
    startListening,
    stopListening,
    startPersonalization,
    applyCurrentInfo,
    reset,
  };
}
