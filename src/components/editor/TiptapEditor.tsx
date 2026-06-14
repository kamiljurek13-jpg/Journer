"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "./EditorToolbar";

interface TiptapEditorProps {
  content: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  onAddPhoto?: () => void;
  uploadingPhoto?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  onAddPhoto,
  uploadingPhoto,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
    ],
    content,
    editable,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className={`border rounded-md ${editable ? "p-3" : ""}`}>
      {editable && (
        <EditorToolbar
          editor={editor}
          onAddPhoto={onAddPhoto}
          uploadingPhoto={uploadingPhoto}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
