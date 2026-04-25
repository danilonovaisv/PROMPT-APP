//#region src/tar/constants.ts
const BLOCK_SIZE = 512;
const BLOCK_SIZE_MASK = 511;
const DEFAULT_FILE_MODE = 420;
const DEFAULT_DIR_MODE = 493;
const USTAR_NAME_OFFSET = 0;
const USTAR_NAME_SIZE = 100;
const USTAR_MODE_OFFSET = 100;
const USTAR_MODE_SIZE = 8;
const USTAR_UID_OFFSET = 108;
const USTAR_UID_SIZE = 8;
const USTAR_GID_OFFSET = 116;
const USTAR_GID_SIZE = 8;
const USTAR_SIZE_OFFSET = 124;
const USTAR_SIZE_SIZE = 12;
const USTAR_MTIME_OFFSET = 136;
const USTAR_MTIME_SIZE = 12;
const USTAR_CHECKSUM_OFFSET = 148;
const USTAR_CHECKSUM_SIZE = 8;
const USTAR_TYPEFLAG_OFFSET = 156;
const USTAR_TYPEFLAG_SIZE = 1;
const USTAR_LINKNAME_OFFSET = 157;
const USTAR_LINKNAME_SIZE = 100;
const USTAR_MAGIC_OFFSET = 257;
const USTAR_MAGIC_SIZE = 6;
const USTAR_VERSION_OFFSET = 263;
const USTAR_VERSION_SIZE = 2;
const USTAR_UNAME_OFFSET = 265;
const USTAR_UNAME_SIZE = 32;
const USTAR_GNAME_OFFSET = 297;
const USTAR_GNAME_SIZE = 32;
const USTAR_PREFIX_OFFSET = 345;
const USTAR_PREFIX_SIZE = 155;
const USTAR_VERSION = "00";
const USTAR_MAX_UID_GID = 2097151;
const USTAR_MAX_SIZE = 8589934591;
const FILE = "file";
const LINK = "link";
const SYMLINK = "symlink";
const DIRECTORY = "directory";
const TYPEFLAG = {
	file: "0",
	link: "1",
	symlink: "2",
	"character-device": "3",
	"block-device": "4",
	directory: "5",
	fifo: "6",
	"pax-header": "x",
	"pax-global-header": "g",
	"gnu-long-name": "L",
	"gnu-long-link-name": "K"
};
const FLAGTYPE = {
	"0": FILE,
	"1": LINK,
	"2": SYMLINK,
	"3": "character-device",
	"4": "block-device",
	"5": DIRECTORY,
	"6": "fifo",
	x: "pax-header",
	g: "pax-global-header",
	L: "gnu-long-name",
	K: "gnu-long-link-name"
};
const ZERO_BLOCK = new Uint8Array(BLOCK_SIZE);
const EMPTY = new Uint8Array(0);

//#endregion
//#region src/tar/encoding.ts
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function writeString(view, offset, size, value) {
	if (value) encoder.encodeInto(value, view.subarray(offset, offset + size));
}
function writeOctal(view, offset, size, value) {
	if (value === void 0) return;
	const octalString = value.toString(8).padStart(size - 1, "0");
	encoder.encodeInto(octalString, view.subarray(offset, offset + size - 1));
}
function readString(view, offset, size) {
	const end = view.indexOf(0, offset);
	const sliceEnd = end === -1 || end > offset + size ? offset + size : end;
	return decoder.decode(view.subarray(offset, sliceEnd));
}
function readOctal(view, offset, size) {
	let value = 0;
	const end = offset + size;
	for (let i = offset; i < end; i++) {
		const charCode = view[i];
		if (charCode === 0) break;
		if (charCode === 32) continue;
		value = value * 8 + (charCode - 48);
	}
	return value;
}
function readNumeric(view, offset, size) {
	if (view[offset] & 128) {
		let result = 0;
		result = view[offset] & 127;
		for (let i = 1; i < size; i++) result = result * 256 + view[offset + i];
		if (!Number.isSafeInteger(result)) throw new Error("TAR number too large");
		return result;
	}
	return readOctal(view, offset, size);
}

//#endregion
//#region src/tar/body.ts
const isBodyless = (header) => header.type === DIRECTORY || header.type === SYMLINK || header.type === LINK || header.type === "character-device" || header.type === "block-device" || header.type === "fifo";
async function normalizeBody(body) {
	if (body === null || body === void 0) return EMPTY;
	if (body instanceof Uint8Array) return body;
	if (typeof body === "string") return encoder.encode(body);
	if (body instanceof ArrayBuffer) return new Uint8Array(body);
	if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
	throw new TypeError("Unsupported content type for entry body.");
}

//#endregion
//#region src/tar/options.ts
const stripPath = (p, n) => {
	const parts = p.split("/").filter(Boolean);
	return n >= parts.length ? "" : parts.slice(n).join("/");
};
function transformHeader(header, options) {
	const { strip, filter, map } = options;
	if (!strip && !filter && !map) return header;
	const h = { ...header };
	if (strip && strip > 0) {
		const newName = stripPath(h.name, strip);
		if (!newName) return null;
		h.name = h.type === DIRECTORY && !newName.endsWith("/") ? `${newName}/` : newName;
		if (h.linkname) {
			const isAbsolute = h.linkname.startsWith("/");
			if (isAbsolute || h.type === LINK) {
				const stripped = stripPath(h.linkname, strip);
				h.linkname = isAbsolute ? `/${stripped}` || "/" : stripped;
			}
		}
	}
	if (filter?.(h) === false) return null;
	const result = map ? map(h) : h;
	if (result && (!result.name || !result.name.trim() || result.name === "." || result.name === "/")) return null;
	return result;
}

//#endregion
//#region src/tar/checksum.ts
const CHECKSUM_SPACE = 32;
const ASCII_ZERO = 48;
function validateChecksum(block) {
	const stored = readOctal(block, USTAR_CHECKSUM_OFFSET, USTAR_CHECKSUM_SIZE);
	let sum = 0;
	for (let i = 0; i < block.length; i++) if (i >= USTAR_CHECKSUM_OFFSET && i < USTAR_CHECKSUM_OFFSET + USTAR_CHECKSUM_SIZE) sum += CHECKSUM_SPACE;
	else sum += block[i];
	return stored === sum;
}
function writeChecksum(block) {
	block.fill(CHECKSUM_SPACE, USTAR_CHECKSUM_OFFSET, USTAR_CHECKSUM_OFFSET + USTAR_CHECKSUM_SIZE);
	let checksum = 0;
	for (const byte of block) checksum += byte;
	for (let i = USTAR_CHECKSUM_OFFSET + 6 - 1; i >= USTAR_CHECKSUM_OFFSET; i--) {
		block[i] = (checksum & 7) + ASCII_ZERO;
		checksum >>= 3;
	}
	block[USTAR_CHECKSUM_OFFSET + 6] = 0;
	block[USTAR_CHECKSUM_OFFSET + 7] = CHECKSUM_SPACE;
}

//#endregion
//#region src/tar/pax.ts
function generatePax(header) {
	const paxRecords = {};
	if (header.name.length > USTAR_NAME_SIZE) {
		if (findUstarSplit(header.name) === null) paxRecords.path = header.name;
	}
	if (header.linkname && header.linkname.length > USTAR_NAME_SIZE) paxRecords.linkpath = header.linkname;
	if (header.uname && header.uname.length > USTAR_UNAME_SIZE) paxRecords.uname = header.uname;
	if (header.gname && header.gname.length > USTAR_GNAME_SIZE) paxRecords.gname = header.gname;
	if (header.uid != null && header.uid > USTAR_MAX_UID_GID) paxRecords.uid = String(header.uid);
	if (header.gid != null && header.gid > USTAR_MAX_UID_GID) paxRecords.gid = String(header.gid);
	if (header.size != null && header.size > USTAR_MAX_SIZE) paxRecords.size = String(header.size);
	if (header.pax) Object.assign(paxRecords, header.pax);
	const paxEntries = Object.entries(paxRecords);
	if (paxEntries.length === 0) return null;
	const paxBody = encoder.encode(paxEntries.map(([key, value]) => {
		const record = `${key}=${value}\n`;
		const partLength = encoder.encode(record).length + 1;
		let totalLength = partLength + String(partLength).length;
		totalLength = partLength + String(totalLength).length;
		return `${totalLength} ${record}`;
	}).join(""));
	return {
		paxHeader: createTarHeader({
			name: decoder.decode(encoder.encode(`PaxHeader/${header.name}`).slice(0, 100)),
			size: paxBody.length,
			type: "pax-header",
			mode: 420,
			mtime: header.mtime,
			uname: header.uname,
			gname: header.gname,
			uid: header.uid,
			gid: header.gid
		}),
		paxBody
	};
}
function findUstarSplit(path) {
	if (path.length <= USTAR_NAME_SIZE) return null;
	const minSlashIndex = path.length - USTAR_NAME_SIZE - 1;
	const slashIndex = path.lastIndexOf("/", USTAR_PREFIX_SIZE);
	if (slashIndex > 0 && slashIndex >= minSlashIndex) return {
		prefix: path.slice(0, slashIndex),
		name: path.slice(slashIndex + 1)
	};
	return null;
}

//#endregion
//#region src/tar/header.ts
function createTarHeader(header) {
	const view = new Uint8Array(BLOCK_SIZE);
	const size = isBodyless(header) ? 0 : header.size ?? 0;
	let name = header.name;
	let prefix = "";
	if (!header.pax?.path) {
		const split = findUstarSplit(name);
		if (split) {
			name = split.name;
			prefix = split.prefix;
		}
	}
	writeString(view, USTAR_NAME_OFFSET, USTAR_NAME_SIZE, name);
	writeOctal(view, USTAR_MODE_OFFSET, USTAR_MODE_SIZE, header.mode ?? (header.type === DIRECTORY ? DEFAULT_DIR_MODE : DEFAULT_FILE_MODE));
	writeOctal(view, USTAR_UID_OFFSET, USTAR_UID_SIZE, header.uid ?? 0);
	writeOctal(view, USTAR_GID_OFFSET, USTAR_GID_SIZE, header.gid ?? 0);
	writeOctal(view, USTAR_SIZE_OFFSET, USTAR_SIZE_SIZE, size);
	writeOctal(view, USTAR_MTIME_OFFSET, USTAR_MTIME_SIZE, Math.floor((header.mtime?.getTime() ?? Date.now()) / 1e3));
	writeString(view, USTAR_TYPEFLAG_OFFSET, USTAR_TYPEFLAG_SIZE, TYPEFLAG[header.type ?? FILE]);
	writeString(view, USTAR_LINKNAME_OFFSET, USTAR_LINKNAME_SIZE, header.linkname);
	writeString(view, USTAR_MAGIC_OFFSET, USTAR_MAGIC_SIZE, "ustar\0");
	writeString(view, USTAR_VERSION_OFFSET, USTAR_VERSION_SIZE, USTAR_VERSION);
	writeString(view, USTAR_UNAME_OFFSET, USTAR_UNAME_SIZE, header.uname);
	writeString(view, USTAR_GNAME_OFFSET, USTAR_GNAME_SIZE, header.gname);
	writeString(view, USTAR_PREFIX_OFFSET, USTAR_PREFIX_SIZE, prefix);
	writeChecksum(view);
	return view;
}
function parseUstarHeader(block, strict) {
	if (strict && !validateChecksum(block)) throw new Error("Invalid tar header checksum.");
	const typeflag = readString(block, USTAR_TYPEFLAG_OFFSET, USTAR_TYPEFLAG_SIZE);
	const header = {
		name: readString(block, USTAR_NAME_OFFSET, USTAR_NAME_SIZE),
		mode: readOctal(block, USTAR_MODE_OFFSET, USTAR_MODE_SIZE),
		uid: readNumeric(block, USTAR_UID_OFFSET, USTAR_UID_SIZE),
		gid: readNumeric(block, USTAR_GID_OFFSET, USTAR_GID_SIZE),
		size: readNumeric(block, USTAR_SIZE_OFFSET, USTAR_SIZE_SIZE),
		mtime: /* @__PURE__ */ new Date(readNumeric(block, USTAR_MTIME_OFFSET, USTAR_MTIME_SIZE) * 1e3),
		type: FLAGTYPE[typeflag] || FILE,
		linkname: readString(block, USTAR_LINKNAME_OFFSET, USTAR_LINKNAME_SIZE)
	};
	const magic = readString(block, USTAR_MAGIC_OFFSET, USTAR_MAGIC_SIZE);
	if (isBodyless(header)) header.size = 0;
	if (magic.trim() === "ustar") {
		header.uname = readString(block, USTAR_UNAME_OFFSET, USTAR_UNAME_SIZE);
		header.gname = readString(block, USTAR_GNAME_OFFSET, USTAR_GNAME_SIZE);
	}
	if (magic === "ustar") header.prefix = readString(block, USTAR_PREFIX_OFFSET, USTAR_PREFIX_SIZE);
	return header;
}
const PAX_MAPPING = {
	path: ["name", (v) => v],
	linkpath: ["linkname", (v) => v],
	size: ["size", (v) => parseInt(v, 10)],
	mtime: ["mtime", parseFloat],
	uid: ["uid", (v) => parseInt(v, 10)],
	gid: ["gid", (v) => parseInt(v, 10)],
	uname: ["uname", (v) => v],
	gname: ["gname", (v) => v]
};
function parsePax(buffer) {
	const decoder$1 = new TextDecoder("utf-8");
	const overrides = Object.create(null);
	const pax = Object.create(null);
	let offset = 0;
	while (offset < buffer.length) {
		const spaceIndex = buffer.indexOf(32, offset);
		if (spaceIndex === -1) break;
		const length = parseInt(decoder$1.decode(buffer.subarray(offset, spaceIndex)), 10);
		if (Number.isNaN(length) || length === 0) break;
		const recordEnd = offset + length;
		const [key, value] = decoder$1.decode(buffer.subarray(spaceIndex + 1, recordEnd - 1)).split("=", 2);
		if (key && value !== void 0) {
			pax[key] = value;
			if (Object.hasOwn(PAX_MAPPING, key)) {
				const [targetKey, parser] = PAX_MAPPING[key];
				const parsedValue = parser(value);
				if (typeof parsedValue === "string" || !Number.isNaN(parsedValue)) overrides[targetKey] = parsedValue;
			}
		}
		offset = recordEnd;
	}
	if (Object.keys(pax).length > 0) overrides.pax = pax;
	return overrides;
}
function applyOverrides(header, overrides) {
	if (overrides.name !== void 0) header.name = overrides.name;
	if (overrides.linkname !== void 0) header.linkname = overrides.linkname;
	if (overrides.size !== void 0) header.size = overrides.size;
	if (overrides.mtime !== void 0) header.mtime = /* @__PURE__ */ new Date(overrides.mtime * 1e3);
	if (overrides.uid !== void 0) header.uid = overrides.uid;
	if (overrides.gid !== void 0) header.gid = overrides.gid;
	if (overrides.uname !== void 0) header.uname = overrides.uname;
	if (overrides.gname !== void 0) header.gname = overrides.gname;
	if (overrides.pax) header.pax = Object.assign({}, header.pax ?? {}, overrides.pax);
}
function getMetaParser(type) {
	switch (type) {
		case "pax-global-header":
		case "pax-header": return parsePax;
		case "gnu-long-name": return (data) => ({ name: readString(data, 0, data.length) });
		case "gnu-long-link-name": return (data) => ({ linkname: readString(data, 0, data.length) });
		default: return;
	}
}
function getHeaderBlocks(header) {
	const base = createTarHeader(header);
	const pax = generatePax(header);
	if (!pax) return [base];
	const paxPadding = -pax.paxBody.length & BLOCK_SIZE_MASK;
	const paddingBlocks = paxPadding > 0 ? [ZERO_BLOCK.subarray(0, paxPadding)] : [];
	return [
		pax.paxHeader,
		pax.paxBody,
		...paddingBlocks,
		base
	];
}

//#endregion
//#region src/tar/packer.ts
const EOF_BUFFER = new Uint8Array(BLOCK_SIZE * 2);
function createTarPacker(onData, onError, onFinalize) {
	let currentHeader = null;
	let bytesWritten = 0;
	let finalized = false;
	return {
		add(header) {
			if (finalized) {
				const error = /* @__PURE__ */ new Error("No new tar entries after finalize.");
				onError(error);
				throw error;
			}
			if (currentHeader !== null) {
				const error = /* @__PURE__ */ new Error("Previous entry must be completed before adding a new one");
				onError(error);
				throw error;
			}
			try {
				const size = isBodyless(header) ? 0 : header.size ?? 0;
				const headerBlocks = getHeaderBlocks({
					...header,
					size
				});
				for (const block of headerBlocks) onData(block);
				currentHeader = {
					...header,
					size
				};
				bytesWritten = 0;
			} catch (error) {
				onError(error);
			}
		},
		write(chunk) {
			if (!currentHeader) {
				const error = /* @__PURE__ */ new Error("No active tar entry.");
				onError(error);
				throw error;
			}
			if (finalized) {
				const error = /* @__PURE__ */ new Error("Cannot write data after finalize.");
				onError(error);
				throw error;
			}
			const newTotal = bytesWritten + chunk.length;
			if (newTotal > currentHeader.size) {
				const error = /* @__PURE__ */ new Error(`"${currentHeader.name}" exceeds given size of ${currentHeader.size} bytes.`);
				onError(error);
				throw error;
			}
			try {
				bytesWritten = newTotal;
				onData(chunk);
			} catch (error) {
				onError(error);
			}
		},
		endEntry() {
			if (!currentHeader) {
				const error = /* @__PURE__ */ new Error("No active entry to end.");
				onError(error);
				throw error;
			}
			if (finalized) {
				const error = /* @__PURE__ */ new Error("Cannot end entry after finalize.");
				onError(error);
				throw error;
			}
			try {
				if (bytesWritten !== currentHeader.size) {
					const error = /* @__PURE__ */ new Error(`Size mismatch for "${currentHeader.name}".`);
					onError(error);
					throw error;
				}
				const paddingSize = -currentHeader.size & BLOCK_SIZE_MASK;
				if (paddingSize > 0) onData(new Uint8Array(paddingSize));
				currentHeader = null;
				bytesWritten = 0;
			} catch (error) {
				onError(error);
				throw error;
			}
		},
		finalize() {
			if (finalized) {
				const error = /* @__PURE__ */ new Error("Archive has already been finalized");
				onError(error);
				throw error;
			}
			if (currentHeader !== null) {
				const error = /* @__PURE__ */ new Error("Cannot finalize while an entry is still active");
				onError(error);
				throw error;
			}
			try {
				onData(EOF_BUFFER);
				finalized = true;
				if (onFinalize) onFinalize();
			} catch (error) {
				onError(error);
			}
		}
	};
}

//#endregion
//#region src/tar/chunk-queue.ts
const INITIAL_CAPACITY = 256;
function createChunkQueue() {
	let chunks = new Array(INITIAL_CAPACITY);
	let capacityMask = chunks.length - 1;
	let head = 0;
	let tail = 0;
	let totalAvailable = 0;
	const consumeFromHead = (count) => {
		const chunk = chunks[head];
		if (count === chunk.length) {
			chunks[head] = EMPTY;
			head = head + 1 & capacityMask;
		} else chunks[head] = chunk.subarray(count);
		totalAvailable -= count;
		if (totalAvailable === 0 && chunks.length > INITIAL_CAPACITY) {
			chunks = new Array(INITIAL_CAPACITY);
			capacityMask = INITIAL_CAPACITY - 1;
			head = 0;
			tail = 0;
		}
	};
	function pull(bytes, callback) {
		if (callback) {
			let fed = 0;
			let remaining$1 = Math.min(bytes, totalAvailable);
			while (remaining$1 > 0) {
				const chunk = chunks[head];
				const toFeed = Math.min(remaining$1, chunk.length);
				const segment = toFeed === chunk.length ? chunk : chunk.subarray(0, toFeed);
				consumeFromHead(toFeed);
				remaining$1 -= toFeed;
				fed += toFeed;
				if (!callback(segment)) break;
			}
			return fed;
		}
		if (totalAvailable < bytes) return null;
		if (bytes === 0) return EMPTY;
		const firstChunk = chunks[head];
		if (firstChunk.length >= bytes) {
			const view = firstChunk.length === bytes ? firstChunk : firstChunk.subarray(0, bytes);
			consumeFromHead(bytes);
			return view;
		}
		const result = new Uint8Array(bytes);
		let copied = 0;
		let remaining = bytes;
		while (remaining > 0) {
			const chunk = chunks[head];
			const toCopy = Math.min(remaining, chunk.length);
			result.set(toCopy === chunk.length ? chunk : chunk.subarray(0, toCopy), copied);
			copied += toCopy;
			remaining -= toCopy;
			consumeFromHead(toCopy);
		}
		return result;
	}
	return {
		push: (chunk) => {
			if (chunk.length === 0) return;
			let nextTail = tail + 1 & capacityMask;
			if (nextTail === head) {
				const oldLen = chunks.length;
				const newLen = oldLen * 2;
				const newChunks = new Array(newLen);
				const count = tail - head + oldLen & oldLen - 1;
				if (head < tail) for (let i = 0; i < count; i++) newChunks[i] = chunks[head + i];
				else if (count > 0) {
					const firstPart = oldLen - head;
					for (let i = 0; i < firstPart; i++) newChunks[i] = chunks[head + i];
					for (let i = 0; i < tail; i++) newChunks[firstPart + i] = chunks[i];
				}
				chunks = newChunks;
				capacityMask = newLen - 1;
				head = 0;
				tail = count;
				nextTail = tail + 1 & capacityMask;
			}
			chunks[tail] = chunk;
			tail = nextTail;
			totalAvailable += chunk.length;
		},
		available: () => totalAvailable,
		peek: (bytes) => {
			if (totalAvailable < bytes) return null;
			if (bytes === 0) return EMPTY;
			const firstChunk = chunks[head];
			if (firstChunk.length >= bytes) return firstChunk.length === bytes ? firstChunk : firstChunk.subarray(0, bytes);
			const result = new Uint8Array(bytes);
			let copied = 0;
			let index = head;
			while (copied < bytes) {
				const chunk = chunks[index];
				const toCopy = Math.min(bytes - copied, chunk.length);
				if (toCopy === chunk.length) result.set(chunk, copied);
				else result.set(chunk.subarray(0, toCopy), copied);
				copied += toCopy;
				index = index + 1 & capacityMask;
			}
			return result;
		},
		discard: (bytes) => {
			if (bytes > totalAvailable) throw new Error("Too many bytes consumed");
			if (bytes === 0) return;
			let remaining = bytes;
			while (remaining > 0) {
				const chunk = chunks[head];
				const toConsume = Math.min(remaining, chunk.length);
				consumeFromHead(toConsume);
				remaining -= toConsume;
			}
		},
		pull
	};
}

//#endregion
//#region src/tar/unpacker.ts
const STATE_HEADER = 0;
const STATE_BODY = 1;
const truncateErr = /* @__PURE__ */ new Error("Tar archive is truncated.");
function createUnpacker(options = {}) {
	const strict = options.strict ?? false;
	const { available, peek, push, discard, pull } = createChunkQueue();
	let state = STATE_HEADER;
	let ended = false;
	let done = false;
	let eof = false;
	let currentEntry = null;
	const paxGlobals = {};
	let nextEntryOverrides = {};
	const unpacker = {
		isEntryActive: () => state === STATE_BODY,
		isBodyComplete: () => !currentEntry || currentEntry.remaining === 0,
		write(chunk) {
			if (ended) throw new Error("Archive already ended.");
			push(chunk);
		},
		end() {
			ended = true;
		},
		readHeader() {
			if (state !== STATE_HEADER) throw new Error("Cannot read header while an entry is active");
			if (done) return void 0;
			while (!done) {
				if (available() < BLOCK_SIZE) {
					if (ended) {
						if (available() > 0 && strict) throw truncateErr;
						done = true;
						return;
					}
					return null;
				}
				const headerBlock = peek(BLOCK_SIZE);
				if (isZeroBlock(headerBlock)) {
					if (available() < BLOCK_SIZE * 2) {
						if (ended) {
							if (strict) throw truncateErr;
							done = true;
							return;
						}
						return null;
					}
					if (isZeroBlock(peek(BLOCK_SIZE * 2).subarray(BLOCK_SIZE))) {
						discard(BLOCK_SIZE * 2);
						done = true;
						eof = true;
						return;
					}
					if (strict) throw new Error("Invalid tar header.");
					discard(BLOCK_SIZE);
					continue;
				}
				let internalHeader;
				try {
					internalHeader = parseUstarHeader(headerBlock, strict);
				} catch (err) {
					if (strict) throw err;
					discard(BLOCK_SIZE);
					continue;
				}
				const metaParser = getMetaParser(internalHeader.type);
				if (metaParser) {
					const paddedSize = internalHeader.size + BLOCK_SIZE_MASK & ~BLOCK_SIZE_MASK;
					if (available() < BLOCK_SIZE + paddedSize) {
						if (ended && strict) throw truncateErr;
						return null;
					}
					discard(BLOCK_SIZE);
					const overrides = metaParser(pull(paddedSize).subarray(0, internalHeader.size));
					const target = internalHeader.type === "pax-global-header" ? paxGlobals : nextEntryOverrides;
					for (const key in overrides) target[key] = overrides[key];
					continue;
				}
				discard(BLOCK_SIZE);
				const header = internalHeader;
				if (internalHeader.prefix) header.name = `${internalHeader.prefix}/${header.name}`;
				applyOverrides(header, paxGlobals);
				applyOverrides(header, nextEntryOverrides);
				if (header.name.endsWith("/") && header.type === FILE) header.type = DIRECTORY;
				nextEntryOverrides = {};
				currentEntry = {
					header,
					remaining: header.size,
					padding: -header.size & BLOCK_SIZE_MASK
				};
				state = STATE_BODY;
				return header;
			}
		},
		streamBody(callback) {
			if (state !== STATE_BODY || !currentEntry || currentEntry.remaining === 0) return 0;
			const bytesToFeed = Math.min(currentEntry.remaining, available());
			if (bytesToFeed === 0) return 0;
			const fed = pull(bytesToFeed, callback);
			currentEntry.remaining -= fed;
			return fed;
		},
		skipPadding() {
			if (state !== STATE_BODY || !currentEntry) return true;
			if (currentEntry.remaining > 0) throw new Error("Body not fully consumed");
			if (available() < currentEntry.padding) return false;
			discard(currentEntry.padding);
			currentEntry = null;
			state = STATE_HEADER;
			return true;
		},
		skipEntry() {
			if (state !== STATE_BODY || !currentEntry) return true;
			const toDiscard = Math.min(currentEntry.remaining, available());
			if (toDiscard > 0) {
				discard(toDiscard);
				currentEntry.remaining -= toDiscard;
			}
			if (currentEntry.remaining > 0) return false;
			return unpacker.skipPadding();
		},
		validateEOF() {
			if (strict) {
				if (!eof) throw truncateErr;
				if (available() > 0) {
					if (pull(available()).some((byte) => byte !== 0)) throw new Error("Invalid EOF.");
				}
			}
		}
	};
	return unpacker;
}
function isZeroBlock(block) {
	if (block.byteOffset % 8 === 0) {
		const view = new BigUint64Array(block.buffer, block.byteOffset, block.length / 8);
		for (let i = 0; i < view.length; i++) if (view[i] !== 0n) return false;
		return true;
	}
	for (let i = 0; i < block.length; i++) if (block[i] !== 0) return false;
	return true;
}

//#endregion
export { normalizeBody as a, LINK as c, isBodyless as i, SYMLINK as l, createTarPacker as n, DIRECTORY as o, transformHeader as r, FILE as s, createUnpacker as t };