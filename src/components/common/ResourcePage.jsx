import {useEffect,useState} from "react";
import {adminRequest} from "../../services/adminApi";
import "./ResourcePage.css";
export default function ResourcePage({title,eyebrow,description,endpoint,fields,columns,allowDelete=false}){
 const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [search,setSearch]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await adminRequest(endpoint);setRows(Array.isArray(r)?r:r?.items||r?.data||r?.enquiries||r?.notifications||r?.reviews||[])}catch(e){setError(e.message||`Unable to load ${title.toLowerCase()}.`)}finally{setLoading(false)}}
 useEffect(()=>{load()},[endpoint]);
 async function update(row,key,value){try{await adminRequest(`${endpoint}/${row._id||row.id}`,{method:"PATCH",body:JSON.stringify({[key]:value})});await load()}catch(e){setError(e.message||"Update failed.")}}
 async function remove(row){if(!window.confirm("Delete this record?"))return;try{await adminRequest(`${endpoint}/${row._id||row.id}`,{method:"DELETE"});await load()}catch(e){setError(e.message||"Delete failed.")}}
 const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
 return <section className="page resource-page"><div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><button className="secondary-button" onClick={load}>Refresh</button></div>
 {error&&<div className="alert error-alert">{error}</div>}<div className="panel"><div className="resource-toolbar"><input className="search-input" placeholder={`Search ${title.toLowerCase()}…`} value={search} onChange={e=>setSearch(e.target.value)}/><span className="record-count">{filtered.length} records</span></div>
 {loading?<p>Loading…</p>:filtered.length===0?<div className="empty-media"><strong>No records found</strong><p>Records will appear here when available from the backend.</p></div>:<div className="table-wrapper"><table className="data-table"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}{fields?.length>0&&<th>Update</th>}{allowDelete&&<th>Actions</th>}</tr></thead><tbody>{filtered.map(row=><tr key={row._id||row.id}>{columns.map(c=><td key={c.key}>{c.render?c.render(row):String(row[c.key]??"—")}</td>)}{fields?.length>0&&<td>{fields.map(f=><select key={f.key} aria-label={f.label} value={row[f.key]||f.options[0].value} onChange={e=>update(row,f.key,e.target.value)}>{f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>)}</td>}{allowDelete&&<td><button onClick={()=>remove(row)}>Delete</button></td>}</tr>)}</tbody></table></div>}</div></section>
}
