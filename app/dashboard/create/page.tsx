"use client";

import React, { useState } from "react";
import { ContentFeed } from "@/app/dashboard/components/ContentFeed";
import { CardTitle } from "@/app/dashboard/components/CardTitle";
import { useCreatePostViewModel } from "./createPostViewModel";
import { useContentEditorViewModel } from "./useContentEditorViewModel";
import { CreatorProfiles } from "../components/CreatorProfiles";
import { EditHistory } from "../components/EditHistory";
import { PostViewModal } from "../components/PostViewModal";
import { useSuggestedEditsViewModel } from "../components/suggestedEditsViewModel";
import { ContextGatheringModal } from "../components/ContextGatheringModal";
import { CircularCountdown } from "../components/CircularCountdown";
import { DiffView } from "../components/DiffView";
import { MuseAvatar } from "../components/MuseAvatar";
import { Button } from "@/components/ui/button";
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
            {/* Editable Content Area */}
            <div className="bg-white rounded-2xl border border-[#E1E1E1] p-4">
              <div className="mb-3">
                <CardTitle
                  title="YOUR CONTENT"
                  subtitle={
                    editsVm.currentVersion
                      ? `+${editsVm.currentVersion.additions} additions • -${editsVm.currentVersion.deletions} deletions`
                      : `${userContent.split(/\s+/).filter(Boolean).length} words • ${userContent.length} characters`
                  }
                />
              </div>

              {editsVm.currentVersion ? (
                <div className="space-y-4">
                  <DiffView
                    original={userContent}
                    edited={editsVm.currentVersion.suggestedText}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={editsVm.handleReset}
                    >
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (editsVm.currentVersion) {
                          setUserContent(editsVm.currentVersion.suggestedText);
                        }
                        editsVm.handleReset();
                      }}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ) : (
                <textarea
                  value={isGeneratingInitial ? "Generating content..." : userContent}
                  onChange={(e) => setUserContent(e.target.value)}
                  placeholder="Select a post to get started..."
                  disabled={isGeneratingInitial}
                  className="w-full min-h-[500px] text-[#696969] bg-transparent border-none resize-none focus:outline-none leading-relaxed disabled:opacity-50"
                />
              )}
            </div>

            {/* Inspiration Content */}
            {highlightedPosts.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E1E1E1] p-4">
                <div className="space-y-6">
                  {highlightedPosts.map((post) => {
                    const postContent = post.postRaw || "";
                    const wordCount = postContent.split(/\s+/).filter(Boolean).length;
                    const charCount = postContent.length;

                    return (
                      <div
                        key={post.id}
                        className="pb-6 border-b border-[#E1E1E1] last:border-b-0 last:pb-0"
                      >
                        <div className="mb-3">
                          <CardTitle
                            title="ORIGINAL POST"
                            subtitle={`${wordCount} words • ${charCount} characters`}
                          />
                        </div>
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-[#696969]">{post.title}</p>
                        </div>
                        <p className="text-[#696969] whitespace-pre-wrap leading-relaxed text-sm">
                          {postContent || "No content available"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Assistant Controls */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E1E1E1] p-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <MuseAvatar isActive={editsVm.isAiActive} size="md" />

                <div className="text-center">
                  <h3 className="text-lg font-semibold">Muse - AI Assistant</h3>
                  {editsVm.isAiActive && (
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
                    onClick={editsVm.toggleVoiceMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editsVm.isVoiceMode ? "bg-[#5578C8]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editsVm.isVoiceMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Feedback Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">What would you like to change?</label>
                      {editsVm.silenceCountdown !== null && (
                        <CircularCountdown countdown={editsVm.silenceCountdown} maxTime={3.0} />
                      )}
                    </div>
                    {editsVm.isVoiceMode && (
                      <button
                        onClick={editsVm.isListening ? editsVm.stopListening : editsVm.startListening}
                        disabled={editsVm.isGenerating}
                        className={`p-2 rounded-full transition-all ${
                          editsVm.isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-[#5578C8] text-white hover:bg-[#4A6AB8]"
                        }`}
                      >
                        {editsVm.isListening ? "🔴" : "🎤"}
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder={editsVm.isVoiceMode ? "Click the mic to speak..." : "e.g., Make it more professional, shorter, add emojis..."}
                    value={editsVm.isListening ? "Listening..." : editsVm.feedbackText}
                    onChange={(e) => editsVm.setFeedbackText(e.target.value)}
                    disabled={editsVm.isListening}
                    className="w-full min-h-[100px] text-sm text-[#696969] bg-transparent border border-[#E1E1E1] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#5578C8] leading-relaxed disabled:opacity-50"
                  />
                </div>

                {/* Edit Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={editsVm.generateEdit}
                    disabled={!userContent.trim() || !editsVm.feedbackText.trim() || editsVm.isGenerating}
                    className="flex-1"
                  >
                    {editsVm.isGenerating ? "Editing..." : "✨ Edit Content"}
                  </Button>
                  {editsVm.versionHistory.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={editsVm.handleClearAll}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </div>

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
