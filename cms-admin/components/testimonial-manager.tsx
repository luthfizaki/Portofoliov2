"use client";

import { Archive, Check, MessageSquareQuote, Plus, RefreshCw, Save, Star } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";

export type TestimonialRow = {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  initial: string;
  avatarUrl: string;
  accent: "blue" | "purple" | "green";
  featuredLabel: string;
  tags: string[];
  featured: boolean;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  sortOrder: number;
  updatedAt: string;
};

type FormState = {
  id?: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  initial: string;
  avatarUrl: string;
  accent: TestimonialRow["accent"];
  featuredLabel: string;
  tags: string;
  featured: boolean;
  status: TestimonialRow["status"];
  sortOrder: number;
};

const emptyForm: FormState = {
  name: "",
  role: "",
  company: "",
  quote: "",
  initial: "",
  avatarUrl: "/testimonial-raka-avatar.svg",
  accent: "blue",
  featuredLabel: "",
  tags: "",
  featured: false,
  status: "PUBLISHED",
  sortOrder: 0,
};

function fromRow(row: TestimonialRow): FormState {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    company: row.company,
    quote: row.quote,
    initial: row.initial,
    avatarUrl: row.avatarUrl,
    accent: row.accent,
    featuredLabel: row.featuredLabel,
    tags: row.tags.join(", "),
    featured: row.featured,
    status: row.status,
    sortOrder: row.sortOrder,
  };
}

function payload(form: FormState) {
  return {
    name: form.name,
    role: form.role,
    company: form.company,
    quote: form.quote,
    initial: form.initial || form.name.slice(0, 1).toUpperCase(),
    avatarUrl: form.avatarUrl,
    accent: form.accent,
    featuredLabel: form.featuredLabel,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    featured: form.featured,
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

export function TestimonialManager({ initialRows }: { initialRows: TestimonialRow[] }) {
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
    const response = await fetch(`${apiUrl}/api/v1/admin/testimonials`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.success) setRows(body.data);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/testimonials${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload(form)),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to save testimonial.");
        return;
      }
      await refreshRows();
      if (!form.id && body.data) setForm(fromRow(body.data));
      setNotice("Testimonial saved and frontend section synced.");
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
      const response = await fetch(`${apiUrl}/api/v1/admin/testimonials/${form.id}`, { method: "DELETE", credentials: "include" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to archive testimonial.");
        return;
      }
      await refreshRows();
      setForm(emptyForm);
      setNotice("Testimonial archived and frontend section synced.");
    } catch {
      setError("CMS API is unavailable. Start backend service and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cms-experience cms-testimonials">
      <section className="cms-module-summary cms-experience-summary">
        <div><span className="overview-tone overview-tone--purple"><MessageSquareQuote size={19} /></span><p><small>Total Voices</small><strong>{rows.length}</strong></p></div>
        <div><i className="is-green" /><p><small>Published</small><strong>{publishedRows.length}</strong></p></div>
        <div><i className="is-blue" /><p><small>Featured</small><strong>{rows.filter((row) => row.featured).length}</strong></p></div>
        <button className="cms-module-primary" type="button" onClick={() => setForm({ ...emptyForm, sortOrder: rows.length })}><Plus size={17} />Add Voice</button>
      </section>

      <div className="cms-experience-grid">
        <section className="cms-module-card">
          <header className="cms-module-card__header">
            <div><h2>Published Voices</h2><p>Rows here feed the public testimonial section.</p></div>
            <button className="cms-secondary-action" type="button" onClick={refreshRows}><RefreshCw size={15} />Refresh</button>
          </header>
          <div className="cms-experience-list">
            {rows.map((row) => (
              <button className={`cms-experience-row${row.id === form.id ? " is-active" : ""}`} type="button" key={row.id} onClick={() => setForm(fromRow(row))}>
                <span>{String(row.sortOrder + 1).padStart(2, "0")}</span>
                <strong>{row.name}<small>{row.role || row.company}</small></strong>
                <em className={`status-${row.status.toLowerCase().replaceAll("_", "-")}`}>{row.status.replaceAll("_", " ")}</em>
                <b>{row.featured ? "FEATURED" : row.accent.toUpperCase()}</b>
              </button>
            ))}
          </div>
        </section>

        <form className="cms-module-card cms-experience-editor" onSubmit={save}>
          <header className="cms-module-card__header">
            <div><h2>{activeRow ? "Edit Voice" : "New Voice"}</h2><p>{activeRow ? activeRow.name : "Add a collaboration testimonial."}</p></div>
            <button className="cms-module-primary" type="submit" disabled={saving}>{saving ? <Check size={16} /> : <Save size={16} />}{saving ? "Saving" : "Save"}</button>
          </header>

          <div className="cms-experience-form">
            <label className="cms-field">Name<input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Raka" required /></label>
            <label className="cms-field">Initial<input value={form.initial} onChange={(event) => setField("initial", event.target.value)} placeholder="R" maxLength={6} /></label>
            <label className="cms-field cms-field--wide">Role<input value={form.role} onChange={(event) => setField("role", event.target.value)} placeholder="Lead Engineer" /></label>
            <label className="cms-field cms-field--wide">Company<input value={form.company} onChange={(event) => setField("company", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Quote<textarea value={form.quote} onChange={(event) => setField("quote", event.target.value)} rows={5} required /></label>
            <label className="cms-field cms-field--wide">Avatar URL<input value={form.avatarUrl} onChange={(event) => setField("avatarUrl", event.target.value)} placeholder="/testimonial-raka-avatar.svg" /></label>
            <label className="cms-field">Accent<select value={form.accent} onChange={(event) => setField("accent", event.target.value as TestimonialRow["accent"])}><option value="blue">Blue</option><option value="purple">Purple</option><option value="green">Green</option></select></label>
            <label className="cms-field">Sort Order<input value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} type="number" min={0} /></label>
            <label className="cms-field cms-field--wide">Featured Label<input value={form.featuredLabel} onChange={(event) => setField("featuredLabel", event.target.value)} placeholder="FEATURED VOICE" /></label>
            <label className="cms-field cms-field--wide">Tags<input value={form.tags} onChange={(event) => setField("tags", event.target.value)} placeholder="ANALYTICAL THINKING, CLIENT ALIGNMENT" /></label>
            <label className="cms-field">Status<select value={form.status} onChange={(event) => setField("status", event.target.value as TestimonialRow["status"])}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="IN_REVIEW">In Review</option><option value="SCHEDULED">Scheduled</option><option value="ARCHIVED">Archived</option></select></label>
            <label className="cms-experience-check"><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} /><Star size={14} />Featured voice</label>
          </div>

          {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
          {notice && <p className="cms-form-message">{notice}</p>}
          {form.id && <button className="cms-experience-archive" type="button" onClick={archiveCurrent} disabled={saving}><Archive size={15} />Archive this testimonial</button>}
        </form>
      </div>
    </div>
  );
}
