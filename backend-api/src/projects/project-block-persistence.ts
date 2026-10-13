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
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
  background?: string;
  animation?: string;
  delete?: boolean;
};

export type ExistingProjectBlock = {
  id: string;
  type: string;
  title: string | null;
  content: unknown;
  sortOrder: number;
  isVisible: boolean;
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
  layoutVariant: string | null;
  background: string | null;
  animation: string | null;
};

export type ProjectBlockPersistencePlan = {
  updates: Array<{ id: string; block: ManagedProjectBlockInput }>;
  creates: ManagedProjectBlockInput[];
  deletes: string[];
};

export type ProjectBlockPersistenceConflicts = {
  duplicateIncomingTypes: string[];
  duplicatePersistedTypes: string[];
};

export type ManagedBlockContentMergeOptions = {
  /** The combined CMS editor submits these arrays as complete raw-object arrays. */
  replaceEditorArrays?: boolean;
  blockType?: string;
};

function duplicateTypes(blocks: Array<{ type: string }>) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const block of blocks) {
    if (seen.has(block.type)) duplicates.add(block.type);
    seen.add(block.type);
  }
  return [...duplicates].sort();
}

export function projectBlockPersistenceConflicts(
  existing: ExistingProjectBlock[],
  incoming: ManagedProjectBlockInput[],
): ProjectBlockPersistenceConflicts {
  const existingManaged = existing.filter((block) => MANAGED_PROJECT_BLOCK_TYPES.has(block.type));
  const managedIncoming = incoming.filter((block) => MANAGED_PROJECT_BLOCK_TYPES.has(block.type));
  return {
    duplicateIncomingTypes: duplicateTypes(managedIncoming),
    duplicatePersistedTypes: duplicateTypes(existingManaged),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const editorArrayPaths: Record<string, Set<string>> = {
  CASE_GALLERY: new Set(["items"]),
  CASE_FEATURE: new Set(["images"]),
};

/**
 * Generic arrays retain the legacy index-merge behavior for partial callers. The
 * combined CMS editor opts into whole-array replacement for the two repeatable
 * arrays it submits with each item's preserved raw object.
 */
function mergeValue(
  existing: unknown,
  incoming: unknown,
  path: string[],
  options: ManagedBlockContentMergeOptions,
): unknown {
  if (isRecord(existing) && isRecord(incoming)) {
    return Object.fromEntries(Object.entries(incoming).map(([key, value]) => [key, mergeValue(existing[key], value, [...path, key], options)]).concat(
      Object.entries(existing).filter(([key]) => !(key in incoming)),
    ));
  }
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    const blockPaths = options.blockType ? editorArrayPaths[options.blockType] : undefined;
    if (options.replaceEditorArrays && blockPaths?.has(path.at(-1) ?? "")) return incoming;
    return incoming.map((value, index) => mergeValue(existing[index], value, [...path, String(index)], options));
  }
  return incoming;
}

export function mergeManagedBlockContent(
  existing: unknown,
  incoming: Record<string, unknown>,
  options: ManagedBlockContentMergeOptions = {},
) {
  return mergeValue(isRecord(existing) ? existing : {}, incoming, [], options) as Record<string, unknown>;
}

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
    if (block.delete) {
      if (current) plan.deletes.push(current.id);
    } else if (current) plan.updates.push({ id: current.id, block });
    else plan.creates.push(block);
    return plan;
  }, { updates: [], creates: [], deletes: [] });
}
