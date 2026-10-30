import {useState} from "react";
import {adminRequest} from "../../services/adminApi";
import MediaPicker from "../common/MediaPicker";
import "./MediaPage.css";
export default function MediaPage(){
 const [kind,setKind]=useState("image");const [url,setUrl]=useState("");const [title,setTitle]=useState("");const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");const [items,setItems]=useState([]);
 async function save(e){e.preventDefault();if(!url.trim()){setError("Upload a file or paste a URL first.");return}setSaving(true);setError("");setNotice("");try{const result=await adminRequest("/media",{method:"POST",body:JSON.stringify({title,kind,url})});setItems(p=>[result.media||result.data||result,...p]);setNotice("Media saved to the library.");setTitle("");setUrl("");}catch(err){setError(err.message||"Could not save media. Check that the backend media library endpoint is configured.");}finally{setSaving(false)}}
 return <section className="page media-page"><div className="page-heading"><div><span className="eyebrow">CONTENT / MEDIA LIBRARY</span><h1>Media library</h1><p>Upload images and videos, or save links from YouTube, Instagram and other platforms.</p></div></div>
 <div className="notice">File upload requires a backend storage endpoint at <code>POST /api/admin/media/upload</code>. Files should be stored in cloud/object storage; MongoDB should store the returned URL and metadata, not large video binaries.</div>
 {error&&<div className="alert error-alert">{error}</div>}{notice&&<div className="alert success-alert">{notice}</div>}
 <div className="settings-card media-upload-card"><h2>Add media</h2><p>Choose an image or video, upload a file, or paste an external link.</p>
 <div className="media-kind-tabs"><button type="button" className={kind==="image"?"selected":""} onClick={()=>{setKind("image");setUrl("")}}>Image</button><button type="button" className={kind==="video"?"selected":""} onClick={()=>{setKind("video");setUrl("")}}>Video / social link</button></div>
 <form className="form-stack" onSubmit={save}><label className="field">Asset title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Workshop highlights"/></label>
 <MediaPicker label={kind==="image"?"Image file or URL":"Video file or YouTube / Instagram / external URL"} kind={kind} accept={kind==="image"?"image/*":"video/*"} value={url} onChange={setUrl}/>
 <button className="primary-button" disabled={saving}>{saving?"Saving…":"Save to media library"}</button></form></div>
 <div className="settings-card"><h2>Recently added</h2>{items.length===0?<div className="empty-media"><span>▧</span><strong>No media added in this session</strong><p>Saved assets will appear here after the backend returns the media record.</p></div>:<div className="media-grid">{items.map((item,i)=><article className="media-card" key={item._id||i}>{item.kind==="video"?<video src={item.url} controls/>:<img src={item.url} alt={item.title||"Media asset"}/>}<div><strong>{item.title||"Untitled media"}</strong><p className="muted">{item.kind||kind}</p><a href={item.url} target="_blank" rel="noreferrer">Open asset ↗</a></div></article>)}</div>}</div>
 </section>
}
