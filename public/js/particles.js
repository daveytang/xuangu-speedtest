/**
 * particles.js
 * Canvas粒子网络背景
 * 节点漂浮、连线、鼠标交互、测速状态响应
 */

export class ParticleNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mousePos = { x: null, y: null };
    this.isActive = false; // 测速进行中
    this.animationFrame = null;

    this.config = {
      particleCount: 100,
      baseSpeed: 0.3,
      activeSpeed: 1.2,
      connectionDistance: 150,
      activeConnectionDistance: 200,
      mouseInfluence: 100
    };

    this.resize();
    this.init();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.baseSpeed,
        vy: (Math.random() - 0.5) * this.config.baseSpeed,
        radius: Math.random() * 2 + 1
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mousePos.x = null;
      this.mousePos.y = null;
    });
  }

  setActive(active) {
    this.isActive = active;
  }

  update() {
    const speed = this.isActive ? this.config.activeSpeed : this.config.baseSpeed;

    this.particles.forEach((p) => {
      // 鼠标引力
      if (this.mousePos.x !== null) {
        const dx = this.mousePos.x - p.x;
        const dy = this.mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.mouseInfluence) {
          const force = (1 - dist / this.config.mouseInfluence) * 0.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // 更新位置
      p.x += p.vx * speed;
      p.y += p.vy * speed;

      // 边界反弹
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      // 保持在画布内
      p.x = Math.max(0, Math.min(this.canvas.width, p.x));
      p.y = Math.max(0, Math.min(this.canvas.height, p.y));

      // 速度衰减
      p.vx *= 0.99;
      p.vy *= 0.99;

      // 最小速度
      if (Math.abs(p.vx) < 0.1) p.vx = (Math.random() - 0.5) * this.config.baseSpeed;
      if (Math.abs(p.vy) < 0.1) p.vy = (Math.random() - 0.5) * this.config.baseSpeed;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 获取CSS变量颜色
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches &&
       !document.documentElement.getAttribute('data-theme'));

    const nodeColor = isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(37, 99, 235, 0.8)';
    const lineColor = isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.12)';
    const activeLineColor = isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.25)';

    const connectionDist = this.isActive
      ? this.config.activeConnectionDistance
      : this.config.connectionDistance;

    // 绘制连线
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDist) {
          const opacity = 1 - dist / connectionDist;
          this.ctx.strokeStyle = this.isActive ? activeLineColor : lineColor;
          this.ctx.globalAlpha = opacity;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    this.ctx.globalAlpha = 1;

    // 绘制节点
    this.particles.forEach((p) => {
      // 鼠标附近的节点加亮
      let brightness = 1;
      if (this.mousePos.x !== null) {
        const dx = this.mousePos.x - p.x;
        const dy = this.mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseInfluence) {
          brightness = 1 + (1 - dist / this.config.mouseInfluence);
        }
      }

      this.ctx.fillStyle = nodeColor;
      this.ctx.globalAlpha = brightness * (this.isActive ? 1 : 0.8);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 测速时节点辉光
      if (this.isActive && brightness > 1) {
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.ctx.globalAlpha = 1;
  }

  animate() {
    this.update();
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
