import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerView from './components/CustomerView';

export default function App(){
  return (
    <div style={{padding:20, fontFamily:'Arial, sans-serif'}}>
      <header style={{display:'flex', gap:10, marginBottom:20}}>
        <h2>Customer CRUD Demo</h2>
        <nav>
          <Link to="/">List</Link> | <Link to="/create">Create</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<CustomerList />} />
        <Route path="/create" element={<CustomerForm />} />
        <Route path="/edit/:id" element={<CustomerForm editMode />} />
        <Route path="/view/:id" element={<CustomerView />} />
      </Routes>
    </div>
  );
}
