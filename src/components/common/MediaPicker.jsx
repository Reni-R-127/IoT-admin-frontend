import { useState } from "react";
import { adminRequest } from "../../services/adminApi";
import "./MediaPicker.css";
export default function MediaPicker({label="Image",value="",onChange,accept="image/*",kind="image"}){
 const [uploading,setUploading]=useState(false); const [error,setError]=useState("");
 async function upload(file){
  if(!file)return;
  const max=kind==="video"?250*1024*1024:15*1024*1024;
  if(file.size>max){setError(`File is too large. Maximum size is ${kind==="video"?"250 MB":"15 MB"}.`);return;}
  setUploading(true);setError("");
  try{
   const body=new FormData();body.append("file",file);body.append("kind",kind);
   const result=await adminRequest("/media/upload",{method:"POST",body});
   const url=result.url||result.media?.url||result.data?.url;
   if(!url)throw new Error("Upload endpoint did not return a media URL.");
   onChange(url);
  }catch(e){setError(e.message||"Upload failed. Configure the backend media upload endpoint.");}
  finally{setUploading(false);}
 }
 return <div className="media-picker field wide">
  <span>{label}</span>
  <div className="media-picker__tabs">
   <label className="media-picker__upload">{uploading?"Uploading…":"Upload from device"}<input type="file" accept={accept} disabled={uploading} onChange={e=>upload(e.target.files?.[0])}/></label>
   <span className="media-picker__or">or paste a URL</span>
  </div>
  <input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={kind==="video"?"YouTube, Instagram, Vimeo or direct video URL":"Image URL"} />
  {value && kind==="image" && <img className="media-picker__preview" src={value} alt="Media preview" onError={e=>e.currentTarget.style.display="none"} />}
  {value && kind==="video" && <p className="media-picker__hint">Saved video/social link: {value}</p>}
  {error&&<small className="media-picker__error">{error}</small>}
 </div>;
}
