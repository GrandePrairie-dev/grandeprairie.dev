/* <neural-net> — GrandePrairie.dev ambient node-network overlay.
   Echoes the swan-wing constellation in the brand mark: drifting nodes
   linked by hairline edges, a few glowing "hub" nodes. Sits behind content,
   never captures pointer events, and honors prefers-reduced-motion (renders a
   single static frame). Fills its positioned parent.

   Usage:
     <div style="position:relative">
       <neural-net color="#3DBFA8" density="0.00012" opacity="0.5" speed="0.15" link="150"></neural-net>
       ... content (give it position/z-index above the overlay) ...
     </div>

   Attributes (all optional):
     color    line/node color            default #3DBFA8 (Aurora Teal)
     density  nodes per px^2             default 0.00011
     opacity  overall layer opacity      default 0.55
     speed    drift px/frame             default 0.15
     link     max px distance to draw an edge   default 150
*/
(() => {
  if (customElements.get("neural-net")) return;

  class NeuralNet extends HTMLElement {
    connectedCallback() {
      this.style.position = this.style.position || "absolute";
      this.style.inset = "0";
      this.style.pointerEvents = "none";
      this.style.overflow = "hidden";
      this.style.display = "block";

      this.canvas = document.createElement("canvas");
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.canvas.style.display = "block";
      this.canvas.style.opacity = this.getAttribute("opacity") || "0.55";
      this.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");

      this.color = this.getAttribute("color") || "#3DBFA8";
      this.density = parseFloat(this.getAttribute("density") || "0.00011");
      this.speed = parseFloat(this.getAttribute("speed") || "0.15");
      this.link = parseFloat(this.getAttribute("link") || "150");
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      this._resize();

      if (this.reduced) { this._draw(); }
      else { this._loop = this._loop.bind(this); this._raf = requestAnimationFrame(this._loop); }
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
    }

    _rgb() {
      const h = this.color.replace("#", "");
      const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    _resize() {
      const r = this.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.canvas.width = r.width * dpr;
      this.canvas.height = r.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.max(14, Math.min(90, Math.round(r.width * r.height * this.density)));
      const nodes = this.nodes || [];
      while (nodes.length < target) {
        nodes.push({
          x: Math.random() * r.width, y: Math.random() * r.height,
          vx: (Math.random() - 0.5) * this.speed * 2, vy: (Math.random() - 0.5) * this.speed * 2,
          hub: Math.random() < 0.14, pulse: Math.random() * Math.PI * 2,
        });
      }
      nodes.length = target;
      this.nodes = nodes;
      if (this.reduced) this._draw();
    }

    _draw() {
      const { ctx, w, h, nodes, link } = this;
      if (!ctx || !w) return;
      const [r, g, b] = this._rgb();
      ctx.clearRect(0, 0, w, h);

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], c = nodes[j];
          const dx = a.x - c.x, dy = a.y - c.y;
          const d = Math.hypot(dx, dy);
          if (d < link) {
            const alpha = (1 - d / link) * 0.5;
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const nd of nodes) {
        const rad = nd.hub ? 2.6 : 1.4;
        if (nd.hub) {
          const glow = 0.35 + Math.sin(nd.pulse) * 0.25;
          const grad = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 9);
          grad.addColorStop(0, `rgba(${r},${g},${b},${glow})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(nd.x, nd.y, 9, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `rgba(${r},${g},${b},${nd.hub ? 0.9 : 0.55})`;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, rad, 0, Math.PI * 2); ctx.fill();
      }
    }

    _loop() {
      const { w, h, nodes } = this;
      if (w) {
        for (const nd of nodes) {
          nd.x += nd.vx; nd.y += nd.vy; nd.pulse += 0.03;
          if (nd.x < 0 || nd.x > w) nd.vx *= -1;
          if (nd.y < 0 || nd.y > h) nd.vy *= -1;
        }
        this._draw();
      }
      this._raf = requestAnimationFrame(this._loop);
    }
  }

  customElements.define("neural-net", NeuralNet);
})();
