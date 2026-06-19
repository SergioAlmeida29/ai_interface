"use client";

import { X, FileText, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Attachment {
  type: "file" | "url";
  name: string;
  text: string;
}

interface FileAttachmentProps {
  attachment: Attachment;
  onRemove: () => void;
}

export function FileAttachment({ attachment, onRemove }: FileAttachmentProps) {
  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1.5 pr-1 py-1 text-xs max-w-48"
    >
      {attachment.type === "file" ? (
        <FileText className="w-3 h-3 shrink-0" />
      ) : (
        <Link className="w-3 h-3 shrink-0" />
      )}
      <span className="truncate">{attachment.name}</span>
      <button
        onClick={onRemove}
        className="ml-1 rounded hover:bg-muted-foreground/20 p-0.5"
        aria-label="Remover anexo"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}
