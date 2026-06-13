/**
 * main.js
 * 主入口 - Aceternity UI风格
 */

import { Gauge } from './gauge.js';
import { UI } from './ui.js';
import { measurePing, measureDownload, measureUpload } from './measure.js';
import { fetchMeta } from './net.js';

// 全局状态
let gauge;
let ui;
let isTesting = false;
let abortController = null;

// 测试结果
const results = {
  ping: null,
  jitter: null,
  packetLoss: null,
  download: null,
  upload: null,
  pingSamples: [],
  downloadSamples: [],
  uploadSamples: []
};

/**
 * 初始化
 */
async function init() {
  gauge = new Gauge();
  ui = new UI();
  bindEvents();
  await loadConnectionInfo();
}

/**
 * 绑定事件
 */
function bindEvents() {
  const startBtn = document.getElementById('test-btn');
  const retestBtn = document.getElementById('retest-btn');

  startBtn.addEventListener('click', startTest);
  retestBtn.addEventListener('click', startTest);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isTesting) {
      abortTest();
    }
  });
}

/**
 * 加载连接信息
 */
async function loadConnectionInfo() {
  try {
    const meta = await fetchMeta();
    ui.updateConnectionInfo(meta);
  } catch (err) {
    console.error('Failed to load connection info:', err);
    ui.updateConnectionInfo({ ip: '获取失败', isp: '未知', node: '未知' });
  }
}

/**
 * 开始测速
 */
async function startTest() {
  if (isTesting) return;

  isTesting = true;
  abortController = new AbortController();

  gauge.reset();
  updateButtonState('loading');
  ui.showRetestButton(false);
  ui.setRetestEnabled(false);
  ['download', 'upload', 'ping', 'jitter', 'packet-loss'].forEach((name) => ui.updateMetric(name, '--'));

  Object.keys(results).forEach(key => {
    results[key] = key.includes('Samples') ? [] : null;
  });

  try {
    await testPing();
    await testDownload();
    await testUpload();
    onTestComplete();
  } catch (err) {
    if (err?.name === 'AbortError') {
      onTestAbort();
    } else {
      console.error('Test failed:', err);
      onTestError(err);
    }
  } finally {
    isTesting = false;
    updateButtonState('ready');
    ui.setRetestEnabled(true);
  }
}

/**
 * 更新按钮状态
 */
function updateButtonState(state) {
  const btn = document.getElementById('test-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');

  if (state === 'loading') {
    btn.disabled = true;
    btnText.textContent = '测速中...';
    btnLoader.style.display = 'flex';
  } else {
    btn.disabled = false;
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
    btnText.textContent = '开始测速';
  }
}

/**
 * 中止测速
 */
function abortTest() {
  if (abortController) {
    abortController.abort();
  }

  isTesting = false;
  updateButtonState('ready');
  onTestAbort();
}

/**
 * 测试Ping
 */
async function testPing() {
  gauge.setPhase('正在测试延迟...');
  gauge.setMaxValue(200);

  const result = await measurePing((samples, stats) => {
    if (!isTesting || abortController?.signal.aborted) {
      return;
    }

    const latest = samples[samples.length - 1] ?? 0;
    gauge.setValue(latest, 'ms');
    results.pingSamples = samples;
    ui.updateMetric('packet-loss', stats.packetLoss);
  }, { signal: abortController.signal });

  if (!isTesting || abortController?.signal.aborted) {
    return;
  }

  results.ping = result.ping;
  results.jitter = result.jitter;
  results.packetLoss = result.packetLoss;
  results.pingSamples = result.samples;

  gauge.setValue(result.ping, 'ms');
  ui.updateMetric('ping', result.ping);
  ui.updateMetric('jitter', result.jitter);
  ui.updateMetric('packet-loss', result.packetLoss);
}

/**
 * 测试下载
 */
async function testDownload() {
  gauge.setPhase('正在测试下载速度...');
  gauge.setMaxValue(500);

  const result = await measureDownload((speed, samples) => {
    if (!isTesting || abortController?.signal.aborted) {
      return;
    }

    gauge.setValue(speed, 'Mbps');
    results.downloadSamples = samples;
  }, { signal: abortController.signal });

  if (!isTesting || abortController?.signal.aborted) {
    return;
  }

  results.download = result.speed;
  results.downloadSamples = result.samples;

  gauge.setValue(result.speed, 'Mbps');
  ui.updateMetric('download', result.speed);
}

/**
 * 测试上传
 */
async function testUpload() {
  gauge.setPhase('正在测试上传速度...');
  gauge.setMaxValue(200);

  const result = await measureUpload((speed, samples) => {
    if (!isTesting || abortController?.signal.aborted) {
      return;
    }

    gauge.setValue(speed, 'Mbps');
    results.uploadSamples = samples;
  }, { signal: abortController.signal });

  if (!isTesting || abortController?.signal.aborted) {
    return;
  }

  results.upload = result.speed;
  results.uploadSamples = result.samples;

  gauge.setValue(result.speed, 'Mbps');
  ui.updateMetric('upload', result.speed);
}

/**
 * 测速完成
 */
function onTestComplete() {
  gauge.setPhase('测速完成');
  gauge.complete();
  ui.showRetestButton(true);
  announceResults();
}

function onTestAbort() {
  gauge.setPhase('测速已中止');
  gauge.setError('测速已中止');
  ui.showRetestButton(true);
  ui.setRetestEnabled(true);
}

/**
 * 测速错误
 */
function onTestError(err) {
  gauge.setError(err.message || '测速失败');
  ui.showRetestButton(true);
}

/**
 * 播报结果（无障碍）
 */
function announceResults() {
  const announcement = `测速完成。下载速度 ${results.download?.toFixed(1)} Mbps，上传速度 ${results.upload?.toFixed(1)} Mbps，延迟 ${results.ping?.toFixed(0)} 毫秒，抖动 ${results.jitter?.toFixed(0)} 毫秒，丢包率 ${results.packetLoss?.toFixed(1)}%。`;

  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px';
  liveRegion.textContent = announcement;

  document.body.appendChild(liveRegion);

  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 3000);
}

// 启动
init();
