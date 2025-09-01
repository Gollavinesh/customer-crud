const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const customers = require('./routes/customers');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/customers', customers);

// health
app.get('/api/health', (req,res)=>res.json({ok:true, time: new Date()}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
