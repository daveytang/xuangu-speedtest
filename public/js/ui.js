/**
 * ui.js
 * UI控制 - 仅暗色模式
 */

export class UI {
  constructor() {
    this.retestBtn = document.getElementById('retest-btn');
  }

  updateMetric(name, value) {
    const element = document.getElementById(`${name}-value`);
    if (!element) return;

    const displayValue = typeof value === 'number'
      ? value < 10 ? value.toFixed(2) : value.toFixed(1)
      : value;

    element.textContent = displayValue;
  }

  showRetestButton(show) {
    this.retestBtn.style.display = show ? 'inline-flex' : 'none';
  }

  setRetestEnabled(enabled) {
    this.retestBtn.disabled = !enabled;
  }

  updateConnectionInfo(meta) {
    document.getElementById('info-ip').textContent = meta.ip || '未知';
    document.getElementById('info-isp').textContent = meta.isp || '未知';
    document.getElementById('info-node').textContent = meta.node || '未知';
  }
}
