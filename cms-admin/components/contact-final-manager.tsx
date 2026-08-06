"use client";

import { Check, ExternalLink, FileText, Link2, RefreshCw, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";

type ContactLinkAccent = "blue" | "light" | "green";

export type ContactFinalContent = {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  availabilityLabel: string;
  availabilityLocation: string;
  availabilityDotUrl: string;
  ambientOrbUrl: string;
  links: Array<{
    number: string;
    label: string;
    title: string;
    detail: string;
    url: string;
    accent: ContactLinkAccent;
    openInNewTab: boolean;
  }>;
  openToLabel: string;
  openTo: string;
  copyright: string;
  footerStatement: string;
  backToTopLabel: string;
};

export type ContactFinalSection = {
  id: string;
  type: string;
  name: string | null;
  content: ContactFinalContent;
};

type LinkForm = ContactFinalContent["links"][number];

type FormState = Omit<ContactFinalContent, "headlineLines" | "links"> & {
  headlineLines: string;
  links: LinkForm[];
};

function toForm(content: ContactFinalContent): FormState {
  return {
    ...content,
    headlineLines: content.headlineLines.join("\n"),
    links: content.links.length ? content.links : [],
  };
}

function toContent(form: FormState): ContactFinalContent {
  return {
    ...form,
    headlineLines: form.headlineLines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    links: form.links.map((link, index) => ({
      ...link,
      number: link.number || String(index + 1).padStart(2, "0"),
      openInNewTab: Boolean(link.openInNewTab),
    })),
  };
}

export function ContactFinalManager({
  section,
  fallbackContent,
}: {
  section: ContactFinalSection | null;
  fallbackContent: ContactFinalContent;
}) {
  const initialForm = useMemo(() => toForm(section?.content ?? fallbackContent), [fallbackContent, section?.content]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setLink(index: number, patch: Partial<LinkForm>) {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link
      ),
    }));
  }

  function addLink() {
    setForm((current) => ({
      ...current,
      links: [
        ...current.links,
        {
          number: String(current.links.length + 1).padStart(2, "0"),
          label: "LINK",
          title: "NEW LINK",
          detail: "",
          url: "",
          accent: "blue",
          openInNewTab: true,
        },
      ],
    }));
  }

  function removeLink(index: number) {
    setForm((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index),
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    if (!section?.id) {
      setError("Contact final section was not found on the homepage.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/pages/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: toContent(form) }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to save contact final section.");
        return;
      }
      setNotice("Contact final section saved. Public frontend will use the updated content.");
    } catch {
      setError("CMS API is unavailable. Start backend service and try again.");
    } finally {
      setSaving(false);
    }
  }

  const cvLink = form.links.find((link) =>
    /cv|resume/i.test(`${link.label} ${link.title} ${link.detail}`)
  );

  return (
    <form className="cms-experience cms-contact-final" onSubmit={save}>
      <section className="cms-module-summary cms-experience-summary">
        <div><span className="overview-tone overview-tone--purple"><FileText size={19} /></span><p><small>Section</small><strong>{form.sectionNumber}</strong></p></div>
        <div><i className="is-blue" /><p><small>Links</small><strong>{form.links.length}</strong></p></div>
        <div><i className="is-green" /><p><small>CV PDF</small><strong>{cvLink?.url ? "SET" : "EMPTY"}</strong></p></div>
        <button className="cms-module-primary" type="submit" disabled={saving || !section?.id}>{saving ? <Check size={16} /> : <Save size={16} />}{saving ? "Saving" : "Save Section"}</button>
      </section>

      <div className="cms-contact-final-grid">
        <section className="cms-module-card cms-experience-editor">
          <header className="cms-module-card__header">
            <div><h2>Statement Content</h2><p>Headline, intro, availability, and footer copy.</p></div>
            <button className="cms-secondary-action" type="button" onClick={() => window.location.reload()}><RefreshCw size={15} />Reload</button>
          </header>
          <div className="cms-experience-form cms-contact-final-form">
            <label className="cms-field">Section Number<input value={form.sectionNumber} onChange={(event) => setField("sectionNumber", event.target.value)} /></label>
            <label className="cms-field">Section Label<input value={form.sectionLabel} onChange={(event) => setField("sectionLabel", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Headline Lines<textarea value={form.headlineLines} onChange={(event) => setField("headlineLines", event.target.value)} rows={4} placeholder={"LET'S BUILD\nSOMETHING\nMEANINGFUL."} /></label>
            <label className="cms-field cms-field--wide">Intro<textarea value={form.intro} onChange={(event) => setField("intro", event.target.value)} rows={5} /></label>
            <label className="cms-field">Availability Label<input value={form.availabilityLabel} onChange={(event) => setField("availabilityLabel", event.target.value)} /></label>
            <label className="cms-field">Availability Location<input value={form.availabilityLocation} onChange={(event) => setField("availabilityLocation", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Availability Dot URL<input value={form.availabilityDotUrl} onChange={(event) => setField("availabilityDotUrl", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Ambient Orb URL<input value={form.ambientOrbUrl} onChange={(event) => setField("ambientOrbUrl", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Open To<input value={form.openTo} onChange={(event) => setField("openTo", event.target.value)} /></label>
            <label className="cms-field">Open To Label<input value={form.openToLabel} onChange={(event) => setField("openToLabel", event.target.value)} /></label>
            <label className="cms-field">Back To Top Label<input value={form.backToTopLabel} onChange={(event) => setField("backToTopLabel", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Copyright<input value={form.copyright} onChange={(event) => setField("copyright", event.target.value)} /></label>
            <label className="cms-field cms-field--wide">Footer Statement<input value={form.footerStatement} onChange={(event) => setField("footerStatement", event.target.value)} /></label>
          </div>
          {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
          {notice && <p className="cms-form-message">{notice}</p>}
        </section>

        <section className="cms-module-card cms-contact-final-links">
          <header className="cms-module-card__header">
            <div><h2>Contact Links</h2><p>Set email, CV PDF, LinkedIn, GitHub, or any profile URL.</p></div>
            <button className="cms-secondary-action" type="button" onClick={addLink}><Link2 size={15} />Add Link</button>
          </header>
          <div className="cms-contact-link-list">
            {form.links.map((link, index) => (
              <div className="cms-contact-link-card" key={`${link.number}-${index}`}>
                <div className="cms-contact-link-card__top">
                  <strong>{link.number || String(index + 1).padStart(2, "0")}</strong>
                  <span>{link.label || "LINK"}</span>
                  <button type="button" onClick={() => removeLink(index)}>Remove</button>
                </div>
                <div className="cms-experience-form cms-contact-link-form">
                  <label className="cms-field">Number<input value={link.number} onChange={(event) => setLink(index, { number: event.target.value })} /></label>
                  <label className="cms-field">Label<input value={link.label} onChange={(event) => setLink(index, { label: event.target.value })} placeholder="RESUME" /></label>
                  <label className="cms-field cms-field--wide">Title<input value={link.title} onChange={(event) => setLink(index, { title: event.target.value })} placeholder="VIEW MY CV" /></label>
                  <label className="cms-field cms-field--wide">Detail<input value={link.detail} onChange={(event) => setLink(index, { detail: event.target.value })} placeholder="PDF / PROFESSIONAL PROFILE" /></label>
                  <label className="cms-field cms-field--wide">URL<input value={link.url} onChange={(event) => setLink(index, { url: event.target.value })} placeholder="/cv-luthfi-arzaki.pdf" /></label>
                  <label className="cms-field">Accent<select value={link.accent} onChange={(event) => setLink(index, { accent: event.target.value as ContactLinkAccent })}><option value="blue">Blue</option><option value="light">Light</option><option value="green">Green</option></select></label>
                  <label className="cms-experience-check"><input type="checkbox" checked={link.openInNewTab} onChange={(event) => setLink(index, { openInNewTab: event.target.checked })} />Open in new tab</label>
                </div>
                {link.url && (
                  <a className="cms-contact-link-preview" href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Preview link</a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </form>
  );
}
