"use client";

import { Archive, Check, Clock3, Plus, RefreshCw, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";

export type ExperienceRow = {
  id: string;
  year: string;
  role: string;
  company: string;
  contribution: string;
  tags: string[];
  featured: boolean;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  sortOrder: number;
  updatedAt: string;
};

type FormState = {
  id?: string;
  year: string;
  role: string;
  company: string;
  contribution: string;
  tags: string;
  featured: boolean;
  status: ExperienceRow["status"];
  sortOrder: number;
};

const emptyForm: FormState = {
  year: "",
  role: "",
  company: "",
  contribution: "",
  tags: "",
  featured: false,
  status: "PUBLISHED",
  sortOrder: 0,
};

function fromRow(row: ExperienceRow): FormState {
  return {
    id: row.id,
    year: row.year,
    role: row.role,
    company: row.company,
    contribution: row.contribution,
    tags: row.tags.join(", "),
    featured: row.featured,
    status: row.status,
    sortOrder: row.sortOrder,
  };
}

function payload(form: FormState) {
  return {
    year: form.year,
    role: form.role,
    company: form.company,
    contribution: form.contribution,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    featured: form.featured,
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

export function ExperienceManager({ initialRows }: { initialRows: ExperienceRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<FormState>(initialRows[0] ? fromRow(initialRows[0]) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const publishedRows = useMemo(() => rows.filter((row) => row.status === "PUBLISHED"), [rows]);
  const activeRow = form.id ? rows.find((row) => row.id === form.id) : null;

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function refreshRows() {
    const response = await fetch(`${apiUrl}/api/v1/admin/experiences`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.success) setRows(body.data);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/experiences${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload(form)),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to save experience.");
        return;
      }
      await refreshRows();
      if (!form.id && body.data) setForm(fromRow(body.data));
      setNotice("Experience saved and homepage section synced.");
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
      const response = await fetch(`${apiUrl}/api/v1/admin/experiences/${form.id}`, { method: "DELETE", credentials: "include" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to archive experience.");
        return;
      }
      await refreshRows();
      setForm(emptyForm);
      setNotice("Experience archived and homepage section synced.");
    } catch {
      setError("CMS API is unavailable. Start backend service and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cms-experience">
      <section className="cms-module-summary cms-experience-summary">
        <div><span className="overview-tone overview-tone--purple"><Clock3 size={19} /></span><p><small>Total Roles</small><strong>{rows.length}</strong></p></div>
        <div><i className="is-green" /><p><small>Published</small><strong>{publishedRows.length}</strong></p></div>
        <div><i className="is-blue" /><p><small>Featured</small><strong>{rows.filter((row) => row.featured).length}</strong></p></div>
        <button className="cms-module-primary" type="button" onClick={() => setForm({ ...emptyForm, sortOrder: rows.length })}><Plus size={17} />Add Role</button>
      </section>

      <div className="cms-experience-grid">
        <section className="cms-module-card">
          <header className="cms-module-card__header">
            <div><h2>Career Timeline</h2><p>Rows here feed the public Experience section.</p></div>
            <button className="cms-secondary-action" type="button" onClick={refreshRows}><RefreshCw size={15} />Refresh</button>
          </header>
          <div className="cms-experience-list">
            {rows.map((row) => (
              <button className={`cms-experience-row${row.id === form.id ? " is-active" : ""}`} type="button" key={row.id} onClick={() => setForm(fromRow(row))}>
                <span>{String(row.sortOrder + 1).padStart(2, "0")}</span>
                <strong>{row.role}<small>{row.company}</small></strong>
                <em className={`status-${row.status.toLowerCase().replaceAll("_", "-")}`}>{row.status.replaceAll("_", " ")}</em>
                <b>{row.year}</b>
              </button>
            ))}
          </div>
        </section>

        <form className="cms-module-card cms-experience-editor" onSubmit={save}>
          <header className="cms-module-card__header">
            <div><h2>{activeRow ? "Edit Role" : "New Role"}</h2><p>{activeRow ? activeRow.role : "Add a new timeline item."}</p></div>
            <button className="cms-module-primary" type="submit" disabled={saving}>{saving ? <Check size={16} /> : <Save size={16} />}{saving ? "Saving" : "Save"}</button>
          </header>

          <div className="cms-experience-form">
            <label className="cms-field">Year<input value={form.year} onChange={(event) => setField("year", event.target.value)} placeholder="2023 — PRESENT" required /></label>
            <label className="cms-field">Sort Order<input value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} type="number" min={0} /></label>
            <label className="cms-field cms-field--wide">Role<input value={form.role} onChange={(event) => setField("role", event.target.value)} placeholder="UI/UX DESIGNER" required /></label>
            <label className="cms-field cms-field--wide">Company<input value={form.company} onChange={(event) => setField("company", event.target.value)} required /></label>
            <label className="cms-field cms-field--wide">Contribution<textarea value={form.contribution} onChange={(event) => setField("contribution", event.target.value)} rows={4} required /></label>
            <label className="cms-field cms-field--wide">Tags<input value={form.tags} onChange={(event) => setField("tags", event.target.value)} placeholder="PRODUCT DESIGN, DESIGN SYSTEM, UAT SUPPORT" /></label>
            <label className="cms-field">Status<select value={form.status} onChange={(event) => setField("status", event.target.value as ExperienceRow["status"])}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="IN_REVIEW">In Review</option><option value="SCHEDULED">Scheduled</option><option value="ARCHIVED">Archived</option></select></label>
            <label className="cms-experience-check"><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} />Featured role</label>
          </div>

          {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
          {notice && <p className="cms-form-message">{notice}</p>}
          {form.id && <button className="cms-experience-archive" type="button" onClick={archiveCurrent} disabled={saving}><Archive size={15} />Archive this role</button>}
        </form>
      </div>
    </div>
  );
}
