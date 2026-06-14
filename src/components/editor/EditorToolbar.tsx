"use client";

import type { Editor } from "@tiptap/react";
import { ImagePlus, Loader2 } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";

interface EditorToolbarProps {
  editor: Editor;
  onAddPhoto?: () => void;
  uploadingPhoto?: boolean;
}

export function EditorToolbar({ editor, onAddPhoto, uploadingPhoto }: EditorToolbarProps) {
  return (
    <div className="flex gap-1 border-b pb-2 mb-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded font-bold transition-colors ${
          editor.isActive("bold") ? "bg-foreground text-background" : "hover:bg-muted"
        }`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded italic transition-colors ${
          editor.isActive("italic") ? "bg-foreground text-background" : "hover:bg-muted"
        }`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          editor.isActive("bulletList") ? "bg-foreground text-background" : "hover:bg-muted"
        }`}
      >
        •—
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          editor.isActive("orderedList") ? "bg-foreground text-background" : "hover:bg-muted"
        }`}
      >
        1—
      </button>
      <span className="w-px bg-border mx-1 self-stretch" aria-hidden />
      {onAddPhoto !== undefined && (
        <button
          type="button"
          onClick={onAddPhoto}
          disabled={uploadingPhoto}
          title="Dodaj zdjęcie"
          className="px-2 py-1 text-sm rounded transition-colors hover:bg-muted disabled:opacity-50"
        >
          {uploadingPhoto ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
        </button>
      )}
      <VoiceRecorder
        onTranscription={(text) =>
          editor.chain().focus().insertContent(`<p>${text}</p>`).run()
        }
      />
    </div>
  );
}
