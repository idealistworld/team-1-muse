"use client";

import React, { useState } from "react";
import { ContentFeed } from "@/app/dashboard/components/ContentFeed/ContentFeed";
import { useCreatePostViewModel } from "./createPostViewModel";
import { useContentEditorViewModel } from "./contentEditorViewModel";
import { CreatorProfiles } from "../components/CreatorProfiles/CreatorProfiles";
import { EditHistory } from "../components/EditHistory/EditHistory";
import { PostViewModal } from "../components/PostViewModal";
import { useSuggestedEditsViewModel } from "../components/SuggestedEditsCard/suggestedEditsViewModel";
import { ContextGatheringModal } from "../components/ContextGatheringModal/ContextGatheringModal";
import { ContentEditorCard } from "./components/ContentEditorCard";
import { InspirationPostsCard } from "./components/InspirationPostsCard";
import { AIAssistantPanel } from "./components/AIAssistantPanel";
import type { ContentPost } from "@/types";

export default function CreatePostPage() {
  const {
    filteredContentFeed,
    creatorProfiles,
    pendingCreatorIds,
    followCreator,
    unfollowCreator,
    togglePostHighlight,
    getHighlightedPosts,
    searchQuery,
    setSearchQuery,
  } = useCreatePostViewModel();
  const highlightedPosts = getHighlightedPosts();
  const [expandedPost, setExpandedPost] = useState<ContentPost | null>(null);

  // Use content editor view model
  const {
    userContent,
    setUserContent,
    isGeneratingInitial,
    showContextModal,
    conversationHistory,
    handleContextComplete,
    handleContextSkip,
    getPostContent,
  } = useContentEditorViewModel(highlightedPosts);

  // Build context from conversation for edits
  const userContext = React.useMemo(() => {
    const context: Record<string, string> = {};
    for (let i = 0; i < conversationHistory.length; i += 2) {
      const question = conversationHistory[i]?.content;
      const answer = conversationHistory[i + 1]?.content;
      if (question && answer) {
        context[question] = answer;
      }
    }
    return Object.keys(context).length > 0 ? context : undefined;
  }, [conversationHistory]);

  // Use suggested edits view model
  const editsVm = useSuggestedEditsViewModel(userContent, userContext);

  function handleExpandPost(post: ContentPost) {
    setExpandedPost(post);
  }

  return (
    <>
      <PostViewModal
        isOpen={expandedPost !== null}
        onClose={() => setExpandedPost(null)}
        title={expandedPost?.title || ""}
        author={expandedPost?.author || ""}
        timeAgo={expandedPost?.timeAgo || ""}
        content={expandedPost?.postRaw}
        postUrl={expandedPost?.postUrl}
      />
      <ContextGatheringModal
        isOpen={showContextModal}
        postContent={getPostContent()}
        onComplete={handleContextComplete}
        onSkip={handleContextSkip}
      />
      <div className="min-h-screen bg-white p-4">
        {/* Three Column Layout */}
        <div className="grid grid-cols-[380px_1fr_380px] gap-4 max-w-[1800px] mx-auto">
          {/* Left Column - Sidebar */}
          <div className="space-y-4">
            <ContentFeed
              posts={filteredContentFeed}
              postCount={filteredContentFeed.length}
              onTogglePost={togglePostHighlight}
              onExpandPost={handleExpandPost}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <CreatorProfiles
              profiles={creatorProfiles}
              profileCount={creatorProfiles.length}
              onFollow={followCreator}
              onUnfollow={unfollowCreator}
              pendingCreatorIds={pendingCreatorIds}
            />
          </div>

          {/* Middle Column - Your Content */}
          <div className="space-y-4">
            <ContentEditorCard
              userContent={userContent}
              setUserContent={setUserContent}
              isGeneratingInitial={isGeneratingInitial}
              currentVersion={editsVm.currentVersion}
              onAcceptEdit={() => {
                if (editsVm.currentVersion) {
                  setUserContent(editsVm.currentVersion.suggestedText);
                }
                editsVm.handleReset();
              }}
              onRejectEdit={editsVm.handleReset}
            />

            <InspirationPostsCard posts={highlightedPosts} />
          </div>

          {/* Right Column - AI Assistant Controls */}
          <div className="space-y-4">
            <AIAssistantPanel
              isAiActive={editsVm.isAiActive}
              isVoiceMode={editsVm.isVoiceMode}
              toggleVoiceMode={editsVm.toggleVoiceMode}
              isListening={editsVm.isListening}
              startListening={editsVm.startListening}
              stopListening={editsVm.stopListening}
              feedbackText={editsVm.feedbackText}
              setFeedbackText={editsVm.setFeedbackText}
              silenceCountdown={editsVm.silenceCountdown}
              isGenerating={editsVm.isGenerating}
              canGenerate={userContent.trim() !== "" && editsVm.feedbackText.trim() !== ""}
              generateEdit={editsVm.generateEdit}
              versionHistoryCount={editsVm.versionHistory.length}
              onClearAll={editsVm.handleClearAll}
            />

            <EditHistory
              versionHistory={editsVm.versionHistory}
              onCopyVersion={editsVm.handleCopyVersion}
              className="bg-white"
            />
          </div>
        </div>
      </div>
    </>
  );
}
