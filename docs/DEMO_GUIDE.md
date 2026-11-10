# ProxiSpeak Demonstration Guide

## Before the review

1. Confirm MongoDB is running and `client/.env` points to the correct database.
2. In `client/`, run `npm run dev`.
3. Open `http://localhost:5173` in two browser windows. Use two devices if available; otherwise wear headphones.
4. Allow microphone access in both windows and enter distinct display names.

## Demonstration sequence

1. Show room discovery and point out **Hush**. If it is not listed in the current local database, create a room with a radius such as 250 units.
2. Join the same room from both windows. Explain that Express/Socket.IO synchronize presence and movement, while WebRTC carries audio directly between the browsers.
3. Move one participant using WASD or arrow keys. Also demonstrate click-to-move.
4. Bring the avatars close together and ask the reviewer to notice full volume. Move to the mid-range and observe the displayed distance and falling gain. Move beyond the dashed audible boundary and show that gain reaches zero.
5. Toggle mute and directional audio. Show the participant status and leave-room behavior.
6. If time allows, briefly open the audio-spots endpoints or describe that this separate feature stores location-tagged clips and searches them by Haversine distance.

## Talk track

“ProxiSpeak demonstrates proximity-aware voice in a shared virtual room. Each browser calculates Euclidean distance from the canvas coordinates and applies a smoothed gain to each remote audio stream with the Web Audio API. Socket.IO keeps room positions and WebRTC signaling synchronized; the audio is peer-to-peer. We also have a separate location-tagged audio-spots API, but live participants are not currently tracked by GPS.”

## Troubleshooting

- **No microphone prompt:** use a secure origin (`localhost` or HTTPS), check browser site permissions, and reload.
- **No remote voice:** confirm both users joined the same room, check the browser console and connection status, and verify both peers are within range.
- **Connection fails on another network:** STUN may be insufficient behind strict NAT/firewall rules; configure a TURN service in the client environment and rebuild.
- **Echo:** use headphones and lower speaker volume.
- **Room list is empty:** check `/api/health`, MongoDB connectivity, and whether a room record exists. The app hides the temporary “Integration Smoke Room” entry; “Hush” remains visible if it exists in the database.

## Evidence and honest limits

A local UI demonstration requires microphone permission. The earlier integration smoke check verified HTTP/API operations and Socket.IO signaling relays, but did not establish a microphone call across independent networks. Do not claim that external-network TURN connectivity has been proven unless it is tested live.
