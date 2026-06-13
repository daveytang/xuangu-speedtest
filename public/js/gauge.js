/**
 * gauge.js
 * 适配Aceternity UI风格 - 圆环进度条
 */

export class Gauge {
  constructor() {
    this.speedNumber = document.getElementById('speed-number');
    this.speedUnit = document.getElementById('speed-unit');
    this.speedStatus = document.getElementById('speed-status');
    this.speedProgress = document.getElementById('speed-progress');
    this.currentValue = 0;
    this.maxValue = 100;
    this.circumference = 2 * Math.PI * 90; // r=90
  }

  setMaxValue(max) {
    this.maxValue = max;
  }

  setValue(value, unit = 'Mbps') {
    this.currentValue = value;

    // 更新数值
    const displayValue = value < 10 ? value.toFixed(2) : value < 100 ? value.toFixed(1) : Math.round(value);
    this.speedNumber.textContent = displayValue;
    this.speedUnit.textContent = unit;

    // 更新圆环进度
    const progress = Math.min(value / this.maxValue, 1);
    const offset = this.circumference * (1 - progress);
    this.speedProgress.style.strokeDashoffset = offset;
  }

  setPhase(phase) {
    this.speedStatus.textContent = phase;
  }

  setError(message) {
    this.speedNumber.textContent = '--';
    this.speedUnit.textContent = '';
    this.speedStatus.textContent = message;
    this.speedProgress.style.strokeDashoffset = this.circumference;
  }

  reset() {
    this.currentValue = 0;
    this.speedNumber.textContent = '0';
    this.speedUnit.textContent = 'Mbps';
    this.speedStatus.textContent = '准备开始';
    this.speedProgress.style.strokeDashoffset = this.circumference;
  }

  complete() {
    this.speedStatus.textContent = '测速完成';
    this.speedProgress.style.strokeDashoffset = 0;
  }
}
