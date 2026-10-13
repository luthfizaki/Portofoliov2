function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
      const item = (value as Record<string, unknown>)[key];
      if (item !== undefined) result[key] = normalize(item);
      return result;
    }, {});
  }
  return value;
}

export function stableSerialize(value: unknown) {
  return JSON.stringify(normalize(value));
}

export function editorSnapshot(metadata: unknown, blocks: unknown) {
  return stableSerialize({ metadata, blocks });
}

export function draftJson(metadata: unknown, blocks: unknown) {
  return JSON.stringify(normalize({ metadata, blocks }), null, 2);
}

export function preserveUnknownFields(raw: Record<string, unknown>, editable: Record<string, unknown>) {
  return { ...raw, ...editable };
}

export function isEditorDirty(savedSnapshot: string, currentSnapshot: string) {
  return savedSnapshot !== currentSnapshot;
}

export function shouldApplyServerResponse(requestRevision: number, currentRevision: number) {
  return requestRevision === currentRevision;
}

export function shouldProtectNavigation(isDirty: boolean) {
  return isDirty;
}

export type EditorOperation = "save" | "publish" | "unpublish" | "archive" | "loadLatest";

export type EditorRequestState = {
  dirty: boolean;
  saving: boolean;
  publishing: boolean;
  loadingLatest: boolean;
};

export function isEditorActionDisabled(operation: EditorOperation, state: EditorRequestState) {
  const requestInFlight = state.saving || state.publishing || state.loadingLatest;
  if (operation === "publish" || operation === "unpublish") return requestInFlight || state.dirty;
  return requestInFlight;
}

export type ConfirmedProjectStatus = {
  id: string;
  status: string;
  updatedAt: string;
};

export function isConfirmedProjectStatus(value: unknown): value is ConfirmedProjectStatus {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string" && typeof record.updatedAt === "string";
}

export function mergeConfirmedProjectStatus<T extends ConfirmedProjectStatus>(current: T, status: ConfirmedProjectStatus) {
  if (current.id !== status.id) return null;
  return { ...current, status: status.status, updatedAt: status.updatedAt };
}
