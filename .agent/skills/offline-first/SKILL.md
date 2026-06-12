# Skill: Offline-First Pattern

## Purpose
This skill guide details how to implement offline-first capabilities for MeCal's core tracking features. It ensures that users can log data without internet friction and that data is safely synced to the backend when connection is restored.

## Core Rules
- **Scope**: Core tracking actions (log meal, log hydration, step goal check-in) must work offline.
- **Storage**: Use IndexedDB to queue actions locally.
- **Synchronization**: Sync to the backend automatically when the connection is restored.
- **User Feedback**: Always show the user their connection status and indicate if a sync is pending.

## Implementation Flow

### 1. IndexedDB Setup
- Use a lightweight wrapper or native IndexedDB to create a local `outbox` or `sync_queue` store.
- Schema for queued items should include:
  ```json
  {
    "id": "auto-incrementing or UUID",
    "actionType": "LOG_MEAL" | "LOG_HYDRATION" | "STEP_CHECKIN",
    "payload": { ... },
    "timestamp": "ISO string"
  }
  ```

### 2. Performing Tracking Actions
When a user triggers a tracking action (e.g., taps to fill a water sachet):
1. **Optimistic Update**: Immediately update the local UI state (Zustand store) so the app feels fast.
2. **Connectivity Check**: Check `navigator.onLine`.
3. **If Online**: Attempt to send the payload to the backend API.
4. **If Offline or API fails**:
   - Save the action and payload to the IndexedDB sync queue.
   - Update the UI to show a "Pending sync" or "Saved offline" status.

### 3. Synchronization Listener
- Add event listeners for `online` and `offline` events on the `window` object.
- When the `online` event fires:
  1. Read all items from the IndexedDB sync queue.
  2. Iterate through them and send them to the respective backend endpoints in chronological order.
  3. On successful response, delete the item from the IndexedDB queue.
  4. Update the UI status to "Synced".

### 4. UI/UX Requirements
- **Status Indicator**: A subtle indicator (e.g., in the header or the Blob companion area) showing:
  - 🟢 Online / Synced
  - 🟡 Offline (Saved locally)
  - 🔄 Syncing...
- **Conflict Handling**: Since history is read-only (per PRD), conflicts are minimized. Assume the client timestamp is the source of truth for the event time.

## Best Practices
- **Batching**: If many events are queued, consider implementing a batch sync endpoint on the backend to reduce network requests.
- **Idempotency**: Ensure backend endpoints can handle duplicate requests gracefully in case a sync is interrupted and retried.

## Reference Files
- `AGENT.md` (Offline Behaviour section)
- PRD (Core features)
