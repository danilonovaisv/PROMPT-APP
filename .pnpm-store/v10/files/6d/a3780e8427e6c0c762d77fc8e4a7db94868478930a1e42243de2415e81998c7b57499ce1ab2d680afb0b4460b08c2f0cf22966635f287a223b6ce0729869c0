// src/main.ts
import { mkdir } from "fs/promises";
import { createServer as createNetServer } from "net";
import { PGlite } from "@electric-sql/pglite";
import { fromNodeSocket } from "pg-gateway/node";

// src/lib/notifications.ts
var NOTIFICATION_RESPONSE = 65;
var textEncoder = new TextEncoder();
function buildNotificationResponse(channel, payload, processId = 0) {
  const channelBytes = textEncoder.encode(channel);
  const payloadBytes = textEncoder.encode(payload);
  const bodyLength = 10 + channelBytes.length + payloadBytes.length;
  const buf = new Uint8Array(1 + bodyLength);
  const view = new DataView(buf.buffer);
  let offset = 0;
  buf[offset++] = NOTIFICATION_RESPONSE;
  view.setInt32(offset, bodyLength);
  offset += 4;
  view.setInt32(offset, processId);
  offset += 4;
  buf.set(channelBytes, offset);
  offset += channelBytes.length;
  buf[offset++] = 0;
  buf.set(payloadBytes, offset);
  offset += payloadBytes.length;
  buf[offset++] = 0;
  return buf;
}
function broadcastNotifications(db, connections) {
  return db.onNotification((channel, payload) => {
    const message = buildNotificationResponse(channel, payload);
    for (const socket of connections) {
      if (!socket.destroyed) {
        socket.write(message);
      }
    }
  });
}

// src/lib/migrations.ts
import { readdir, readFile } from "fs/promises";
import { join } from "path";
var MIGRATION_DIR_PATTERN = /^\d+_.+$/;
var MIGRATION_FILE = "migration.sql";
var TRACKING_TABLE = "netlify_migrations";
function isMigrationDirectory(entry) {
  return entry.isDirectory() && MIGRATION_DIR_PATTERN.test(entry.name);
}
async function applyMigrations(db, migrationsDirectory, target) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  let entries;
  try {
    const dirents = await readdir(migrationsDirectory, { withFileTypes: true });
    entries = dirents.filter(isMigrationDirectory).map((d) => d.name);
  } catch {
    throw new Error(`Migration directory not found: ${migrationsDirectory}`);
  }
  entries.sort();
  let migrationsToConsider;
  if (target === void 0) {
    migrationsToConsider = entries;
  } else {
    let targetIndex = entries.indexOf(target);
    if (targetIndex === -1) {
      targetIndex = entries.findIndex((name) => name.startsWith(`${target}_`));
    }
    if (targetIndex === -1) {
      throw new Error(`No migration found matching target: ${target}`);
    }
    migrationsToConsider = entries.slice(0, targetIndex + 1);
  }
  const result = await db.query(`SELECT name FROM ${TRACKING_TABLE} WHERE name = ANY($1)`, [
    migrationsToConsider
  ]);
  const alreadyApplied = new Set(result.rows.map((row) => row.name));
  const applied = [];
  for (const name of migrationsToConsider) {
    if (alreadyApplied.has(name)) {
      continue;
    }
    const sqlPath = join(migrationsDirectory, name, MIGRATION_FILE);
    let sql;
    try {
      sql = await readFile(sqlPath, "utf-8");
    } catch {
      throw new Error(`${MIGRATION_FILE} not found in migration directory: ${name}`);
    }
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query(`INSERT INTO ${TRACKING_TABLE} (name) VALUES ($1)`, [name]);
    });
    applied.push(name);
  }
  return applied;
}

// src/main.ts
var DEFAULT_HOST = "localhost";
async function resetDatabase(db) {
  const result = await db.query(
    `SELECT schema_name
     FROM information_schema.schemata
     WHERE schema_name <> 'information_schema'
       AND schema_name NOT LIKE 'pg_%'`
  );
  for (const { schema_name } of result.rows) {
    const escapedSchemaName = schema_name.replaceAll('"', '""');
    await db.exec(`DROP SCHEMA "${escapedSchemaName}" CASCADE`);
  }
  await db.exec("CREATE SCHEMA IF NOT EXISTS public");
}
var NetlifyDB = class {
  db;
  directory;
  logger;
  port;
  server;
  // All active client sockets, tracked so notifications can be broadcast
  // and so they can be destroyed on stop().
  connections = /* @__PURE__ */ new Set();
  // Unsubscribe function for the global onNotification handler.
  unsubNotification;
  constructor({ directory, logger, port } = {}) {
    this.directory = directory;
    this.logger = logger ?? console.log;
    this.port = port;
  }
  async start() {
    if (this.directory) {
      await mkdir(this.directory, { recursive: true });
    }
    this.db = await PGlite.create(this.directory);
    this.unsubNotification = broadcastNotifications(this.db, this.connections);
    this.server = createNetServer((socket) => {
      this.handleConnection(socket);
    });
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error("Server not initialized"));
        return;
      }
      this.server.on("error", reject);
      this.server.listen(this.port ?? 0, DEFAULT_HOST, () => {
        this.server?.off("error", reject);
        const { address, port } = this.server?.address();
        const host = address === "::1" || address === "127.0.0.1" ? "localhost" : address;
        resolve(`postgres://${host}:${String(port)}/postgres`);
      });
    });
  }
  async applyMigrations(migrationsDirectory, target) {
    if (!this.db) {
      throw new Error("Database has not been started. Call start() before applying migrations.");
    }
    return applyMigrations(this.db, migrationsDirectory, target);
  }
  async reset() {
    if (!this.db) {
      throw new Error("Database has not been started. Call start() before resetting.");
    }
    await resetDatabase(this.db);
  }
  async exec(sql) {
    if (!this.db) {
      throw new Error("Database has not been started. Call start() before executing queries.");
    }
    return this.db.exec(sql);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  async query(sql, params) {
    if (!this.db) {
      throw new Error("Database has not been started. Call start() before executing queries.");
    }
    return this.db.query(sql, params);
  }
  async transaction(fn) {
    if (!this.db) {
      throw new Error("Database has not been started. Call start() before executing queries.");
    }
    return this.db.transaction(fn);
  }
  async stop() {
    if (this.unsubNotification) {
      this.unsubNotification();
      this.unsubNotification = void 0;
    }
    for (const socket of this.connections) {
      socket.destroy();
    }
    this.connections.clear();
    await new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    if (this.db) {
      await this.db.close();
      this.db = void 0;
    }
  }
  handleConnection(socket) {
    if (!this.db) {
      return;
    }
    const db = this.db;
    this.connections.add(socket);
    socket.on("close", () => {
      this.connections.delete(socket);
    });
    fromNodeSocket(socket, {
      serverVersion: "16.3 (NetlifyDB/pglite)",
      auth: {
        method: "trust"
      },
      async onMessage(data, { isAuthenticated }) {
        if (!isAuthenticated) {
          return;
        }
        return db.execProtocolRaw(data);
      }
    }).catch((error) => {
      if (error instanceof Error && error.message.includes("ECONNRESET")) {
        return;
      }
      this.logger("Unexpected connection error:", error);
    });
  }
};
export {
  NetlifyDB,
  applyMigrations,
  resetDatabase
};
