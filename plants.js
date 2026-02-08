// ==================== COLOR CLASS ====================
class Color {
  r;
  g;
  b;
  a;

  constructor(r, g, b, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toString() {
    return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a / 255})`;
  }
}

// ==================== SKETCH CLASS (Processing-like framework) ====================
class Sketch {
  ctx;
  canvas;
  width;
  height;
  frameCount = 0;

  // Constants
  HSB = "hsb";
  RGB = "rgb";
  CLOSE = "close";

  // Private properties
  _colorMode = "rgb";
  _lastFrameTime = 0;
  _targetFrameInterval = 1000 / 60;

  // Perlin noise properties
  perm = [];
  grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];

  // User-defined functions
  setup = () => { };
  draw = () => { };

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.width = canvas.width;
    this.height = canvas.height;
    this.initNoise();
    requestAnimationFrame(() => this.start());
  }

  start() {
    this.setup();
    this._lastFrameTime = performance.now();
    this.loop();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    let currentTime = performance.now();
    let elapsed = currentTime - this._lastFrameTime;

    if (elapsed > this._targetFrameInterval) {
      this._lastFrameTime = currentTime - (elapsed % this._targetFrameInterval);
      this.draw();
      this.frameCount++;
    }
  }

  frameRate(fps) {
    if (fps > 0) {
      this._targetFrameInterval = 1000 / fps;
    } else {
      this._targetFrameInterval = 0;
    }
  }

  // Initialize Perlin noise
  initNoise() {
    let permutation = new Array(256).fill(0).map((val, index) => index);

    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }

    this.perm = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = permutation[i & 255];
    }
  }

  dot(gradient, x, y) {
    return gradient[0] * x + gradient[1] * y;
  }

  // Perlin noise implementation
  noise(x, y) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const skew = (x + y) * F2;
    const i = Math.floor(x + skew);
    const j = Math.floor(y + skew);

    const G2 = (3 - Math.sqrt(3)) / 6;
    const unskew = (i + j) * G2;
    const X0 = i - unskew;
    const Y0 = j - unskew;
    const x0 = x - X0;
    const y0 = y - Y0;

    // Determine which simplex we're in
    let i1, j1;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    const gi0 = this.perm[ii + this.perm[jj]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;

    let n0, n1, n2;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    return 70 * (n0 + n1 + n2) * 0.5 + 0.5;
  }

  lerp(start, end, amount) {
    return amount * (end - start) + start;
  }

  colorMode(mode) {
    this._colorMode = mode;
  }

  color(r, g, b, a) {
    if (r instanceof Color) {
      return new Color(r.r, r.g, r.b, r.a);
    }

    if (typeof r === "string") {
      let colorStr = r.trim();

      if (colorStr === "white") return new Color(255, 255, 255);
      if (colorStr === "black") return new Color(0, 0, 0);
      if (colorStr === "transparent") return new Color(0, 0, 0, 0);

      if (colorStr.startsWith("#")) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) {
          hex = hex.split("").map(c => c + c).join("");
        }
        if (hex.length === 6) {
          hex += "ff";
        }
        let value = parseInt(hex, 16);
        return new Color(
          (value >> 24) & 255,
          (value >> 16) & 255,
          (value >> 8) & 255,
          value & 255
        );
      }

      if (colorStr.startsWith("rgb")) {
        let values = colorStr.match(/[\\d.]+/g);
        if (values && values.length >= 3) {
          let red = parseFloat(values[0]);
          let green = parseFloat(values[1]);
          let blue = parseFloat(values[2]);
          let alpha = values[3] ? parseFloat(values[3]) * 255 : 255;
          return new Color(red, green, blue, alpha);
        }
      }

      return new Color(0, 0, 0);
    }

    if (typeof r === "number" && g !== undefined && b !== undefined) {
      let alpha = a !== undefined ? a : (this._colorMode === this.RGB ? 255 : 1);
      if (this._colorMode === this.HSB) {
        return this.hsbToRgb(r, g, b, alpha);
      } else {
        return new Color(r, g, b, alpha);
      }
    }

    return new Color(0, 0, 0);
  }

  lerpColor(color1, color2, amount) {
    return new Color(
      this.lerp(color1.r, color2.r, amount),
      this.lerp(color1.g, color2.g, amount),
      this.lerp(color1.b, color2.b, amount),
      this.lerp(color1.a, color2.a, amount)
    );
  }

  rgbToHsb(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = 0;
    let s;
    let v = max;
    let d = max - min;

    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (s - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, b: v * 100 };
  }

  hsbToRgb(h, s, b, a) {
    s /= 100;
    b /= 100;

    let f = (n) => (n + h / 60) % 6;
    let convert = (n) => b * (1 - s * Math.max(0, Math.min(f(n), 4 - f(n), 1)));

    return new Color(
      convert(5) * 255,
      convert(3) * 255,
      convert(1) * 255,
      a * 255
    );
  }

  hue(color) {
    return this.rgbToHsb(color.r, color.g, color.b).h;
  }

  saturation(color) {
    return this.rgbToHsb(color.r, color.g, color.b).s;
  }

  brightness(color) {
    return this.rgbToHsb(color.r, color.g, color.b).b;
  }

  // Drawing state methods
  push() {
    this.ctx.save();
  }

  pop() {
    this.ctx.restore();
  }

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  rotate(angle) {
    this.ctx.rotate(angle);
  }

  pixelDensity(density) { }

  stroke(color) {
    let c = this.color(color);
    this.ctx.strokeStyle = c.toString();
  }

  strokeWeight(weight) {
    this.ctx.lineWidth = weight;
  }

  noStroke() {
    this.ctx.strokeStyle = "rgba(0,0,0,0)";
  }

  fill(color) {
    let c = this.color(color);
    this.ctx.fillStyle = c.toString();
  }

  noFill() {
    this.ctx.fillStyle = "rgba(0,0,0,0)";
  }

  noSmooth() {
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  beginShape() {
    this.ctx.beginPath();
  }

  vertex(x, y) {
    this.ctx.lineTo(x, y);
  }

  endShape(mode) {
    if (mode === "close") {
      this.ctx.closePath();
    }

    if (this.ctx.fillStyle && !this.ctx.fillStyle.toString().includes(", 0)")) {
      this.ctx.fill();
    }

    if (this.ctx.strokeStyle && !this.ctx.strokeStyle.toString().includes(", 0)")) {
      this.ctx.stroke();
    }
  }

  rect(x, y, w, h) {
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.endShape();
  }

  square(x, y, size) {
    this.rect(x, y, size, size);
  }

  ellipse(x, y, w, h) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    this.endShape();
  }

  arc(x, y, w, h, start, end) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, w / 2, h / 2, 0, start, end);
    this.ctx.lineTo(x, y);
    this.endShape();
  }
}

// ==================== PLANT CONFIGURATION ====================
// Available flower colors
var FLOWER_COLORS = [
  "#ff69b4",     // Hot pink
  "#ff6450ff",   // Coral
  "#fee65aff",   // Yellow
  "#b6c2ffff",   // Light blue
  "#8570dbff",   // Purple
  "#bf3de0ff",   // Magenta
  "#0b5e16ff"    // Dark green
];

// 95% chance to reduce color palette to 2-4 colors
if (Math.random() < 0.95) {
  let numColors = Math.round(Math.random() * 0.6) + 2;
  while (FLOWER_COLORS.length > numColors) {
    FLOWER_COLORS.splice(Math.floor(Math.random() * FLOWER_COLORS.length), 1);
  }
}

var MAX_BRANCH_LENGTH = 160;
var GRAVITY = 0; // Can be modified to make branches curve

// ==================== BRANCH CLASS ====================
class Branch {
  x;
  y;
  angle;
  color;
  length;
  totalLength;
  dead = false;
  splitChance = 0.04;
  splitCount;
  points;

  constructor(x, y, angle, color, length, totalLength = 0, splitCount = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    this.totalLength = totalLength;
    this.splitCount = splitCount;
    this.color = color;
    this.points = [];
  }

  update(sketch) {
    if (this.dead) {
      return [];
    }

    let newEntities = [];

    // Grow the branch
    this.length += 1;
    this.totalLength += 1;

    // Add noise-based organic movement
    let noiseAngle = (sketch.noise(this.x * 0.1, this.y * 0.1) - 0.5) * Math.PI / 16;
    this.angle += noiseAngle;

    // Boundary avoidance - keep branches inside canvas
    let boundaryMargin = 32;
    let boundaryForce = 0.1;

    if (this.totalLength > boundaryMargin) {
      // Left boundary
      if (this.x < boundaryMargin) {
        this.angle += (Math.sin(this.angle) > 0 ? -1 : 1) * boundaryForce;
      }
      // Right boundary
      else if (this.x > sketch.width - boundaryMargin) {
        this.angle += (Math.sin(this.angle) > 0 ? 1 : -1) * boundaryForce;
      }

      // Top boundary
      if (this.y < boundaryMargin) {
        this.angle += (Math.cos(this.angle) > 0 ? 1 : -1) * boundaryForce;
      }
      // Bottom boundary
      else if (this.y > sketch.height - boundaryMargin) {
        this.angle += (Math.cos(this.angle) > 0 ? -1 : 1) * boundaryForce;
      }
    }

    // Apply gravity effect
    if (this.totalLength > 32) {
      let normalizedAngle = this.angle % (Math.PI * 2);
      let gravityDirection = normalizedAngle > 3 * Math.PI / 2 ? 1 : -1;

      if (normalizedAngle > Math.PI) {
        gravityDirection = 0;
      }

      if (GRAVITY < 0) {
        gravityDirection = -gravityDirection;
      }

      this.angle += GRAVITY * gravityDirection;
    }

    // Move branch forward
    this.x += Math.cos(this.angle);
    this.y += Math.sin(this.angle);

    // Store point for drawing
    this.points.push({ x: this.x, y: this.y });

    // Branch splitting logic
    if (Math.random() < this.splitChance &&
      this.length > 16 &&
      this.totalLength > 32 &&
      this.splitCount < 4) {

      let splitAngle = sketch.noise(this.x * 0.2 + 100, this.y * 0.2 + 100) * Math.PI / 4 + Math.PI / 8;

      // Create two new branches
      let lighterColor = sketch.lerpColor(sketch.color(this.color), sketch.color("white"), 0.1).toString();

      newEntities.push(new Branch(
        this.x,
        this.y,
        this.angle + splitAngle,
        lighterColor,
        0,
        this.totalLength + Math.floor((Math.random() - 0.5) * 10),
        this.splitCount + 1
      ));

      newEntities.push(new Branch(
        this.x,
        this.y,
        this.angle - splitAngle,
        lighterColor,
        0,
        this.totalLength + Math.floor((Math.random() - 0.5) * 10),
        this.splitCount + 1
      ));

      this.dead = true;
    }

    // Spawn leaves randomly
    if (Math.random() < 0.03 * Math.ceil(this.totalLength / 64) && this.totalLength > 25) {
      newEntities.push(new Leaf(this.x, this.y, this.angle, this.color));
    }

    // Spawn flowers randomly
    let randomFlowerColor = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

    if (Math.random() < 0.01 && this.totalLength > 35) {
      newEntities.push(new Flower(this.x, this.y, this.angle, randomFlowerColor));
    }

    // Branch reached maximum length
    if (this.totalLength > MAX_BRANCH_LENGTH) {
      // 50% chance to spawn a final flower
      if (Math.random() < 0.5) {
        newEntities.push(new Flower(this.x, this.y, this.angle, randomFlowerColor));
      }
      this.dead = true;
    }

    return newEntities;
  }

  draw(sketch) {
    sketch.stroke(this.color);
    sketch.strokeWeight(1);
    sketch.noStroke();
    sketch.fill(this.color);
    sketch.noSmooth();

    // Draw all points in the branch
    for (let point of this.points) {
      sketch.rect(Math.floor(point.x) - 1, Math.floor(point.y) - 1, 2, 2);
    }

    // Draw the first point again (thicker base)
    sketch.rect(Math.floor(this.points[0].x) - 1, Math.floor(this.points[0].y) - 1, 2, 2);
  }
}

// ==================== LEAF CLASS ====================
class Leaf {
  x;
  y;
  angle;
  color;
  side;
  size;
  growth = 0;
  roundness;

  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.angle = angle + (Math.random() - 0.5) * Math.PI / 2;
    this.color = color;
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.size = Math.random() * 0.2 + 1;
    this.roundness = Math.ceil(Math.random() * 2 + 1);
  }

  update(sketch) {
    this.growth = sketch.lerp(this.growth, 1, 0.1);
    return [];
  }

  draw(sketch) {
    let scaledSize = this.size * this.growth;

    // Draw 5 overlapping layers for depth effect
    for (let layer = 0; layer < 5; layer++) {
      // Draw lighter background layer
      sketch.push();
      sketch.translate(this.x, this.y - 1);
      sketch.rotate(this.angle);
      sketch.fill(sketch.lerpColor(sketch.color(this.color), sketch.color("white"), 0.3));
      sketch.noStroke();
      sketch.noSmooth();
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, 0, Math.PI);
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, Math.PI, 0);
      sketch.pop();

      // Draw main leaf layer
      sketch.push();
      sketch.translate(this.x, this.y);
      sketch.rotate(this.angle);
      sketch.fill(this.color);
      sketch.noStroke();
      sketch.noSmooth();
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, 0, Math.PI);
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, Math.PI, 0);
      sketch.pop();
    }
  }
}

// ==================== FLOWER CONFIGURATIONS ====================
var FLOWER_TYPES = {
  0: { size: 2, life: 5 },   // Classic 4-petal flower
  1: { size: 1, life: 0 },   // Radial flower
  2: { size: 1, life: 10 },  // Small simple flower
  3: { size: 2, life: 5 },   // Square flower
  4: { size: 3, life: 10 },  // Organic cluster
  5: { size: 3, life: 0 }    // Bell/trumpet flower
};

// ==================== FLOWER CLASS ====================
class Flower {
  x;
  y;
  angle;
  color;
  flowerType = 0;
  flowers;
  life;
  size;
  growth = 0;

  constructor(x, y, angle, color) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.angle = angle;
    this.flowerType = Math.floor(Math.random() * 6);
    this.life = FLOWER_TYPES[this.flowerType].life;
    this.size = FLOWER_TYPES[this.flowerType].size;
    this.color = color;
    this.flowers = [{ x: this.x, y: this.y }];

    // Special angle adjustment for bell flowers
    if (this.flowerType == 5) {
      this.angle = this.angle % (Math.PI * 2);
      let angleToVertical = (Math.PI / 2 - this.angle + Math.PI) % (Math.PI * 2) - Math.PI;
      this.angle += angleToVertical * 0.5;
    }
  }

  update(sketch) {
    this.growth = sketch.lerp(this.growth, 1, 0.1);

    if (this.life <= 0) {
      return [];
    }

    if (sketch.frameCount % 4 != 0) {
      return [];
    }

    this.life--;

    let newFlowerPoints = [];

    // Type 4: Organic cluster growth
    if (this.flowerType === 4) {
      for (let point of this.flowers) {
        let randomAngle = Math.random() * Math.PI * 2;
        let randomDistance = Math.random() * 4 + 1;
        let newPoint = {
          x: point.x + Math.round(Math.cos(randomAngle) * randomDistance),
          y: point.y + Math.round(Math.sin(randomAngle) * randomDistance)
        };

        if (Math.random() < 0.3) {
          newFlowerPoints.push(newPoint);
        }
      }
    }
    // Other types: Grid-based growth
    else {
      for (let point of this.flowers) {
        let directions = [
          { x: 2, y: 1 },
          { x: -2, y: 1 },
          { x: 1, y: 2 },
          { x: 1, y: -2 }
        ];

        for (let direction of directions) {
          let spacing = this.size;
          let newPoint = {
            x: point.x + direction.x * spacing,
            y: point.y + direction.y * spacing
          };

          // Check if point is too close to existing points
          let tooClose = this.flowers.some(existingPoint => {
            let dx = existingPoint.x - newPoint.x;
            let dy = existingPoint.y - newPoint.y;
            return Math.sqrt(dx * dx + dy * dy) < spacing * 2;
          });

          if (!tooClose && Math.random() < 0.1) {
            newFlowerPoints.push(newPoint);
          }
        }
      }
    }

    this.flowers.push(...newFlowerPoints);

    return [];
  }

  draw(sketch) {
    sketch.push();
    sketch.noStroke();
    sketch.noSmooth();

    // Seeded random number generator for consistent flower appearance
    function makeSeededRandom(seed) {
      return function() {
        let value = seed += 1831565813;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      }
    }

    let random = makeSeededRandom(this.x * 1000);
    let index = 0;

    for (let point of this.flowers) {
      // Type 0: Classic 4-petal flower
      if (this.flowerType === 0) {
        sketch.fill(this.color);
        sketch.rect(point.x - 1, point.y, 2, 3);      // Right petal
        sketch.rect(point.x + 2, point.y, 2, 3);      // Left petal
        sketch.rect(point.x, point.y - 1, 3, 2);      // Top petal
        sketch.rect(point.x, point.y + 2, 3, 2);      // Bottom petal
        sketch.fill("white");
        sketch.rect(point.x + 1, point.y + 1, 1, 1);  // Center
      }
      // Type 2: Small simple flower
      else if (this.flowerType === 2) {
        sketch.fill(this.color);
        sketch.rect(point.x - 1, point.y - 1, 3, 3);
        sketch.fill("white");
        sketch.rect(point.x, point.y, 1, 1);
      }
      // Type 3: Square flower with variation
      else if (this.flowerType === 3) {
        let flowerColor = this.color;
        sketch.fill(flowerColor);

        let width = Math.round(random() * 2 + 4);
        let height = Math.round(random() * 2 + 4);

        sketch.rect(point.x - 2, point.y - 2, width, height);
        sketch.fill(sketch.lerpColor(sketch.color(flowerColor), sketch.color("white"), 0.2));
        sketch.rect(point.x - 1, point.y - 1, width - 2, height - 2);
        sketch.fill(flowerColor);
        sketch.rect(point.x, point.y, 1, 1);
      }
      // Type 4: Organic cluster
      else if (this.flowerType === 4) {
        for (let layer = 0; layer < 5; layer++) {
          sketch.fill(this.color);
          sketch.ellipse(point.x, point.y, 5, 5);
        }
      }
      // Type 1: Radial multi-petal flower
      else if (this.flowerType === 1) {
        let petalCount = Math.floor(random() * 3) + 4;
        let petalLength = Math.floor(random() * 5) + 2;
        petalLength = petalLength * this.growth;
        let alternatingColors = random() < 0.5;

        // Draw petals
        for (let petal = 0; petal < petalCount; petal++) {
          let petalAngle = petal / petalCount * Math.PI * 2 + this.angle;
          let petalX = point.x + Math.cos(petalAngle) * (petalLength - 1);
          let petalY = point.y + Math.sin(petalAngle) * (petalLength - 1);

          if (alternatingColors && petal % 2 == 0) {
            let lighterColor = sketch.lerpColor(sketch.color(this.color), sketch.color("white"), 0.3);
            sketch.fill(lighterColor);
          } else {
            sketch.fill(this.color);
          }

          sketch.ellipse(petalX, petalY, petalLength, petalLength);
        }

        // Draw center
        let centerColor = sketch.color(this.color);
        sketch.colorMode(sketch.HSB);
        centerColor = sketch.color(
          (sketch.hue(centerColor) + 15) % 360,
          sketch.saturation(centerColor),
          sketch.brightness(centerColor) / 2
        );

        let whiteCenter = sketch.lerpColor(sketch.color(this.color), sketch.color("white"), 0.5);
        sketch.fill(random() < 0.5 ? whiteCenter : centerColor);
        sketch.ellipse(point.x, point.y, petalLength + 1, petalLength + 1);
      }
      // Type 5: Bell/trumpet flower
      else if (this.flowerType == 5) {
        let flowerSize = 11 + Math.floor(random() * 5);
        let openingAngle = random() * 0.2 + 0.3;
        let darkColor = sketch.lerpColor(sketch.color(this.color), sketch.color("black"), 0.4);
        let flowerPoint = point;

        // Draw stem lines
        for (let stem = 0; stem < 5; stem++) {
          sketch.stroke(darkColor);
          sketch.noFill();
          sketch.beginShape();
          sketch.vertex(
            flowerPoint.x + Math.cos(this.angle) * (flowerSize / 2) * this.growth,
            flowerPoint.y + Math.sin(this.angle) * (flowerSize / 2) * this.growth
          );
          let stemExtension = 1.1 * this.growth;
          sketch.vertex(
            flowerPoint.x + Math.cos(this.angle) * flowerSize * stemExtension,
            flowerPoint.y + Math.sin(this.angle) * flowerSize * stemExtension
          );
          sketch.endShape();
        }

        // Draw bell petals
        for (let petal = 0; petal < 5; petal++) {
          sketch.fill(this.color);
          sketch.noStroke();

          // Draw center dot
          sketch.ellipse(
            flowerPoint.x + Math.cos(this.angle) * flowerSize / 3,
            flowerPoint.y + Math.sin(this.angle) * flowerSize / 3,
            3, 3
          );

          // Draw petal shape
          sketch.beginShape();
          sketch.vertex(flowerPoint.x, flowerPoint.y);

          // Left side of petal
          for (let i = 0; i <= 6; i++) {
            sketch.vertex(
              flowerPoint.x + Math.cos(this.angle - openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6),
              flowerPoint.y + Math.sin(this.angle - openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6)
            );
          }

          sketch.vertex(
            flowerPoint.x + Math.cos(this.angle) * flowerSize * 0.8,
            flowerPoint.y + Math.sin(this.angle) * flowerSize * 0.8
          );

          // Right side of petal
          for (let i = 6; i >= 0; i--) {
            sketch.vertex(
              flowerPoint.x + Math.cos(this.angle + openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6),
              flowerPoint.y + Math.sin(this.angle + openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6)
            );
          }

          sketch.endShape(sketch.CLOSE);
        }

        // Draw pistil/stamen
        sketch.noStroke();
        sketch.fill("#286428ff");  // Dark green
        sketch.ellipse(
          point.x + Math.cos(this.angle),
          point.y + Math.sin(this.angle),
          4, 4
        );
      }

      index += 1;
    }

    // Type 4: Draw connecting lines between cluster points
    if (this.flowerType === 4) {
      for (let connectLine = 0; connectLine < 5; connectLine++) {
        sketch.stroke(sketch.lerpColor(sketch.color(this.color), sketch.color("white"), 0.5));
        sketch.strokeWeight(1);
        sketch.noFill();
        sketch.beginShape();
        for (let point of this.flowers) {
          sketch.vertex(point.x, point.y);
        }
        sketch.endShape(sketch.CLOSE);
      }
    }

    sketch.pop();
  }
}

// ==================== INTERSECTION OBSERVER UTILITY ====================
function observeElement(element, callback) {
  let options = {};
  let observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      callback(entry.intersectionRatio > 0);
    });
  }, options);
  observer.observe(element);
}

// ==================== MAIN INITIALIZATION ====================
window.addEventListener("load", () => {
  let canvas = document.querySelector("#canvas");
  canvas.width = 160;
  canvas.height = 240;

  // Start with one branch at the bottom-right, growing upward
  let entities = [new Branch(canvas.width - 40, canvas.height, -Math.PI / 2, "#286428ff", 0)];
  let sketchInstance = null;

  function startGrowing() {
    console.log("Growing flower :)");

    sketchInstance = new Sketch(canvas);

    sketchInstance.setup = () => {
      sketchInstance = sketchInstance;
      sketchInstance.pixelDensity(1);
    };

    sketchInstance.draw = () => {
      sketchInstance = sketchInstance;

      // Slow down animation as it progresses
      let updateInterval = Math.floor(sketchInstance.frameCount / 75) + 1;
      updateInterval = Math.min(updateInterval, 6);

      if (sketchInstance.frameCount % updateInterval == 0) {
        sketchInstance.clear();

        // Update all entities (branches, leaves, flowers)
        for (let entity of entities) {
          let newEntities = entity.update(sketchInstance);
          entities.push(...newEntities);
        }

        // Draw all entities
        for (let entity of entities) {
          entity.draw(sketchInstance);
        }
      }
    };
  }

  // Only start growing when the canvas is visible on screen
  observeElement(canvas, (isVisible) => {
    if (isVisible && sketchInstance == null) {
      startGrowing();
    }
  });
});
