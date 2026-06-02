---
description: Identify slow components using React Profiler
---

1. **Install DevTools**:
   - Install React Developer Tools extension for Chrome/Firefox.

2. **Record Session**:
   - Open DevTools -> Profiler tab.
   - Click the "Record" circle.
   - Interact with your app (perform the slow action).
   - Stop recording.

3. **Analyze**:
   - Look for yellow/red bars in the flamegraph.
   - Check "Why did this render?" to find unnecessary re-renders.

4. **Pro Tips**:
   - Enable "Highlight updates when components render" in React DevTools settings to visualize re-renders in real-time.
