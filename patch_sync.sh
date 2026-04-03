cat << 'INNER_EOF' > patch.diff
--- src/services/syncService.ts
+++ src/services/syncService.ts
@@ -397,20 +397,20 @@
         ]);

       const categoriesByRemoteId = new Map<number, Category>(
-        allLocalCategories
+        (allLocalCategories as Category[])
           .filter((c): c is Category & { remoteId: number } => c.remoteId !== undefined)
           .map((c) => [c.remoteId, c]),
       );
       const menusByRemoteId = new Map<number, ContextMenu>(
-        allLocalMenus
+        (allLocalMenus as ContextMenu[])
           .filter((m): m is ContextMenu & { remoteId: number } => m.remoteId !== undefined)
           .map((m) => [m.remoteId, m]),
       );
       const menusByMenuId = new Map<string, ContextMenu>(
-        allLocalMenus.map((m) => [m.menuId, m]),
+        (allLocalMenus as ContextMenu[]).map((m) => [m.menuId, m]),
       );
       const promptsByRemoteId = new Map<number, Prompt>(
-        allLocalPrompts
+        (allLocalPrompts as Prompt[])
           .filter((p): p is Prompt & { remoteId: number } => p.remoteId !== undefined)
           .map((p) => [p.remoteId, p]),
       );
INNER_EOF
patch src/services/syncService.ts < patch.diff
