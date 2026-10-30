import {useEffect,useState} from "react";
import "./PricingForm.css";
const blank={title:"",description:"",price:"",features:"",active:true,order:0};
export default function PricingForm({initialData,onSubmit,onCancel,saving}){
 const [form,setForm]=useState(blank);
 useEffect(()=>setForm(initialData?{...blank,...initialData,features:Array.isArray(initialData.features)?initialData.features.join("\n"):""}:blank),[initialData]);
 const change=(k,v)=>setForm(p=>({...p,[k]:v}));
 function submit(e){e.preventDefault();onSubmit({...form,title:form.title.trim(),price:String(form.price),features:form.features.split("\n").map(x=>x.trim()).filter(Boolean),order:Number(form.order)||0});}
 return <form className="admin-form pricing-form" onSubmit={submit}><h2>{initialData?"Edit pricing plan":"Create pricing plan"}</h2>
 <label className="field">Plan name *<input required value={form.title} onChange={e=>change("title",e.target.value)} placeholder="Starter plan"/></label>
 <label className="field">Price *<input required value={form.price} onChange={e=>change("price",e.target.value)} placeholder="₹ 2999 / course"/></label>
 <label className="field wide">Description<textarea rows="3" value={form.description} onChange={e=>change("description",e.target.value)} placeholder="Plan summary"/></label>
 <label className="field wide">Features (one per line)<textarea rows="5" value={form.features} onChange={e=>change("features",e.target.value)} placeholder={"Live sessions\nProject kit\nCertificate"}/></label>
 <label className="field">Display order<input type="number" min="0" value={form.order} onChange={e=>change("order",e.target.value)}/></label>
 <label className="field checkbox-field"><input type="checkbox" checked={!!form.active} onChange={e=>change("active",e.target.checked)}/> Active plan</label>
 <div className="admin-form__actions"><button disabled={saving}>{saving?"Saving…":initialData?"Save changes":"Create plan"}</button><button type="button" onClick={onCancel} disabled={saving}>Cancel</button></div></form>;
}
