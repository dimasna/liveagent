"use client";

import { useState } from "react";
import {
  LibraryBigIcon,
  PlusIcon,
  FileTextIcon,
  TrashIcon,
  UploadIcon,
  Loader2Icon,
} from "lucide-react";

interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export default function FilesPage() {
  const [files] = useState<KnowledgeFile[]>([]);
  const [uploading, setUploading] = useState(false);

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // TODO: Implement file upload API
    setTimeout(() => setUploading(false), 1000);
  }

  return (
    <div className="p-8">
      <div className="mx-auto w-full max-w-screen-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload documents your voice agents can reference during calls
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50">
            {uploading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            Upload File
            <input
              type="file"
              className="hidden"
              accept=".txt,.pdf,.md,.csv"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* File List */}
        <div className="mt-8">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
              <LibraryBigIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">No files yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload documents like FAQs, menus, or service guides for your
                agents to reference
              </p>
              <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground">
                <UploadIcon className="h-4 w-4" />
                Upload Your First File
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.md,.csv"
                  onChange={handleUpload}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type} &middot; {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
