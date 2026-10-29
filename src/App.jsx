import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, BookOpen, Newspaper, MessageSquare, Star, RefreshCw, Plus,
  Check, Trash2, ExternalLink, Tag, FlaskConical, Bell, Pencil, X, UploadCloud,
  Image as ImageIcon, CircleAlert, CheckCircle2, Eye, EyeOff
} from "lucide-react";

const API = "/api/admin";
const emptyForms = {
  courses: { title:"", slug:"", description:"", category:"IoT", ageRange:"", duration:"", level:"Beginner", price:"Contact us", active:true },
  blogs: { title:"", slug:"", category:"IoT", excerpt:"", content:"", published:false },
  pricing: { name:"", subtitle:"", price:"", duration:"", category:"Learning plan", description:"", features:"", active:true, sortOrder:0 },
  projects: { title:"", slug:"", category:"IoT", description:"", active:true },
};
const labels = {
  courses: "Courses", blogs: "Blog posts", pricing: "Pricing plans", projects: "Project lab",
  enquiries: "Enquiries", reviews: "Reviews", notifications: "Notifications",
};
const nav = [
  ["overview","Overview",LayoutDashboard],["courses","Courses",BookOpen],["blogs","Blog posts",Newspaper],
  ["pricing","Pricing",Tag],["projects","Project lab",FlaskConical],["enquiries","Enquiries",MessageSquare],
  ["notifications","Notifications",Bell],["reviews","Reviews",Star],
];
const slugify = (value) => String(value ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

// APIs may return an array directly or wrap it in { items: [...] }.
// Always give list components an array so .filter(), .map() and .slice() cannot crash.
const asArray = (value, ...keys) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
};

export default function App() {
  const [section,setSection] = useState("overview");
  const [stats,setStats] = useState(null);
  const [courses,setCourses] = useState([]);
  const [blogs,setBlogs] = useState([]);
  const [pricing,setPricing] = useState([]);
  const [projects,setProjects] = useState([]);
  const [enquiries,setEnquiries] = useState([]);
  const [reviews,setReviews] = useState([]);
  const [notifications,setNotifications] = useState([]);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  const [editor,setEditor] = useState(null);
  const [form,setForm] = useState({});
  const [imageFile,setImageFile] = useState(null);
  const [imagePreview,setImagePreview] = useState("");
  const [search,setSearch] = useState("");

  const req = useCallback(async (path,opts={}) => {
    const isForm = opts.body instanceof FormData;
    const response = await fetch(`${API}${path}`, {
      ...opts,
      headers: { ...(isForm ? {} : {"Content-Type":"application/json"}), ...opts.headers },
    });
    if (!response.ok) {
      const data = await response.json().catch(()=>({}));
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
  },[]);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [s,c,b,p,pr,e,r,n] = await Promise.all([
        req("/overview"),req("/courses"),req("/blogs"),req("/pricing"),req("/projects"),
        req("/enquiries"),req("/reviews"),req("/notifications"),
      ]);
      setStats(s && typeof s === "object" ? s : null);
      setCourses(asArray(c, "items", "courses"));
      setBlogs(asArray(b, "items", "blogs"));
      setPricing(asArray(p, "items", "pricing", "plans"));
      setProjects(asArray(pr, "items", "projects"));
      setEnquiries(asArray(e, "items", "enquiries"));
      setReviews(asArray(r, "items", "reviews"));
      setNotifications(asArray(n, "items", "notifications"));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  },[req]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ if(!notice) return; const t=setTimeout(()=>setNotice(""),3500); return ()=>clearTimeout(t); },[notice]);

  const openCreate = (kind) => {
    if (kind === "pricing" && pricing.length >= 3) { setError("You can manage a maximum of 3 pricing plans."); return; }
    setError("");setImageFile(null);setImagePreview("");setEditor({kind,id:null});
    setForm({...emptyForms[kind]});
  };
  const openEdit = (kind,item) => {
    setError("");setImageFile(null);setImagePreview(item.image || "");
    setEditor({kind,id:item._id});
    const f={...item};
    if(Array.isArray(f.features)) f.features=f.features.join("\n");
    setForm(f);
  };
  const closeEditor = () => { setEditor(null);setImageFile(null);setImagePreview(""); };
  const setField = (name,value) => {
    setForm(old=>{
      const next={...old,[name]:value};
      if(name==="title" && !editor?.id) next.slug=slugify(value);
      return next;
    });
  };
  const selectImage = (file) => {
    if(!file) return;
    if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)) { setError("Choose a JPG, PNG, WEBP or GIF image."); return; }
    if(file.size>3*1024*1024) { setError("Image must be 3 MB or smaller."); return; }
    setImageFile(file);setImagePreview(URL.createObjectURL(file));setError("");
  };
  const saveRecord = async (event) => {
    event.preventDefault(); if(!editor) return;
    setBusy(true);setError("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key,value])=>{
        if(key==="_id" || key==="__v" || key==="createdAt" || key==="updatedAt" || key==="image") return;
        if(key==="features") payload.append(key,Array.isArray(value)?value.join("\n"):value ?? "");
        else if(value!==undefined && value!==null) payload.append(key,typeof value==="boolean"?String(value):String(value));
      });
      if(imageFile) payload.append("imageFile",imageFile);
      const path=`/${editor.kind}${editor.id?`/${editor.id}`:""}`;
      await req(path,{method:editor.id?"PUT":"POST",body:payload});
      closeEditor();setNotice(`${labels[editor.kind]} saved successfully.`);await load();
    } catch(err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const act = async (fn,message) => {
    setError("");
    try { await fn(); setNotice(message || "Changes saved."); await load(); }
    catch(err) { setError(err.message); }
  };
  const removeRecord = (kind,item) => {
    if(!window.confirm(`Delete "${item.title || item.name}"? This cannot be undone.`)) return;
    act(()=>req(`/${kind}/${item._id}`,{method:"DELETE"}),"Record deleted.");
  };
  const filtered = (items,fields) => asArray(items).filter(item=>!search || fields.some(k=>String(item?.[k]??"").toLowerCase().includes(search.toLowerCase())));
  const unread = asArray(notifications).filter(n=>!n?.read).length;

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brandmark">TS</span><span><b>TechSprout</b><small>ADMIN CONTROL CENTER</small></span></div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={section===id?"nav active":"nav"} onClick={()=>{setSection(id);setSearch("");}}>
        <Icon size={18}/><span>{label}</span>{id==="notifications"&&unread>0&&<em>{unread}</em>}
      </button>)}</nav>
      <div className="sidefoot"><span className="statusdot"/><span>API connection</span><button onClick={load} aria-label="Refresh"><RefreshCw size={15}/></button></div>
    </aside>
    <main className="main">
      <header className="page-header">
        <div><p className="eyebrow">CONTROL CENTER / {section.toUpperCase()}</p><h1>{labels[section] || "Overview"}</h1><p className="muted">Manage live website content and incoming enquiries.</p></div>
        <div className="headeractions"><a href="http://localhost:5173" target="_blank" rel="noreferrer">View website <ExternalLink size={15}/></a><button className="refresh" onClick={load}><RefreshCw size={16}/>{busy?"Refreshing":"Refresh"}</button></div>
      </header>
      {error&&<div className="alert error"><CircleAlert size={18}/><span>{error}</span><button onClick={()=>setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
      {notice&&<div className="alert success"><CheckCircle2 size={18}/><span>{notice}</span></div>}

      {section==="overview"&&<Overview stats={stats} enquiries={enquiries} reviews={reviews} notifications={notifications} onGo={setSection}/>}
      {["courses","blogs","pricing","projects"].includes(section)&&<ContentSection kind={section} items={{courses,blogs,pricing,projects}[section]} onCreate={()=>openCreate(section)} onEdit={item=>openEdit(section,item)} onDelete={item=>removeRecord(section,item)} search={search} setSearch={setSearch}/>}
      {section==="enquiries"&&<Enquiries items={filtered(enquiries,["parentName","childName","course","email","phone","source","status"])} onStatus={(item,status)=>act(()=>req(`/enquiries/${item._id}`,{method:"PATCH",body:JSON.stringify({status})}),"Enquiry status updated.")}/>}
      {section==="notifications"&&<Notifications items={asArray(notifications)} onRead={(item)=>act(()=>req(`/notifications/${item._id}`,{method:"PATCH",body:JSON.stringify({read:!item.read})}),"Notification updated.")} onReadAll={()=>act(()=>req("/notifications/read-all",{method:"PATCH",body:JSON.stringify({})}),"All notifications marked as read.")}/>}
      {section==="reviews"&&<Reviews items={reviews} onToggle={item=>act(()=>req(`/reviews/${item._id}`,{method:"PATCH",body:JSON.stringify({approved:!item.approved})}),item.approved?"Review hidden from website.":"Review approved and published.")} onDelete={item=>{if(confirm("Delete this review?"))act(()=>req(`/reviews/${item._id}`,{method:"DELETE"}),"Review deleted.");}}/>}
      <footer className="footer">TechSprout Kids <span>Live content from MongoDB · No demo records</span></footer>
    </main>
    {editor&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeEditor();}}>
      <form className="editor-modal" onSubmit={saveRecord}>
        <div className="modal-head"><div><p className="eyebrow">{editor.id?"EDIT RECORD":"CREATE RECORD"}</p><h2>{editor.id?"Edit":"Add"} {labels[editor.kind]?.replace(/s$/,"")}</h2></div><button type="button" className="iconbtn" onClick={closeEditor} aria-label="Close"><X/></button></div>
        <div className="form-grid">
          {editor.kind==="courses"&&<>
            <Field label="Course title" value={form.title} onChange={v=>setField("title",v)} required/>
            <Field label="Slug" value={form.slug} onChange={v=>setField("slug",slugify(v))} required/>
            <Field label="Category" value={form.category} onChange={v=>setField("category",v)} required/>
            <Field label="Age range" value={form.ageRange} onChange={v=>setField("ageRange",v)}/>
            <Field label="Duration" value={form.duration} onChange={v=>setField("duration",v)}/>
            <Field label="Level" value={form.level} onChange={v=>setField("level",v)}/>
            <Field label="Price" value={form.price} onChange={v=>setField("price",v)}/>
            <TextArea label="Description" value={form.description} onChange={v=>setField("description",v)} required wide/>
            <Toggle label="Show on website" checked={!!form.active} onChange={v=>setField("active",v)}/>
          </>}
          {editor.kind==="blogs"&&<>
            <Field label="Blog title" value={form.title} onChange={v=>setField("title",v)} required/>
            <Field label="Slug" value={form.slug} onChange={v=>setField("slug",slugify(v))} required/>
            <Field label="Category" value={form.category} onChange={v=>setField("category",v)} required/>
            <TextArea label="Short description / excerpt" value={form.excerpt} onChange={v=>setField("excerpt",v)} required wide/>
            <TextArea label="Blog content" value={form.content} onChange={v=>setField("content",v)} required wide rows={7}/>
            <Toggle label="Publish on website" checked={!!form.published} onChange={v=>setField("published",v)}/>
          </>}
          {editor.kind==="pricing"&&<>
            <Field label="Plan name" value={form.name} onChange={v=>setField("name",v)} required/>
            <Field label="Subtitle" value={form.subtitle} onChange={v=>setField("subtitle",v)}/>
            <Field label="Price" value={form.price} onChange={v=>setField("price",v)} required/>
            <Field label="Duration" value={form.duration} onChange={v=>setField("duration",v)} required/>
            <Field label="Category" value={form.category} onChange={v=>setField("category",v)}/>
            <Field label="Display order" type="number" value={form.sortOrder} onChange={v=>setField("sortOrder",v)}/>
            <TextArea label="Description" value={form.description} onChange={v=>setField("description",v)} wide/>
            <TextArea label="Features (one per line)" value={form.features} onChange={v=>setField("features",v)} wide/>
            <Toggle label="Show on website" checked={!!form.active} onChange={v=>setField("active",v)}/>
          </>}
          {editor.kind==="projects"&&<>
            <Field label="Project title" value={form.title} onChange={v=>setField("title",v)} required/>
            <Field label="Slug" value={form.slug} onChange={v=>setField("slug",slugify(v))} required/>
            <Field label="Category" value={form.category} onChange={v=>setField("category",v)} required/>
            <TextArea label="Description" value={form.description} onChange={v=>setField("description",v)} required wide/>
            <Toggle label="Show on website" checked={!!form.active} onChange={v=>setField("active",v)}/>
          </>}
          <div className="upload-field wide"><label>Upload image <span>(JPG, PNG, WEBP or GIF · max 3 MB)</span></label><label className="upload-drop"><UploadCloud size={22}/><span>{imageFile?imageFile.name:"Choose image file"}</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>selectImage(e.target.files?.[0])}/></label>
            {imagePreview&&<div className="image-preview"><img src={imagePreview} alt="Selected preview"/><button type="button" className="iconbtn" onClick={()=>{setImageFile(null);setImagePreview("");setForm(old=>({...old,image:""}));}}><X size={15}/> Remove image</button></div>}
          </div>
        </div>
        <div className="modal-actions"><button type="button" className="secondary" onClick={closeEditor}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":editor.id?"Save changes":"Create record"}</button></div>
      </form>
    </div>}
  </div>;
}

function Field({label,value,onChange,type="text",required=false}) { return <label className="field"><span>{label}{required?" *":""}</span><input type={type} value={value??""} onChange={e=>onChange(e.target.value)} required={required}/></label>; }
function TextArea({label,value,onChange,required=false,wide=false,rows=3}) { return <label className={`field ${wide?"wide":""}`}><span>{label}{required?" *":""}</span><textarea rows={rows} value={value??""} onChange={e=>onChange(e.target.value)} required={required}/></label>; }
function Toggle({label,checked,onChange}) { return <label className="toggle-field"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>; }

function Overview({stats,enquiries,reviews,notifications,onGo}) {
  enquiries = asArray(enquiries); reviews = asArray(reviews); notifications = asArray(notifications);
  const cards=[["Courses",stats?.courses,BookOpen,"courses"],["Blog posts",stats?.blogs,Newspaper,"blogs"],["Active price plans",stats?.pricing,Tag,"pricing"],["Project lab",stats?.projects,FlaskConical,"projects"],["Enquiries",stats?.enquiries,MessageSquare,"enquiries"],["New enquiries",stats?.newEnquiries,Bell,"enquiries"],["Approved reviews",stats?.approvedReviews,Star,"reviews"],["Overall rating",stats?`${Number(stats.averageRating).toFixed(1)} / 5`:"—",Star,"reviews"]];
  return <><div className="stats">{cards.map(([label,value,Icon,dest])=><button className="stat" key={label} onClick={()=>onGo(dest)}><span className="staticon"><Icon size={18}/></span><p>{label}</p><strong>{value??"—"}</strong><small>View details <ExternalLink size={12}/></small></button>)}</div>
    <div className="dashboard-columns"><div className="panel"><PanelHead title="Recent enquiries" subtitle="Latest incoming website leads" action="View all" onClick={()=>onGo("enquiries")}/><DataTable rows={enquiries.slice(0,5)} columns={["parentName","course","source","status"]}/></div>
    <div className="panel"><PanelHead title="Recent notifications" subtitle="WhatsApp click tracking and form submissions" action="View all" onClick={()=>onGo("notifications")}/><DataTable rows={notifications.slice(0,5)} columns={["type","source","createdAt","read"]}/></div></div>
    <div className="panel"><PanelHead title="Reviews overview" subtitle="Approve genuine reviews before they appear publicly" action="Moderate" onClick={()=>onGo("reviews")}/><DataTable rows={reviews.slice(0,5)} columns={["name","rating","message","approved"]}/></div>
  </>;
}
function PanelHead({title,subtitle,action,onClick}) {return <div className="panelhead"><div><h2>{title}</h2><p>{subtitle}</p></div>{action&&<button className="textbtn" onClick={onClick}>{action} →</button>}</div>;}
function ContentSection({kind,items,onCreate,onEdit,onDelete,search,setSearch}) {
 items = asArray(items);
  const max=kind==="pricing"?3:null;
 const columns={courses:["title","category","ageRange","duration","price","active"],blogs:["title","category","published","createdAt"],pricing:["name","price","duration","category","active"],projects:["title","category","active","createdAt"]}[kind];
 return <div className="panel"><div className="panelhead"><div><h2>{labels[kind]} library</h2><p>{kind==="pricing"?"Maximum 3 active pricing plans.":"Create and edit real content stored in MongoDB."}</p></div><button className="primary" disabled={kind==="pricing"&&items.length>=3} onClick={onCreate}><Plus size={16}/> Add {kind==="pricing"?"plan":kind==="projects"?"project":kind==="blogs"?"blog":"course"}</button></div>
 <div className="toolbar"><input type="search" placeholder={`Search ${labels[kind].toLowerCase()}…`} value={search} onChange={e=>setSearch(e.target.value)}/><span>{items.length}{max?` / ${max}`:""} records</span></div>
 <DataTable rows={items.filter(i=>!search||columns.some(c=>String(i[c]??"").toLowerCase().includes(search.toLowerCase())))} columns={columns} actions={item=><div className="rowactions"><button className="iconbtn" title="Edit" onClick={()=>onEdit(item)}><Pencil size={15}/></button><button className="iconbtn danger" title="Delete" onClick={()=>onDelete(item)}><Trash2 size={15}/></button></div>}/></div>;
}
function Enquiries({items,onStatus}) { items = asArray(items); return <div className="panel"><PanelHead title="Incoming enquiries" subtitle="Each record shows the section where the visitor started the enquiry."/><DataTable rows={items} columns={["parentName","childName","course","phone","email","source","channel","createdAt","status"]} actions={row=><select value={row.status} onChange={e=>onStatus(row,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="enrolled">Enrolled</option><option value="closed">Closed</option></select>}/></div>;}
function Notifications({items,onRead,onReadAll}) { items = asArray(items); return <div className="panel"><PanelHead title="Enquiry notifications" subtitle="WhatsApp button clicks are tracked by source section. Actual incoming WhatsApp messages require a Meta webhook." action="Mark all read" onClick={onReadAll}/>{!items.length?<div className="empty">No notifications yet. Website enquiry submissions and tracked WhatsApp clicks will appear here.</div>:<div className="notification-list">{items.map(item=><article key={item._id} className={`notification-item ${item.read?"read":""}`}><span className="notification-icon">{item.type==="whatsapp_click"?<MessageSquare/>:<Bell/>}</span><div className="notification-copy"><strong>{item.type==="whatsapp_click"?"WhatsApp click":"New enquiry"} · {item.source}</strong><p>{item.message}</p><small>{item.createdAt?new Date(item.createdAt).toLocaleString():""}</small></div><button className="iconbtn" onClick={()=>onRead(item)} title={item.read?"Mark unread":"Mark read"}>{item.read?<EyeOff size={16}/>:<Eye size={16}/>}</button></article>)}</div>}</div>;}
function Reviews({items,onToggle,onDelete}) { items = asArray(items); return <div className="panel"><PanelHead title="Reviews and ratings" subtitle="Only approved reviews appear on the public website (maximum 3 shown publicly)."/><DataTable rows={items} columns={["name","role","rating","message","approved","createdAt"]} actions={row=><div className="rowactions"><button className="iconbtn" title={row.approved?"Hide review":"Approve review"} onClick={()=>onToggle(row)}><Check size={16}/></button><button className="iconbtn danger" title="Delete review" onClick={()=>onDelete(row)}><Trash2 size={16}/></button></div>}/></div>;}
function DataTable({rows,columns,actions}) {
 rows = asArray(rows);
 if(!rows.length)return <div className="empty"><ImageIcon size={24}/><strong>No records yet</strong><span>Real submissions and content you add will appear here. No dummy records are inserted.</span></div>;
 return <div className="tablewrap"><table><thead><tr>{columns.map(c=><th key={c}>{c.replace(/([A-Z])/g," $1")}</th>)}{actions&&<th>Actions</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r._id||i}>{columns.map(c=><td key={c}>{c==="createdAt"?(r[c]?new Date(r[c]).toLocaleString():"—"):typeof r[c]==="boolean"?<span className={`badge ${r[c]?"good":""}`}>{r[c]?"Yes":"No"}</span>:c==="message"||c==="description"?String(r[c]??"—").slice(0,100):String(r[c]??"—").slice(0,100)}</td>)}{actions&&<td>{actions(r)}</td>}</tr>)}</tbody></table></div>;
}
