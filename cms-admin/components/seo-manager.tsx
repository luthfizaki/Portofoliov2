"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Search, ShieldCheck, Sparkles } from "lucide-react";
import { apiUrl } from "../lib/api";

type SeoValues = {
  title: string | null; description: string | null; canonical: string | null;
  ogTitle: string | null; ogDescription: string | null; ogImageUrl: string | null;
  noIndex: boolean; noFollow: boolean;
};
type SeoItem = {
  entityType: "page" | "project"; id: string; name: string; slug: string; status: string;
  updatedAt: string; visibility?: string; seo: SeoValues | null;
};
type Draft = {
  title: string; description: string; canonical: string; ogTitle: string;
  ogDescription: string; ogImageUrl: string; noIndex: boolean; noFollow: boolean;
};
const toDraft = (seo: SeoValues | null | undefined): Draft => ({
  title: seo?.title ?? "", description: seo?.description ?? "", canonical: seo?.canonical ?? "",
  ogTitle: seo?.ogTitle ?? "", ogDescription: seo?.ogDescription ?? "", ogImageUrl: seo?.ogImageUrl ?? "",
  noIndex: seo?.noIndex ?? false, noFollow: seo?.noFollow ?? false,
});
const itemKey = (item: SeoItem) => item.entityType + ":" + item.id;

export function SeoManager({ initialItems, writesAllowed }: { initialItems: SeoItem[]; writesAllowed: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [selectedKey, setSelectedKey] = useState(initialItems[0] ? itemKey(initialItems[0]) : "");
  const [draft, setDraft] = useState<Draft>(() => toDraft(initialItems[0]?.seo));
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = items.find((item) => itemKey(item) === selectedKey) ?? null;
  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesType = filter === "all" || item.entityType === filter;
    const q = searchText.trim().toLowerCase();
    const matchesText = !q || (item.name + " " + item.slug).toLowerCase().includes(q);
    return matchesType && matchesText;
  }), [items, filter, searchText]);

  useEffect(() => {
    setDraft(toDraft(selected?.seo));
    setMessage("");
    setError("");
  }, [selectedKey]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(apiUrl + "/api/v1/admin/seo/" + selected.entityType + "/" + selected.id, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "SEO metadata could not be saved.");
        return;
      }
      const seo = body.data.seo as SeoValues;
      setItems((current) => current.map((item) => itemKey(item) === selectedKey ? { ...item, seo, updatedAt: new Date().toISOString() } : item));
      setMessage("SEO metadata saved.");
    } catch {
      setError("SEO service is unavailable.");
    } finally {
      setSaving(false);
    }
  }

  function setText(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="cms-module-body cms-seo-page">
      {!writesAllowed && <div className="cms-readonly-notice"><strong>Preview is read-only</strong><span>SEO changes are disabled here because Preview uses the production database environment.</span></div>}
      <section className="cms-module-summary cms-seo-summary">
        <div><span className="cms-seo-summary__icon"><Search size={18} /></span><p><small>Pages and projects</small><strong>{items.length}</strong></p></div>
        <div><span className="cms-seo-summary__icon"><ShieldCheck size={18} /></span><p><small>No-index rules</small><strong>{items.filter((item) => item.seo?.noIndex).length}</strong></p></div>
        <div className="cms-module-note"><strong>Search appearance</strong><span>Set page titles, descriptions, canonical URLs, and Open Graph sharing metadata.</span></div>
      </section>

      <div className="cms-seo-layout">
        <section className="cms-module-card cms-seo-list">
          <header className="cms-module-card__header"><div><h2>Content inventory</h2><p>Select a page or case study to edit SEO.</p></div></header>
          <label className="cms-media-search cms-seo-search"><Search size={16} /><input aria-label="Search SEO inventory" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search content…" /></label>
          <div className="cms-seo-filters">
            {["all", "page", "project"].map((value) => <button type="button" key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All content" : value === "page" ? "Pages" : "Projects"}</button>)}
          </div>
          <div className="cms-seo-items">
            {filteredItems.map((item) => (
              <button type="button" className={"cms-seo-item" + (itemKey(item) === selectedKey ? " is-selected" : "")} key={itemKey(item)} onClick={() => setSelectedKey(itemKey(item))}>
                <span><b>{item.entityType === "page" ? "PAGE" : "PROJECT"}</b><strong>{item.name}</strong><small>/{item.slug}</small></span>
                <em>{item.seo?.title ? "Configured" : "Not set"}</em>
              </button>
            ))}
            {!filteredItems.length && <div className="cms-seo-empty">No matching content was found.</div>}
          </div>
        </section>

        <section className="cms-module-card cms-seo-editor">
          {!selected ? (
            <div className="cms-seo-empty cms-seo-empty--large"><Sparkles size={26} /><strong>No pages or projects found</strong><span>Create or restore content before adding SEO metadata.</span></div>
          ) : (
            <>
              <header className="cms-module-card__header"><div><h2>SEO settings</h2><p>{selected.name} · /{selected.slug}</p></div><span className="cms-seo-status">{selected.status.replaceAll("_", " ")}</span></header>
              <form className="cms-seo-form" onSubmit={save}>
                {message && <p className="cms-inline-message is-success" role="status">{message}</p>}
                {error && <p className="cms-inline-message is-error" role="alert">{error}</p>}
                <fieldset disabled={!writesAllowed || saving}>
                  <div className="cms-seo-field"><label htmlFor="seo-title">SEO title <span>{draft.title.length}/70</span></label><input id="seo-title" maxLength={70} value={draft.title} onChange={(event) => setText("title", event.target.value)} placeholder="Title shown in search results" /><small>Keep it descriptive and close to 50–60 characters where possible.</small></div>
                  <div className="cms-seo-field"><label htmlFor="seo-description">Meta description <span>{draft.description.length}/320</span></label><textarea id="seo-description" rows={3} maxLength={320} value={draft.description} onChange={(event) => setText("description", event.target.value)} placeholder="A concise summary of the page" /></div>
                  <div className="cms-seo-field"><label htmlFor="seo-canonical">Canonical URL</label><input id="seo-canonical" type="url" value={draft.canonical} onChange={(event) => setText("canonical", event.target.value)} placeholder="https://lyzastudio.my.id/…" /><small>Use an absolute HTTP or HTTPS URL. Leave empty to clear.</small></div>
                  <div className="cms-seo-divider"><strong>Social sharing</strong><span>Open Graph metadata</span></div>
                  <div className="cms-seo-field"><label htmlFor="seo-og-title">Open Graph title <span>{draft.ogTitle.length}/70</span></label><input id="seo-og-title" maxLength={70} value={draft.ogTitle} onChange={(event) => setText("ogTitle", event.target.value)} placeholder="Optional share title" /></div>
                  <div className="cms-seo-field"><label htmlFor="seo-og-description">Open Graph description <span>{draft.ogDescription.length}/320</span></label><textarea id="seo-og-description" rows={3} maxLength={320} value={draft.ogDescription} onChange={(event) => setText("ogDescription", event.target.value)} placeholder="Optional share summary" /></div>
                  <div className="cms-seo-field"><label htmlFor="seo-og-image">Open Graph image URL</label><input id="seo-og-image" type="url" value={draft.ogImageUrl} onChange={(event) => setText("ogImageUrl", event.target.value)} placeholder="https://…/preview.jpg" /></div>
                  <div className="cms-seo-index-rules">
                    <label><input type="checkbox" checked={draft.noIndex} onChange={(event) => setDraft((current) => ({ ...current, noIndex: event.target.checked }))} /><span><strong>noindex</strong><small>Ask search engines not to index this page.</small></span></label>
                    <label><input type="checkbox" checked={draft.noFollow} onChange={(event) => setDraft((current) => ({ ...current, noFollow: event.target.checked }))} /><span><strong>nofollow</strong><small>Ask crawlers not to follow links on this page.</small></span></label>
                  </div>
                  <div className="cms-seo-actions"><button type="submit">{saving ? "Saving…" : "Save SEO settings"}</button></div>
                </fieldset>
              </form>
            </>
          )}
        </section>
      </div>
      <p className="cms-media-footnote">SEO settings are returned by the public API. Search crawlers will only receive these directives after the site renderer emits them in page metadata.</p>
    </div>
  );
}
