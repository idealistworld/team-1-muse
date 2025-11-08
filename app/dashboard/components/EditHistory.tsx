/**
 * EditHistory - Displays the history of edits made to content
 */
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardTitle } from "./CardTitle";
import { cn } from "@/lib/utils";

interface Version {
  suggestedText: string;
  additions: number;
  deletions: number;
  timestamp: number;
}

interface EditHistoryProps {
  versionHistory: Version[];
  onCopyVersion: (text: string) => void;
  className?: string;
}

export function EditHistory({ versionHistory, onCopyVersion, className }: EditHistoryProps) {
  if (versionHistory.length <= 1) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle title="EDIT HISTORY" subtitle={`${versionHistory.length} edits`} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {versionHistory.map((version, index) => (
            <div key={version.timestamp} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Edit #{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    +{version.additions} -{version.deletions}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyVersion(version.suggestedText)}
                    className="h-6 text-xs"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm p-2 bg-background rounded border border-border line-clamp-3">
                {version.suggestedText}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
