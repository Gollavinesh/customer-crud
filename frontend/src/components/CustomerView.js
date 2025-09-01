import React, {useEffect, useState} from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function CustomerView(){
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  useEffect(()=>{ fetch(api('/api/customers/'+id)).then(r=>r.json()).then(d=>setCustomer(d)); },[id]);
  if(!customer) return <div>Loading...</div>;
  return (
    <div>
      <h3>{customer.first_name} {customer.last_name}</h3>
      <p>Phone: {customer.phone}</p>
      <p>City: {customer.city} | State: {customer.state} | Pincode: {customer.pincode}</p>
      <h4>Addresses</h4>
      <ul>
        {customer.addresses && customer.addresses.map(a=>(
          <li key={a.id}>{a.line1} {a.line2} — {a.city} {a.pincode} {a.is_primary? '(Primary)':''}</li>
        ))}
      </ul>
      <Link to="/">Back</Link>
    </div>
  );
}
