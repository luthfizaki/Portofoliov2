export const MANAGED_PROJECT_BLOCK_TYPES = new Set([
  "CASE_HERO",
  "CASE_SUMMARY",
  "CASE_GALLERY",
  "CASE_FEATURE",
  "CASE_NEXT",
]);

export type ManagedProjectBlockInput = {
  type: string;
  title?: string;
  content: Record<string, unknown>;
  sortOrder?: number;
  isVisible?: boolean;
  layoutVariant?: string;
};

export type ExistingProjectBlock = {
  id: string;
  type: string;
  title: string | null;
  content: unknown;
  sortOrder: number;
  isVisible: boolean;
  layoutVariant: string | null;
};

export type ProjectBlockPersistencePlan = {
  updates: Array<{ id: string; block: ManagedProjectBlockInput }>;
  creates: ManagedProjectBlockInput[];
};

export function buildProjectBlockPersistencePlan(
  existing: ExistingProjectBlock[],
  incoming: ManagedProjectBlockInput[],
): ProjectBlockPersistencePlan {
  const existingManaged = new Map(
    existing
      .filter((block) => MANAGED_PROJECT_BLOCK_TYPES.has(block.type))
      .map((block) => [block.type, block]),
  );
  const managedIncoming = incoming.filter((block) => MANAGED_PROJECT_BLOCK_TYPES.has(block.type));

  return managedIncoming.reduce<ProjectBlockPersistencePlan>((plan, block) => {
    const current = existingManaged.get(block.type);
    if (current) plan.updates.push({ id: current.id, block });
    else plan.creates.push(block);
    return plan;
  }, { updates: [], creates: [] });
}
