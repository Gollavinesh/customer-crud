const express = require('express');
const router = express.Router();
const db = require('../db');

// helper for async-like responses
function runQuery(sql, params=[]) {
  return new Promise((resolve, reject)=>{
    db.all(sql, params, (err, rows)=> {
      if(err) reject(err);
      else resolve(rows);
    });
  });
}

// Create customer with at least one address (addresses optional)
router.post('/', (req,res)=>{
  const { first_name, last_name, phone, city, state, pincode, addresses } = req.body;
  if(!first_name || !last_name || !phone) return res.status(400).json({ error: 'first_name, last_name, phone required' });
  db.serialize(()=> {
    const stmt = db.prepare('INSERT INTO customers (first_name,last_name,phone,city,state,pincode,only_one_address) VALUES (?,?,?,?,?,?,?)');
    const onlyOne = (addresses && addresses.length && addresses.length===1) ? 1 : 0;
    stmt.run(first_name,last_name,phone,city||'',state||'',pincode||'', onlyOne, function(err){
      if(err) return res.status(500).json({ error: err.message });
      const customerId = this.lastID;
      if(addresses && addresses.length){
        const as = db.prepare('INSERT INTO addresses (customer_id,line1,line2,city,state,pincode,is_primary) VALUES (?,?,?,?,?,? ,?)');
        addresses.forEach((a, idx)=>{
          as.run(customerId, a.line1||'', a.line2||'', a.city||'', a.state||'', a.pincode||'', idx===0?1:0);
        });
        as.finalize(()=> res.json({ id: customerId }));
      } else {
        res.json({ id: customerId });
      }
    });
    stmt.finalize();
  });
});

// Read list with filters, pagination, sorting
router.get('/', async (req,res)=>{
  try{
    let { page=1, per_page=10, city, state, pincode, q, sort='id', dir='asc' } = req.query;
    page = parseInt(page); per_page = parseInt(per_page);
    const where = [];
    const params = [];
    if(city){ where.push('c.city = ?'); params.push(city); }
    if(state){ where.push('c.state = ?'); params.push(state); }
    if(pincode){ where.push('c.pincode = ?'); params.push(pincode); }
    if(q){ where.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)'); params.push('%'+q+'%','%'+q+'%','%'+q+'%'); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page-1)*per_page;
    const sql = `SELECT c.*, 
      (SELECT COUNT(1) FROM addresses a WHERE a.customer_id = c.id) as address_count
      FROM customers c
      ${whereSql}
      ORDER BY c.${sort} ${dir}
      LIMIT ? OFFSET ?`;
    params.push(per_page, offset);
    const rows = await runQuery(sql, params);
    res.json({ data: rows, page, per_page });
  }catch(err){ console.error(err); res.status(500).json({ error: err.message }); }
});

// Get by id including addresses
router.get('/:id', (req,res)=>{
  const id = req.params.id;
  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer)=>{
    if(err) return res.status(500).json({ error: err.message });
    if(!customer) return res.status(404).json({ error: 'Not found' });
    db.all('SELECT * FROM addresses WHERE customer_id = ?', [id], (e, addresses)=>{
      if(e) return res.status(500).json({ error: e.message });
      customer.addresses = addresses;
      res.json(customer);
    });
  });
});

// Update customer basic info
router.put('/:id', (req,res)=>{
  const id = req.params.id;
  const { first_name, last_name, phone, city, state, pincode } = req.body;
  db.run(`UPDATE customers SET first_name=?, last_name=?, phone=?, city=?, state=?, pincode=? WHERE id=?`,
    [first_name,last_name,phone,city||'',state||'',pincode||'', id],
    function(err){
      if(err) return res.status(500).json({ error: err.message });
      if(this.changes===0) return res.status(404).json({ error: 'Not found' });
      res.json({ updated: true });
    });
});

// Delete customer (and cascade deletes because of our logic)
router.delete('/:id', (req,res)=>{
  const id = req.params.id;
  db.run('DELETE FROM addresses WHERE customer_id = ?', [id], function(err){
    if(err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM customers WHERE id = ?', [id], function(err2){
      if(err2) return res.status(500).json({ error: err2.message });
      res.json({ deleted: true });
    });
  });
});

// Addresses routes: add/update/delete
router.post('/:id/addresses', (req,res)=>{
  const customerId = req.params.id;
  const { line1, line2, city, state, pincode, is_primary } = req.body;
  db.run('INSERT INTO addresses (customer_id,line1,line2,city,state,pincode,is_primary) VALUES (?,?,?,?,?,?,?)',
    [customerId,line1||'',line2||'',city||'',state||'',pincode||'', is_primary?1:0],
    function(err){
      if(err) return res.status(500).json({ error: err.message });
      // if marked primary, clear others
      if(is_primary){
        db.run('UPDATE addresses SET is_primary=0 WHERE customer_id=? AND id<>?', [customerId, this.lastID]);
      }
      // update customer's only_one_address flag
      db.get('SELECT COUNT(1) as cnt FROM addresses WHERE customer_id=?',[customerId],(e,r)=>{
        if(!e){
          const onlyOne = (r.cnt===1)?1:0;
          db.run('UPDATE customers SET only_one_address=? WHERE id=?', [onlyOne, customerId]);
        }
      });
      res.json({ id: this.lastID });
    });
});

router.put('/:customerId/addresses/:addrId', (req,res)=>{
  const { customerId, addrId } = req.params;
  const { line1, line2, city, state, pincode, is_primary } = req.body;
  db.run('UPDATE addresses SET line1=?,line2=?,city=?,state=?,pincode=?,is_primary=? WHERE id=? AND customer_id=?',
    [line1||'',line2||'',city||'',state||'',pincode||'', is_primary?1:0, addrId, customerId],
    function(err){
      if(err) return res.status(500).json({ error: err.message });
      if(this.changes===0) return res.status(404).json({ error: 'Not found' });
      if(is_primary){
        db.run('UPDATE addresses SET is_primary=0 WHERE customer_id=? AND id<>?', [customerId, addrId]);
      }
      // update customer's only_one_address flag
      db.get('SELECT COUNT(1) as cnt FROM addresses WHERE customer_id=?',[customerId],(e,r)=>{
        if(!e){
          const onlyOne = (r.cnt===1)?1:0;
          db.run('UPDATE customers SET only_one_address=? WHERE id=?', [onlyOne, customerId]);
        }
      });
      res.json({ updated: true });
    });
});

router.delete('/:customerId/addresses/:addrId', (req,res)=>{
  const { customerId, addrId } = req.params;
  db.run('DELETE FROM addresses WHERE id=? AND customer_id=?', [addrId, customerId], function(err){
    if(err) return res.status(500).json({ error: err.message });
    // update only_one flag
    db.get('SELECT COUNT(1) as cnt FROM addresses WHERE customer_id=?',[customerId],(e,r)=>{
      if(!e){
        const onlyOne = (r.cnt===1)?1:0;
        db.run('UPDATE customers SET only_one_address=? WHERE id=?', [onlyOne, customerId]);
      }
    });
    res.json({ deleted: true });
  });
});

module.exports = router;
