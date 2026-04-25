import { a as normalizeBody, c as LINK, l as SYMLINK, n as createTarPacker, o as DIRECTORY, r as transformHeader, s as FILE, t as createUnpacker } from "../unpacker-Dcww6JeE.js";
import * as fs from "node:fs/promises";
import { cpus } from "node:os";
import * as path from "node:path";
import { Readable, Writable } from "node:stream";
import * as fs$1 from "node:fs";

//#region src/fs/cache.ts
const createCache = () => {
	const m = /* @__PURE__ */ new Map();
	return {
		get(k) {
			const v = m.get(k);
			if (m.delete(k)) m.set(k, v);
			return v;
		},
		set(k, v) {
			if (m.set(k, v).size > 1e4) m.delete(m.keys().next().value);
		}
	};
};

//#endregion
//#region src/fs/path.ts
const unicodeCache = createCache();
const normalizeUnicode = (s) => {
	for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) >= 128) {
		const cached = unicodeCache.get(s);
		if (cached !== void 0) return cached;
		const normalized = s.normalize("NFD");
		unicodeCache.set(s, normalized);
		return normalized;
	}
	return s;
};
function validateBounds(targetPath, destDir, errorMessage) {
	const target = normalizeUnicode(path.resolve(targetPath));
	const dest = path.resolve(destDir);
	if (target !== dest && !target.startsWith(dest + path.sep)) throw new Error(errorMessage);
}
const win32Reserved = {
	":": "",
	"<": "",
	">": "",
	"|": "",
	"?": "",
	"*": "",
	"\"": ""
};
function normalizeName(name) {
	const path$1 = name.replace(/\\/g, "/");
	if (path$1.split("/").includes("..") || /^[a-zA-Z]:\.\./.test(path$1)) throw new Error(`${name} points outside extraction directory`);
	let relative = path$1;
	if (/^[a-zA-Z]:/.test(relative)) relative = relative.replace(/^[a-zA-Z]:[/\\]?/, "");
	else if (relative.startsWith("/")) relative = relative.replace(/^\/+/, "");
	if (process.platform === "win32") return relative.replace(/[<>:"|?*]/g, (char) => win32Reserved[char]);
	return relative;
}
const normalizeHeaderName = (s) => normalizeUnicode(normalizeName(s.replace(/\/+$/, "")));

//#endregion
//#region src/fs/pack.ts
const packTarSources = packTar;
function packTar(sources, options = {}) {
	const stream = new Readable({ read() {} });
	(async () => {
		const packer = createTarPacker((chunk) => stream.push(Buffer.from(chunk)), stream.destroy.bind(stream), () => stream.push(null));
		const { dereference = false, filter, map, baseDir, concurrency = cpus().length || 8 } = options;
		const isDir = typeof sources === "string";
		const directoryPath = isDir ? path.resolve(sources) : null;
		const jobs = isDir ? (await fs.readdir(directoryPath, { withFileTypes: true })).map((entry) => ({
			type: entry.isDirectory() ? DIRECTORY : FILE,
			source: path.join(directoryPath, entry.name),
			target: entry.name
		})) : sources;
		const results = /* @__PURE__ */ new Map();
		const resolvers = /* @__PURE__ */ new Map();
		const seenInodes = /* @__PURE__ */ new Map();
		let jobIndex = 0;
		let writeIndex = 0;
		let activeWorkers = 0;
		let allJobsQueued = false;
		const writer = async () => {
			const readBufferSmall = Buffer.alloc(64 * 1024);
			let readBufferLarge = null;
			while (true) {
				if (stream.destroyed) return;
				if (allJobsQueued && writeIndex >= jobs.length) break;
				if (!results.has(writeIndex)) {
					await new Promise((resolve) => resolvers.set(writeIndex, resolve));
					continue;
				}
				const result = results.get(writeIndex);
				results.delete(writeIndex);
				resolvers.delete(writeIndex);
				if (!result) {
					writeIndex++;
					continue;
				}
				packer.add(result.header);
				if (result.body) if (result.body instanceof Uint8Array) {
					if (result.body.length > 0) packer.write(result.body);
				} else if (result.body instanceof Readable || result.body instanceof ReadableStream) try {
					for await (const chunk of result.body) {
						if (stream.destroyed) break;
						packer.write(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
					}
				} catch (error) {
					stream.destroy(error);
					return;
				}
				else {
					const { handle, size } = result.body;
					const readBuffer = size > 1048576 ? readBufferLarge ??= Buffer.alloc(512 * 1024) : readBufferSmall;
					try {
						let bytesLeft = size;
						while (bytesLeft > 0 && !stream.destroyed) {
							const toRead = Math.min(bytesLeft, readBuffer.length);
							const { bytesRead } = await handle.read(readBuffer, 0, toRead, null);
							if (bytesRead === 0) break;
							packer.write(readBuffer.subarray(0, bytesRead));
							bytesLeft -= bytesRead;
						}
					} catch (error) {
						stream.destroy(error);
						return;
					} finally {
						await handle.close();
					}
				}
				packer.endEntry();
				writeIndex++;
			}
		};
		const controller = () => {
			if (stream.destroyed || allJobsQueued) return;
			while (activeWorkers < concurrency && jobIndex < jobs.length) {
				activeWorkers++;
				const currentIndex = jobIndex++;
				processJob(jobs[currentIndex], currentIndex).catch(stream.destroy.bind(stream)).finally(() => {
					activeWorkers--;
					controller();
				});
			}
			if (activeWorkers === 0 && jobIndex >= jobs.length) {
				allJobsQueued = true;
				resolvers.get(writeIndex)?.();
			}
		};
		const processJob = async (job, index) => {
			let jobResult = null;
			const target = normalizeName(job.target);
			try {
				if (job.type === "content" || job.type === "stream") {
					let body$1;
					let size;
					const isDir$1 = target.endsWith("/");
					if (job.type === "stream") {
						if (typeof job.size !== "number" || !isDir$1 && job.size <= 0 || isDir$1 && job.size !== 0) throw new Error(isDir$1 ? "Streams for directories must have size 0." : "Streams require a positive size.");
						size = job.size;
						body$1 = job.content;
					} else {
						const content = await normalizeBody(job.content);
						size = content.length;
						body$1 = content;
					}
					const stat$1 = {
						size: isDir$1 ? 0 : size,
						isFile: () => !isDir$1,
						isDirectory: () => isDir$1,
						isSymbolicLink: () => false,
						mode: job.mode,
						mtime: job.mtime ?? /* @__PURE__ */ new Date(),
						uid: job.uid ?? 0,
						gid: job.gid ?? 0
					};
					if (filter && !filter(target, stat$1)) return;
					let header$1 = {
						name: target,
						type: isDir$1 ? DIRECTORY : FILE,
						size: isDir$1 ? 0 : size,
						mode: stat$1.mode,
						mtime: stat$1.mtime,
						uid: stat$1.uid,
						gid: stat$1.gid,
						uname: job.uname,
						gname: job.gname
					};
					if (map) header$1 = map(header$1);
					jobResult = {
						header: header$1,
						body: isDir$1 ? void 0 : body$1
					};
					return;
				}
				let stat = await fs.lstat(job.source, { bigint: true });
				if (dereference && stat.isSymbolicLink()) {
					const linkTarget = await fs.readlink(job.source);
					const resolved = path.resolve(path.dirname(job.source), linkTarget);
					const resolvedBase = baseDir ?? directoryPath ?? process.cwd();
					if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) return;
					stat = await fs.stat(job.source, { bigint: true });
				}
				if (filter && !filter(target, stat)) return;
				let header = {
					name: target,
					size: 0,
					mode: job.mode ?? Number(stat.mode),
					mtime: job.mtime ?? stat.mtime,
					uid: job.uid ?? Number(stat.uid),
					gid: job.gid ?? Number(stat.gid),
					uname: job.uname,
					gname: job.gname,
					type: FILE
				};
				let body;
				if (stat.isDirectory()) {
					header.type = DIRECTORY;
					header.name = target.endsWith("/") ? target : `${target}/`;
					try {
						for (const d of await fs.readdir(job.source, { withFileTypes: true })) jobs.push({
							type: d.isDirectory() ? DIRECTORY : FILE,
							source: path.join(job.source, d.name),
							target: `${header.name}${d.name}`
						});
					} catch {}
				} else if (stat.isSymbolicLink()) {
					header.type = SYMLINK;
					header.linkname = await fs.readlink(job.source);
				} else if (stat.isFile()) {
					header.size = Number(stat.size);
					if (stat.nlink > 1 && seenInodes.has(stat.ino)) {
						header.type = LINK;
						header.linkname = seenInodes.get(stat.ino);
						header.size = 0;
					} else {
						if (stat.nlink > 1) seenInodes.set(stat.ino, target);
						if (header.size > 0) if (header.size < 32 * 1024) body = await fs.readFile(job.source);
						else body = {
							handle: await fs.open(job.source, "r"),
							size: header.size
						};
					}
				} else return;
				if (map) header = map(header);
				jobResult = {
					header,
					body
				};
			} finally {
				results.set(index, jobResult);
				resolvers.get(index)?.();
			}
		};
		controller();
		await writer();
		if (!stream.destroyed) packer.finalize();
	})().catch((error) => stream.destroy(error));
	return stream;
}

//#endregion
//#region src/fs/concurrency.ts
const createOperationQueue = (concurrency) => {
	let active = 0;
	const tasks = [];
	let head = 0;
	let idle = null;
	let resolveIdle = null;
	const ensureIdle = () => idle ??= new Promise((resolve) => resolveIdle = resolve);
	const flush = () => {
		while (active < concurrency && head < tasks.length) {
			const task = tasks[head++];
			active++;
			task().finally(() => {
				active--;
				flush();
			});
		}
		if (head === tasks.length) {
			tasks.length = 0;
			head = 0;
			if (active === 0 && resolveIdle) {
				resolveIdle();
				idle = null;
				resolveIdle = null;
			}
		}
	};
	return {
		add(op) {
			const wasIdle = active === 0 && head === tasks.length;
			return new Promise((resolve, reject) => {
				tasks.push(() => Promise.resolve().then(op).then(resolve, reject));
				if (wasIdle) ensureIdle();
				flush();
			});
		},
		onIdle() {
			return active === 0 && head === tasks.length ? Promise.resolve() : ensureIdle();
		}
	};
};

//#endregion
//#region src/fs/file-sink.ts
const BATCH_BYTES = 256 * 1024;
const STATE_UNOPENED = 0;
const STATE_OPENING = 1;
const STATE_OPEN = 2;
const STATE_CLOSED = 3;
const STATE_FAILED = 4;
const DRAINED_PROMISE = Promise.resolve();
function createFileSink(path$1, { mode = 438, mtime } = {}) {
	let state = STATE_UNOPENED;
	let flushing = false;
	let fd = null;
	let queue = [];
	let spare = [];
	let bytes = 0;
	let storedError = null;
	let endPromise = null;
	let endResolve = null;
	let endReject = null;
	const waitResolves = [];
	const waitRejects = [];
	const settleWaiters = () => {
		if (waitResolves.length === 0) return;
		for (let i = 0; i < waitResolves.length; i++) waitResolves[i]();
		waitResolves.length = 0;
		waitRejects.length = 0;
	};
	const failWaiters = (error) => {
		if (waitRejects.length === 0) return;
		for (let i = 0; i < waitRejects.length; i++) waitRejects[i](error);
		waitRejects.length = 0;
		waitResolves.length = 0;
	};
	const resetBuffers = () => {
		bytes = 0;
		queue.length = 0;
		spare.length = 0;
	};
	const finish = () => {
		state = STATE_CLOSED;
		endResolve?.();
		settleWaiters();
	};
	const swapQueues = () => {
		const current = queue;
		queue = spare;
		spare = current;
		queue.length = 0;
		return current;
	};
	const fail = (error) => {
		if (storedError) return;
		storedError = error;
		state = STATE_FAILED;
		resetBuffers();
		flushing = false;
		const fdToClose = fd;
		fd = null;
		if (fdToClose !== null) fs$1.ftruncate(fdToClose, 0, () => fs$1.close(fdToClose));
		endReject?.(error);
		failWaiters(error);
	};
	const close = () => {
		if (fd === null) {
			finish();
			return;
		}
		const fdToClose = fd;
		fd = null;
		if (mtime) fs$1.futimes(fdToClose, mtime, mtime, (err) => {
			if (err) return fail(err);
			fs$1.close(fdToClose, (closeErr) => {
				if (closeErr) fail(closeErr);
				else finish();
			});
		});
		else fs$1.close(fdToClose, (err) => {
			if (err) fail(err);
			else finish();
		});
	};
	const flush = () => {
		if (flushing || queue.length === 0 || state !== STATE_OPEN) return;
		flushing = true;
		const bufs = swapQueues();
		const onDone = (err, written = 0) => {
			if (err) return fail(err);
			flushing = false;
			bytes -= written;
			spare.length = 0;
			if (bytes < BATCH_BYTES) settleWaiters();
			if (queue.length > 0) flush();
			else if (endResolve) close();
		};
		if (bufs.length === 1) {
			const buf = bufs[0];
			fs$1.write(fd, buf, 0, buf.length, null, onDone);
		} else fs$1.writev(fd, bufs, onDone);
	};
	const open = () => {
		if (state !== STATE_UNOPENED) return;
		state = STATE_OPENING;
		fs$1.open(path$1, "w", mode, (err, openFd) => {
			if (err) return fail(err);
			if (state === STATE_CLOSED || state === STATE_FAILED) {
				fs$1.close(openFd);
				return;
			}
			fd = openFd;
			state = STATE_OPEN;
			if (endResolve) if (queue.length > 0) flush();
			else close();
			else if (bytes >= BATCH_BYTES && !flushing) flush();
			else settleWaiters();
		});
	};
	const write = (chunk) => {
		if (storedError || state >= STATE_CLOSED || endResolve) return false;
		if (state !== STATE_OPEN && state !== STATE_OPENING) open();
		const buf = Buffer.isBuffer(chunk) ? chunk : chunk instanceof Uint8Array ? Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength) : Buffer.from(chunk);
		if (buf.length === 0) return bytes < BATCH_BYTES;
		queue.push(buf);
		bytes += buf.length;
		if (state === STATE_OPEN && !flushing && bytes >= BATCH_BYTES) flush();
		return bytes < BATCH_BYTES;
	};
	const waitDrain = () => {
		if (bytes < BATCH_BYTES || state !== STATE_OPEN) return DRAINED_PROMISE;
		return new Promise((resolve, reject) => {
			waitResolves.push(resolve);
			waitRejects.push(reject);
		});
	};
	const end = () => {
		if (state >= STATE_CLOSED) return DRAINED_PROMISE;
		if (storedError) return Promise.reject(storedError);
		if (endPromise) return endPromise;
		endPromise = new Promise((resolve, reject) => {
			endResolve = resolve;
			endReject = reject;
			if (state !== STATE_OPEN && state !== STATE_OPENING) open();
			else if (state === STATE_OPEN && !flushing) if (queue.length > 0) flush();
			else close();
		});
		return endPromise;
	};
	const destroy = (error) => {
		if (error) {
			fail(error);
			return;
		}
		if (state >= STATE_CLOSED || storedError) return;
		resetBuffers();
		flushing = false;
		if (fd !== null) {
			const fdToClose = fd;
			fd = null;
			fs$1.close(fdToClose);
		}
		finish();
	};
	return {
		write,
		end,
		destroy,
		waitDrain
	};
}

//#endregion
//#region src/fs/path-cache.ts
const ENOENT = "ENOENT";
const createPathCache = (destDirPath, options) => {
	const dirPromises = createCache();
	const pathConflicts = createCache();
	const deferredLinks = [];
	const realDirCache = createCache();
	const initializeDestDir = async (destDirPath$1) => {
		const symbolic = normalizeUnicode(path.resolve(destDirPath$1));
		try {
			await fs.mkdir(symbolic, { recursive: true });
		} catch (err) {
			if (err.code === ENOENT) {
				const parentDir = path.dirname(symbolic);
				if (parentDir === symbolic) throw err;
				await fs.mkdir(parentDir, { recursive: true });
				await fs.mkdir(symbolic, { recursive: true });
			} else throw err;
		}
		try {
			return {
				symbolic,
				real: await fs.realpath(symbolic)
			};
		} catch (err) {
			if (err.code === ENOENT) return {
				symbolic,
				real: symbolic
			};
			throw err;
		}
	};
	const destDirPromise = initializeDestDir(destDirPath);
	destDirPromise.catch(() => {});
	const getRealDir = async (dirPath, errorMessage) => {
		const destDir = await destDirPromise;
		if (dirPath === destDir.symbolic) {
			validateBounds(destDir.real, destDir.real, errorMessage);
			return destDir.real;
		}
		let promise = realDirCache.get(dirPath);
		if (!promise) {
			promise = fs.realpath(dirPath).then((realPath) => {
				validateBounds(realPath, destDir.real, errorMessage);
				return realPath;
			});
			realDirCache.set(dirPath, promise);
		}
		const realDir = await promise;
		validateBounds(realDir, destDir.real, errorMessage);
		return realDir;
	};
	const prepareDirectory = async (dirPath, mode) => {
		let promise = dirPromises.get(dirPath);
		if (promise) return promise;
		promise = (async () => {
			if (dirPath === (await destDirPromise).symbolic) return;
			await prepareDirectory(path.dirname(dirPath));
			try {
				const stat = await fs.lstat(dirPath);
				if (stat.isDirectory()) return;
				if (stat.isSymbolicLink()) try {
					const realPath = await getRealDir(dirPath, `Symlink "${dirPath}" points outside the extraction directory.`);
					if ((await fs.stat(realPath)).isDirectory()) return;
				} catch (err) {
					if (err.code === ENOENT) throw new Error(`Symlink "${dirPath}" points outside the extraction directory.`);
					throw err;
				}
				throw new Error(`"${dirPath}" is not a valid directory component.`);
			} catch (err) {
				if (err.code === ENOENT) {
					await fs.mkdir(dirPath, { mode: mode ?? options.dmode });
					return;
				}
				throw err;
			}
		})();
		dirPromises.set(dirPath, promise);
		return promise;
	};
	return {
		async ready() {
			await destDirPromise;
		},
		async preparePath(header) {
			const { name, linkname, type, mode, mtime } = header;
			const { maxDepth = 1024, dmode } = options;
			const normalizedName = normalizeHeaderName(name);
			const destDir = await destDirPromise;
			const outPath = path.join(destDir.symbolic, normalizedName);
			validateBounds(outPath, destDir.symbolic, `Entry "${name}" points outside the extraction directory.`);
			if (maxDepth !== Infinity) {
				let depth = 1;
				for (const char of normalizedName) if (char === "/" && ++depth > maxDepth) throw new Error("Tar exceeds max specified depth.");
			}
			const prevOp = pathConflicts.get(normalizedName);
			if (prevOp) {
				if (prevOp === DIRECTORY && type !== DIRECTORY || prevOp !== DIRECTORY && type === DIRECTORY) throw new Error(`Path conflict ${type} over existing ${prevOp} at "${name}"`);
				return;
			}
			const parentDir = path.dirname(outPath);
			switch (type) {
				case DIRECTORY: {
					pathConflicts.set(normalizedName, DIRECTORY);
					const safeMode = mode ? mode & 511 : void 0;
					await prepareDirectory(outPath, dmode ?? safeMode);
					if (mtime) await fs.lutimes(outPath, mtime, mtime).catch(() => {});
					return;
				}
				case FILE:
					pathConflicts.set(normalizedName, FILE);
					await prepareDirectory(parentDir);
					return outPath;
				case SYMLINK:
					pathConflicts.set(normalizedName, SYMLINK);
					if (!linkname) return;
					await prepareDirectory(parentDir);
					validateBounds(path.resolve(parentDir, linkname), destDir.symbolic, `Symlink "${linkname}" points outside the extraction directory.`);
					await fs.symlink(linkname, outPath);
					if (mtime) await fs.lutimes(outPath, mtime, mtime).catch(() => {});
					return;
				case LINK: {
					pathConflicts.set(normalizedName, LINK);
					if (!linkname) return;
					const normalizedLink = normalizeUnicode(linkname);
					if (path.isAbsolute(normalizedLink)) throw new Error(`Hardlink "${linkname}" points outside the extraction directory.`);
					const linkTarget = path.join(destDir.symbolic, normalizedLink);
					validateBounds(linkTarget, destDir.symbolic, `Hardlink "${linkname}" points outside the extraction directory.`);
					await prepareDirectory(path.dirname(linkTarget));
					const realTargetParent = await getRealDir(path.dirname(linkTarget), `Hardlink "${linkname}" points outside the extraction directory.`);
					validateBounds(path.join(realTargetParent, path.basename(linkTarget)), destDir.real, `Hardlink "${linkname}" points outside the extraction directory.`);
					if (linkTarget !== outPath) {
						await prepareDirectory(parentDir);
						deferredLinks.push({
							linkTarget,
							outPath
						});
					}
					return;
				}
				default: return;
			}
		},
		async applyLinks() {
			for (const { linkTarget, outPath } of deferredLinks) try {
				await fs.link(linkTarget, outPath);
			} catch (err) {
				if (err.code === ENOENT) throw new Error(`Hardlink target "${linkTarget}" does not exist for link at "${outPath}".`);
				throw err;
			}
		}
	};
};

//#endregion
//#region src/fs/unpack.ts
function unpackTar(directoryPath, options = {}) {
	const unpacker = createUnpacker(options);
	const opQueue = createOperationQueue(options.concurrency || cpus().length || 8);
	const pathCache = createPathCache(directoryPath, options);
	let currentFileStream = null;
	let currentWriteCallback = null;
	return new Writable({
		async write(chunk, _, cb) {
			try {
				unpacker.write(chunk);
				if (unpacker.isEntryActive()) {
					if (currentFileStream && currentWriteCallback) {
						let needsDrain = false;
						const writeCallback = currentWriteCallback;
						while (!unpacker.isBodyComplete()) {
							needsDrain = false;
							if (unpacker.streamBody(writeCallback) === 0) if (needsDrain) await currentFileStream.waitDrain();
							else {
								cb();
								return;
							}
						}
						while (!unpacker.skipPadding()) {
							cb();
							return;
						}
						const streamToClose = currentFileStream;
						if (streamToClose) opQueue.add(() => streamToClose.end());
						currentFileStream = null;
						currentWriteCallback = null;
					} else if (!unpacker.skipEntry()) {
						cb();
						return;
					}
				}
				while (true) {
					const header = unpacker.readHeader();
					if (header === void 0 || header === null) {
						cb();
						return;
					}
					const transformedHeader = transformHeader(header, options);
					if (!transformedHeader) {
						if (!unpacker.skipEntry()) {
							cb();
							return;
						}
						continue;
					}
					const outPath = await opQueue.add(() => pathCache.preparePath(transformedHeader));
					if (outPath) {
						const safeMode = transformedHeader.mode ? transformedHeader.mode & 511 : void 0;
						const fileStream = createFileSink(outPath, {
							mode: options.fmode ?? safeMode,
							mtime: transformedHeader.mtime ?? void 0
						});
						let needsDrain = false;
						const writeCallback = (chunk$1) => {
							const writeOk = fileStream.write(chunk$1);
							if (!writeOk) needsDrain = true;
							return writeOk;
						};
						while (!unpacker.isBodyComplete()) {
							needsDrain = false;
							if (unpacker.streamBody(writeCallback) === 0) if (needsDrain) await fileStream.waitDrain();
							else {
								currentFileStream = fileStream;
								currentWriteCallback = writeCallback;
								cb();
								return;
							}
						}
						while (!unpacker.skipPadding()) {
							currentFileStream = fileStream;
							currentWriteCallback = writeCallback;
							cb();
							return;
						}
						opQueue.add(() => fileStream.end());
					} else if (!unpacker.skipEntry()) {
						cb();
						return;
					}
				}
			} catch (err) {
				cb(err);
			}
		},
		async final(cb) {
			try {
				unpacker.end();
				unpacker.validateEOF();
				await pathCache.ready();
				await opQueue.onIdle();
				await pathCache.applyLinks();
				cb();
			} catch (err) {
				cb(err);
			}
		},
		destroy(error, callback) {
			(async () => {
				if (currentFileStream) {
					currentFileStream.destroy(error ?? void 0);
					currentFileStream = null;
					currentWriteCallback = null;
				}
				await opQueue.onIdle();
			})().then(() => callback(error ?? null), (e) => callback(error ?? (e instanceof Error ? e : /* @__PURE__ */ new Error("Stream destroyed"))));
		}
	});
}

//#endregion
export { packTar, packTarSources, unpackTar };