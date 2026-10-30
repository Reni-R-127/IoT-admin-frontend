import {useEffect,useState} from "react";
import {adminRequest} from "../../services/adminApi";
import "./StaffPage.css";
const perms=["overview","courses","blogs","pricing","projects","media","enquiries","notifications","reviews","staff","settings"];
const labels={overview:"Overview",courses:"Courses",blogs:"Blogs",pricing:"Pricing",projects:"Projects",media:"Media",enquiries:"Enquiries",notifications:"Notifications",reviews:"Reviews",staff:"Staff",settings:"Settings"};
const blank={name:"",email:"",role:"editor",permissions:["overview","courses","blogs","projects","media"],active:true};
export default function StaffPage(){
 const [staff,setStaff]=useState([]);const [form,setForm]=useState(blank);const [editing,setEditing]=useState(null);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await adminRequest("/staff");setStaff(Array.isArray(r)?r:r.staff||r.data||[])}catch(e){setError(e.message||"Unable to load staff. The backend /staff endpoints may not be implemented yet.")}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 function start(item){setEditing(item||null);setForm(item?{...blank,...item,permissions:item.permissions||[]}:blank);setNotice("");}
 function toggle(p){setForm(f=>({...f,permissions:f.permissions.includes(p)?f.permissions.filter(x=>x!==p):[...f.permissions,p]}))}
 async function save(e){e.preventDefault();setSaving(true);setError("");setNotice("");try{const id=editing?._id||editing?.id;await adminRequest(id?`/staff/${id}`:"/staff",{method:id?"PUT":"POST",body:JSON.stringify(form)});setNotice(id?"Staff member updated.":"Staff member created.");setEditing(null);setForm(blank);await load()}catch(e){setError(e.message||"Unable to save staff member. Configure protected /staff endpoints in backend.")}finally{setSaving(false)}}
 async function remove(item){if(!window.confirm(`Remove staff access for ${item.email}?`))return;try{await adminRequest(`/staff/${item._id||item.id}`,{method:"DELETE"});await load()}catch(e){setError(e.message||"Unable to remove staff member.")}}
 return <section className="page staff-page"><div className="page-heading"><div><span className="eyebrow">ACCESS CONTROL</span><h1>Staff & permissions</h1><p>Create staff accounts and assign least-privilege access by module.</p></div><button className="secondary-button" onClick={()=>start(null)}>+ Add staff</button></div>
 <div className="notice">Security: staff roles and permissions must be enforced by the backend on every request. Hiding a menu item in the frontend is not access control.</div>
 {error&&<div className="alert error-alert">{error}</div>}{notice&&<div className="alert success-alert">{notice}</div>}
 <div className="staff-layout"><div className="settings-card"><h2>{editing?"Edit staff member":"Add staff member"}</h2><form className="form-stack" onSubmit={save}>
 <label className="field">Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Staff name"/></label>
 <label className="field">Work email<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@company.com"/></label>
 <label className="field">Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="editor">Editor</option><option value="content_manager">Content manager</option><option value="support">Support</option><option value="admin">Admin</option></select></label>
 <div><strong className="permission-title">Module permissions</strong><div className="permission-list">{perms.map(p=><label className="permission-item" key={p}><input type="checkbox" checked={form.permissions.includes(p)} onChange={()=>toggle(p)}/>{labels[p]}</label>)}</div></div>
 <label className="permission-item"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Account active</label>
 <div className="staff-actions"><button className="primary-button" disabled={saving}>{saving?"Saving…":editing?"Save changes":"Create staff"}</button>{editing&&<button type="button" className="secondary-button" onClick={()=>start(null)}>Cancel</button>}</div></form></div>
 <div className="settings-card"><div className="panel-head"><div><h2>Staff directory</h2><p>{staff.length} staff records</p></div><button className="secondary-button" onClick={load}>Refresh</button></div>{loading?<p>Loading staff…</p>:staff.length===0?<div className="empty-media"><strong>No staff records</strong><p>Staff data will appear after backend support is enabled.</p></div>:<div className="table-wrapper"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{staff.map(s=><tr key={s._id||s.id}><td>{s.name}</td><td>{s.email}</td><td>{s.role}</td><td><span className="badge">{s.active===false?"Inactive":"Active"}</span></td><td><button onClick={()=>start(s)}>Edit</button><button onClick={()=>remove(s)}>Remove</button></td></tr>)}</tbody></table></div>}</div></div>
 </section>
}
