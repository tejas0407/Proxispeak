# ProxiSpeak

**ProxiSpeak: Geospatial Proximity Audio Ecosystem** is a web development internship project for Infotact Solutions (Ref: ITS/WEB/1213), scheduled for 10 October–10 November 2026.

## Project overview

ProxiSpeak is a real-time web application where participants join a shared virtual room, move on a 2D canvas, and talk through peer-to-peer WebRTC audio. The Node.js/Express server stores room and audio-spot metadata in MongoDB, synchronizes room presence and coordinates with Socket.io, and relays WebRTC signaling. The browser uses the Web Audio API to adjust each remote participant's volume according to distance.

## Team contributions

- **Tejas:** Created the repository and project overview, reviewed the project components, and coordinated integration.
- **Jasmine Singh:** Developed the React frontend, virtual canvas, movement controls, and client-side WebRTC/Socket.io logic.
- **Palak Sinha:** Developed the MongoDB-backed location-audio backend foundation, including audio uploads and nearby search. The backend is integrated with the room and signaling server.

## Architecture

The React/Vite client runs in development on port 5173. Express and Socket.io run together on port 3000. Vite proxies API and Socket.io requests to Express. MongoDB stores room and audio-spot metadata. WebRTC transports live voice directly between participants; the server relays SDP and ICE messages but does not carry the audio itself.

The live voice room uses virtual canvas coordinates. The audio-spots API is a separate location-tagged clip feature; uploaded clips are not part of live peer-to-peer voice.

## Proximity audio model

For virtual distance d and room radius R, d_min is max(30, 20% of R), capped at R.

- Gain is 1 when d <= d_min.
- Gain falls linearly as 1 - (d - d_min) / (R - d_min) when d_min < d < R.
- Gain is 0 when d >= R.

The listener applies the gain to each remote stream locally and smooths changes to avoid abrupt volume steps.

## Requirements and setup

Use Node.js 18 or newer and MongoDB Community Server or MongoDB Atlas.

1. Change to the client folder.
2. Copy .env.example to .env. Set MONGO_URI if using a remote or non-default MongoDB instance.
3. Install packages with npm install.
4. Start the room server and Vite with npm run dev.
5. Open http://localhost:5173, allow microphone access, and join the same room from two browser windows. Use headphones when testing on one computer.

The API and Socket.io server listen on port 3000. Production mode serves the built client from Express: run npm run build, then npm start from the client folder.

The default public STUN server may not connect participants behind restrictive NATs; configure the optional TURN settings in client/.env.example for broader network support.

## HTTP API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Room service and MongoDB status |
| GET | /api/rooms | List saved rooms with current online participant counts |
| POST | /api/rooms | Create a room with a name and audible radius |
| POST | /api/audio-spots | Upload a location-tagged audio clip |
| GET | /api/audio-spots | List recent audio spots |
| GET | /api/audio-spots/nearby?latitude=...&longitude=...&radiusKm=5 | Find nearby audio spots |
| GET | /api/audio-spots/:id | Retrieve one audio spot |

Room creation accepts a JSON name (up to 40 characters) and radius (80–600 virtual units; defaults to 250). Audio upload uses multipart form data with title, optional description, latitude, longitude, and an audio file up to 15 MB. Uploaded files are served under /uploads.

Nearby audio-spot search uses Haversine distance and scans a bounded number of records. A GeoJSON Point field and MongoDB 2dsphere index are recommended before scaling.

## Socket.io events

| Direction | Event | Data |
|---|---|---|
| Client to server | join | roomId and name; acknowledgement returns participant id, room name, radius, canvas dimensions, and color |
| Server to room | state | Participants with id, name, x, y, and color |
| Client to server | move | Updated virtual x and y coordinates |
| Client to server | sig | Target participant id and WebRTC SDP or ICE data |
| Server to recipient | sig | Sender id and relayed SDP or ICE data |

Presence and coordinates are held in memory and cleared when a socket disconnects. Room and audio-spot records persist in MongoDB.

## Known limitations and next steps

- Rooms do not have accounts or access control.
- Voice uses a peer-to-peer mesh, suitable for small demonstration rooms but not large groups.
- Upload checks the declared MIME type and file size, but not the audio file signature.
- Configure TURN, add authentication, improve geographic indexing, and verify calls across separate networks.
- GPS/Leaflet, formal report, presentation, and a repeatable hosted demonstration remain future deliverables.

## Reference DSA exercise

The internship also covers LeetCode 1385, Find the Distance Value Between Two Arrays. The reference approach sorts one array and uses lower-bound/custom binary search to check values within an absolute-distance threshold.

## License

No license has been selected yet.