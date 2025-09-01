import React, {useState, useEffect} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

export default function CustomerForm({ editMode }){
  const [form, setForm] = useState({ first_name:'', last_name:'', phone:'', city:'', state:'', pincode:'', addresses:[] });
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(()=>{
    if(editMode && id){
      fetch(api('/api/customers/'+id)).then(r=>r.json()).then(d=> setForm({...d, addresses: d.addresses || []}));
    }
  },[editMode,id]);

  function addAddress(){
    setForm({...form, addresses: [...form.addresses, { line1:'', line2:'', city:'', state:'', pincode:'', is_primary:false }]});
  }
  function save(e){
    e.preventDefault();
    // basic validation
    if(!form.first_name || !form.last_name || !form.phone){ alert('first name, last name, phone required'); return; }
    const payload = {...form};
    const method = editMode ? 'PUT' : 'POST';
    const url = editMode ? api('/api/customers/'+id) : api('/api/customers');
    fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r=>r.json()).then(data=>{
        alert('Saved'); navigate('/');
      }).catch(e=> alert('Error: '+e.message));
  }

  function updateAddress(idx, key, value){
    const copy = JSON.parse(JSON.stringify(form));
    copy.addresses[idx][key] = value;
    setForm(copy);
  }

  return (
    <form onSubmit={save}>
      <div><label>First name <input value={form.first_name} onChange={e=>setForm({...form, first_name: e.target.value})} /></label></div>
      <div><label>Last name <input value={form.last_name} onChange={e=>setForm({...form, last_name: e.target.value})} /></label></div>
      <div><label>Phone <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} /></label></div>
      <div><label>City <input value={form.city} onChange={e=>setForm({...form, city: e.target.value})} /></label></div>
      <div><label>State <input value={form.state} onChange={e=>setForm({...form, state: e.target.value})} /></label></div>
      <div><label>Pincode <input value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} /></label></div>

      <div style={{marginTop:10}}>
        <h4>Addresses</h4>
        {form.addresses.map((a,idx)=>(
          <div key={idx} style={{border:'1px solid #ddd', padding:8, marginBottom:6}}>
            <div><input placeholder="line1" value={a.line1} onChange={e=>updateAddress(idx,'line1',e.target.value)} /></div>
            <div><input placeholder="city" value={a.city} onChange={e=>updateAddress(idx,'city',e.target.value)} /></div>
            <div><label><input type="checkbox" checked={a.is_primary} onChange={e=>updateAddress(idx,'is_primary',e.target.checked)} /> Primary</label></div>
          </div>
        ))}
        <button type="button" onClick={addAddress}>Add Address</button>
      </div>

      <div style={{marginTop:10}}>
        <button>Save</button> <button type="button" onClick={()=>navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}
