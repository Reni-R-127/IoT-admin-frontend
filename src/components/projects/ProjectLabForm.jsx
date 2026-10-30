import {useEffect,useState} from "react";
import MediaPicker from "../common/MediaPicker";
import "./ProjectLabForm.css";
const blank={title:"",description:"",category:"",image:"",videoUrl:"",technologies:"",active:true};
export default function ProjectLabForm({initialData,onSubmit,onCancel,saving}){
 const [form,setForm]=useState(blank);
 useEffect(()=>setForm(initialData?{...blank,...initialData,technologies:Array.isArray(initialData.technologies)?initialData.technologies.join("\n"):initialData.technologies||""}:blank),[initialData]);
 const change=(k,v)=>setForm(p=>({...p,[k]:v}));
 function submit(e){e.preventDefault();onSubmit({...form,title:form.title.trim(),technologies:form.technologies.split("\n").map(x=>x.trim()).filter(Boolean)});}
 return <form className="admin-form project-form" onSubmit={submit}><h2>{initialData?"Edit project":"Create project"}</h2>
 <label className="field">Project title *<input required value={form.title} onChange={e=>change("title",e.target.value)} placeholder="Smart irrigation system"/></label>
 <label className="field">Category<input value={form.category} onChange={e=>change("category",e.target.value)} placeholder="IoT / Robotics"/></label>
 <label className="field wide">Description<textarea required rows="4" value={form.description} onChange={e=>change("description",e.target.value)} placeholder="Describe this project"/></label>
 <MediaPicker label="Project image" value={form.image} onChange={v=>change("image",v)}/>
 <MediaPicker label="Project video (upload or YouTube / Instagram / video URL)" kind="video" accept="video/*" value={form.videoUrl} onChange={v=>change("videoUrl",v)}/>
 <label className="field wide">Technologies (one per line)<textarea rows="3" value={form.technologies} onChange={e=>change("technologies",e.target.value)} placeholder={"ESP32\nArduino\nReact"}/></label>
 <label className="field checkbox-field wide"><input type="checkbox" checked={!!form.active} onChange={e=>change("active",e.target.checked)}/> Active project</label>
 <div className="admin-form__actions"><button disabled={saving}>{saving?"Saving…":initialData?"Save changes":"Create project"}</button><button type="button" onClick={onCancel} disabled={saving}>Cancel</button></div></form>;
}
