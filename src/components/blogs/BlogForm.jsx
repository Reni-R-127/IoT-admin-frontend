import { useEffect,useState } from "react";
import { adminRequest } from "../../services/adminApi";
import MediaPicker from "../common/MediaPicker";
import "./BlogForm.css";
const blank={title:"",slug:"",category:"IoT",excerpt:"",content:"",image:"",published:false,publishedAt:""};
export default function BlogForm({blog,onCancel,onSaved}){
 const [form,setForm]=useState(blank);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 useEffect(()=>setForm(blog?{...blank,...blog,publishedAt:blog.publishedAt?String(blog.publishedAt).slice(0,10):""}:blank),[blog]);
 const change=(k,v)=>setForm(p=>({...p,[k]:v}));
 async function submit(e){e.preventDefault();setSaving(true);setError("");try{const payload={...form,title:form.title.trim(),slug:(form.slug||form.title).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};const id=blog?._id||blog?.id;await adminRequest(id?`/blogs/${id}`:"/blogs",{method:id?"PUT":"POST",body:JSON.stringify(payload)});onSaved?.(id?"Blog updated successfully.":"Blog created successfully.");}catch(err){setError(err.message||"Unable to save blog.");}finally{setSaving(false)}}
 return <form className="admin-form blog-form" onSubmit={submit}><h2>{blog?"Edit blog post":"Create blog post"}</h2>{error&&<div className="alert error-alert wide">{error}</div>}
 <label className="field">Title *<input required value={form.title} onChange={e=>change("title",e.target.value)} placeholder="Article title"/></label>
 <label className="field">Slug<input value={form.slug} onChange={e=>change("slug",e.target.value)} placeholder="article-title"/></label>
 <label className="field">Category<input value={form.category} onChange={e=>change("category",e.target.value)} placeholder="IoT"/></label>
 <label className="field">Publish date<input type="date" value={form.publishedAt} onChange={e=>change("publishedAt",e.target.value)}/></label>
 <label className="field wide">Excerpt<textarea rows="2" value={form.excerpt} onChange={e=>change("excerpt",e.target.value)} placeholder="Short article summary"/></label>
 <label className="field wide">Article content *<textarea rows="9" required value={form.content} onChange={e=>change("content",e.target.value)} placeholder="Write the full article here"/></label>
 <MediaPicker label="Cover image" value={form.image} onChange={v=>change("image",v)}/>
 <label className="field checkbox-field wide"><input type="checkbox" checked={!!form.published} onChange={e=>change("published",e.target.checked)}/> Publish this post</label>
 <div className="admin-form__actions"><button disabled={saving}>{saving?"Saving…":blog?"Save changes":"Create blog"}</button><button type="button" onClick={onCancel}>Cancel</button></div></form>;
}
