(() => {
  var f = class {
    r;
    g;
    b;
    a;
    constructor(t, e, s, o = 255) {
      this.r = t, this.g = e, this.b = s, this.a = o
    }
    toString() {
      return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a / 255})`
    }
  },
    x = class {
      ctx;
      canvas;
      width;
      height;
      frameCount = 0;
      HSB = "hsb";
      RGB = "rgb";
      CLOSE = "close";
      _colorMode = "rgb";
      _lastFrameTime = 0;
      _targetFrameInterval = 1e3 / 60;
      perm = [];
      grad3 = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1]
      ];
      setup = () => { };
      draw = () => { };
      constructor(t) {
        this.canvas = t, this.ctx = t.getContext("2d", {
          alpha: !0
        }), this.width = t.width, this.height = t.height, this.initNoise(), requestAnimationFrame(() => this.start())
      }
      start() {
        this.setup(), this._lastFrameTime = performance.now(), this.loop()
      }
      loop() {
        requestAnimationFrame(() => this.loop());
        let t = performance.now(),
          e = t - this._lastFrameTime;
        e > this._targetFrameInterval && (this._lastFrameTime = t - e % this._targetFrameInterval, this.draw(), this.frameCount++)
      }
      frameRate(t) {
        t > 0 ? this._targetFrameInterval = 1e3 / t : this._targetFrameInterval = 0
      }
      initNoise() {
        let t = new Array(256).fill(0).map((e, s) => s);
        for (let e = 255; e > 0; e--) {
          let s = Math.floor(Math.random() * (e + 1));
          [t[e], t[s]] = [t[s], t[e]]
        }
        this.perm = new Array(512);
        for (let e = 0; e < 512; e++) this.perm[e] = t[e & 255]
      }
      dot(t, e, s) {
        return t[0] * e + t[1] * s
      }
      noise(t, e) {
        let s, o, i, r = .5 * (Math.sqrt(3) - 1),
          n = (t + e) * r,
          a = Math.floor(t + n),
          l = Math.floor(e + n),
          u = (3 - Math.sqrt(3)) / 6,
          h = (a + l) * u,
          y = a - h,
          S = l - h,
          m = t - y,
          g = e - S,
          p, C;
        m > g ? (p = 1, C = 0) : (p = 0, C = 1);
        let P = m - p + u,
          T = g - C + u,
          k = m - 1 + 2 * u,
          I = g - 1 + 2 * u,
          B = a & 255,
          L = l & 255,
          E = this.perm[B + this.perm[L]] % 12,
          R = this.perm[B + p + this.perm[L + C]] % 12,
          D = this.perm[B + 1 + this.perm[L + 1]] % 12,
          b = .5 - m * m - g * g;
        b < 0 ? s = 0 : (b *= b, s = b * b * this.dot(this.grad3[E], m, g));
        let d = .5 - P * P - T * T;
        d < 0 ? o = 0 : (d *= d, o = d * d * this.dot(this.grad3[R], P, T));
        let w = .5 - k * k - I * I;
        return w < 0 ? i = 0 : (w *= w, i = w * w * this.dot(this.grad3[D], k, I)), 70 * (s + o + i) * .5 + .5
      }
      lerp(t, e, s) {
        return s * (e - t) + t
      }
      colorMode(t) {
        this._colorMode = t
      }
      color(t, e, s, o) {
        if (t instanceof f) return new f(t.r, t.g, t.b, t.a);
        if (typeof t == "string") {
          let i = t.trim();
          if (i === "white") return new f(255, 255, 255);
          if (i === "black") return new f(0, 0, 0);
          if (i === "transparent") return new f(0, 0, 0, 0);
          if (i.startsWith("#")) {
            let r = i.slice(1);
            r.length === 3 && (r = r.split("").map(a => a + a).join("")), r.length === 6 && (r += "ff");
            let n = parseInt(r, 16);
            return new f(n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255)
          }
          if (i.startsWith("rgb")) {
            let r = i.match(/[\d.]+/g);
            if (r && r.length >= 3) {
              let n = parseFloat(r[0]),
                a = parseFloat(r[1]),
                l = parseFloat(r[2]),
                u = r[3] ? parseFloat(r[3]) * 255 : 255;
              return new f(n, a, l, u)
            }
          }
          return new f(0, 0, 0)
        }
        if (typeof t == "number" && e !== void 0 && s !== void 0) {
          let i = o !== void 0 ? o : this._colorMode === this.RGB ? 255 : 1;
          return this._colorMode === this.HSB ? this.hsbToRgb(t, e, s, i) : new f(t, e, s, i)
        }
        return new f(0, 0, 0)
      }
      lerpColor(t, e, s) {
        return new f(this.lerp(t.r, e.r, s), this.lerp(t.g, e.g, s), this.lerp(t.b, e.b, s), this.lerp(t.a, e.a, s))
      }
      rgbToHsb(t, e, s) {
        t /= 255, e /= 255, s /= 255;
        let o = Math.max(t, e, s),
          i = Math.min(t, e, s),
          r = 0,
          n, a = o,
          l = o - i;
        if (n = o === 0 ? 0 : l / o, o === i) r = 0;
        else {
          switch (o) {
            case t:
              r = (e - s) / l + (e < s ? 6 : 0);
              break;
            case e:
              r = (s - t) / l + 2;
              break;
            case s:
              r = (t - e) / l + 4;
              break
          }
          r /= 6
        }
        return {
          h: r * 360,
          s: n * 100,
          b: a * 100
        }
      }
      hsbToRgb(t, e, s, o) {
        e /= 100, s /= 100;
        let i = n => (n + t / 60) % 6,
          r = n => s * (1 - e * Math.max(0, Math.min(i(n), 4 - i(n), 1)));
        return new f(r(5) * 255, r(3) * 255, r(1) * 255, o * 255)
      }
      hue(t) {
        return this.rgbToHsb(t.r, t.g, t.b).h
      }
      saturation(t) {
        return this.rgbToHsb(t.r, t.g, t.b).s
      }
      brightness(t) {
        return this.rgbToHsb(t.r, t.g, t.b).b
      }
      push() {
        this.ctx.save()
      }
      pop() {
        this.ctx.restore()
      }
      translate(t, e) {
        this.ctx.translate(t, e)
      }
      rotate(t) {
        this.ctx.rotate(t)
      }
      pixelDensity(t) { }
      stroke(t) {
        let e = this.color(t);
        this.ctx.strokeStyle = e.toString()
      }
      strokeWeight(t) {
        this.ctx.lineWidth = t
      }
      noStroke() {
        this.ctx.strokeStyle = "rgba(0,0,0,0)"
      }
      fill(t) {
        let e = this.color(t);
        this.ctx.fillStyle = e.toString()
      }
      noFill() {
        this.ctx.fillStyle = "rgba(0,0,0,0)"
      }
      noSmooth() {
        this.ctx.imageSmoothingEnabled = !1
      }
      clear() {
        this.ctx.clearRect(0, 0, this.width, this.height)
      }
      beginShape() {
        this.ctx.beginPath()
      }
      vertex(t, e) {
        this.ctx.lineTo(t, e)
      }
      endShape(t) {
        t === "close" && this.ctx.closePath(), this.ctx.fillStyle && !this.ctx.fillStyle.toString().includes(", 0)") && this.ctx.fill(), this.ctx.strokeStyle && !this.ctx.strokeStyle.toString().includes(", 0)") && this.ctx.stroke()
      }
      rect(t, e, s, o) {
        this.ctx.beginPath(), this.ctx.rect(t, e, s, o), this.endShape()
      }
      square(t, e, s) {
        this.rect(t, e, s, s)
      }
      ellipse(t, e, s, o) {
        this.ctx.beginPath(), this.ctx.ellipse(t, e, s / 2, o / 2, 0, 0, Math.PI * 2), this.endShape()
      }
      arc(t, e, s, o, i, r) {
        this.ctx.beginPath(), this.ctx.ellipse(t, e, s / 2, o / 2, 0, i, r), this.ctx.lineTo(t, e), this.endShape()
      }
    };
  var M = ["#ff69b4", "#ff6450ff", "#fee65aff", "#b6c2ffff", "#8570dbff", "#bf3de0ff", "#0b5e16ff"];
  if (Math.random() < .95) {
    let c = Math.round(Math.random() * .6) + 2;
    for (; M.length > c;) M.splice(Math.floor(Math.random() * M.length), 1)
  }
  var q = 160,
    _ = 0,
    F = class c {
      x;
      y;
      angle;
      color;
      length;
      totalLength;
      dead = !1;
      splitChance = .04;
      splitCount;
      points;
      constructor(t, e, s, o, i, r = 0, n = 0) {
        this.x = t, this.y = e, this.angle = s, this.length = i, this.totalLength = r, this.splitCount = n, this.color = o, this.points = []
      }
      update(t) {
        if (this.dead) return [];
        let e = [];
        this.length += 1, this.totalLength += 1;
        let s = (t.noise(this.x * .1, this.y * .1) - .5) * Math.PI / 16;
        this.angle += s;
        let o = 32,
          i = .1;
        if (this.totalLength > o && (this.x < o ? this.angle += (Math.sin(this.angle) > 0 ? -1 : 1) * i : this.x > t.width - o && (this.angle += (Math.sin(this.angle) > 0 ? 1 : -1) * i), this.y < o ? this.angle += (Math.cos(this.angle) > 0 ? 1 : -1) * i : this.y > t.height - o && (this.angle += (Math.cos(this.angle) > 0 ? -1 : 1) * i)), this.totalLength > 32) {
          let n = this.angle % (Math.PI * 2),
            a = n > 3 * Math.PI / 2 ? 1 : -1;
          n > Math.PI && (a = 0), _ < 0 && (a = -a), this.angle += _ * a
        }
        if (this.x += Math.cos(this.angle), this.y += Math.sin(this.angle), this.points.push({
          x: this.x,
          y: this.y
        }), Math.random() < this.splitChance && this.length > 16 && this.totalLength > 32 && this.splitCount < 4) {
          let n = t.noise(this.x * .2 + 100, this.y * .2 + 100) * Math.PI / 4 + Math.PI / 8;
          e.push(new c(this.x, this.y, this.angle + n, t.lerpColor(t.color(this.color), t.color("white"), .1).toString(), 0, this.totalLength + Math.floor((Math.random() - .5) * 10), this.splitCount + 1)), e.push(new c(this.x, this.y, this.angle - n, t.lerpColor(t.color(this.color), t.color("white"), .1).toString(), 0, this.totalLength + Math.floor((Math.random() - .5) * 10), this.splitCount + 1)), this.dead = !0
        }
        Math.random() < .03 * Math.ceil(this.totalLength / 64) && this.totalLength > 25 && e.push(new z(this.x, this.y, this.angle, this.color));
        let r = M[Math.floor(Math.random() * M.length)];
        return Math.random() < .01 && this.totalLength > 35 && e.push(new v(this.x, this.y, this.angle, r)), this.totalLength > q && (Math.random() < .5 && e.push(new v(this.x, this.y, this.angle, r)), this.dead = !0), e
      }
      draw(t) {
        t.stroke(this.color), t.strokeWeight(1), t.noStroke(), t.fill(this.color), t.noSmooth();
        for (let e of this.points) t.rect(Math.floor(e.x) - 1, Math.floor(e.y) - 1, 2, 2);
        t.rect(Math.floor(this.points[0].x) - 1, Math.floor(this.points[0].y) - 1, 2, 2)
      }
    },
    z = class {
      x;
      y;
      angle;
      color;
      side;
      size;
      growth = 0;
      roundness;
      constructor(t, e, s, o) {
        this.x = t, this.y = e, this.angle = s + (Math.random() - .5) * Math.PI / 2, this.color = o, this.side = Math.random() < .5 ? -1 : 1, this.size = Math.random() * .2 + 1, this.roundness = Math.ceil(Math.random() * 2 + 1)
      }
      update(t) {
        return this.growth = t.lerp(this.growth, 1, .1), []
      }
      draw(t) {
        let e = this.size * this.growth;
        for (let s = 0; s < 5; s++) t.push(), t.translate(this.x, this.y - 1), t.rotate(this.angle), t.fill(t.lerpColor(t.color(this.color), t.color("white"), .3)), t.noStroke(), t.noSmooth(), t.arc(0, 4 * this.side * this.growth, this.roundness * e, 6 * e, 0, Math.PI), t.arc(0, 4 * this.side * this.growth, this.roundness * e, 6 * e, Math.PI, 0), t.pop(), t.push(), t.translate(this.x, this.y), t.rotate(this.angle), t.fill(this.color), t.noStroke(), t.noSmooth(), t.arc(0, 4 * this.side * this.growth, this.roundness * e, 6 * e, 0, Math.PI), t.arc(0, 4 * this.side * this.growth, this.roundness * e, 6 * e, Math.PI, 0), t.pop()
      }
    };
  var H = {
    0: {
      size: 2,
      life: 5
    },
    1: {
      size: 1,
      life: 0
    },
    2: {
      size: 1,
      life: 10
    },
    3: {
      size: 2,
      life: 5
    },
    4: {
      size: 3,
      life: 10
    },
    5: {
      size: 3,
      life: 0
    }
  },
    v = class {
      x;
      y;
      angle;
      color;
      flowerType = 0;
      flowers;
      life;
      size;
      growth = 0;
      constructor(t, e, s, o) {
        if (this.x = Math.round(t), this.y = Math.round(e), this.angle = s, this.flowerType = Math.floor(Math.random() * 6), this.life = H[this.flowerType].life, this.size = H[this.flowerType].size, this.color = o, this.flowers = [{
          x: this.x,
          y: this.y
        }], this.flowerType == 5) {
          this.angle = this.angle % (Math.PI * 2);
          let r = (Math.PI / 2 - this.angle + Math.PI) % (Math.PI * 2) - Math.PI;
          this.angle += r * .5
        }
      }
      update(t) {
        if (this.growth = t.lerp(this.growth, 1, .1), this.life <= 0) return [];
        if (t.frameCount % 4 != 0) return [];
        this.life--;
        let e = [];
        if (this.flowerType === 4)
          for (let s of this.flowers) {
            let o = Math.random() * Math.PI * 2,
              i = Math.random() * 4 + 1,
              r = {
                x: s.x + Math.round(Math.cos(o) * i),
                y: s.y + Math.round(Math.sin(o) * i)
              };
            Math.random() < .3 && e.push(r)
          } else
          for (let s of this.flowers) {
            let o = [{
              x: 2,
              y: 1
            }, {
              x: -2,
              y: 1
            }, {
              x: 1,
              y: 2
            }, {
              x: 1,
              y: -2
            }];
            for (let i of o) {
              let r = this.size,
                n = {
                  x: s.x + i.x * r,
                  y: s.y + i.y * r
                };
              this.flowers.some(l => {
                let u = l.x - n.x,
                  h = l.y - n.y;
                return Math.sqrt(u * u + h * h) < r * 2
              }) || Math.random() < .1 && e.push(n)
            }
          }
        return this.flowers.push(...e), []
      }
      draw(t) {
        t.push(), t.noStroke(), t.noSmooth();

        function e(i) {
          return function() {
            let r = i += 1831565813;
            return r = Math.imul(r ^ r >>> 15, r | 1), r ^= r + Math.imul(r ^ r >>> 7, r | 61), ((r ^ r >>> 14) >>> 0) / 4294967296
          }
        }
        let s = e(this.x * 1e3),
          o = 0;
        for (let i of this.flowers) {
          if (this.flowerType === 0) t.fill(this.color), t.rect(i.x - 1, i.y, 2, 3), t.rect(i.x + 2, i.y, 2, 3), t.rect(i.x, i.y - 1, 3, 2), t.rect(i.x, i.y + 2, 3, 2), t.fill("white"), t.rect(i.x + 1, i.y + 1, 1, 1);
          else if (this.flowerType === 2) t.fill(this.color), t.rect(i.x - 1, i.y - 1, 3, 3), t.fill("white"), t.rect(i.x, i.y, 1, 1);
          else if (this.flowerType === 3) {
            let r = this.color;
            t.fill(r);
            let n = Math.round(s() * 2 + 4),
              a = Math.round(s() * 2 + 4);
            t.rect(i.x - 2, i.y - 2, n, a), t.fill(t.lerpColor(t.color(r), t.color("white"), .2)), t.rect(i.x - 1, i.y - 1, n - 2, a - 2), t.fill(r), t.rect(i.x, i.y, 1, 1)
          } else if (this.flowerType === 4)
            for (let r = 0; r < 5; r++) t.fill(this.color), t.ellipse(i.x, i.y, 5, 5);
          else if (this.flowerType === 1) {
            let r = Math.floor(s() * 3) + 4,
              n = Math.floor(s() * 5) + 2;
            n = n * this.growth;
            let a = s() < .5;
            for (let h = 0; h < r; h++) {
              let y = h / r * Math.PI * 2 + this.angle,
                S = i.x + Math.cos(y) * (n - 1),
                m = i.y + Math.sin(y) * (n - 1);
              if (a && h % 2 == 0) {
                let g = t.lerpColor(t.color(this.color), t.color("white"), .3);
                t.fill(g)
              } else t.fill(this.color);
              t.ellipse(S, m, n, n)
            }
            let l = t.color(this.color);
            t.colorMode(t.HSB), l = t.color((t.hue(l) + 15) % 360, t.saturation(l), t.brightness(l) / 2);
            let u = t.lerpColor(t.color(this.color), t.color("white"), .5);
            t.fill(s() < .5 ? u : l), t.ellipse(i.x, i.y, n + 1, n + 1)
          } else if (this.flowerType == 5) {
            let r = 11 + Math.floor(s() * 5),
              n = s() * .2 + .3,
              a = t.lerpColor(t.color(this.color), t.color("black"), .4),
              l = i;
            for (let u = 0; u < 5; u++) {
              t.stroke(a), t.noFill(), t.beginShape(), t.vertex(l.x + Math.cos(this.angle) * (r / 2) * this.growth, l.y + Math.sin(this.angle) * (r / 2) * this.growth);
              let h = 1.1 * this.growth;
              t.vertex(l.x + Math.cos(this.angle) * r * h, l.y + Math.sin(this.angle) * r * h), t.endShape()
            }
            for (let u = 0; u < 5; u++) {
              t.fill(this.color), t.noStroke(), t.ellipse(l.x + Math.cos(this.angle) * r / 3, l.y + Math.sin(this.angle) * r / 3, 3, 3), t.beginShape(), t.vertex(l.x, l.y);
              for (let h = 0; h <= 6; h++) t.vertex(l.x + Math.cos(this.angle - n * this.growth * (h / 6)) * r * (h / 6), l.y + Math.sin(this.angle - n * this.growth * (h / 6)) * r * (h / 6));
              t.vertex(l.x + Math.cos(this.angle) * r * .8, l.y + Math.sin(this.angle) * r * .8);
              for (let h = 6; h >= 0; h--) t.vertex(l.x + Math.cos(this.angle + n * this.growth * (h / 6)) * r * (h / 6), l.y + Math.sin(this.angle + n * this.growth * (h / 6)) * r * (h / 6));
              t.endShape(t.CLOSE)
            }
            t.noStroke(), t.fill("#286428ff"), t.ellipse(i.x + Math.cos(this.angle), i.y + Math.sin(this.angle), 4, 4)
          }
          o += 1
        }
        if (this.flowerType === 4)
          for (let i = 0; i < 5; i++) {
            t.stroke(t.lerpColor(t.color(this.color), t.color("white"), .5)), t.strokeWeight(1), t.noFill(), t.beginShape();
            for (let r of this.flowers) t.vertex(r.x, r.y);
            t.endShape(t.CLOSE)
          }
        t.pop()
      }
    };

  function j(c, t) {
    var e = {},
      s = new IntersectionObserver((o, i) => {
        o.forEach(r => {
          t(r.intersectionRatio > 0)
        })
      }, e);
    s.observe(c)
  }
  window.addEventListener("load", () => {
    let c = document.querySelector("#canvas");
    c.width = 160, c.height = 240;
    let t = [new F(c.width - 40, c.height, -Math.PI / 2, "#286428ff", 0)],
      e = null;

    function s() {
      console.log("Growing flower :)"), e = new x(c), e.setup = () => {
        e = e, e.pixelDensity(1)
      }, e.draw = () => {
        e = e;
        let o = Math.floor(e.frameCount / 75) + 1;
        if (o = Math.min(o, 6), e.frameCount % o == 0) {
          e.clear();
          for (let i of t) {
            let r = i.update(e);
            t.push(...r)
          }
          for (let i of t) i.draw(e)
        }
      }
    }
    j(c, o => {
      o && e == null && s()
    })
  });
})();
