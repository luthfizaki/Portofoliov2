"use client";

import { Check, Code2, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { SessionUser } from "../lib/api";
import { apiUrl } from "../lib/api";
import { CmsWorkspace } from "./cms-workspace";
import { SectionVisibilitySwitch } from "./section-visibility-switch";

type Primitive = string | number | boolean | null;
type FormValue = Primitive | FormValue[] | { [key: string]: FormValue };
type FormObject = { [key: string]: FormValue };
type Path = Array<string | number>;

export type EditablePage = {
  id: string; name: string; slug: string; status: string;
  sections: Array<{ id: string; type: string; name: string | null; content: FormObject; isVisible: boolean }>;
};

const hiddenKeys = new Set(["id", "createdAt", "updatedAt", "deletedAt"]);

function titleFromKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function isRecord(value: FormValue): value is FormObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssetField(key: string, value: FormValue) {
  if (typeof value !== "string") return false;
  return /(url|image|avatar|portrait|background|visual|collage|glow|dot|orb|pdf|resume|cv)/i.test(key);
}

function updateAtPath(value: FormValue, path: Path, nextValue: FormValue): FormValue {
  if (!path.length) return nextValue;
  const [head, ...tail] = path;
  if (Array.isArray(value)) {
    return value.map((item, index) => index === head ? updateAtPath(item, tail, nextValue) : item);
  }
  if (isRecord(value) && typeof head === "string") {
    return { ...value, [head]: updateAtPath(value[head], tail, nextValue) };
  }
  return value;
}

function removeAtPath(value: FormValue, path: Path): FormValue {
  const [head, ...tail] = path;
  if (Array.isArray(value) && typeof head === "number") {
    if (!tail.length) return value.filter((_, index) => index !== head);
    return value.map((item, index) => index === head ? removeAtPath(item, tail) : item);
  }
  if (isRecord(value) && typeof head === "string") {
    return { ...value, [head]: removeAtPath(value[head], tail) };
  }
  return value;
}

function addAtPath(value: FormValue, path: Path, item: FormValue): FormValue {
  if (!path.length && Array.isArray(value)) return [...value, item];
  const [head, ...tail] = path;
  if (Array.isArray(value) && typeof head === "number") {
    return value.map((entry, index) => index === head ? addAtPath(entry, tail, item) : entry);
  }
  if (isRecord(value) && typeof head === "string") {
    return { ...value, [head]: addAtPath(value[head], tail, item) };
  }
  return value;
}

function blankFrom(value: FormValue): FormValue {
  if (Array.isArray(value)) return value.length ? blankFrom(value[0]) : "";
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, blankFrom(entry)]));
  }
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

export function PageEditor({ page, user }: { page: EditablePage; user: SessionUser }) {
  const router = useRouter();
  const initialContent = useMemo(
    () => Object.fromEntries(page.sections.map((section) => [section.id, section.content])),
    [page.sections]
  );
  const [content, setContent] = useState<Record<string, FormObject>>(initialContent);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setSectionValue(sectionId: string, path: Path, value: FormValue) {
    setContent((current) => ({
      ...current,
      [sectionId]: updateAtPath(current[sectionId], path, value) as FormObject,
    }));
  }

  function removeSectionValue(sectionId: string, path: Path) {
    setContent((current) => ({
      ...current,
      [sectionId]: removeAtPath(current[sectionId], path) as FormObject,
    }));
  }

  function addSectionValue(sectionId: string, path: Path, item: FormValue) {
    setContent((current) => ({
      ...current,
      [sectionId]: addAtPath(current[sectionId], path, item) as FormObject,
    }));
  }

  async function uploadAsset(sectionId: string, path: Path, file: File) {
    setError("");
    setMessage("");
    setUploading(`${sectionId}:${path.join(".")}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${apiUrl}/api/v1/admin/media/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "File could not be uploaded.");
        return;
      }
      setSectionValue(sectionId, path, body.data.url);
      setMessage("File uploaded and inserted into the field.");
    } catch {
      setError("Upload service is unavailable.");
    } finally {
      setUploading(null);
    }
  }

  async function save(sectionId: string) {
    setError("");
    setMessage("");
    setSaving(sectionId);
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/pages/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content[sectionId] }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Section could not be saved.");
        return;
      }
      setMessage("Section saved. The public portfolio has been updated.");
      router.refresh();
    } catch {
      setError("CMS API is unavailable.");
    } finally {
      setSaving(null);
    }
  }

  const renderField = (sectionId: string, key: string, value: FormValue, path: Path): ReactNode => {
    if (hiddenKeys.has(key)) return null;

    if (Array.isArray(value)) {
      const primitiveArray = value.every((item) => typeof item !== "object" || item === null);
      if (primitiveArray) {
        return (
          <label className="cms-field cms-field--wide" key={path.join(".")}>
            {titleFromKey(key)}
            <textarea
              value={value.map((item) => String(item ?? "")).join("\n")}
              onChange={(event) => setSectionValue(sectionId, path, event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
              rows={Math.max(3, Math.min(7, value.length + 1))}
            />
            <small>One item per line.</small>
          </label>
        );
      }

      return (
        <fieldset className="cms-form-group cms-field--wide" key={path.join(".")}>
          <legend>{titleFromKey(key)}</legend>
          <div className="cms-repeatable-list">
            {value.map((item, index) => (
              <div className="cms-repeatable-item" key={`${path.join(".")}-${index}`}>
                <header>
                  <strong>{titleFromKey(key)} {String(index + 1).padStart(2, "0")}</strong>
                  <button type="button" onClick={() => removeSectionValue(sectionId, [...path, index])}><Trash2 size={14} />Remove</button>
                </header>
                {isRecord(item)
                  ? Object.entries(item).map(([childKey, childValue]) => renderField(sectionId, childKey, childValue, [...path, index, childKey]))
                  : renderField(sectionId, `${key} ${index + 1}`, item, [...path, index])}
              </div>
            ))}
          </div>
          <button className="cms-secondary-action cms-add-repeatable" type="button" onClick={() => addSectionValue(sectionId, path, blankFrom(value))}>
            <Plus size={15} />Add {titleFromKey(key)}
          </button>
        </fieldset>
      );
    }

    if (isRecord(value)) {
      return (
        <fieldset className="cms-form-group cms-field--wide" key={path.join(".")}>
          <legend>{titleFromKey(key)}</legend>
          <div className="cms-nested-form">
            {Object.entries(value).map(([childKey, childValue]) => renderField(sectionId, childKey, childValue, [...path, childKey]))}
          </div>
        </fieldset>
      );
    }

    if (typeof value === "boolean") {
      return (
        <label className="cms-experience-check" key={path.join(".")}>
          <input type="checkbox" checked={value} onChange={(event) => setSectionValue(sectionId, path, event.target.checked)} />
          {titleFromKey(key)}
        </label>
      );
    }

    if (typeof value === "number") {
      return (
        <label className="cms-field" key={path.join(".")}>
          {titleFromKey(key)}
          <input type="number" value={value} onChange={(event) => setSectionValue(sectionId, path, Number(event.target.value))} />
        </label>
      );
    }

    const fieldKey = `${sectionId}:${path.join(".")}`;
    const multiline = key.toLowerCase().includes("intro") || key.toLowerCase().includes("description") || key.toLowerCase().includes("note") || String(value ?? "").length > 90;

    return (
      <label className={`cms-field${multiline || isAssetField(key, value) ? " cms-field--wide" : ""}`} key={path.join(".")}>
        {titleFromKey(key)}
        {multiline ? (
          <textarea value={String(value ?? "")} onChange={(event) => setSectionValue(sectionId, path, event.target.value)} rows={4} />
        ) : (
          <input value={String(value ?? "")} onChange={(event) => setSectionValue(sectionId, path, event.target.value)} />
        )}
        {isAssetField(key, value) && (
          <div className="cms-upload-inline">
            {String(value ?? "") && <a href={String(value)} target="_blank" rel="noreferrer">Preview current file</a>}
            <label>
              <ImagePlus size={14} />
              {uploading === fieldKey ? "Uploading" : "Upload file"}
              <input
                type="file"
                accept="image/*,application/pdf,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAsset(sectionId, path, file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        )}
      </label>
    );
  };

  return (
    <CmsWorkspace user={user} active="Pages" title={page.name} subtitle={`Edit content sections for /${page.slug}.`}>
      <div className="cms-module-body cms-editor-modern">
        <div className="cms-editor-modern__toolbar"><a href="/pages">← Back to Pages</a><span className={`cms-editor__status status-${page.status.toLowerCase()}`}>{page.status}</span></div>
        <div className="cms-modern-page-sections">
          {page.sections.map((section, index) => (
            <section className="cms-editor-panel cms-section-form-panel" key={section.id}>
              <header>
                <div><span className="overview-tone overview-tone--purple"><Code2 size={18} /></span><p><small>{section.type.toUpperCase()}</small><strong>{section.name ?? section.type}</strong></p></div>
                <div className="cms-section-actions">
                  <SectionVisibilitySwitch sectionId={section.id} label={section.name ?? section.type} initialVisible={section.isVisible} />
                  <button className="cms-module-primary" type="button" onClick={() => save(section.id)} disabled={saving === section.id}>{saving === section.id ? <Check size={16} /> : <Save size={16} />}{saving === section.id ? "Saving" : "Save Section"}</button>
                </div>
              </header>
              <div className="cms-form-section-label"><span>Section {String(index + 1).padStart(2, "0")}</span><small>Editable content form</small></div>
              <div className="cms-page-form-grid">
                {Object.entries(content[section.id] ?? {}).map(([key, value]) => renderField(section.id, key, value, [key]))}
              </div>
            </section>
          ))}
          {!page.sections.length && <div className="cms-module-card cms-module-empty"><Code2 size={26} /><strong>No sections available</strong><p>Page section management is coming soon.</p></div>}
          {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
          {message && <p className="cms-form-message">{message}</p>}
        </div>
      </div>
    </CmsWorkspace>
  );
}
