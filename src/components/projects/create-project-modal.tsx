"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloseIcon, AlertTriangleIcon } from "@/components/ui/icons";
import { slugify, slugCollides } from "@/lib/project-slug";
import { formatChainError } from "@/lib/chain-errors";
import type { CreateStatus } from "@/hooks/useProjects";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass project names so the modal can warn about duplicate slugs inline */
  existingNames?: string[];
  /** Receives status updates so we can show 'Signing…', 'Submitting…', etc. */
  onCreateProject: (
    name: string,
    description: string | undefined,
    onStatus?: (s: CreateStatus) => void,
  ) => Promise<void> | void;
  defaultAddress?: string;
}

const STATUS_LABEL: Record<CreateStatus, string> = {
  preparing: "Preparing transaction…",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting to Stellar…",
  done: "Done",
};

export function CreateProjectModal({
  isOpen,
  onClose,
  existingNames = [],
  onCreateProject,
  defaultAddress,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CreateStatus | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setName("");
        setDescription("");
        setIsSubmitting(false);
        setError(null);
        setStatus(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const trimmed = name.trim();
  void existingNames; // back-compat: name uniqueness is enforced by chain ID now
  const canSubmit = trimmed.length > 0 && !!defaultAddress;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateProject(trimmed, description.trim() || undefined, (s) =>
        setStatus(s),
      );
    } catch (err) {
      setError(formatChainError(err, "Couldn't create project"));
      setIsSubmitting(false);
      setStatus(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200"
        onClick={isSubmitting ? undefined : onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none overflow-y-auto">
        <div
          className="w-full max-w-lg my-auto rounded-2xl border border-border bg-elevated shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6 flex items-start justify-between border-b border-border-subtle">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                  Create project
                </h2>
                <p className="text-sm text-secondary mt-1.5">
                  Set up a new project to accept recurring payments.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors -m-2 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Project name
                </label>
                <Input
                  placeholder="My SaaS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  disabled={isSubmitting}
                  maxLength={64}
                />
                <p className="text-[10px] text-muted mt-1.5">
                  Stored on chain. The URL will use a unique chain-assigned ID
                  — no slug collisions, ever.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Description{" "}
                  <span className="text-muted font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="What does it do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={64}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Receiving wallet
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <p className="text-xs font-mono text-foreground truncate">
                    {defaultAddress
                      ? `${defaultAddress.slice(0, 10)}…${defaultAddress.slice(-10)}`
                      : "—"}
                  </p>
                </div>
                <p className="text-[10px] text-muted mt-1">
                  Payments for this project go to your connected wallet.
                </p>
              </div>

              {!isSubmitting && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
                  <AlertTriangleIcon
                    size={14}
                    className="text-muted shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-secondary leading-relaxed">
                    Your wallet will sign one transaction. A small base reserve
                    is locked on your Stellar account for the data entries.
                  </p>
                </div>
              )}

              {status && (
                <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent-subtle/50 p-3">
                  <div className="w-3 h-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin shrink-0" />
                  <p className="text-xs text-accent font-medium">
                    {STATUS_LABEL[status]}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 sm:px-8 py-4 border-t border-border-subtle bg-surface/30 flex items-center justify-end gap-3 rounded-b-2xl">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating…" : "Create project"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
