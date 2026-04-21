"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Project } from "@/hooks/useProjects";
import {
  PlanIcon,
  SubscribersIcon,
  BillingIcon,
  KeeperIcon,
  IntegrateIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

interface ProjectSidebarProps {
  project: Project;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "plans", label: "Plans", Icon: PlanIcon },
  { id: "subscribers", label: "Subscribers", Icon: SubscribersIcon },
  { id: "billing", label: "Billing", Icon: BillingIcon },
  { id: "keeper", label: "Keeper", Icon: KeeperIcon },
  { id: "integrate", label: "Integrate", Icon: IntegrateIcon },
];

export function ProjectSidebar({
  project,
  activeTab,
  onTabChange,
}: ProjectSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        `vowena:project:${project.id}:sidebar-collapsed`,
      );
      if (saved) setIsCollapsed(JSON.parse(saved));
    } catch {}
  }, [project.id]);

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem(
        `vowena:project:${project.id}:sidebar-collapsed`,
        JSON.stringify(next),
      );
    } catch {}
  };

  return (
    <>
      {/* Mobile: horizontal tab bar */}
      <div className="lg:hidden border-b border-border bg-elevated/40">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-border-subtle">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-xs">
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate tracking-tight">
              {project.name}
            </p>
            <p className="text-[10px] text-muted truncate font-mono">
              {project.merchant.slice(0, 6)}…
              {project.merchant.slice(-4)}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === id
                  ? "bg-accent-subtle text-accent"
                  : "text-secondary hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop: vertical sidebar */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed ? "w-16" : "w-60"
        } shrink-0 border-r border-border bg-elevated/40 flex-col transition-[width] duration-200`}
      >
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate tracking-tight">
                  {project.name}
                </p>
                <p className="text-[10px] text-muted truncate font-mono mt-0.5">
                  {project.merchant.slice(0, 6)}…
                  {project.merchant.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                title={isCollapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent-subtle text-accent"
                    : "text-secondary hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link
            href={`https://stellar.expert/explorer/testnet/account/${project.merchant}`}
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? "View on Explorer" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <ExternalLinkIcon size={14} className="shrink-0" />
            {!isCollapsed && <span>Explorer</span>}
          </Link>
          <button
            onClick={handleToggle}
            title={isCollapsed ? "Expand" : "Collapse"}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon size={14} className="shrink-0" />
            ) : (
              <>
                <ChevronLeftIcon size={14} className="shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
