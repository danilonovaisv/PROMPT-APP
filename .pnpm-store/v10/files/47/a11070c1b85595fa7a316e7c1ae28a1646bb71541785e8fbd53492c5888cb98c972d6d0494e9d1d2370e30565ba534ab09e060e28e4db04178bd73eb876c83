import { a as normalizeBody, i as isBodyless, n as createTarPacker$1, r as transformHeader, t as createUnpacker } from "../unpacker-Dcww6JeE.js";

//#region src/web/compression.ts
function createGzipEncoder() {
	return new CompressionStream("gzip");
}
function createGzipDecoder() {
	return new DecompressionStream("gzip");
}

//#endregion
//#region src/web/pack.ts
function createTarPacker() {
	let streamController;
	let packer;
	return {
		readable: new ReadableStream({ start(controller) {
			streamController = controller;
			packer = createTarPacker$1(controller.enqueue.bind(controller), controller.error.bind(controller), controller.close.bind(controller));
		} }),
		controller: {
			add(header) {
				const bodyless = isBodyless(header);
				const h = { ...header };
				if (bodyless) h.size = 0;
				packer.add(h);
				if (bodyless) packer.endEntry();
				return new WritableStream({
					write(chunk) {
						packer.write(chunk);
					},
					close() {
						if (!bodyless) packer.endEntry();
					},
					abort(reason) {
						streamController.error(reason);
					}
				});
			},
			finalize() {
				packer.finalize();
			},
			error(err) {
				streamController.error(err);
			}
		}
	};
}

//#endregion
//#region src/web/stream-utils.ts
async function streamToBuffer(stream) {
	const chunks = [];
	const reader = stream.getReader();
	let totalLength = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			totalLength += value.length;
		}
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			result.set(chunk, offset);
			offset += chunk.length;
		}
		return result;
	} finally {
		reader.releaseLock();
	}
}
const drain = (stream) => stream.pipeTo(new WritableStream());

//#endregion
//#region src/web/unpack.ts
function createTarDecoder(options = {}) {
	const unpacker = createUnpacker(options);
	let bodyController = null;
	let pumping = false;
	const pump = (controller) => {
		if (pumping) return;
		pumping = true;
		try {
			while (true) if (unpacker.isEntryActive()) {
				if (bodyController) {
					if (unpacker.streamBody((c) => (bodyController.enqueue(c), true)) === 0 && !unpacker.isBodyComplete()) break;
				} else if (!unpacker.skipEntry()) break;
				if (unpacker.isBodyComplete()) {
					try {
						bodyController?.close();
					} catch {}
					bodyController = null;
					if (!unpacker.skipPadding()) break;
				}
			} else {
				const header = unpacker.readHeader();
				if (header === null || header === void 0) break;
				controller.enqueue({
					header,
					body: new ReadableStream({
						start(c) {
							if (header.size === 0) c.close();
							else bodyController = c;
						},
						pull: () => pump(controller),
						cancel() {
							bodyController = null;
							pump(controller);
						}
					})
				});
			}
		} catch (error) {
			try {
				bodyController?.error(error);
			} catch {}
			bodyController = null;
			throw error;
		} finally {
			pumping = false;
		}
	};
	return new TransformStream({
		transform(chunk, controller) {
			try {
				unpacker.write(chunk);
				pump(controller);
			} catch (error) {
				try {
					bodyController?.error(error);
				} catch {}
				throw error;
			}
		},
		flush(controller) {
			try {
				unpacker.end();
				pump(controller);
				unpacker.validateEOF();
				if (unpacker.isEntryActive() && !unpacker.isBodyComplete()) try {
					bodyController?.close();
				} catch {}
			} catch (error) {
				try {
					bodyController?.error(error);
				} catch {}
				throw error;
			}
		}
	}, void 0, { highWaterMark: 1 });
}

//#endregion
//#region src/web/helpers.ts
async function packTar(entries) {
	const { readable, controller } = createTarPacker();
	await (async () => {
		for (const entry of entries) {
			const entryStream = controller.add(entry.header);
			const body = "body" in entry ? entry.body : entry.data;
			if (!body) {
				await entryStream.close();
				continue;
			}
			if (body instanceof ReadableStream) await body.pipeTo(entryStream);
			else if (body instanceof Blob) await body.stream().pipeTo(entryStream);
			else try {
				const chunk = await normalizeBody(body);
				if (chunk.length > 0) {
					const writer = entryStream.getWriter();
					await writer.write(chunk);
					await writer.close();
				} else await entryStream.close();
			} catch {
				throw new TypeError(`Unsupported content type for entry "${entry.header.name}".`);
			}
		}
	})().then(() => controller.finalize()).catch((err) => controller.error(err));
	return new Uint8Array(await streamToBuffer(readable));
}
async function unpackTar(archive, options = {}) {
	const sourceStream = archive instanceof ReadableStream ? archive : new ReadableStream({ start(controller) {
		controller.enqueue(archive instanceof Uint8Array ? archive : new Uint8Array(archive));
		controller.close();
	} });
	const results = [];
	const entryStream = sourceStream.pipeThrough(createTarDecoder(options));
	for await (const entry of entryStream) {
		let processedHeader;
		try {
			processedHeader = transformHeader(entry.header, options);
		} catch (error) {
			await entry.body.cancel();
			throw error;
		}
		if (processedHeader === null) {
			await drain(entry.body);
			continue;
		}
		if (isBodyless(processedHeader)) {
			await drain(entry.body);
			results.push({ header: processedHeader });
		} else results.push({
			header: processedHeader,
			data: await streamToBuffer(entry.body)
		});
	}
	return results;
}

//#endregion
export { createGzipDecoder, createGzipEncoder, createTarDecoder, createTarPacker, packTar, unpackTar };