const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const dialog = document.querySelector('[data-dialog]');
const interestForm = document.querySelector('[data-interest-form]');
const successState = document.querySelector('[data-form-success]');
const cursorLight = document.querySelector('[data-cursor-light]');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 48);

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const nextState = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(nextState));
  navigation?.classList.toggle('is-open', nextState);
  document.body.classList.toggle('is-menu-open', nextState);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    document.body.classList.remove('is-menu-open');
  });
});

const sectionLinks = [...(navigation?.querySelectorAll('a[href^="#"]') || [])];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach((link) => {
      const isActive = link.hash === `#${visible.target.id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  },
  { rootMargin: '-28% 0px -58% 0px', threshold: [0, 0.1, 0.35] },
);

sectionLinks.forEach((link) => {
  const section = document.querySelector(link.hash);
  if (section) sectionObserver.observe(section);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -45px' },
);

document.querySelectorAll('.reveal').forEach((element, index) => {
  if (element.closest('.hero')) element.style.transitionDelay = `${Math.min(index * 75, 340)}ms`;
  revealObserver.observe(element);
});

if (finePointer) {
  window.addEventListener(
    'pointermove',
    (event) => {
      cursorLight?.style.setProperty('--cursor-x', `${event.clientX}px`);
      cursorLight?.style.setProperty('--cursor-y', `${event.clientY}px`);
    },
    { passive: true },
  );

  document.querySelectorAll('.glass-button, .glass-icon').forEach((control) => {
    control.addEventListener('pointermove', (event) => {
      const bounds = control.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width;
      const py = (event.clientY - bounds.top) / bounds.height;
      control.style.setProperty('--glass-x', `${px * 100}%`);
      control.style.setProperty('--glass-y', `${py * 100}%`);
      control.style.transform = `translate(${(px - 0.5) * 8}px, ${(py - 0.5) * 6 - 2}px)`;
    });

    control.addEventListener('pointerleave', () => {
      control.style.removeProperty('--glass-x');
      control.style.removeProperty('--glass-y');
      control.style.transform = '';
    });
  });
}

const heroScene = document.querySelector('[data-tilt-scene]');
const heroSection = heroScene?.closest('.hero');

const updateHeroScroll = () => {
  if (!heroScene || !heroSection) return;
  const bounds = heroSection.getBoundingClientRect();
  const progress = reducedMotion ? 1 : clamp(-bounds.top / Math.max(bounds.height * 0.72, 1));
  heroScene.style.setProperty('--hero-y', `${progress * 150}px`);
  heroScene.style.setProperty('--hero-scale', (1 + progress * 0.1).toFixed(3));
  heroScene.style.setProperty('--orbit-reveal', String(clamp(progress * 2.1, 0.18, 1)));
  heroScene.style.setProperty('--label-reveal', String(clamp((progress - 0.2) * 2.1, 0.12, 1)));
  heroScene.style.setProperty('--layer-reveal', String(clamp((progress - 0.4) * 2.3)));
  heroScene.style.setProperty('--internal-reveal', String(clamp((progress - 0.56) * 2.7)));
};

if (heroScene && finePointer && !reducedMotion) {
  heroSection?.addEventListener('pointermove', (event) => {
    const bounds = heroSection.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroScene.style.setProperty('--ry', `${x * 9}deg`);
    heroScene.style.setProperty('--rx', `${y * -7}deg`);
  });

  heroSection?.addEventListener('pointerleave', () => {
    heroScene.style.setProperty('--ry', '0deg');
    heroScene.style.setProperty('--rx', '0deg');
  });
}

const smokeCanvas = document.querySelector('[data-smoke-canvas]');

// Volumetric 3D smoke: raymarched FBM volume rendered in a raw WebGL
// fragment shader (no dependencies). Smoke streams left -> right, dense on
// the left and dissolving to clean paper on the right, lit from top-right
// so billow tops read bright and crevices fall into cool grey shadow.
const startVolumetricSmoke = (canvas) => {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vertexSource = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const fragmentSource = (steps) => `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform vec2 uRes;
    uniform float uTime;

    #define STEPS ${steps}

    const vec3 BG = vec3(0.9686, 0.9725, 0.9608);
    const vec3 SMOKE_DARK = vec3(0.33, 0.345, 0.39);
    const vec3 SMOKE_LIGHT = vec3(0.945, 0.945, 0.935);
    const vec3 LIGHT_DIR = vec3(0.4249, 0.7081, -0.4721);

    float hash13(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.zyx + 31.32);
      return fract((p.x + p.y) * p.z);
    }

    float noise3(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), u.x),
            mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
        mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), u.x),
            mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
        u.z);
    }

    float fbm3(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; i++) {
        v += a * noise3(p);
        p = p * 2.03 + vec3(17.3, 9.1, 4.7);
        a *= 0.52;
      }
      return v;
    }

    float fbm2(vec3 p) {
      float v = 0.5 * noise3(p);
      p = p * 2.03 + vec3(17.3, 9.1, 4.7);
      v += 0.26 * noise3(p);
      return v;
    }

    void main() {
      vec2 uvN = gl_FragCoord.xy / uRes;
      float aspect = uRes.x / uRes.y;
      vec2 uv = vec2((uvN.x - 0.5) * aspect, uvN.y - 0.5);
      float t = uTime;

      // Per-pixel domain-warped flow position (constant along the ray).
      // The whole field advects left -> right at a slow, stately pace.
      float sx = uv.x * 1.85 - t * 0.085;
      float sy = uv.y * 1.85;
      float wx = fbm3(vec3(sx, sy + t * 0.045, 3.7));
      float wy = fbm3(vec3(sx + 5.2, sy - t * 0.03, 1.3));
      float qx = sx + (wx - 0.5) * 2.7;
      float qy = sy + (wy - 0.5) * 2.295;

      // Density mask: heavy on the left, organic dissolving edge to the right.
      float edge = fbm3(vec3(uvN.x * 1.5 + 9.0 - t * 0.02975, uvN.y * 1.5, 7.7));
      float maskX = 1.0 - smoothstep(0.15, 1.05, uvN.x + (edge - 0.5) * 0.85);
      float maskY = 0.74 + 0.26 * (1.0 - smoothstep(0.10, 0.95, uvN.y));
      float mask = min(maskX * maskY + 0.035, 1.0);

      vec3 rd = normalize(vec3(uv * 0.5, 1.0));
      float jit = hash13(vec3(gl_FragCoord.xy * 0.71, 0.37));

      float trans = 1.0;
      float tau = 0.0;
      vec3 col = vec3(0.0);
      float dt = 2.0 / float(STEPS);

      for (int i = 0; i < STEPS; i++) {
        float tz = -1.0 + (float(i) + 0.2 + jit * 0.6) * dt;
        vec3 pos = vec3(uv + rd.xy * tz, rd.z * tz);
        float qz = pos.z * 1.1 + t * 0.025;
        vec3 sp = vec3(qx + pos.x * 0.6475, qy + pos.y * 0.6475, qz);
        float v = fbm3(sp);
        float clump = fbm3(vec3(qx * 0.42 + 13.1, qy * 0.42 + 7.7, qz * 0.42));
        float dens = smoothstep(0.40, 0.70, v * 0.62 + clump * 0.66) * mask;
        if (dens > 0.002) {
          vec3 lp = sp + LIGHT_DIR * 0.34;
          float vl = fbm3(lp);
          float cl = fbm2(vec3((qx + LIGHT_DIR.x * 0.34) * 0.42 + 13.1,
                               (qy + LIGHT_DIR.y * 0.34) * 0.42 + 7.7,
                               (qz + LIGHT_DIR.z * 0.34) * 0.42));
          float densL = smoothstep(0.40, 0.70, vl * 0.62 + cl * 0.66) * mask;
          float lit = clamp(0.50 + (dens - densL) * 8.0, 0.0, 1.0);
          tau += dens * dt;
          float ao = 0.50 + 0.50 * exp(-tau * 1.3);
          float a = 1.0 - exp(-dens * dt * 4.6);
          col += trans * a * mix(SMOKE_DARK, SMOKE_LIGHT, lit * ao);
          trans *= 1.0 - a;
          if (trans < 0.02) break;
        }
      }

      col += trans * BG;
      col += (hash13(vec3(gl_FragCoord.xy, 1.7)) - 0.5) * 0.006;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const buildProgram = (steps) => {
    const vs = compile(gl.VERTEX_SHADER, vertexSource);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSource(steps));
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    return program;
  };

  // Two quality tiers; drop down if the device cannot hold a smooth frame.
  const tiers = [
    { scale: 0.55, steps: 22 },
    { scale: 0.42, steps: 14 },
  ];
  let tier = 0;
  let program = buildProgram(tiers[0].steps);
  if (!program) return null;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  let uRes = null;
  let uTime = null;
  const useProgram = () => {
    gl.useProgram(program);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    uRes = gl.getUniformLocation(program, 'uRes');
    uTime = gl.getUniformLocation(program, 'uTime');
  };
  useProgram();

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const scale = tiers[tier].scale;
    canvas.width = Math.max(2, Math.round(bounds.width * scale));
    canvas.height = Math.max(2, Math.round(bounds.height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const draw = (time) => {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (reducedMotion) {
    draw(12);
    return { stop: () => {} };
  }

  let raf = 0;
  let running = false;
  let inView = true;
  const start = performance.now();
  let frames = 0;
  let accum = 0;
  let last = start;

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    draw(12 + (now - start) / 1000);

    // Adaptive quality: after a warm-up, drop a tier if frames run long.
    frames += 1;
    accum += now - last;
    last = now;
    if (frames === 90 && tier < tiers.length - 1 && accum / frames > 26) {
      tier += 1;
      program = buildProgram(tiers[tier].steps);
      if (program) {
        useProgram();
        resize();
      }
    }
  };

  const play = () => {
    if (running || document.hidden || !inView) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });

  const hero = canvas.closest('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting !== false;
        if (inView) play();
        else pause();
      },
      { threshold: 0 },
    ).observe(hero);
  }

  play();
  return { stop: pause };
};

if (smokeCanvas) {
  const volumetric = startVolumetricSmoke(smokeCanvas);

  if (volumetric) {
    smokeCanvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      volumetric.stop();
      // A canvas that lost its WebGL context cannot switch to 2D — swap in a
      // fresh element and run the Canvas 2D smoke on it instead.
      const replacement = smokeCanvas.cloneNode();
      smokeCanvas.replaceWith(replacement);
      startCanvasSmoke(replacement);
    });
  } else {
    startCanvasSmoke(smokeCanvas);
  }
}

function startCanvasSmoke(smokeCanvas) {
  const ctx = smokeCanvas.getContext('2d');
  if (!ctx) return;
  // Offscreen buffer for the self-advection feedback pass
  const field = document.createElement('canvas');
  const fctx = field.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let time = 0;
  let frame = 0;

  // Pre-render ultra-soft smoke puffs in dark / mid / light tones.
  // Sprites stay silky — broad gradients only, no hard detail — because
  // the feedback pass in renderSmoke advects the frame onto itself in
  // wavy bands, smearing these blobs into smooth liquid marble folds.
  const makeSmokeSprite = (base) => {
    const size = 384;
    const sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const g = sprite.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    const radius = size * 0.48;

    // Soft single-tone body
    const body = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
    body.addColorStop(0, `rgba(${base},${base + 2},${base + 8},0.8)`);
    body.addColorStop(0.5, `rgba(${base + 6},${base + 8},${base + 13},0.42)`);
    body.addColorStop(1, `rgba(${base + 12},${base + 14},${base + 18},0)`);
    g.fillStyle = body;
    g.fillRect(0, 0, size, size);

    // Gentle tonal variation — huge, very low-alpha soft blobs only
    for (let i = 0; i < 5; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * radius * 0.35;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d * 0.8;
      const r = radius * (0.35 + Math.random() * 0.3);
      const darker = Math.random() < 0.5;
      const shade = Math.max(30, Math.min(240,
        base + (darker ? -1 : 1) * (12 + Math.floor(Math.random() * 24))));
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${shade},${shade + 2},${shade + 8},0.2)`);
      grad.addColorStop(1, `rgba(${shade},${shade + 2},${shade + 8},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
    }
    return sprite;
  };

  const sprites = [
    ...Array.from({ length: 3 }, () => makeSmokeSprite(72)),
    ...Array.from({ length: 4 }, () => makeSmokeSprite(150)),
    ...Array.from({ length: 2 }, () => makeSmokeSprite(208)),
  ];
  const smokePuffs = [];
  const count = window.innerWidth < 720 ? 26 : 46;

  // Smoke streams in from the left edge and flows across to the right
  const spawnPuff = (anywhere = false) => {
    const radius = Math.random() * 220 + 200;
    return {
      x: anywhere ? Math.random() * window.innerWidth * 0.6 - radius : -(radius + Math.random() * 320),
      y: Math.random() * window.innerHeight * 1.1 - window.innerHeight * 0.05,
      radius,
      sprite: sprites[Math.floor(Math.random() * sprites.length)],
      vx: Math.random() * 1.1 + 0.7,
      vy: -Math.random() * 0.12 - 0.02,
      maxOpacity: Math.random() * 0.3 + 0.7,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.0022,
    };
  };

  for (let i = 0; i < count; i += 1) {
    smokePuffs.push(spawnPuff(true));
  }

  const resize = () => {
    const bounds = smokeCanvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    smokeCanvas.width = Math.round(width * dpr);
    smokeCanvas.height = Math.round(height * dpr);
    field.width = smokeCanvas.width;
    field.height = smokeCanvas.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const renderSmoke = () => {
    time += 0.007;

    // Feedback pass: copy the current frame, then redraw it shifted in
    // wavy horizontal bands with slight decay. The smoke advects itself,
    // smearing the soft puffs into smooth, continuous liquid folds.
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, field.width, field.height);
    fctx.drawImage(smokeCanvas, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.95; // gentle decay so old smoke dissolves
    const bands = 110;
    const bandH = height / bands;
    for (let j = 0; j < bands; j += 1) {
      const dx = 0.5 + Math.sin(time * 1.1 + j * 0.11) * 1.3;
      const dy = Math.cos(time * 0.85 + j * 0.09) * 0.7;
      ctx.drawImage(field, 0, j * bandH * dpr, field.width, bandH * dpr,
        dx, j * bandH + dy, width, bandH);
    }
    ctx.restore();

    // Inject soft puffs — very low alpha; the feedback pass builds density
    smokePuffs.forEach((p, index) => {
      // Steady left-to-right flow with organic wobble
      p.x += p.vx + Math.sin(time * 0.9 + p.y * 0.002) * 0.34;
      p.y += p.vy + Math.cos(time * 0.7 + p.x * 0.0016) * 0.15;
      p.rotation += p.vRot;

      // Recycle back to the left edge once fully past the right boundary
      if (p.x - p.radius * 1.5 > width || p.y < -p.radius * 2) {
        smokePuffs[index] = spawnPuff();
        return;
      }

      // Fade in from the left edge, thin out past the middle like the reference
      const fadeIn = clamp((p.x + p.radius) / Math.max(width * 0.16, 1));
      const fadeOut = clamp((width * 0.6 + p.radius * 0.2 - p.x) / Math.max(width * 0.36, 1));
      const currentOpacity = p.maxOpacity * 0.09 * fadeIn * fadeOut;
      if (currentOpacity <= 0.001) return;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1.18, 0.82); // wind-sheared, horizontally stretched billows
      ctx.globalAlpha = currentOpacity;
      ctx.drawImage(p.sprite, -p.radius, -p.radius, p.radius * 2, p.radius * 2);
      ctx.restore();
    });

    frame = requestAnimationFrame(renderSmoke);
  };

  resize();
  window.addEventListener('resize', resize);
  renderSmoke();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else renderSmoke();
  });
}

const collectivePoints = document.querySelector('.collective-points');

if (collectivePoints) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 16; index += 1) {
    const point = document.createElement('i');
    const angle = (Math.PI * 2 * index) / 16 - Math.PI / 2;
    const radiusX = window.innerWidth < 720 ? 136 : 260;
    const radiusY = window.innerWidth < 720 ? 126 : 165;
    point.style.left = `calc(50% + ${Math.cos(angle) * radiusX}px)`;
    point.style.top = `${200 + Math.sin(angle) * radiusY}px`;
    point.style.setProperty('--delay', `${index * -0.11}s`);
    point.dataset.angle = String(angle);
    fragment.appendChild(point);
  }
  collectivePoints.appendChild(fragment);
}

const collectiveDiagram = document.querySelector('[data-collective]');
let collectivePointerX = 0;
let collectivePointerY = 0;

const updateCollective = () => {
  if (!collectiveDiagram || !collectivePoints) return;
  const bounds = collectiveDiagram.getBoundingClientRect();
  const sectionProgress = reducedMotion ? 1 : clamp((window.innerHeight * 0.78 - bounds.top) / Math.max(bounds.height, 1));
  const mobile = window.innerWidth < 720;
  const radiusX = (mobile ? 136 : 260) * (0.78 + sectionProgress * 0.22);
  const radiusY = (mobile ? 126 : 165) * (0.78 + sectionProgress * 0.22);
  const centreY = mobile ? 200 : 200;
  [...collectivePoints.children].forEach((point) => {
    const angle = Number(point.dataset.angle || 0);
    const response = 0.35 + ((Math.cos(angle) + 1) / 2) * 0.65;
    point.style.left = `calc(50% + ${Math.cos(angle) * radiusX + collectivePointerX * response}px)`;
    point.style.top = `${centreY + Math.sin(angle) * radiusY + collectivePointerY * response}px`;
  });
};

if (collectiveDiagram && finePointer && !reducedMotion) {
  collectiveDiagram.addEventListener('pointermove', (event) => {
    const bounds = collectiveDiagram.getBoundingClientRect();
    collectivePointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    collectivePointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 14;
    updateCollective();
  });
  collectiveDiagram.addEventListener('pointerleave', () => {
    collectivePointerX = 0;
    collectivePointerY = 0;
    updateCollective();
  });
}

const territoryStack = document.querySelector('[data-territory-stack]');
const territoryCards = [...document.querySelectorAll('[data-territory-card]')];
const deckCurrent = document.querySelector('[data-deck-current]');

const updateTerritoryDeck = () => {
  if (!territoryStack || window.innerWidth <= 720 || reducedMotion) return;
  const bounds = territoryStack.getBoundingClientRect();
  const scrollDistance = Math.max(1, bounds.height - window.innerHeight);
  const progress = clamp(-bounds.top / scrollDistance);
  const position = progress * (territoryCards.length - 1);
  const activeIndex = Math.round(position);
  const spread = clamp(progress * 4);

  territoryCards.forEach((card, index) => {
    const distance = index - position;
    const x = distance * (30 + spread * 118);
    const y = Math.abs(distance) * (8 + spread * 24) + Math.max(0, distance) * 4;
    const rotation = distance * (1.2 + spread * 3.4);
    const scale = 1 - Math.min(Math.abs(distance) * 0.045, 0.24);
    card.style.setProperty('--deck-x', `${x}px`);
    card.style.setProperty('--deck-y', `${y}px`);
    card.style.setProperty('--deck-z', `${Math.max(0, 120 - Math.abs(distance) * 42)}px`);
    card.style.setProperty('--deck-rotate', `${rotation}deg`);
    card.style.setProperty('--deck-scale', scale.toFixed(3));
    card.style.zIndex = String(20 - Math.round(Math.abs(distance) * 2));
    card.classList.toggle('is-active', index === activeIndex);
  });

  if (deckCurrent) deckCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
};

if (finePointer && !reducedMotion) {
  territoryCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty('--tilt-x', `${x * 4.5}deg`);
      card.style.setProperty('--tilt-y', `${y * -4.5}deg`);
      card.style.setProperty('--image-x', `${x * -7}px`);
      card.style.setProperty('--image-y', `${y * -5}px`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--image-x', '0px');
      card.style.setProperty('--image-y', '0px');
    });
  });
}

const protocol = document.querySelector('[data-protocol]');
const protocolDocument = protocol?.querySelector('.protocol-document');
const protocolRows = [...(protocol?.querySelectorAll('[data-protocol-row]') || [])];
const dayCount = document.querySelector('[data-day-count]');
const dayDial = document.querySelector('[data-day-dial]');
const residencyProgress = document.querySelector('[data-residency-progress]');
const progressLabel = document.querySelector('[data-progress-label]');

if (protocolDocument && !reducedMotion) protocolDocument.classList.add('protocol-ready');

const updateResidencyDocument = () => {
  if (!protocol) return;
  const bounds = protocol.getBoundingClientRect();
  const progress = clamp((window.innerHeight * 0.78 - bounds.top) / Math.max(bounds.height, 1));
  const currentDay = Math.max(1, Math.min(30, Math.round(1 + progress * 29)));
  const activeRows = Math.ceil(progress * protocolRows.length);

  protocolRows.forEach((row, index) => row.classList.toggle('is-sequenced', reducedMotion || index < activeRows));
  if (dayCount) dayCount.textContent = String(currentDay).padStart(2, '0');
  dayDial?.style.setProperty('--dial-angle', `${(currentDay / 30) * 360}deg`);
  residencyProgress?.style.setProperty('--residency-progress', `${progress * 100}%`);
  if (progressLabel) progressLabel.textContent = `Day ${String(currentDay).padStart(2, '0')} of 30`;
};

const envelopeSection = document.querySelector('[data-envelope-section]');
const envelopePin = envelopeSection?.querySelector('[data-envelope-pin]');
const envelopeBox = envelopeSection?.querySelector('[data-archive-envelope]');
const envelopeFlap = envelopeSection?.querySelector('[data-envelope-flap]');
const envelopeCards = [...(envelopeSection?.querySelectorAll('[data-archive-photo]') || [])];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* Cards emerge one by one, alternating sides: two left, two right */
const envelopeCardPlan = [
  { side: -1, row: 0, rot: -6 },
  { side: 1, row: 0, rot: 5 },
  { side: -1, row: 1, rot: 4 },
  { side: 1, row: 1, rot: -5 },
];

let envelopeScrubbed = false;

const clearEnvelopeInlineStyles = () => {
  if (envelopeFlap) {
    envelopeFlap.style.transform = '';
    envelopeFlap.style.zIndex = '';
  }
  envelopeCards.forEach((card) => {
    card.style.transform = '';
    card.style.zIndex = '';
  });
};

if (envelopeSection) {
  const envelopeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        envelopeSection.classList.add('is-inview');
      }
    });
  }, { threshold: 0.15 });
  envelopeObserver.observe(envelopeSection);
}

const updatePhotoArchive = () => {
  if (!envelopeSection || !envelopePin || !envelopeBox || !envelopeFlap || !envelopeCards.length) return;

  const useStaticLayout = reducedMotion || window.innerWidth <= 720;

  if (useStaticLayout) {
    if (envelopeScrubbed) {
      envelopeScrubbed = false;
      envelopeSection.classList.remove('is-scrubbed');
      clearEnvelopeInlineStyles();
    }
    return;
  }

  if (!envelopeScrubbed) {
    envelopeScrubbed = true;
    envelopeSection.classList.add('is-scrubbed');
  }

  const bounds = envelopePin.getBoundingClientRect();
  const scrollDistance = Math.max(1, bounds.height - window.innerHeight);
  const progress = clamp(-bounds.top / scrollDistance);

  /* Phase 1 — Envelope mouth (top flap) rotates open upwards */
  const mouthProgress = clamp((progress - 0.02) / 0.20);
  const mouth = easeInOutCubic(mouthProgress);
  envelopeFlap.style.transform = `perspective(1200px) rotateX(${(mouth * 180).toFixed(2)}deg)`;
  envelopeFlap.style.zIndex = mouth > 0.5 ? '1' : '35';

  /* Phase 2 — 4 Cards emerge one by one through the mouth (2 Left, 2 Right) */
  const envW = envelopeBox.offsetWidth || 400;
  const envH = envelopeBox.offsetHeight || 240;
  const cardW = envelopeCards[0]?.offsetWidth || 220;
  const cardH = envelopeCards[0]?.offsetHeight || 190;

  const isMobile = window.innerWidth <= 768;
  const spreadX = isMobile ? Math.min(160, window.innerWidth * 0.38) : Math.min(340, window.innerWidth * 0.32);

  envelopeCards.forEach((card, index) => {
    const plan = envelopeCardPlan[index % envelopeCardPlan.length];
    const start = 0.20 + index * 0.16;
    const t = clamp((progress - start) / 0.22);

    const riseT = easeOutCubic(clamp(t / 0.45));
    const travelT = easeInOutCubic(clamp((t - 0.30) / 0.50));
    const settleT = easeInOutCubic(clamp((t - 0.65) / 0.35));

    const finalX = plan.side * spreadX;
    const finalY = plan.row === 0 ? -(envH * 0.48) : (envH * 0.28);
    const clearY = -(envH * 0.65 + cardH * 0.35);

    const x = finalX * travelT;
    const y = -(cardH * 0.4 * riseT) + (clearY + (finalY - clearY) * settleT) * travelT;
    const rotation = plan.rot * travelT;
    const scale = 0.7 + 0.3 * riseT;
    const opacity = clamp(t / 0.12);

    // Card starts inside pocket (zIndex 10, behind front cover zIndex 20),
    // and pops out in front (zIndex 25+) as it clears the mouth
    const zIndex = travelT > 0.08 ? (25 + index) : 10;

    card.style.opacity = opacity.toFixed(2);
    card.style.zIndex = String(zIndex);
    card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  });
};

const bangaloreSection = document.querySelector('#bangalore');
const satelliteLayer = document.querySelector('[data-satellite-layer]');

if (bangaloreSection) {
  if (reducedMotion) {
    bangaloreSection.classList.add('is-inview');
  } else {
    const bangaloreObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          bangaloreSection.classList.add('is-inview');
          bangaloreObserver.disconnect();
        }
      });
    }, { threshold: 0.15 });
    bangaloreObserver.observe(bangaloreSection);
  }
}

const updateBangaloreScene = () => {
  if (!bangaloreSection || reducedMotion) return;
  const bounds = bangaloreSection.getBoundingClientRect();
  const progress = clamp((window.innerHeight - bounds.top) / (window.innerHeight + bounds.height));
  if (satelliteLayer) {
    satelliteLayer.style.setProperty('--map-scroll-tilt', `${(8.5 - progress * 5.5).toFixed(3)}deg`);
    if (window.innerWidth > 720) {
      satelliteLayer.style.setProperty('--map-zoom', (1.04 + progress * 0.05).toFixed(4));
    }
  }
};

let documentFrame = 0;
const updateDocumentSystems = () => {
  documentFrame = 0;
  updateHeroScroll();
  updateCollective();
  updateTerritoryDeck();
  updateResidencyDocument();
  updatePhotoArchive();
  updateBangaloreScene();
};
const scheduleDocumentSystems = () => {
  if (documentFrame) return;
  documentFrame = requestAnimationFrame(updateDocumentSystems);
};

updateDocumentSystems();
window.addEventListener('scroll', scheduleDocumentSystems, { passive: true });
window.addEventListener('resize', scheduleDocumentSystems);

const bangaloreMarker = document.querySelector('.map-marker--bangalore');
const toggleMapMarker = () => {
  const selected = bangaloreMarker?.classList.toggle('is-selected');
  bangaloreMarker?.setAttribute('aria-pressed', String(Boolean(selected)));
};

bangaloreMarker?.addEventListener('click', toggleMapMarker);
bangaloreMarker?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  toggleMapMarker();
});

const ascentStage = document.querySelector('[data-ascent-stage]');
const climbingSpecimen = document.querySelector('[data-climbing-specimen]');

if (ascentStage) {
  const updateAscent = () => {
    const bounds = ascentStage.getBoundingClientRect();
    const viewport = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (viewport - bounds.top) / (viewport + bounds.height * 0.55)));
    if (climbingSpecimen) {
      const travel = window.innerWidth < 720 ? 330 : 450;
      climbingSpecimen.style.transform = `translate(-50%, ${progress * -travel}px) rotate(${progress * 21 - 12}deg)`;
    }
  };

  if (finePointer && !reducedMotion) {
    ascentStage.addEventListener('pointermove', (event) => {
      const bounds = ascentStage.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 14;
      ascentStage.style.setProperty('--stage-x', `${x}px`);
      ascentStage.style.setProperty('--stage-y', `${y}px`);
    });

    ascentStage.addEventListener('pointerleave', () => {
      ascentStage.style.setProperty('--stage-x', '0px');
      ascentStage.style.setProperty('--stage-y', '0px');
    });
  }

  updateAscent();
  window.addEventListener('scroll', updateAscent, { passive: true });
  window.addEventListener('resize', updateAscent);
}

const openDialog = () => {
  if (!dialog) return;
  interestForm?.removeAttribute('hidden');
  successState?.setAttribute('hidden', '');
  if (typeof dialog.showModal === 'function') dialog.showModal();
};

const closeDialog = () => dialog?.close();

document.querySelectorAll('[data-open-form]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    openDialog();
  });
});

document.querySelectorAll('[data-close-form]').forEach((button) => button.addEventListener('click', closeDialog));

dialog?.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) closeDialog();
});

interestForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  interestForm.setAttribute('hidden', '');
  successState?.removeAttribute('hidden');
});

/* Selection Dossier Card Flight System */
const dossierGrid = document.querySelector('[data-dossier-grid]');
const dossierManifesto = document.querySelector('[data-manifesto]');
const dossierRecords = [...document.querySelectorAll('[data-dossier-record]')];

if (dossierGrid && dossierManifesto && dossierRecords.length && !reducedMotion) {
  let activeClone = null;
  let activeSource = null;
  let isPinned = false;

  const getGridRelativeRect = (element) => {
    const gridRect = dossierGrid.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();
    return {
      left: elRect.left - gridRect.left,
      top: elRect.top - gridRect.top,
      width: elRect.width,
      height: elRect.height
    };
  };

  const removeClone = () => {
    if (!activeClone) return;
    const clone = activeClone;
    const source = activeSource;
    activeClone = null;
    activeSource = null;
    isPinned = false;

    dossierManifesto.classList.remove('is-covered');

    if (source && dossierGrid.contains(source)) {
      const sourceRect = getGridRelativeRect(source);
      clone.style.left = `${sourceRect.left}px`;
      clone.style.top = `${sourceRect.top}px`;
      clone.style.width = `${sourceRect.width}px`;
      clone.style.height = `${sourceRect.height}px`;
      clone.style.transform = 'scale(1) rotate(0deg)';
      clone.style.opacity = '0.7';

      const handleTransitionEnd = (e) => {
        if (e.propertyName === 'left' || e.propertyName === 'top' || e.propertyName === 'opacity') {
          clone.removeEventListener('transitionend', handleTransitionEnd);
          clone.remove();
          if (source) source.classList.remove('is-flight-source');
        }
      };
      clone.addEventListener('transitionend', handleTransitionEnd);
      setTimeout(() => {
        clone.remove();
        if (source) source.classList.remove('is-flight-source');
      }, 550);
    } else {
      clone.remove();
    }
  };

  const flyToCenter = (record, pinned = false) => {
    if (activeSource === record) {
      if (pinned) isPinned = true;
      return;
    }

    if (activeClone) {
      const oldClone = activeClone;
      const oldSource = activeSource;
      activeClone = null;
      activeSource = null;
      isPinned = false;
      oldClone.remove();
      if (oldSource) oldSource.classList.remove('is-flight-source');
    }

    const sourceRect = getGridRelativeRect(record);
    const targetRect = getGridRelativeRect(dossierManifesto);

    const clone = record.cloneNode(true);
    clone.className = 'dossier-record dossier-clone';

    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.opacity = '1';
    clone.style.transform = 'scale(1) rotate(0deg)';

    dossierGrid.appendChild(clone);
    activeClone = clone;
    activeSource = record;
    isPinned = pinned;

    record.classList.add('is-flight-source');
    dossierManifesto.classList.add('is-covered');

    // Force layout reflow before triggering smooth CSS transition to center
    void clone.offsetHeight;

    requestAnimationFrame(() => {
      if (activeClone === clone) {
        clone.style.left = `${targetRect.left}px`;
        clone.style.top = `${targetRect.top}px`;
        clone.style.width = `${targetRect.width}px`;
        clone.style.height = `${targetRect.height}px`;
        clone.style.transform = 'scale(1.02) rotate(-0.5deg)';
      }
    });
  };

  dossierRecords.forEach((record) => {
    record.addEventListener('pointerenter', () => {
      if (!isPinned) flyToCenter(record, false);
    });

    record.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeSource === record && isPinned) {
        removeClone();
      } else {
        flyToCenter(record, true);
      }
    });
  });

  dossierGrid.addEventListener('pointerleave', (e) => {
    // Only remove clone when pointer genuinely exits dossier grid
    if (!isPinned && activeClone) {
      const rect = dossierGrid.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        removeClone();
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (isPinned && !e.target.closest('[data-dossier-record]')) {
      removeClone();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removeClone();
  });

  window.addEventListener('resize', () => removeClone());
}
