# Customer CRUD Sample (React + Express + SQLite)

This is a sample full-stack application implementing Customer and Multiple Addresses CRUD,
built with React (React Router) frontend and Node.js + Express backend using SQLite.

## Features implemented (sample)
- Create / Read / Update / Delete customers
- Multiple addresses per customer
- Search by city/state/pincode
- Client-side validation
- Pagination (simple)
- Simple error handling & logging (backend)
- Responsive UI (basic)
- SQLite DB initialization + seed data

## How to run

### Backend
1. cd backend
2. npm install
3. npm run start

Server runs on http://localhost:4000

### Frontend
1. cd frontend
2. npm install
3. npm run start

App runs on http://localhost:3000 and talks to backend at port 4000.

### Useful
- DB file: backend/data/database.sqlite
- To reset DB, delete the sqlite file and restart server.

