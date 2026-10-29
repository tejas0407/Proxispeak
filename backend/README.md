# ProxiSpeak Location-Audio Backend Starter

This standalone learning service uses Node.js, Express, MongoDB, and Mongoose to store audio clips tagged with latitude and longitude. It is separate from the live peer-to-peer voice rooms served by the React application.

## Features

- Health endpoint.
- Upload audio with a title, optional description, and coordinates.
- Save audio metadata in MongoDB and serve files from the uploads directory.
- List audio spots, retrieve one by ID, and search nearby spots with Haversine distance.

## Requirements and setup

Use Node.js 18 or newer and a local MongoDB instance or MongoDB Atlas.

1. From this folder, run **npm install**.
2. Copy **.env.example** to **.env** and set MONGODB_URI to your MongoDB connection string if needed.
3. Start in development mode with **npm run dev**, or use **npm start**.
4. Open **http://localhost:5000/api/health** to check the service.

Keep .env private and do not commit credentials. The default database is named proxispeak.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | / | Welcome message |
| GET | /api/health | Health check |
| POST | /api/audio-spots | Upload audio and create a location entry |
| GET | /api/audio-spots | List recent entries |
| GET | /api/audio-spots/nearby?latitude=...&longitude=...&radiusKm=5 | Find nearby entries |
| GET | /api/audio-spots/:id | Retrieve one entry |

The upload endpoint accepts multipart form data: title, optional description, latitude, longitude, and audio. Audio files are limited to 15 MB. Returned audio URLs are paths under /uploads.

## Current limitations

This is a learning scaffold. It has no authentication, ownership/access control, moderation, rate limiting, edit/delete API, or cloud object storage. The upload filter checks declared MIME types and extensions; it does not verify file signatures. Nearby search scans at most 5,000 records; a GeoJSON Point field with a MongoDB 2dsphere index is the next step for scalable geographic queries. The uploaded audio spots are not part of the live WebRTC conversation flow.
