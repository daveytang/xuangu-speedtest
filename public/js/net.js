/**
 * net.js
 * 网络请求封装，下载使用 Fetch 流，上传使用更稳定的 XHR
 */

const UPLOAD_CHUNK_SIZE = 16 * 1024 * 1024;
let uploadPayload;

function createAbortError() {
  return new DOMException('测速已中止', 'AbortError');
}

function ensureUploadPayload() {
  if (uploadPayload) {
    return uploadPayload;
  }

  const buffer = new Uint8Array(UPLOAD_CHUNK_SIZE);
  for (let offset = 0; offset < buffer.length; offset += 65536) {
    crypto.getRandomValues(buffer.subarray(offset, Math.min(offset + 65536, buffer.length)));
  }

  uploadPayload = new Blob([buffer], { type: 'application/octet-stream' });
  return uploadPayload;
}

/**
 * Ping单次请求，测量RTT
 * @returns {Promise<number>} RTT in ms
 */
export async function ping(signal) {
  const startTime = performance.now();

  const response = await fetch('/api/ping', {
    method: 'GET',
    cache: 'no-store',
    signal
  });

  if (!response.ok) {
    throw new Error(`Ping failed: ${response.status}`);
  }

  await response.json();
  const endTime = performance.now();

  return endTime - startTime;
}

/**
 * 下载测速：流式读取数据
 * @param {number} bytes - 要下载的字节数
 * @param {Function} onProgress - 进度回调 (bytesReceived, duration)
 * @returns {Promise<{bytes: number, duration: number}>}
 */
export async function downloadTest(bytes, onProgress, signal) {
  const startTime = performance.now();
  let bytesReceived = 0;

  const response = await fetch(`/api/download?bytes=${bytes}`, {
    method: 'GET',
    cache: 'no-store',
    signal
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const reader = response.body.getReader();

  try {
    while (!signal?.aborted) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      bytesReceived += value.length;
      const duration = performance.now() - startTime;

      if (onProgress) {
        onProgress(bytesReceived, duration);
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  const duration = performance.now() - startTime;

  return { bytes: bytesReceived, duration };
}

function sendUploadChunk(payload, accumulatedBytes, startedAt, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const chunkStartedAt = performance.now();

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
    };

    const handleAbort = () => {
      cleanup();
      xhr.abort();
      reject(createAbortError());
    };

    xhr.open('POST', '/api/upload');
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      const elapsed = Math.max(performance.now() - startedAt, 1);
      if (onProgress) {
        onProgress(accumulatedBytes + event.loaded, elapsed);
      }
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error('Upload failed'));
    };

    xhr.onabort = () => {
      cleanup();
      reject(createAbortError());
    };

    xhr.onload = () => {
      cleanup();

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload failed: ${xhr.status}`));
        return;
      }

      const response = xhr.response || JSON.parse(xhr.responseText || '{}');
      resolve({
        bytes: response.received ?? payload.size,
        duration: response.duration_ms ?? performance.now() - chunkStartedAt
      });
    };

    if (signal) {
      if (signal.aborted) {
        handleAbort();
        return;
      }

      signal.addEventListener('abort', handleAbort, { once: true });
    }

    xhr.send(payload);
  });
}

/**
 * 上传测速：兼容性更稳的分块上传
 * @param {number} durationMs - 上传持续时间（毫秒）
 * @param {Function} onProgress - 进度回调 (bytesSent, duration)
 * @returns {Promise<{bytes: number, duration: number}>}
 */
export async function uploadTest(durationMs, onProgress, signal) {
  const payload = ensureUploadPayload();
  const startedAt = performance.now();
  let bytesSent = 0;

  while (performance.now() - startedAt < durationMs) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const result = await sendUploadChunk(payload, bytesSent, startedAt, onProgress, signal);
    bytesSent += result.bytes;
  }

  return {
    bytes: bytesSent,
    duration: performance.now() - startedAt
  };
}

/**
 * 获取连接元信息
 * @returns {Promise<Object>}
 */
export async function fetchMeta() {
  const response = await fetch('/api/meta', {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Meta fetch failed: ${response.status}`);
  }

  return response.json();
}
