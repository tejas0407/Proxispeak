# ProxiSpeak

**ProxiSpeak: Geospatial Proximity Audio Ecosystem** is a web development internship project for Infotact Solutions (Ref: ITS/WEB/1213), scheduled for 10 October–10 November 2026.

## Project goal

ProxiSpeak is designed as a shared virtual room where participants can speak through live microphone audio. Participants move around a 2D canvas, and the listener's audio volume changes with Euclidean distance. The planned stack is React, Tailwind CSS, Canvas, Socket.io, WebRTC, and MongoDB.

## Team contributions and current status

- **Tejas:** Created the GitHub repository, prepared the project overview, and reviewed the project components.
- **Jasmine Singh:** Developed the initial React frontend, including the room interface, virtual canvas, movement controls, and client-side WebRTC/Socket.io groundwork.
- **Palak Sinha:** Developing the backend and will commit her backend implementation to the repository.

The frontend is in the client folder. The backend is intentionally pending Palak's commit; no backend implementation is included in this commit. Frontend room creation, presence, signaling, and live voice depend on matching backend API and Socket.io behavior, so those interfaces must be aligned during integration.

## Proximity audio model

The frontend uses virtual Euclidean distance. Let R be the room's audible radius and d_min be max(30, 20% of R), capped at R.

- Gain is 1 when d <= d_min.
- Gain falls linearly as 1 - (d - d_min) / (R - d_min) when d_min < d < R.
- Gain is 0 when d >= R.

The client smooths changes to avoid abrupt volume transitions. WebRTC transports audio; the listener applies each remote participant's gain locally.

## Frontend setup

Requirements: Node.js 18 or newer.

1. Change to the client folder.
2. Install dependencies with npm install.
3. Start the Vite development server with npm run dev.
4. Open http://localhost:5173.

The page can render without the backend, but room listing and creation require the backend API. Joining a room also requires the Socket.io signaling service, microphone permission, and a compatible backend. The Vite configuration currently proxies /api and /socket.io to localhost:3000; update it if the backend uses another local port.

Create a production bundle with npm run build. Run npm run preview to preview that bundle.

## Frontend's expected backend contract

The frontend currently calls GET /api/rooms and POST /api/rooms. It expects room records with an ID, name, audible radius, and online participant count.

The client also expects Socket.io events:

| Direction | Event | Expected data |
|---|---|---|
| Client to server | join | roomId and name; acknowledgement with participant id, room name, radius, canvas dimensions, and marker color |
| Server to room | state | Participant list with id, name, x, y, and color |
| Client to server | move | Updated x and y coordinates |
| Client to server | sig | Target participant id and WebRTC SDP or ICE data |
| Server to recipient | sig | Sender id and relayed SDP or ICE data |

This table describes what the current frontend expects; it does not claim that the backend is already implemented.

## Repository layout

- client: React and Vite frontend, Canvas stage, Socket.io client, and WebRTC audio hook.
- README.md: project goals, progress, proximity model, and frontend/backend integration contract.

## Next steps

1. Review Palak's backend commit and align its endpoints and event payloads with the frontend contract.
2. Run the application with MongoDB and test room join/leave, coordinate updates, WebRTC connection, mute behavior, and gain cutoff across two devices or browser sessions.
3. Document verified behavior, remaining limitations, and the repeatable demonstration steps.
4. Complete the formal project report and presentation.

## Reference DSA exercise

The internship also covers LeetCode 1385, Find the Distance Value Between Two Arrays. The reference approach sorts one array and uses lower-bound/custom binary search to check values within an absolute-distance threshold.

## License

No license has been selected yet.