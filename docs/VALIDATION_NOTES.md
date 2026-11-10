# Validation Notes

These notes distinguish automated or smoke-tested behavior from features that still need a live environment check.

| Area | Recorded check | Outcome / boundary |
|---|---|---|
| Frontend | Vite production build | Passed in the local integrated project. |
| HTTP service | Health endpoint and static production serving | Returned HTTP 200 during the earlier integration smoke run. |
| Rooms | Create, list, and invalid room input | Create/list worked; validation rejected invalid values. |
| Real-time room | Two Socket.IO clients joined, moved, relayed signaling, and left | Smoke flow passed. This verifies signaling events, not audio quality. |
| Audio spots | Upload, list, nearby lookup, and static file serving | Smoke flow passed. |
| Proximity gain | Deterministic piecewise linear formula | Boundary examples are documented in the report and project docs. |
| Live microphone audio | Independent browser/device call across separate networks | Not verified in the recorded smoke run. Validate permissions, STUN, and TURN during the final live demonstration. |

ProxiSpeak does not include a machine-learning model. Model evaluation is therefore not applicable; functional checks are the appropriate validation method for the current implementation.
