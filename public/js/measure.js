/**
 * measure.js
 * 测速算法：Ping、Download、Upload
 * 真实网络测量，无模拟数据
 */

import { ping, downloadTest, uploadTest } from './net.js';

const PING_ATTEMPTS = 10;

function createAbortError() {
  return new DOMException('测速已中止', 'AbortError');
}

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function computeStableAverage(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = values.slice().sort((a, b) => a - b);
  const trimCount = values.length > 8 ? Math.floor(values.length * 0.1) : 0;
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount || sorted.length);

  return trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
}

/**
 * 测量Ping和Jitter
 * 连续10次ping，取中位数为Ping，标准差为Jitter
 * 第一次丢弃（握手开销）
 */
export async function measurePing(onProgress, options = {}) {
  const samples = [];
  let lost = 0;

  // 第一次请求丢弃（握手/DNS）
  try {
    await ping(options.signal);
  } catch (err) {
    if (isAbortError(err)) {
      throw err;
    }
  }

  // 连续10次真实ping
  for (let i = 0; i < PING_ATTEMPTS; i++) {
    if (options.signal?.aborted) {
      throw createAbortError();
    }

    try {
      const rtt = await ping(options.signal);
      samples.push(rtt);

      if (onProgress) {
        onProgress(samples, {
          attempts: i + 1,
          lost,
          packetLoss: (lost / (i + 1)) * 100
        });
      }

      // 间隔100ms避免过于密集
      await sleep(100, options.signal);
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }

      lost += 1;

      if (onProgress) {
        onProgress(samples, {
          attempts: i + 1,
          lost,
          packetLoss: (lost / (i + 1)) * 100
        });
      }
    }
  }

  if (samples.length === 0) {
    throw new Error('All ping requests failed');
  }

  // 计算中位数（Ping）
  const sorted = samples.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // 计算相邻采样差值的均值，避免极端值过度放大抖动结果
  const jitterSamples = samples.slice(1).map((sample, index) => Math.abs(sample - samples[index]));
  const jitter = jitterSamples.length
    ? jitterSamples.reduce((sum, value) => sum + value, 0) / jitterSamples.length
    : 0;
  const packetLoss = (lost / PING_ATTEMPTS) * 100;

  return {
    ping: median,
    jitter,
    packetLoss,
    attempts: PING_ATTEMPTS,
    lost,
    samples
  };
}

/**
 * 测量下载速度
 * 并行4-6个连接，10s测试窗口，前2s warm-up，取后8s的90百分位稳定均值
 */
export async function measureDownload(onProgress, options = {}) {
  const PARALLEL = 3; // 并行连接数
  const TOTAL_DURATION = 10000; // 总测试时长10s
  const WARMUP_DURATION = 2000; // 预热2s
  const PROBE_SIZE = 8 * 1024 * 1024; // 探测包8MB
  const LARGE_SIZE = 64 * 1024 * 1024; // 高速网络使用大包减少请求次数
  const SMALL_SIZE = 16 * 1024 * 1024;

  const startTime = performance.now();
  const speedSamples = []; // 瞬时速度样本
  let downloadSize = PROBE_SIZE; // 初始探测包大小

  // 探测阶段：快速判断网速档位
  const probeResult = await downloadTest(PROBE_SIZE, null, options.signal);
  const probeDuration = Math.max(probeResult.duration, 1);
  const probeMbps = (probeResult.bytes * 8) / (probeDuration * 1000);

  // 根据探测结果调整传输量：>50Mbps用大包，否则用小包
  if (probeMbps > 50) {
    downloadSize = LARGE_SIZE;
  } else {
    downloadSize = SMALL_SIZE;
  }

  // 并行下载
  const downloads = [];
  for (let i = 0; i < PARALLEL; i++) {
    const promise = (async () => {
      while (performance.now() - startTime < TOTAL_DURATION) {
        if (options.signal?.aborted) {
          throw createAbortError();
        }

        try {
          await downloadTest(downloadSize, (bytes, duration) => {
            const elapsed = performance.now() - startTime;

            // 跳过warm-up阶段的统计
            if (elapsed < WARMUP_DURATION) return;

            // 计算瞬时速度 (Mbps)
            const mbps = (bytes * 8) / (duration * 1000);
            speedSamples.push({ time: elapsed, mbps });
          }, options.signal);
        } catch (err) {
          if (isAbortError(err)) {
            throw err;
          }

          break;
        }

        // 检查是否超时
        if (performance.now() - startTime >= TOTAL_DURATION) {
          break;
        }
      }
    })();

    downloads.push(promise);
  }

  // 定时回调更新UI（每200ms）
  const updateInterval = setInterval(() => {
    if (speedSamples.length > 0) {
      // 取最近的速度样本（EMA平滑）
      const recentSamples = speedSamples.slice(-6).map((sample) => sample.mbps);
      const avgSpeed = computeStableAverage(recentSamples);

      if (onProgress) {
        onProgress(avgSpeed, speedSamples);
      }
    }
  }, 200);

  await Promise.all(downloads);
  clearInterval(updateInterval);

  // 计算最终速度：取后8s的90百分位附近样本的均值
  const validSamples = speedSamples.filter(s => s.time >= WARMUP_DURATION);

  if (validSamples.length === 0) {
    throw new Error('No valid download samples');
  }

  const finalSpeed = computeStableAverage(validSamples.map((sample) => sample.mbps));

  return {
    speed: finalSpeed,
    samples: speedSamples
  };
}

/**
 * 测量上传速度
 * 并行2-4个连接，10s测试窗口，前2s warm-up
 */
export async function measureUpload(onProgress, options = {}) {
  const PARALLEL = 1; // 降低超高速本地环境中的请求风暴，提升兼容性
  const TOTAL_DURATION = 10000; // 10s
  const WARMUP_DURATION = 2000; // 2s

  const startTime = performance.now();
  const speedSamples = [];

  // 并行上传
  const uploads = [];
  for (let i = 0; i < PARALLEL; i++) {
    const promise = uploadTest(TOTAL_DURATION, (bytes, duration) => {
      const elapsed = performance.now() - startTime;

      // 跳过warm-up
      if (elapsed < WARMUP_DURATION) return;

      // 瞬时速度
      const mbps = (bytes * 8) / (duration * 1000);
      speedSamples.push({ time: elapsed, mbps });
    }, options.signal);

    uploads.push(promise);
  }

  // 定时回调更新UI
  const updateInterval = setInterval(() => {
    if (speedSamples.length > 0) {
      const recentSamples = speedSamples.slice(-6).map((sample) => sample.mbps);
      const avgSpeed = computeStableAverage(recentSamples);

      if (onProgress) {
        onProgress(avgSpeed, speedSamples);
      }
    }
  }, 200);

  await Promise.all(uploads);
  clearInterval(updateInterval);

  // 计算最终速度
  const validSamples = speedSamples.filter(s => s.time >= WARMUP_DURATION);

  if (validSamples.length === 0) {
    throw new Error('No valid upload samples');
  }

  const finalSpeed = computeStableAverage(validSamples.map((sample) => sample.mbps));

  return {
    speed: finalSpeed,
    samples: speedSamples
  };
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      resolve();
    }, ms);

    const handleAbort = () => {
      clearTimeout(timer);
      reject(createAbortError());
    };

    if (signal) {
      if (signal.aborted) {
        handleAbort();
        return;
      }

      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
}
