"use client";

import { CardTitle } from "@/app/dashboard/components/shared/CardTitle";
import { DiffView } from "@/app/dashboard/components/shared/DiffView";
import { Button } from "@/components/ui/button";
import type { GeneratedVersion } from "@/app/dashboard/components/SuggestedEditsCard/suggestedEditsViewModel";

interface ContentEditorCardProps {
  userContent: string;
  setUserContent: (content: string) => void;
  isGeneratingInitial: boolean;
  currentVersion: GeneratedVersion | null;
  onAcceptEdit: () => void;
  onRejectEdit: () => void;
}

export function ContentEditorCard({
  userContent,
  setUserContent,
  isGeneratingInitial,
  currentVersion,
  onAcceptEdit,
  onRejectEdit,
}: ContentEditorCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E1E1E1] p-4">
      <div className="mb-3">
        <CardTitle
          title="YOUR CONTENT"
          subtitle={
            currentVersion
              ? `+${currentVersion.additions} additions • -${currentVersion.deletions} deletions`
              : `${userContent.split(/\s+/).filter(Boolean).length} words • ${userContent.length} characters`
          }
        />
      </div>

      {currentVersion ? (
        <div className="space-y-4">
          <DiffView
            original={userContent}
            edited={currentVersion.suggestedText}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onRejectEdit}
            >
              Reject
            </Button>
            <Button
              className="flex-1"
              onClick={onAcceptEdit}
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
  );
}
