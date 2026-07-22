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

const canvas = document.querySelector('[data-particle-canvas]');

if (canvas) {
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  const count = window.innerWidth < 720 ? 58 : 110;
  const particles = Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 1200,
    y: (Math.random() - 0.5) * 900,
    z: Math.random() * 950 + 80,
    size: Math.random() * 1.6 + 0.4,
    tint: Math.random(),
  }));

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const updatePointer = (event) => {
    const bounds = canvas.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 70;
    targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 50;
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * 0.035;
    pointerY += (targetY - pointerY) * 0.035;

    particles.forEach((particle) => {
      if (!reducedMotion) particle.z -= 0.48;
      if (particle.z < 30) particle.z = 1030;
      const scale = 540 / particle.z;
      const x = width * 0.73 + (particle.x + pointerX) * scale;
      const y = height * 0.4 + (particle.y + pointerY) * scale;
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) return;
      const alpha = Math.min(0.5, Math.max(0.06, 1 - particle.z / 1100));
      const radius = Math.min(4, particle.size * scale);
      const color = particle.tint > 0.96 ? `102,136,255` : particle.tint < 0.04 ? `255,98,56` : `67,83,108`;
      context.beginPath();
      context.fillStyle = `rgba(${color},${alpha})`;
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });

    frame = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  canvas.closest('.hero')?.addEventListener('pointermove', updatePointer, { passive: true });
  draw();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else draw();
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

const photoArchive = document.querySelector('[data-photo-archive]');
const archivePhotos = [...document.querySelectorAll('[data-archive-photo]')];

const updatePhotoArchive = () => {
  if (!photoArchive || window.innerWidth <= 720 || reducedMotion) return;
  const bounds = photoArchive.getBoundingClientRect();
  const progress = clamp((window.innerHeight * 0.78 - bounds.top) / Math.max(bounds.height * 0.78, 1));
  const archiveBounds = photoArchive.getBoundingClientRect();
  const stackX = archiveBounds.width * 0.5;
  const stackY = archiveBounds.height * 0.45;

  archivePhotos.forEach((photo, index) => {
    const photoX = photo.offsetLeft + photo.offsetWidth * 0.5;
    const photoY = photo.offsetTop + photo.offsetHeight * 0.5;
    const x = (stackX - photoX) * (1 - progress) * 0.86;
    const y = (stackY - photoY) * (1 - progress) * 0.78;
    const rotation = (index - 3.5) * 1.7 * (1 - progress);
    photo.style.setProperty('--archive-x', `${x}px`);
    photo.style.setProperty('--archive-y', `${y}px`);
    photo.style.setProperty('--archive-r', `${rotation}deg`);
    photo.style.setProperty('--archive-z', String(index + 1));
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
  let flightClone = null;
  let flightSource = null;
  let flightPinned = false;

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

  const flyTo = (clone, fromRect, toRect, onDone) => {
    const duration = 440;
    const start = performance.now();
    const controlX = (fromRect.left + toRect.left) / 2;
    const controlY = Math.min(fromRect.top, toRect.top) - 40;
    const direction = toRect.left + toRect.width / 2 < fromRect.left + fromRect.width / 2 ? -1 : 1;

    if (clone._flyFrame) cancelAnimationFrame(clone._flyFrame);

    const step = (now) => {
      const raw = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - raw, 3);
      const q = 1 - e;
      const lift = Math.sin(Math.PI * e);

      const currentX = q * q * fromRect.left + 2 * q * e * controlX + e * e * toRect.left;
      const currentY = q * q * fromRect.top + 2 * q * e * controlY + e * e * toRect.top;
      const currentW = fromRect.width + (toRect.width - fromRect.width) * e;
      const currentH = fromRect.height + (toRect.height - fromRect.height) * e;

      clone.style.left = `${currentX.toFixed(2)}px`;
      clone.style.top = `${currentY.toFixed(2)}px`;
      clone.style.width = `${currentW.toFixed(2)}px`;
      clone.style.height = `${currentH.toFixed(2)}px`;
      clone.style.transform = `translate3d(0, 0, 0) scale(${(1 + lift * 0.02).toFixed(4)}) rotate(${(lift * direction * 1.4).toFixed(2)}deg)`;
      clone.style.boxShadow = `0 ${(20 + lift * 25).toFixed(0)}px ${(50 + lift * 35).toFixed(0)}px rgba(23, 34, 55, ${(0.1 + lift * 0.08).toFixed(2)})`;

      if (raw < 1) {
        clone._flyFrame = requestAnimationFrame(step);
      } else {
        clone.style.left = `${toRect.left}px`;
        clone.style.top = `${toRect.top}px`;
        clone.style.width = `${toRect.width}px`;
        clone.style.height = `${toRect.height}px`;
        clone.style.transform = '';
        clone._flyFrame = 0;
        if (onDone) onDone();
      }
    };
    clone._flyFrame = requestAnimationFrame(step);
  };

  const endFlight = (animate) => {
    if (!flightClone) return;
    const clone = flightClone;
    const source = flightSource;
    flightClone = null;
    flightSource = null;
    flightPinned = false;
    dossierManifesto.classList.remove('is-covered');

    if (animate && source && dossierGrid.contains(source)) {
      const currentRect = getGridRelativeRect(clone);
      const sourceRect = getGridRelativeRect(source);
      flyTo(clone, currentRect, sourceRect, () => {
        clone.remove();
        if (source) source.classList.remove('is-flight-source');
      });
    } else {
      if (clone._flyFrame) cancelAnimationFrame(clone._flyFrame);
      clone.remove();
      if (source) source.classList.remove('is-flight-source');
    }
  };

  const startFlight = (record, pinned) => {
    if (flightSource === record) {
      flightPinned = flightPinned || pinned;
      return;
    }
    if (flightClone) {
      const oldClone = flightClone;
      const oldSource = flightSource;
      flightClone = null;
      flightSource = null;
      flightPinned = false;
      if (oldClone._flyFrame) cancelAnimationFrame(oldClone._flyFrame);
      oldClone.remove();
      if (oldSource) oldSource.classList.remove('is-flight-source');
    }

    const sourceRect = getGridRelativeRect(record);
    const targetRect = getGridRelativeRect(dossierManifesto);

    const clone = record.cloneNode(true);
    clone.classList.add('dossier-clone');
    clone.style.setProperty('--tilt-x', '0deg');
    clone.style.setProperty('--tilt-y', '0deg');
    clone.style.setProperty('--lift', '0px');

    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;

    dossierGrid.appendChild(clone);
    flightClone = clone;
    flightSource = record;
    flightPinned = pinned;

    record.classList.add('is-flight-source');
    dossierManifesto.classList.add('is-covered');

    flyTo(clone, sourceRect, targetRect);
  };

  dossierRecords.forEach((record) => {
    const handleEnter = () => startFlight(record, false);
    record.addEventListener('mouseenter', handleEnter);
    record.addEventListener('pointerenter', handleEnter);
    record.addEventListener('click', (event) => {
      event.stopPropagation();
      if (flightSource === record && flightPinned) endFlight(true);
      else startFlight(record, true);
    });
  });

  const handleGridLeave = (event) => {
    if (!event.relatedTarget || !dossierGrid.contains(event.relatedTarget)) {
      if (flightClone && !flightPinned) {
        endFlight(true);
      }
    }
  };
  dossierGrid.addEventListener('mouseleave', handleGridLeave);
  dossierGrid.addEventListener('pointerleave', handleGridLeave);

  document.addEventListener('click', () => endFlight(true));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') endFlight(true);
  });
  window.addEventListener('resize', () => endFlight(false));
}
