"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { RequireWallet } from "@/components/wallet/require-wallet";
import {
  useProjects,
  getProjectPlansWithData,
  type Project,
} from "@/hooks/useProjects";
import { usePro } from "@/hooks/usePro";
import { findProjectByUrlParam, projectUrl } from "@/lib/project-slug";
import { ProjectSidebar } from "@/components/projects/project-sidebar";
import { TopNav } from "@/components/top-nav";
import { PlansTab } from "@/components/projects/plans-tab";
import { SubscribersTab } from "@/components/projects/subscribers-tab";
import { BillingTab } from "@/components/projects/billing-tab";
import { KeeperTab } from "@/components/projects/keeper-tab";
import { IntegrateTab } from "@/components/projects/integrate-tab";
import { ChevronLeftIcon } from "@/components/ui/icons";

export default function ProjectDashboardPage() {
  return (
    <RequireWallet>
      <ProjectDashboardView />
    </RequireWallet>
  );
}

function ProjectDashboardView() {
  const router = useRouter();
  const params = useParams();
  const urlParam = params.id as string;

  const { isPro, isLoading: isProLoading } = usePro();
  const { projects, isLoading: isWsLoading } = useProjects();
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState<
    Awaited<ReturnType<typeof getProjectPlansWithData>>
  >([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const project: Project | undefined = findProjectByUrlParam(
    projects,
    urlParam,
  );

  // If user landed on a legacy /projects/0 URL, redirect to the slug version
  useEffect(() => {
    if (project && urlParam !== projectUrl(project).split("/").pop()) {
      router.replace(projectUrl(project));
    }
  }, [project, urlParam, router]);

  // Pro gate
  useEffect(() => {
    if (!isProLoading && !isPro) {
      router.replace("/projects");
    }
  }, [isPro, isProLoading, router]);

  // Project not found after chain read completes → bounce to list
  useEffect(() => {
    if (!isWsLoading && !project) {
      router.replace("/projects");
    }
  }, [isWsLoading, project, router]);

  // Load plans tagged to this project from chain
  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingPlans(true);
      try {
        const data = await getProjectPlansWithData(
          project.merchant,
          project.id,
        );
        if (!cancelled) setPlans(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [project, refreshKey]);

  const refreshPlans = () => setRefreshKey((k) => k + 1);

  // Loading skeleton while resolving project + pro status
  if (isWsLoading || isProLoading || !project || !isPro) {
    return (
      <>
        <TopNav active="projects" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <div className="rounded-2xl border border-border bg-elevated/40 min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav active="projects" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/projects"
          className="text-xs text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeftIcon size={12} />
          Projects
        </Link>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-2xl border border-border bg-elevated/40 overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
          <ProjectSidebar
            project={project}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <main className="flex-1 overflow-auto bg-elevated min-w-0">
            <div className="p-5 sm:p-8 lg:p-10">
              {activeTab === "plans" && (
                <PlansTab
                  project={project}
                  plans={plans}
                  isLoading={isLoadingPlans}
                  onCreated={refreshPlans}
                />
              )}
              {activeTab === "subscribers" && (
                <SubscribersTab project={project} plans={plans} />
              )}
              {activeTab === "billing" && (
                <BillingTab project={project} plans={plans} />
              )}
              {activeTab === "keeper" && <KeeperTab project={project} />}
              {activeTab === "integrate" && (
                <IntegrateTab project={project} plans={plans} />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
