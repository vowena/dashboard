"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";
import { RequireWallet } from "@/components/wallet/require-wallet";
import { usePro } from "@/hooks/usePro";
import { useProjects } from "@/hooks/useProjects";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { PlusIcon, ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { projectUrl } from "@/lib/project-slug";
import { encodePlanId } from "@/lib/plan-id-codec";

export default function ProjectsPage() {
  return (
    <RequireWallet>
      <ProjectsView />
    </RequireWallet>
  );
}

function ProjectsView() {
  const { address } = useWallet();
  const router = useRouter();
  const { isPro, activate } = usePro();
  const { projects, isLoading, createProject } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!isPro) {
    return (
      <>
        <TopNav active="projects" />
        <UpgradeView onActivate={activate} />
      </>
    );
  }

  return (
    <>
      <TopNav active="projects" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Projects
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-foreground tracking-tight leading-[1.1]">
              Your{" "}
              <span className="serif-italic text-accent text-[1.05em]">
                projects.
              </span>
            </h1>
            <p className="text-secondary text-sm max-w-md">
              {isLoading
                ? "Reading from Stellar…"
                : projects.length === 0
                  ? "Create a project for each product or service you charge for."
                  : `${projects.length} project${projects.length !== 1 ? "s" : ""} on Stellar.`}
            </p>
          </div>
          {!isLoading && projects.length > 0 && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 shrink-0 self-start sm:self-end"
            >
              <PlusIcon size={14} />
              New project
            </Button>
          )}
        </div>

        {isLoading ? (
          <ProjectsSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(projectUrl(project))}
                className="text-left rounded-xl border border-border bg-elevated hover:border-accent/40 transition-all duration-200 p-6 sm:p-7 group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm">
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ArrowRightIcon
                    size={16}
                    className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors mb-2 truncate">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-secondary mb-4 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className="font-mono text-muted truncate">
                    {project.merchant.slice(0, 6)}…
                    {project.merchant.slice(-6)}
                  </p>
                  <span className="text-muted shrink-0 font-mono text-[10px]">
                    #{encodePlanId(project.id)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={async (name, description, onStatus) => {
          const ws = await createProject(name, description, onStatus);
          setShowCreateModal(false);
          router.push(projectUrl(ws));
        }}
        defaultAddress={address || ""}
      />
    </>
  );
}

function UpgradeView({ onActivate }: { onActivate: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: 0.04,
        }}
      />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none">
        <div className="w-[600px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-6">
            Vowena Pro
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-semibold text-foreground mb-6 leading-[1.1] tracking-tight">
            Build with{" "}
            <span className="serif-italic text-accent text-[1.08em]">
              Vowena.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-secondary leading-relaxed mb-10">
            Projects give you everything you need to accept recurring
            payments. Create plans, share checkout links, and integrate in
            minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Button
              size="lg"
              className="h-11 px-6 text-sm gap-2"
              onClick={onActivate}
            >
              Activate Pro
              <ArrowRightIcon size={14} />
            </Button>
          </div>

          <p className="text-xs text-muted">
            Pro is free during the open beta. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto mt-20 sm:mt-24">
          {[
            {
              title: "Unlimited projects",
              description:
                "Stored natively on your Stellar account. Cross-device by default.",
            },
            {
              title: "Shareable checkout",
              description:
                "Send a link, get paid. No SDK required for basic flows.",
            },
            {
              title: "Real-time analytics",
              description:
                "Revenue, churn, and subscriber growth read from on-chain events.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-elevated p-6"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center mb-4">
                <CheckIcon size={14} className="text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">
                {feature.title}
              </h3>
              <p className="text-secondary text-xs leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-border border-dashed bg-surface/50 p-10 sm:p-16 text-center">
      <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
        No projects yet
      </h3>
      <p className="text-secondary text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        Create your first project to start accepting recurring payments for
        your product.
      </p>
      <Button onClick={onCreate} className="gap-2">
        <PlusIcon size={14} />
        Create project
      </Button>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-elevated p-6 sm:p-7 animate-pulse"
        >
          <div className="w-10 h-10 rounded-lg bg-surface mb-5" />
          <div className="h-4 w-32 bg-surface rounded mb-2" />
          <div className="h-3 w-48 bg-surface rounded mb-5" />
          <div className="h-3 w-24 bg-surface rounded" />
        </div>
      ))}
    </div>
  );
}
