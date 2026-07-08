# STEP 2: NETLIFY AUDIT
- O projeto apresenta deploy via Netlify. O arquivo principal netlify.toml não se encontrava na raiz da exploração (o que indicaria que ou as configs estão setadas pela UI do Netlify usando scripts do package.json \`"build": "tsc -p tsconfig.app.json && vite build"\` e publish dir \`dist\`, ou foram movidas/estão em outro repositório).
- Não há serverless ou edge functions (projeto é majoritariamente um Vite SPA client-side com persistência Supabase e IndexedDB Dexie local).
- Headers controlam as requests localmente e o netlify-cli existe nas devDependencies.
