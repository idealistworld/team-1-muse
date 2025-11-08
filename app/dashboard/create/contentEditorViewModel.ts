import { useState, useEffect, useMemo, useRef } from "react";
import type { ContentPost } from "@/types";
import { aiClient } from "@/services/aiClient";

export interface UserContext {
  [key: string]: string;
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

export function useContentEditorViewModel(highlightedPosts: ContentPost[]) {
  const [userContent, setUserContent] = useState("");
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const lastGeneratedIdsRef = useRef("");
  const isInitialMount = useRef(true);

  // Track post IDs to detect actual changes
  const highlightedPostIds = useMemo(() =>
    highlightedPosts.map(p => p.id).join(','),
    [highlightedPosts]
  );

  // Show modal when posts are selected
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Don't re-show if same posts
    if (lastGeneratedIdsRef.current === highlightedPostIds) {
      return;
    }

    if (highlightedPosts.length === 0) {
      setUserContent("");
      lastGeneratedIdsRef.current = "";
      return;
    }

    // Show context modal
    setShowContextModal(true);
    lastGeneratedIdsRef.current = highlightedPostIds;
  }, [highlightedPostIds, highlightedPosts]);

  const handleContextComplete = async (history: ChatMessage[]) => {
    setConversationHistory(history);
    setShowContextModal(false);
    setIsGeneratingInitial(true);

    try {
      const combinedContent = highlightedPosts
        .map((post) => post.postRaw || "")
        .join("\n\n");

      // Build context from conversation
      const context: UserContext = {};
      for (let i = 0; i < history.length; i += 2) {
        const question = history[i]?.content;
        const answer = history[i + 1]?.content;
        if (question && answer) {
          context[question] = answer;
        }
      }

      const data = await aiClient.generateEdit({
        text: combinedContent,
        context,
      });

      setUserContent(data.suggestedText || "");
    } catch (error) {
      console.error("Failed to generate initial content:", error);
      const combinedContent = highlightedPosts
        .map((post) => post.postRaw || "")
        .join("\n\n");
      setUserContent(combinedContent);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  const handleContextSkip = async () => {
    setShowContextModal(false);
    setIsGeneratingInitial(true);

    try {
      const combinedContent = highlightedPosts
        .map((post) => post.postRaw || "")
        .join("\n\n");

      const data = await aiClient.generateEdit({
        text: combinedContent,
        context: {},
      });

      setUserContent(data.suggestedText || "");
    } catch (error) {
      console.error("Failed to generate initial content:", error);
      const combinedContent = highlightedPosts
        .map((post) => post.postRaw || "")
        .join("\n\n");
      setUserContent(combinedContent);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  const getPostContent = () => {
    return highlightedPosts.map((post) => post.postRaw || "").join("\n\n");
  };

  return {
    userContent,
    setUserContent,
    isGeneratingInitial,
    showContextModal,
    conversationHistory,
    handleContextComplete,
    handleContextSkip,
    getPostContent,
  };
}
