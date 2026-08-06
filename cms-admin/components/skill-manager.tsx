"use client";

import { Archive, Check, Gauge, Plus, RefreshCw, Save, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";

export type SkillRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  level: number;
  tools: string[];
  featured: boolean;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  sortOrder: number;
  updatedAt: string;
};

type FormState = {
  id?: string;
  name: string;
  category: string;
  description: string;
  level: number;
  tools: string;
  featured: boolean;
  status: SkillRow["status"];
  sortOrder: number;
};

const emptyForm: FormState = {
  name: "",
  category: "Interface",
  description: "",
  level: 80,
  tools: "",
  featured: false,
  status: "PUBLISHED",
  sortOrder: 0,
};

function fromRow(row: SkillRow): FormState {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    level: row.level,
    tools: row.tools.join(", "),
    featured: row.featured,
    status: row.status,
    sortOrder: row.sortOrder,
  };
}

function payload(form: FormState) {
  return {
    name: form.name,
    category: form.category,
    description: form.description,
    level: Number(form.level) || 0,
    tools: form.tools.split(",").map((tool) => tool.trim()).filter(Boolean),
    featured: form.featured,
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

export function SkillManager({ initialRows }: { initialRows: SkillRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<FormState>(initialRows[0] ? fromRow(initialRows[0]) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const publishedRows = useMemo(() => rows.filter((row) => row.status === "PUBLISHED"), [rows]);
  const categories = useMemo(() => [...new Set(rows.map((row) => row.category))], [rows]);
  const activeRow = form.id ? rows.find((row) => row.id === form.id) : null;

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function refreshRows() {
    const response = await fetch(`${apiUrl}/api/v1/admin/skills`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.success) setRows(body.data);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/skills${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload(form)),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to save skill.");
        return;
      }
      await refreshRows();
      if (!form.id && body.data) setForm(fromRow(body.data));
      setNotice("Skill saved and frontend section synced.");
    } catch {
      setError("CMS API is unavailable. Start backend service and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveCurrent() {
    if (!form.id) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/skills/${form.id}`, { method: "DELETE", credentials: "include" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to archive skill.");
        return;
      }
      await refreshRows();
      setForm(emptyForm);
      setNotice("Skill archived and frontend section synced.");
    } catch {
      setError("CMS API is unavailable. Start backend service and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cms-experience cms-skills">
      <section className="cms-module-summary cms-experience-summary">
        <div><span className="overview-tone overview-tone--purple"><Sparkles size={19} /></span><p><small>Total Skills</small><strong>{rows.length}</strong></p></div>
        <div><i className="is-green" /><p><small>Published</small><strong>{publishedRows.length}</strong></p></div>
        <div><i className="is-blue" /><p><small>Categories</small><strong>{categories.length}</strong></p></div>
        <button className="cms-module-primary" type="button" onClick={() => setForm({ ...emptyForm, sortOrder: rows.length })}><Plus size={17} />Add Skill</button>
      </section>

      <div className="cms-experience-grid">
        <section className="cms-module-card">
          <header className="cms-module-card__header">
            <div><h2>Skill Library</h2><p>Items here feed the public Skills section.</p></div>
            <button className="cms-secondary-action" type="button" onClick={refreshRows}><RefreshCw size={15} />Refresh</button>
          </header>
          <div className="cms-experience-list">
            {rows.map((row) => (
              <button className={`cms-experience-row${row.id === form.id ? " is-active" : ""}`} type="button" key={row.id} onClick={() => setForm(fromRow(row))}>
                <span>{String(row.sortOrder + 1).padStart(2, "0")}</span>
                <strong>{row.name}<small>{row.category}</small></strong>
                <em className={`status-${row.status.toLowerCase().replaceAll("_", "-")}`}>{row.status.replaceAll("_", " ")}</em>
                <b>{row.level}%</b>
              </button>
            ))}
          </div>
        </section>

        <form className="cms-module-card cms-experience-editor" onSubmit={save}>
          <header className="cms-module-card__header">
            <div><h2>{activeRow ? "Edit Skill" : "New Skill"}</h2><p>{activeRow ? activeRow.name : "Add a new capability item."}</p></div>
            <button className="cms-module-primary" type="submit" disabled={saving}>{saving ? <Check size={16} /> : <Save size={16} />}{saving ? "Saving" : "Save"}</button>
          </header>

          <div className="cms-experience-form">
            <label className="cms-field cms-field--wide">Skill Name<input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="High-Fidelity UI Design" required /></label>
            <label className="cms-field">Category<input value={form.category} onChange={(event) => setField("category", event.target.value)} placeholder="Interface" required list="skill-categories" /></label>
            <datalist id="skill-categories">{categories.map((category) => <option value={category} key={category} />)}</datalist>
            <label className="cms-field">Sort Order<input value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} type="number" min={0} /></label>
            <label className="cms-field cms-field--wide">Description<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={4} required /></label>
            <label className="cms-field cms-field--wide">Tools<input value={form.tools} onChange={(event) => setField("tools", event.target.value)} placeholder="Figma, Auto Layout, Prototype" /></label>
            <label className="cms-field">Level<div className="cms-skill-level"><Gauge size={15} /><input value={form.level} onChange={(event) => setField("level", Number(event.target.value))} type="number" min={0} max={100} /></div></label>
            <label className="cms-field">Status<select value={form.status} onChange={(event) => setField("status", event.target.value as SkillRow["status"])}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="IN_REVIEW">In Review</option><option value="SCHEDULED">Scheduled</option><option value="ARCHIVED">Archived</option></select></label>
            <label className="cms-experience-check"><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} />Featured skill</label>
          </div>

          {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
          {notice && <p className="cms-form-message">{notice}</p>}
          {form.id && <button className="cms-experience-archive" type="button" onClick={archiveCurrent} disabled={saving}><Archive size={15} />Archive this skill</button>}
        </form>
      </div>
    </div>
  );
}
