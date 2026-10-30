import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, ExternalLink, LoaderCircle, Plus, RefreshCw, Search, Star, Trash2, UploadCloud, Video, X, Play } from "lucide-react";
import { adminRequest } from "../../services/adminApi";
import "./StudentTestimonialsPage.css";

const EMPTY_FORM = { studentName: "", role: "", course: "", quote: "", videoUrl: "", thumbnailUrl: "", duration: "", published: true, sortOrder: 0 };
const getId = (item) => item?._id || item?.id;
const getName = (item) => item?.studentName || item?.name || "Student name";
function unwrapList(response) {
  if (Array.isArray(response)) return response;
  for (const key of ["testimonials", "items", "data", "results"]) if (Array.isArray(response?.[key])) return response[key];
  return [];
}
function getVideoEmbed(url = "") {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("instagram.com")) {
      const match = parsed.pathname.match(/\/(?:p|reel|tv)\/([^/]+)/);
      if (match) return `https://www.instagram.com/${parsed.pathname.split("/").filter(Boolean)[0]}/${match[1]}/embed/`;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
  } catch { /* Non-URL input: show the placeholder. */ }
  return "";
}
function VideoPreview({ item }) {
  const [playing, setPlaying] = useState(false);
  const url = item.videoUrl || item.video || item.url || "";
  const embed = getVideoEmbed(url);
  const thumbnail = item.thumbnailUrl || item.thumbnail || item.image || "";
  return <div className="testimonial-video">
    {playing && embed ? <iframe src={`${embed}?autoplay=1`} title={`${getName(item)} testimonial video`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      : playing && url ? <video src={url} controls autoPlay playsInline />
      : thumbnail ? <img src={thumbnail} alt={`${getName(item)} testimonial thumbnail`} />
      : <div className="testimonial-video__placeholder"><Video size={30} /><span>Video testimonial</span></div>}
    {!playing && <button type="button" className="testimonial-play" aria-label="Preview video" onClick={() => setPlaying(true)}><Play size={22} fill="currentColor" /></button>}
    {item.duration && <span className="testimonial-duration">{item.duration}</span>}
  </div>;
}

export default function StudentTestimonialsPage() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null); const [form, setForm] = useState(EMPTY_FORM);
  const loadTestimonials = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems(unwrapList(await adminRequest("/testimonials"))); }
    catch (err) { setError(`${err.message || "Could not load testimonials."} Confirm that the backend provides GET /api/admin/testimonials.`); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadTestimonials(); }, [loadTestimonials]);
  const filteredItems = useMemo(() => items.filter((item) => {
    const text = `${getName(item)} ${item.role || ""} ${item.course || ""} ${item.quote || item.message || ""}`.toLowerCase();
    const published = Boolean(item.published ?? item.approved ?? false);
    return text.includes(search.toLowerCase()) && (filter === "all" || (filter === "published" ? published : !published));
  }), [items, search, filter]);
  const publishedCount = items.filter((item) => Boolean(item.published ?? item.approved ?? false)).length;
  const setValue = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); setError(""); setNotice(""); }
  function openEdit(item) {
    setEditing(item); setForm({ ...EMPTY_FORM, studentName: item.studentName || item.name || "", role: item.role || "", course: item.course || item.kit || "", quote: item.quote || item.message || "", videoUrl: item.videoUrl || item.video || item.url || "", thumbnailUrl: item.thumbnailUrl || item.thumbnail || item.image || "", duration: item.duration || "", published: Boolean(item.published ?? item.approved ?? true), sortOrder: item.sortOrder ?? 0 });
    setShowForm(true); setError(""); setNotice("");
  }
  async function uploadAsset(event, key, kind) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const max = kind === "video" ? 250 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > max) { setError(`${kind === "video" ? "Video" : "Thumbnail"} is too large. Maximum size is ${kind === "video" ? "250 MB" : "15 MB"}.`); return; }
    setUploading(key); setError("");
    try {
      const body = new FormData(); body.append("file", file); body.append("kind", kind);
      const result = await adminRequest("/media/upload", { method: "POST", body });
      const url = result?.url || result?.media?.url || result?.data?.url;
      if (!url) throw new Error("Upload endpoint did not return a file URL.");
      setValue(key, url); setNotice(`${kind === "video" ? "Video" : "Thumbnail"} uploaded. Save the testimonial to store its details.`);
    } catch (err) { setError(`${err.message || "Upload failed."} Configure POST /api/admin/media/upload in the backend.`); }
    finally { setUploading(""); }
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.studentName.trim()) { setError("Student name is required."); return; }
    if (!form.videoUrl.trim()) { setError("Upload a video or paste a video/social link."); return; }
    setSaving(true); setError(""); setNotice("");
    const payload = { studentName: form.studentName.trim(), name: form.studentName.trim(), role: form.role.trim(), course: form.course.trim(), quote: form.quote.trim(), message: form.quote.trim(), videoUrl: form.videoUrl.trim(), thumbnailUrl: form.thumbnailUrl.trim(), duration: form.duration.trim(), published: Boolean(form.published), sortOrder: Number(form.sortOrder) || 0 };
    try {
      const id = getId(editing);
      await adminRequest(id ? `/testimonials/${id}` : "/testimonials", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      setShowForm(false); setEditing(null); setNotice(id ? "Student testimonial updated." : "Student testimonial created."); await loadTestimonials();
    } catch (err) { setError(`${err.message || "Could not save testimonial."} Confirm POST/PUT /api/admin/testimonials is implemented in the backend.`); }
    finally { setSaving(false); }
  }
  async function togglePublished(item) {
    const id = getId(item); const next = !Boolean(item.published ?? item.approved ?? false); setError(""); setNotice("");
    try { await adminRequest(`/testimonials/${id}`, { method: "PATCH", body: JSON.stringify({ published: next }) }); await loadTestimonials(); setNotice(next ? "Testimonial published." : "Testimonial moved to draft."); }
    catch (err) { setError(`${err.message || "Could not update status."} Confirm PATCH /api/admin/testimonials/:id is implemented.`); }
  }
  async function deleteItem(item) {
    if (!window.confirm(`Delete testimonial from ${getName(item)}? This cannot be undone.`)) return;
    setError(""); setNotice("");
    try { await adminRequest(`/testimonials/${getId(item)}`, { method: "DELETE" }); setItems((previous) => previous.filter((entry) => getId(entry) !== getId(item))); setNotice("Student testimonial deleted."); }
    catch (err) { setError(`${err.message || "Could not delete testimonial."} Confirm DELETE /api/admin/testimonials/:id is implemented.`); }
  }

  return <section className="page student-testimonials-page">
    <header className="page-heading testimonials-heading"><div><span className="eyebrow">WEBSITE CONTENT / STUDENT TESTIMONIALS</span><h1>Student Testimonials</h1><p>Manage the student video stories displayed on your website.</p></div><div className="testimonials-heading__actions"><button type="button" className="secondary-button" onClick={loadTestimonials}><RefreshCw size={15} /> Refresh</button><button type="button" className="primary-button" onClick={openCreate}><Plus size={16} /> Add testimonial</button></div></header>
    {error && <div className="alert error-alert" role="alert">{error}</div>}{notice && <div className="alert success-alert" role="status"><CheckCircle2 size={16} /> {notice}</div>}
    <div className="testimonial-stats"><div className="testimonial-stat"><span className="testimonial-stat__icon"><Video size={19} /></span><div><span>Total testimonials</span><strong>{items.length}</strong></div></div><div className="testimonial-stat"><span className="testimonial-stat__icon testimonial-stat__icon--green"><CheckCircle2 size={19} /></span><div><span>Published</span><strong>{publishedCount}</strong></div></div><div className="testimonial-stat"><span className="testimonial-stat__icon testimonial-stat__icon--blue"><Star size={19} /></span><div><span>Drafts</span><strong>{items.length - publishedCount}</strong></div></div></div>
    {showForm && <div className="testimonial-form-panel"><div className="testimonial-form-panel__header"><div><span className="eyebrow">TESTIMONIAL DETAILS</span><h2>{editing ? "Edit student testimonial" : "Add student testimonial"}</h2><p>Upload a video or use a YouTube, Instagram, or direct video link.</p></div><button className="icon-button" type="button" aria-label="Close form" onClick={() => setShowForm(false)}><X size={19} /></button></div>
      <form className="testimonial-form" onSubmit={handleSubmit}><div className="testimonial-form__grid">
        <label className="field"><span>Student name <b>*</b></span><input value={form.studentName} onChange={(e) => setValue("studentName", e.target.value)} placeholder="e.g. Karthik S" required /></label>
        <label className="field"><span>Student role / year</span><input value={form.role} onChange={(e) => setValue("role", e.target.value)} placeholder="e.g. II Year ECE Student" /></label>
        <label className="field"><span>Kit / course label</span><input value={form.course} onChange={(e) => setValue("course", e.target.value)} placeholder="e.g. IoT Kit" /></label>
        <label className="field"><span>Video duration label</span><input value={form.duration} onChange={(e) => setValue("duration", e.target.value)} placeholder="e.g. 02:18" /></label>
        <label className="field field--full"><span>Student quote</span><textarea rows="3" value={form.quote} onChange={(e) => setValue("quote", e.target.value)} placeholder="What did the student say about their learning experience?" /></label>
        <div className="field field--full testimonial-upload-field"><span>Video testimonial <b>*</b></span><div className="testimonial-upload-row"><label className="upload-file-button"><UploadCloud size={17} />{uploading === "videoUrl" ? "Uploading video…" : "Upload video file"}<input type="file" accept="video/*" disabled={Boolean(uploading)} onChange={(e) => uploadAsset(e, "videoUrl", "video")} /></label><span>or paste a link below</span></div><input value={form.videoUrl} onChange={(e) => setValue("videoUrl", e.target.value)} placeholder="YouTube, Instagram, Vimeo or direct video URL" required /><small>Maximum upload size: 250 MB. Direct uploads require backend storage to be configured.</small></div>
        <div className="field field--full testimonial-upload-field"><span>Video thumbnail (optional)</span><div className="testimonial-upload-row"><label className="upload-file-button upload-file-button--secondary"><UploadCloud size={17} />{uploading === "thumbnailUrl" ? "Uploading image…" : "Upload thumbnail"}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(e) => uploadAsset(e, "thumbnailUrl", "image")} /></label><span>or paste an image URL below</span></div><input value={form.thumbnailUrl} onChange={(e) => setValue("thumbnailUrl", e.target.value)} placeholder="https://example.com/student-thumbnail.jpg" />{form.thumbnailUrl && <img className="testimonial-thumbnail-preview" src={form.thumbnailUrl} alt="Thumbnail preview" onError={(e) => { e.currentTarget.style.display = "none"; }} />}</div>
        <label className="field"><span>Display order</span><input type="number" min="0" value={form.sortOrder} onChange={(e) => setValue("sortOrder", e.target.value)} /></label>
        <label className="testimonial-publish-toggle"><input type="checkbox" checked={form.published} onChange={(e) => setValue("published", e.target.checked)} /><span><strong>Publish on website</strong><small>Published testimonials can appear in the public section.</small></span></label>
      </div><div className="testimonial-form__footer"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving || Boolean(uploading)}>{saving ? <><LoaderCircle className="spin" size={16} /> Saving…</> : editing ? "Save changes" : "Create testimonial"}</button></div></form>
    </div>}
    <div className="testimonial-library-panel"><div className="testimonial-library-panel__heading"><div><h2>Video testimonials</h2><p>Manage the student stories and their website display status.</p></div><span className="testimonial-count-pill">{filteredItems.length} {filteredItems.length === 1 ? "record" : "records"}</span></div>
      <div className="testimonial-toolbar"><label className="testimonial-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students, courses or quotes…" /></label><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter testimonials"><option value="all">All testimonials</option><option value="published">Published</option><option value="draft">Drafts</option></select></div>
      {loading ? <div className="testimonial-loading"><LoaderCircle className="spin" size={22} /> Loading student testimonials…</div> : filteredItems.length === 0 ? <div className="testimonial-empty"><span><Video size={27} /></span><h3>{items.length ? "No matching testimonials" : "No student testimonials yet"}</h3><p>{items.length ? "Try another search or filter." : "Add a student's video, quote, name and course to start building this section."}</p>{!items.length && <button type="button" className="primary-button" onClick={openCreate}><Plus size={16} /> Add first testimonial</button>}</div> : <div className="testimonial-card-grid">{filteredItems.map((item) => {
        const isPublished = Boolean(item.published ?? item.approved ?? false);
        return <article className="testimonial-admin-card" key={getId(item)}><VideoPreview item={item} /><div className="testimonial-admin-card__body"><div className="testimonial-admin-card__status"><span className={`testimonial-status ${isPublished ? "is-published" : "is-draft"}`}>{isPublished ? "Published" : "Draft"}</span><span className="testimonial-kit">{item.course || item.kit || "Student story"}</span></div><p className="testimonial-quote">“{item.quote || item.message || "No student quote added yet."}”</p><div className="testimonial-student"><div className="testimonial-student__avatar">{getName(item).slice(0, 1).toUpperCase()}</div><div className="testimonial-student__details"><strong>{getName(item)}</strong><span>{item.role || "Student"}</span></div></div><div className="testimonial-card-actions"><button type="button" className="testimonial-action-edit" onClick={() => openEdit(item)}><Edit3 size={14} /> Edit</button><button type="button" className="testimonial-action-publish" onClick={() => togglePublished(item)}>{isPublished ? "Unpublish" : "Publish"}</button><button type="button" className="testimonial-action-delete" aria-label={`Delete testimonial from ${getName(item)}`} onClick={() => deleteItem(item)}><Trash2 size={15} /></button>{(item.videoUrl || item.video || item.url) && <a href={item.videoUrl || item.video || item.url} target="_blank" rel="noreferrer" aria-label="Open video link"><ExternalLink size={14} /></a>}</div></div></article>;
      })}</div>}
    </div>
  </section>;
}
