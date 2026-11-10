# ProxiSpeak Project Documentation

**Project:** ProxiSpeak: Geospatial Proximity Audio Ecosystem  
**Reference:** ITS/WEB/1213  
**Intern:** Tejas Vikram Singh, Associate L1 Intern — Web Development  
**Project period:** 10 October–10 November 2026

## 1. Project summary

ProxiSpeak is a browser-based shared voice room in which a participant's position on a virtual 2D canvas affects how other participants hear them. Nearby participants are heard at full volume; voices fade as distance increases and become silent at the room's audible boundary. WebRTC carries live audio between browsers. Socket.IO synchronizes room presence, virtual coordinates, and the signaling messages needed to establish peer connections.

The repository also contains a separate location-tagged audio-spots feature. It stores uploaded clip metadata and supports nearby search using latitude/longitude. The live voice room currently uses virtual canvas coordinates; it does not track participants by GPS or display a Leaflet map.

## 2. Objectives and scope

- Provide room discovery and room creation with a configurable hearing radius.
- Let participants join with a display name and browser microphone permission.
- Show participant positions and hearing boundaries on a responsive canvas map.
- Update remote audio gain as participants move closer or farther away.
- Offer optional directional panning, microphone mute, and leave-room controls.
- Store room and audio-spot metadata in MongoDB.
- Provide a repeatable local demonstration using two browser windows.

The current voice experience is a small-room, peer-to-peer mesh demonstration. Accounts, authorization, GPS tracking for live voice, a hosted production deployment, and a media server for large rooms are outside the implemented scope.

## 3. Users and workflow

1. Start MongoDB and the application server.
2. Open the Vite page and choose a display name.
3. Select a room such as **Hush**, or create a room and set its audible radius.
4. Allow microphone access and join the same room from another browser window or device.
5. Move with WASD, arrow keys, or a click on the canvas. Observe the distance and gain indicator change.
6. Mute, enable directional audio, or leave the room using the controls.

Use headphones when demonstrating from one computer to prevent acoustic feedback.

## 4. System design

The browser uses React and Tailwind CSS for the interface, Canvas for the virtual room, Socket.IO for room events, WebRTC for peer audio, and the Web Audio API for per-peer gain and panning. A Node.js/Express process hosts the HTTP API and Socket.IO server. MongoDB stores rooms and audio-spot metadata; current room membership and positions are held in server memory. See the repository's [README](https://github.com/tejas0407/Proxispeak/blob/main/README.md) and [architecture guide](https://github.com/tejas0407/Proxispeak/blob/main/docs/ARCHITECTURE.md) for detailed diagrams and interface contracts.

### Core data and flow

- Room record: name, audible radius, creation/update timestamps.
- Audio spot: title, description, latitude, longitude, generated audio filename, timestamps.
- Live member: socket ID, name, virtual x/y coordinates, marker color. This state is transient.
- Signaling: the server relays SDP and ICE data only between members of the same active room. The audio stream itself is not relayed by the application server.

## 5. Proximity audio calculation

Let listener position be `(x₁, y₁)`, remote participant position `(x₂, y₂)`, and room radius `R`:

`distance = √((x₂ − x₁)² + (y₂ − y₁)²)`

The client sets the full-volume threshold to `d_min = min(R, max(30, round(0.2 × R)))` virtual units. The implemented linear gain is:

- `gain = 1` when `distance ≤ d_min`.
- `gain = 1 − (distance − d_min) / (R − d_min)` when `d_min < distance < R`.
- `gain = 0` when `distance ≥ R`.

For a 250-unit room, `d_min = 50`: a listener at 50 units hears full volume, at 150 units hears 50% gain, and at or beyond 250 units hears 0% gain. Gain changes are smoothed with Web Audio automation. Directional mode uses relative horizontal and vertical offsets for panning.

## 6. HTTP and Socket.IO interfaces

| Interface | Purpose |
|---|---|
| `GET /api/health` | Reports API and MongoDB connection status. |
| `GET /api/rooms` | Lists saved rooms and current online participant counts. |
| `POST /api/rooms` | Creates a room from a name and radius (80–600 units; default 250). |
| `POST /api/audio-spots` | Uploads an audio clip with title and coordinates. |
| `GET /api/audio-spots` | Lists recent clips. |
| `GET /api/audio-spots/nearby?latitude=…&longitude=…&radiusKm=…` | Finds nearby clips using Haversine distance. |
| `GET /api/audio-spots/:id` | Retrieves one clip record. |
| Socket.IO `join` | Joins a room and acknowledges the room and participant information. |
| Socket.IO `state` | Broadcasts room member IDs, names, coordinates, and colors. |
| Socket.IO `move` | Submits virtual coordinates; the server clamps them to the canvas. |
| Socket.IO `sig` | Relays WebRTC SDP and ICE data to a peer in the same room. |

## 7. Setup

Requirements: Node.js 18 or newer and MongoDB Community Server or MongoDB Atlas.

1. Open a terminal in `client/`.
2. Copy `.env.example` to `.env`; set `MONGO_URI` if using a non-default MongoDB instance.
3. Run `npm install`.
4. Run `npm run dev` and open `http://localhost:5173`.
5. Allow microphone access and join from two browser windows.
6. For production serving, run `npm run build`, then `npm start` from `client/`.

The optional `VITE_TURN_URL`, `VITE_TURN_USER`, and `VITE_TURN_PASS` values configure a TURN service for stricter network environments. The default public STUN server alone cannot guarantee connectivity through every NAT or firewall.

## 8. Verification and model evaluation

There is no trained machine-learning model in ProxiSpeak, so ML model evaluation metrics such as accuracy, precision, recall, or F1 do not apply. The proximity gain function is deterministic and is evaluated through boundary and intermediate-distance cases. The application was previously smoke-checked for production build, HTTP health, room creation/listing/validation, two-client Socket.IO join/movement/signaling/leave, and audio-spot upload/list/nearby/static serving. A real microphone-to-microphone call across separate networks and TURN configuration still require a live environment check. See [Validation Notes](VALIDATION_NOTES.md).

## 9. Team contributions

- **Tejas Vikram Singh:** Created and maintained the repository, integrated the project, reviewed the components, and prepared documentation and submission materials.
- **Jasmine Singh:** Developed the React frontend, virtual canvas, movement controls, and client-side real-time audio experience.
- **Palak Sinha:** Developed the MongoDB-backed backend foundation, including room/audio-spot data and location-tagged audio APIs.

## 10. Limitations and future work

- Presence and coordinates are in process memory and reset when the server restarts.
- Peer-to-peer mesh connections suit small demonstration rooms; larger rooms need an SFU/media server.
- Authentication, moderation, room access controls, and rate limiting are not implemented.
- The live room uses virtual coordinates. GPS/Leaflet presence remains a future extension.
- Nearby audio-spot search scans a bounded set of records; a GeoJSON `2dsphere` index is recommended for scale.
- Upload validation checks MIME type and size but does not inspect the file signature.
- HTTPS and a configured TURN service are needed for reliable access outside localhost and less restrictive networks.

## 11. Submission items

- Source code: [GitHub repository](https://github.com/tejas0407/Proxispeak) and included source archive.
- Technical documentation: this guide and the architecture guide.
- Formal report: `report/ProxiSpeak_Project_Report.docx`.
- Presentation: `presentation/ProxiSpeak_Final_Review.pptx`.
- Model evaluation: not applicable; deterministic functional verification is documented above.
- Demonstration: run the live app using the steps in [Demo Guide](DEMO_GUIDE.md).
