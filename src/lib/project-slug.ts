/**
 * Project URLs use the same scrambled base-56 codec as plan IDs. Each
 * project has a globally unique chain-assigned u64 ID — we just encode
 * that for display in the URL bar.
 *
 *   /projects/{encodePlanId(project.id)}
 *
 * No client-side ID generation, no slug collisions, no slot logic.
 */

import { encodePlanId, decodePlanId } from "@/lib/plan-id-codec";

export interface UrlAddressableProject {
  id: number;
  name?: string;
}

export function projectUrl(project: UrlAddressableProject): string {
  return `/projects/${encodePlanId(project.id)}`;
}

/**
 * Resolve a URL param back to a project ID. Falls back to numeric input
 * for legacy /projects/0 style links so they don't 404.
 */
export function findProjectByUrlParam<P extends { id: number }>(
  projects: P[],
  param: string,
): P | undefined {
  const id = decodePlanId(param);
  if (Number.isFinite(id) && id > 0) {
    const exact = projects.find((p) => p.id === id);
    if (exact) return exact;
  }
  const numeric = parseInt(param, 10);
  if (!isNaN(numeric)) {
    return projects.find((p) => p.id === numeric);
  }
  return undefined;
}

/**
 * Names don't need to be unique anymore — the chain ID is the source of
 * identity. Kept for back-compat with existing call sites; always false.
 */
export function slugCollides(): boolean {
  return false;
}

export function slugify(name: string): string {
  return name.trim();
}
