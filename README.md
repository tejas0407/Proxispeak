# ProxiSpeak

**ProxiSpeak: Geospatial Proximity Audio Ecosystem** is a web development internship project for Infotact Solutions (Ref: ITS/WEB/1213), for the 10 October–10 November 2026 internship period.

## What the project does

ProxiSpeak lets people talk through a shared virtual room. Each participant moves on a 2D canvas. WebRTC carries live microphone audio between peers, while Socket.io synchronizes room presence, coordinates, and WebRTC signaling. The listener's browser adjusts each remote participant's volume according to distance.

The current implementation focuses on virtual coordinates. GPS/Leaflet is a possible extension and is not part of the current room flow.

## Current repository contents

- **client/** — React, Tailwind, and Canvas room interface; WebRTC peer connections; Express and Socket.io room server.
- **backend/** — separate Express/MongoDB starter for uploaded, location-tagged audio spots and nearby search. These stored clips are distinct from the live peer-to-peer room audio.
- **README.md** — project setup, architecture, API and signaling contracts, and known limitations.

The React frontend was initially developed by Jasmine Singh. Palak Sinha prepared the location-audio backend starter. Tejas created the project repository and reviewed the project components.

## Architecture

The browser connects to the room server for room lists, presence, movement, and SDP/ICE signaling. Audio itself travels peer-to-peer through WebRTC. The Web Audio API applies a GainNode to each remote stream and can use a PannerNode for direction. MongoDB persists room definitions. The separate backend service stores uploaded audio-spot metadata and files.

## Proximity audio

The virtual room uses Euclidean distance. For distance d and room audible radius R, the current linear falloff is:

Let d_min be max(30, 20% of R), capped at R. Gain is 1 when d <= d_min, falls linearly as 1 - (d - d_min) / (R - d_min) when d_min < d < R, and is 0 when d >= R. The client smooths gain changes. Each listener applies the gain locally; movement updates do not renegotiate WebRTC.

## Run the room application

Requirements: Node.js 18 or newer and a running MongoDB instance.

1. Open the client folder: **cd client**
2. Copy **.env.example** to **.env** and set MONGO_URI if MongoDB is not using its local default.
3. Install dependencies with **npm install**.
4. Start the server and Vite client with **npm run dev**.
5. Open **http://localhost:5173** in two browser windows, enter a name, and join the same room. Allow microphone access and use headphones when both windows use the same device.

The room server listens on port 3000. Vite runs on port 5173 and proxies API and Socket.io requests to the room server. For a production build, run **npm run build** and then **npm start** from client; Express serves the generated client build.

The client environment file also supports optional TURN settings. The default public STUN server can fail on restrictive networks; real deployments should configure a TURN service and protect its credentials.

## Room HTTP API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Report room server and MongoDB status |
| GET | /api/rooms | List saved rooms with current online counts |
| POST | /api/rooms | Create a room with a name and audible radius |

Create-room JSON fields: name (required, up to 40 characters) and radius (80–600 virtual units; defaults to 250). Room IDs are MongoDB document IDs.

## Socket.io events

| Direction | Event | Payload or result |
|---|---|---|
| Client to server | join | roomId and name; acknowledgement returns participant id, room name, radius, canvas dimensions, and marker color |
| Server to room | state | Current participant list with id, name, x, y, and color |
| Client to server | move | Updated virtual x and y coordinates |
| Client to server | sig | Target participant id and WebRTC SDP or ICE data |
| Server to recipient | sig | Sender id and relayed SDP or ICE data |

The server only relays signaling between participants in the same room. Presence is in memory and is removed when a socket disconnects; room definitions persist in MongoDB.

## Separate location-audio backend

The backend folder is an optional standalone service for uploaded audio spots, not a dependency of live room voice. From that folder, copy **.env.example** to **.env**, install with **npm install**, and start with **npm run dev**. It defaults to port 5000 and the same local MongoDB database.

Its routes are GET /api/health, POST /api/audio-spots, GET /api/audio-spots, GET /api/audio-spots/nearby, and GET /api/audio-spots/:id. The POST endpoint accepts multipart form data with title, optional description, latitude, longitude, and an audio file. Nearby results use Haversine distance and scan up to 5,000 records; a MongoDB 2dsphere index is needed for scalable searches.

## Known limitations and next steps

- Rooms have no user accounts, authentication, or access control.
- WebRTC currently uses a peer mesh, which is suitable for a small demonstration room but does not scale to large groups.
- The location-audio upload starter checks declared MIME type and file size, but does not inspect audio file signatures. It is a learning scaffold, not a production upload service.
- Add automated coverage, configure TURN, harden validation and upload handling, and verify the complete experience across separate devices and networks.
- GPS support, formal report, presentation, and a repeatable deployed demonstration remain future work.

## Reference DSA exercise

The internship also covers LeetCode 1385, Find the Distance Value Between Two Arrays. The reference approaches sort one array and use lower-bound/custom binary search to check whether values fall within the absolute-distance threshold.

## License

No license has been selected yet.