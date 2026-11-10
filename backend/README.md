# ProxiSpeak MERN Backend (Beginner Starter)

This backend uses **Node.js + Express + MongoDB + Mongoose**. It does not create or replace your frontend.

## Features
- Health endpoint
- Upload audio with title, description and coordinates
- Save metadata in MongoDB
- List audio spots and retrieve one by ID
- Search nearby spots by distance in kilometres

## Requirements
- Node.js LTS
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- VS Code

## Step 1: Install dependencies
Open this folder in VS Code, open **Terminal → New Terminal**, then run:
```bash
npm install
```

## Step 2: Create `.env`
Copy `.env.example` to a new file named `.env`.
For local MongoDB, this default is suitable if MongoDB is installed and running:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/proxispeak
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=uploads
```
If your frontend uses another port, change `FRONTEND_URL`. For a plain HTML page opened using VS Code Live Server, it may be `http://127.0.0.1:5500`.

For MongoDB Atlas, replace `MONGODB_URI` with your own Atlas connection string. Keep `.env` private and never commit it.

## Step 3: Run the backend
Development mode:
```bash
npm run dev
```
Or:
```bash
npm start
```
Expected terminal output includes:
- `MongoDB connected successfully`
- `ProxiSpeak API running at http://localhost:5000`

## Step 4: Check the API
Open:
- `http://localhost:5000/`
- `http://localhost:5000/api/health`

## Step 5: Test with Postman
Create a `POST` request to `http://localhost:5000/api/audio-spots`.
Choose **Body → form-data**, then add:
- `title` (Text): e.g. Test audio
- `description` (Text): optional
- `latitude` (Text): a test latitude
- `longitude` (Text): a test longitude
- `audio` (File): choose a small MP3/WAV/OGG/WebM file

Then test:
- `GET http://localhost:5000/api/audio-spots`
- `GET http://localhost:5000/api/audio-spots/nearby?latitude=22.5726&longitude=88.3639&radiusKm=5`
- `GET http://localhost:5000/api/audio-spots/<id>` using an ID from the response.

You can also install a REST Client extension or use Postman. This starter does not provide a Swagger UI.

## API summary
| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Welcome message |
| GET | `/api/health` | Health check |
| POST | `/api/audio-spots` | Upload audio and create a location entry |
| GET | `/api/audio-spots` | List entries |
| GET | `/api/audio-spots/nearby?latitude=...&longitude=...&radiusKm=5` | Find nearby entries |
| GET | `/api/audio-spots/:id` | Retrieve one entry |

Audio URLs are returned as paths such as `/uploads/<filename>`. The frontend should prefix these with the backend base URL, e.g. `http://localhost:5000`.

## Before production
This is a learning scaffold, not production-ready. It has no authentication, ownership/access control, moderation, rate limiting, deletion/editing, cloud object storage, or automated tests. MIME checks alone do not prove a file is safe. Restrict CORS to your real frontend, add authentication and authorization, inspect file signatures, and use cloud object storage. Nearby search currently scans a bounded set of records; use GeoJSON with a MongoDB `2dsphere` index for scalable proximity queries.
