---
description: description: Real-time data sync
---

---

description: Real-time data sync
---

1. **Enable Realtime**:
   - Go to Database → Replication in Supabase.

2. **Subscribe to Changes**:

   ```tsx
   const channel = supabase
     .channel('messages')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
       if (payload.eventType === 'INSERT') {
         setMessages((prev) => [...prev, payload.new]);
       }
     })
     .subscribe();
   ```

3. **Implement Presence**:

   ```tsx
   await channel.track({ user: 'John', online_at: new Date() });
   ```

4. **Pro Tips**:
   - Use RLS for security.
   - Combine with React Query.
