"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { FileText, Image as ImageIcon, RefreshCw, Search, UploadCloud, Video } from "lucide-react";
import { apiUrl } from "../lib/api";

type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER";
type MediaAsset = {
  id: string; type: MediaType; filename: string; originalName: string; url: string;
  mimeType: string; size: number; width: number | null; height: number | null;
  duration: number | null; altText: string | null; caption: string | null;
  createdAt: string; updatedAt: string;
};
type Draft = { altText: string; caption: string };
const initialDraft = (asset: MediaAsset): Draft => ({ altText: asset.altText ?? "", caption: asset.caption ?? "" });

function readableSize(size: number) {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

export function MediaLibrary({ writesAllowed }: { writesAllowed: boolean }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  async function loadAssets(search = query, filter = type) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", page: "1" });
      if (search.trim()) params.set("q", search.trim());
      if (filter !== "ALL") params.set("type", filter);
      const response = await fetch(apiUrl + "/api/v1/admin/media?" + params.toString(), { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Media library could not be loaded.");
        return;
      }
      const rows = (body.data ?? []) as MediaAsset[];
      setAssets(rows);
      setTotal(body.meta?.total ?? rows.length);
      setDrafts(Object.fromEntries(rows.map((asset) => [asset.id, initialDraft(asset)])));
    } catch {
      setError("Media service is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAssets("", "ALL"); }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchText);
    void loadAssets(searchText, type);
  }

  function changeDraft(id: string, key: keyof Draft, value: string) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { altText: "", caption: "" }), [key]: value },
    }));
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Maximum file size is 10 MB.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(apiUrl + "/api/v1/admin/media/upload", {
        method: "POST", credentials: "include", body: formData,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Upload failed.");
        return;
      }
      setMessage("File uploaded to the media library.");
      await loadAssets(query, type);
    } catch {
      setError("Upload service is unavailable.");
    } finally {
      setUploading(false);
    }
  }

  async function saveMetadata(asset: MediaAsset) {
    const draft = drafts[asset.id] ?? initialDraft(asset);
    setSavingId(asset.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(apiUrl + "/api/v1/admin/media/" + asset.id + "/metadata", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: draft.altText, caption: draft.caption }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Metadata could not be saved.");
        return;
      }
      const updated = body.data as MediaAsset;
      setAssets((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDrafts((current) => ({ ...current, [updated.id]: initialDraft(updated) }));
      setMessage("Alt text and caption saved.");
    } catch {
      setError("Media service is unavailable.");
    } finally {
      setSavingId("");
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Asset URL copied.");
    } catch {
      setError("The browser did not allow copying this URL.");
    }
  }

  return (
    <div className="cms-module-body cms-media-page">
      {!writesAllowed && <div className="cms-readonly-notice"><strong>Preview is read-only</strong><span>Uploads and metadata saves are disabled here because Preview uses the production database environment.</span></div>}
      <section className="cms-module-summary cms-media-summary">
        <div><span className="cms-media-summary__icon"><ImageIcon size={18} /></span><p><small>Assets in library</small><strong>{total}</strong></p></div>
        <div><span className="cms-media-summary__icon"><UploadCloud size={18} /></span><p><small>Upload limit</small><strong>10 MB</strong></p></div>
        <div className="cms-module-note"><strong>Reusable portfolio assets</strong><span>Search files, copy asset URLs, and maintain accessibility metadata.</span></div>
      </section>

      <section className="cms-module-card cms-media-card">
        <header className="cms-module-card__header">
          <div><h2>Media Library</h2><p>Images, videos, and documents already stored in the portfolio bucket.</p></div>
          <label className={"cms-media-upload" + ((!writesAllowed || uploading) ? " is-disabled" : "")}>
            <UploadCloud size={16} /> {uploading ? "Uploading…" : "Upload file"}
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4" disabled={!writesAllowed || uploading} onChange={uploadFile} />
          </label>
        </header>

        <form className="cms-media-tools" onSubmit={submitSearch}>
          <label className="cms-media-search"><Search size={16} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search filename, alt text, caption…" /></label>
          <select aria-label="Filter media type" value={type} onChange={(event) => { setType(event.target.value); void loadAssets(query, event.target.value); }}>
            <option value="ALL">All types</option><option value="IMAGE">Images</option><option value="VIDEO">Videos</option><option value="DOCUMENT">Documents</option><option value="OTHER">Other</option>
          </select>
          <button type="submit">Search</button>
          <button type="button" className="cms-media-refresh" onClick={() => void loadAssets(query, type)} aria-label="Refresh media"><RefreshCw size={15} /></button>
        </form>

        {message && <p className="cms-inline-message is-success" role="status">{message}</p>}
        {error && <p className="cms-inline-message is-error" role="alert">{error}</p>}
        {loading ? <div className="cms-media-empty">Loading media library…</div> : assets.length === 0 ? (
          <div className="cms-media-empty"><ImageIcon size={28} /><strong>No matching assets</strong><span>Try a different search or upload a new file in a writable environment.</span></div>
        ) : (
          <div className="cms-media-grid">
            {assets.map((asset) => {
              const draft = drafts[asset.id] ?? initialDraft(asset);
              return (
                <article className="cms-media-asset" key={asset.id}>
                  <div className="cms-media-preview">
                    {asset.type === "IMAGE" ? <img src={asset.url} alt={asset.altText || asset.originalName} loading="lazy" /> :
                      asset.type === "VIDEO" ? <video src={asset.url} controls preload="metadata" /> :
                      <span className="cms-media-file-icon">{asset.type === "DOCUMENT" ? <FileText size={30} /> : <Video size={30} />}</span>}
                  </div>
                  <div className="cms-media-asset__body">
                    <div className="cms-media-asset__title"><strong title={asset.originalName}>{asset.originalName}</strong><span>{readableSize(asset.size)} · {asset.type.toLowerCase()}</span></div>
                    <label>Alt text<input maxLength={250} value={draft.altText} disabled={!writesAllowed} onChange={(event) => changeDraft(asset.id, "altText", event.target.value)} placeholder="Describe this image for accessibility" /></label>
                    <label>Caption<textarea maxLength={500} rows={2} value={draft.caption} disabled={!writesAllowed} onChange={(event) => changeDraft(asset.id, "caption", event.target.value)} placeholder="Optional caption" /></label>
                    <div className="cms-media-asset__actions"><button type="button" onClick={() => void copyUrl(asset.url)}>Copy URL</button><button type="button" disabled={!writesAllowed || savingId === asset.id} onClick={() => void saveMetadata(asset)}>{savingId === asset.id ? "Saving…" : "Save metadata"}</button></div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="cms-media-footnote">Files are not deleted from this library, protecting media references already used on published pages and projects.</p>
      </section>
    </div>
  );
}
