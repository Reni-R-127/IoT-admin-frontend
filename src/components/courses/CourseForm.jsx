import { useEffect, useState } from "react";
import { adminRequest } from "../../services/adminApi";
import MediaPicker from "../common/MediaPicker";
import "./CourseForm.css";
const blank={title:"",slug:"",description:"",ageRange:"",duration:"",level:"Beginner",price:"",image:"",active:true};
export default function CourseForm({course,onCancel,onSaved}){
 const [form,setForm]=useState(blank);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{setForm(course?{...blank,...course,price:course.price??""}:blank)},[course]);
 const change=(key,value)=>setForm(p=>({...p,[key]:value}));
 async function submit(e){e.preventDefault();setSaving(true);setError("");try{const payload={...form,title:form.title.trim(),slug:(form.slug||form.title).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};const id=course?._id||course?.id;await adminRequest(id?`/courses/${id}`:"/courses",{method:id?"PUT":"POST",body:JSON.stringify(payload)});onSaved?.(id?"Course updated successfully.":"Course created successfully.");}catch(err){setError(err.message||"Unable to save course.");}finally{setSaving(false)}}
 return <form className="admin-form course-form" onSubmit={submit}><h2>{course?"Edit course":"Create course"}</h2>{error&&<div className="alert error-alert wide">{error}</div>}
 <label className="field">Course title *<input required value={form.title} onChange={e=>change("title",e.target.value)} placeholder="e.g. Junior Robotics"/></label>
 <label className="field">Slug<input value={form.slug} onChange={e=>change("slug",e.target.value)} placeholder="junior-robotics"/></label>
 <label className="field">Age range<input value={form.ageRange} onChange={e=>change("ageRange",e.target.value)} placeholder="8–12 years"/></label>
 <label className="field">Duration<input value={form.duration} onChange={e=>change("duration",e.target.value)} placeholder="6 weeks"/></label>
 <label className="field">Level<select value={form.level} onChange={e=>change("level",e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
 <label className="field">Price<input value={form.price} onChange={e=>change("price",e.target.value)} placeholder="₹ 3000"/></label>
 <label className="field wide">Description<textarea rows="4" value={form.description} onChange={e=>change("description",e.target.value)} placeholder="Course details"/></label>
 <MediaPicker label="Course image" value={form.image} onChange={v=>change("image",v)}/>
 <label className="field checkbox-field wide"><input type="checkbox" checked={!!form.active} onChange={e=>change("active",e.target.checked)}/> Published / active</label>
 <div className="admin-form__actions"><button disabled={saving}>{saving?"Saving…":course?"Save changes":"Create course"}</button><button type="button" onClick={onCancel}>Cancel</button></div></form>;
}
