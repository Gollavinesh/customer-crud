import React, {useEffect, useState} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function CustomerList(){
  const [customers, setCustomers] = useState([]);
  const [page,setPage] = useState(1);
  const [perPage] = useState(10);
  const [q,setQ] = useState('');
  const [filters,setFilters] = useState({city:'', state:'', pincode:''});

  useEffect(()=>{ fetchList(); },[page]);

  function fetchList(){
    const params = new URLSearchParams({ page, per_page: perPage, q: q || undefined, city: filters.city || undefined, state: filters.state || undefined, pincode: filters.pincode || undefined });
    fetch(api('/api/customers?'+params.toString()))
      .then(r=>r.json()).then(data=> setCustomers(data.data || []))
      .catch(e=> alert('Error: '+e.message));
  }

  function onSearch(e){
    e.preventDefault();
    setPage(1);
    fetchList();
  }
  function clearFilters(){
    setFilters({city:'',state:'',pincode:''}); setQ(''); setPage(1); fetch(api('/api/customers')).then(r=>r.json()).then(d=>setCustomers(d.data));
  }
  function deleteCustomer(id){
    if(!confirm('Delete customer '+id+'?')) return;
    fetch(api('/api/customers/'+id), { method:'DELETE' }).then(r=>r.json()).then(()=> fetchList());
  }

  return (
    <div>
      <form onSubmit={onSearch} style={{marginBottom:10}}>
        <input placeholder="search name/phone" value={q} onChange={e=>setQ(e.target.value)} />{' '}
        <input placeholder="city" value={filters.city} onChange={e=>setFilters({...filters,city:e.target.value})} />{' '}
        <input placeholder="state" value={filters.state} onChange={e=>setFilters({...filters,state:e.target.value})} />{' '}
        <input placeholder="pincode" value={filters.pincode} onChange={e=>setFilters({...filters,pincode:e.target.value})} />{' '}
        <button>Search</button> <button type="button" onClick={clearFilters}>Clear</button>
      </form>
      <table border="1" cellPadding="6" style={{width:'100%', borderCollapse:'collapse'}}>
        <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>City</th><th>Addresses</th><th>Actions</th></tr></thead>
        <tbody>
          {customers.map(c=>(
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.first_name} {c.last_name}</td>
              <td>{c.phone}</td>
              <td>{c.city}</td>
              <td>{c.address_count}</td>
              <td>
                <Link to={'/view/'+c.id}>View</Link> | <Link to={'/edit/'+c.id}>Edit</Link> | <a href="#" onClick={(e)=>{e.preventDefault(); deleteCustomer(c.id);}}>Delete</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:10}}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <span style={{margin:10}}>Page {page}</span>
        <button onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );
}
