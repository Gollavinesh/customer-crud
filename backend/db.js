const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbFile = path.join(__dirname, 'data', 'database.sqlite');
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT,
    state TEXT,
    pincode TEXT,
    only_one_address INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    line1 TEXT,
    line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    is_primary INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`);

  // seed simple data if empty
  db.get('SELECT COUNT(1) as cnt FROM customers', (err,row)=>{
    if(err) return console.error(err);
    if(row.cnt === 0){
      const stmt = db.prepare('INSERT INTO customers (first_name,last_name,phone,city,state,pincode,only_one_address) VALUES (?,?,?,?,?,?,?)');
      stmt.run('Alice','Johnson','9990001111','Mumbai','Maharashtra','400001',1);
      stmt.run('Bob','Sharma','8880002222','Pune','Maharashtra','411001',0);
      stmt.finalize(()=>{
        db.get('SELECT id FROM customers WHERE first_name = ?', ['Bob'], (e,r)=>{
          if(r){
            const rid = r.id;
            const a = db.prepare('INSERT INTO addresses (customer_id,line1,city,state,pincode,is_primary) VALUES (?,?,?,?,?,?)');
            a.run(rid,'Shop 12, MG Road','Pune','Maharashtra','411001',1);
            a.run(rid,'Flat 5B, Hillview','Pune','Maharashtra','411002',0);
            a.finalize();
          }
        });
      });
    }
  });
});

module.exports = db;
