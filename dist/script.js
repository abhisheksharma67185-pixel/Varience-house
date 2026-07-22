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

if (smokeCanvas) {
  const ctx = smokeCanvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let time = 0;
  let mouseX = -1000;
  let mouseY = -1000;
  let frame = 0;

  const smokePuffs = [];
  const count = window.innerWidth < 720 ? 30 : 48;

  // Smoke streams in from the left edge and flows across to the right
  const spawnPuff = (anywhere = false) => {
    const radius = Math.random() * 150 + 100;
    return {
      x: anywhere ? Math.random() * window.innerWidth * 1.1 - radius : -(radius + Math.random() * 240),
      y: Math.random() * window.innerHeight * 1.08 - window.innerHeight * 0.04,
      radius,
      vx: Math.random() * 1.15 + 0.95,
      vy: -Math.random() * 0.14 - 0.02,
      maxOpacity: Math.random() * 0.1 + 0.08,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.0016,
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const updateMouse = (event) => {
    const bounds = smokeCanvas.getBoundingClientRect();
    mouseX = event.clientX - bounds.left;
    mouseY = event.clientY - bounds.top;
  };

  const renderSmoke = () => {
    ctx.clearRect(0, 0, width, height);
    time += 0.007;

    smokePuffs.forEach((p, index) => {
      // Steady left-to-right flow with organic wobble
      p.x += p.vx + Math.sin(time * 0.9 + p.y * 0.002) * 0.32;
      p.y += p.vy + Math.cos(time * 0.7 + p.x * 0.0016) * 0.14;
      p.rotation += p.vRot;

      // Interactive fluid swirl
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 300 && dist > 0) {
        const force = (1 - dist / 300) * 0.55;
        p.x += force * 3.5;
        p.y += (dy / dist) * force * 2;
      }

      // Recycle back to the left edge once fully past the right boundary
      if (p.x - p.radius * 1.5 > width || p.y < -p.radius * 2) {
        smokePuffs[index] = spawnPuff();
        return;
      }

      // Fade in from the left edge, fade out approaching the right edge
      const fadeIn = clamp((p.x + p.radius) / Math.max(width * 0.16, 1));
      const fadeOut = clamp((width + p.radius * 0.4 - p.x) / Math.max(width * 0.22, 1));
      const currentOpacity = p.maxOpacity * fadeIn * fadeOut;
      if (currentOpacity <= 0.001) return;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
      grad.addColorStop(0, `rgba(10, 12, 17, ${currentOpacity})`);
      grad.addColorStop(0.32, `rgba(17, 21, 28, ${currentOpacity * 0.82})`);
      grad.addColorStop(0.6, `rgba(30, 36, 46, ${currentOpacity * 0.36})`);
      grad.addColorStop(0.85, `rgba(42, 49, 60, ${currentOpacity * 0.1})`);
      grad.addColorStop(1, 'rgba(42, 49, 60, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    frame = requestAnimationFrame(renderSmoke);
  };

  resize();
  window.addEventListener('resize', resize);
  smokeCanvas.closest('.hero')?.addEventListener('pointermove', updateMouse, { passive: true });
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

  /* Phase 1 — the envelope mouth (top flap) rotates open */
  const mouth = easeInOutCubic(clamp((progress - 0.02) / 0.14));
  envelopeFlap.style.transform = `perspective(1300px) rotateX(${(mouth * 178).toFixed(2)}deg)`;
  envelopeFlap.style.zIndex = mouth > 0.5 ? '1' : '4';

  /* Phase 2 — cards rise straight out of the mouth one by one. A card only
     starts travelling sideways once its bottom edge has fully cleared the
     mouth, so it can never cross in front of the envelope body. */
  const envW = envelopeBox.offsetWidth;
  const envH = envelopeBox.offsetHeight;
  const cardW = envelopeCards[0].offsetWidth;
  const cardH = envelopeCards[0].offsetHeight;
  const cardHomeTop = envelopeCards[0].offsetTop;
  const clearY = -(cardHomeTop + cardH + 12);

  envelopeCards.forEach((card, index) => {
    const plan = envelopeCardPlan[index % envelopeCardPlan.length];
    const start = 0.18 + index * 0.2;
    const t = clamp((progress - start) / 0.19);
    /* 1) rise through the mouth, 2) glide sideways above the envelope,
       3) settle down into the side slot */
    const riseT = easeOutCubic(clamp(t / 0.42));
    const travelT = easeInOutCubic(clamp((t - 0.42) / 0.3));
    const settleT = easeInOutCubic(clamp((t - 0.72) / 0.28));
    const finalX = plan.side * Math.min(envW / 2 + cardW * 0.68, window.innerWidth / 2 - cardW * 0.58);
    const finalY = plan.row === 0 ? -(envH * 0.47) : envH * 0.155;
    const x = finalX * travelT;
    const y = clearY * riseT + (finalY - clearY) * settleT;
    const rotation = plan.rot * travelT;
    const scale = 0.62 + 0.38 * riseT;
    /* Later cards tuck behind the ones already placed, so captions stay visible */
    card.style.zIndex = String(envelopeCards.length - index);
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
      clone.style.left = `${targetRect.left}px`;
      clone.style.top = `${targetRect.top}px`;
      clone.style.width = `${targetRect.width}px`;
      clone.style.height = `${targetRect.height}px`;
      clone.style.transform = 'scale(1.02) rotate(-0.5deg)';
    });
  };

  dossierRecords.forEach((record) => {
    record.addEventListener('pointerenter', () => {
      if (!isPinned) flyToCenter(record, false);
    });

    record.addEventListener('pointerleave', (e) => {
      // If moving to the clone itself or if pinned, keep active
      if (!isPinned && activeSource === record) {
        removeClone();
      }
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

  dossierGrid.addEventListener('mouseleave', () => {
    if (!isPinned && activeClone) removeClone();
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
