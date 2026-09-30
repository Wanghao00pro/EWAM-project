const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

navToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const observedSections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!active) return;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${active.target.id}`);
    });
  },
  { rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.25, 0.5] }
);

observedSections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const expandTriggers = [...document.querySelectorAll("[data-expand]")];

function setDrawer(trigger, open) {
  const drawer = document.getElementById(trigger.dataset.expand);
  if (!drawer) return;
  drawer.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
}

expandTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const drawer = document.getElementById(trigger.dataset.expand);
    if (!drawer) return;
    const willOpen = drawer.hidden;
    expandTriggers
      .filter((other) => other !== trigger)
      .filter((other) => document.getElementById(other.dataset.expand)?.dataset.expandGroup === drawer.dataset.expandGroup)
      .forEach((other) => setDrawer(other, false));
    setDrawer(trigger, willOpen);
    if (willOpen) drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

document.querySelectorAll("[data-expand-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const drawer = button.closest(".table-drawer");
    const trigger = expandTriggers.find((item) => item.dataset.expand === drawer?.id);
    if (trigger) {
      setDrawer(trigger, false);
      trigger.focus({ preventScroll: true });
    }
  });
});

document.querySelectorAll(".ckpt-figure").forEach((figure) => {
  const activate = (step) => {
    figure.dataset.active = step;
  };
  figure.querySelectorAll("[data-step]").forEach((item) => {
    if (item.matches("path")) return;
    item.addEventListener("mouseenter", () => activate(item.dataset.step));
    item.addEventListener("focus", () => activate(item.dataset.step));
    item.addEventListener("click", () => activate(item.dataset.step));
  });
});

const imageDialog = document.querySelector("#image-lightbox");
const imageDialogImage = imageDialog?.querySelector("img");

document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!imageDialog || !imageDialogImage) return;
    imageDialogImage.src = button.dataset.lightbox;
    const sourceImage = button.querySelector("img");
    imageDialogImage.alt = sourceImage?.alt || "Expanded figure";
    imageDialogImage.hidden = false;
    resetZoom();
    imageDialog.showModal();
  });
});

const zoomStage = imageDialog?.querySelector(".lightbox-stage");
const zoomLabel = imageDialog?.querySelector(".zoom-level");
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
let zoom = 1;
let panX = 0;
let panY = 0;
const pointers = new Map();
let gesture = null;

function applyZoom() {
  if (!imageDialogImage) return;
  const width = imageDialogImage.offsetWidth;
  const height = imageDialogImage.offsetHeight;
  panX = Math.min(0, Math.max(width - width * zoom, panX));
  panY = Math.min(0, Math.max(height - height * zoom, panY));
  imageDialogImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  if (zoomLabel) zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  zoomStage?.classList.toggle("is-zoomed", zoom > 1);
}

function resetZoom() {
  zoom = 1;
  panX = 0;
  panY = 0;
  applyZoom();
}

function imagePoint(clientX, clientY) {
  const rect = zoomStage.getBoundingClientRect();
  return {
    x: clientX - rect.left - imageDialogImage.offsetLeft,
    y: clientY - rect.top - imageDialogImage.offsetTop,
  };
}

function zoomAt(point, nextZoom) {
  const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  panX = point.x - ((point.x - panX) * target) / zoom;
  panY = point.y - ((point.y - panY) * target) / zoom;
  zoom = target;
  applyZoom();
}

function zoomAtCenter(nextZoom) {
  zoomAt({ x: imageDialogImage.offsetWidth / 2, y: imageDialogImage.offsetHeight / 2 }, nextZoom);
}

if (zoomStage && imageDialogImage) {
  zoomStage.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomAt(imagePoint(event.clientX, event.clientY), zoom * Math.exp(-event.deltaY * 0.0015));
    },
    { passive: false },
  );

  zoomStage.addEventListener("dblclick", (event) => {
    if (zoom > 1) resetZoom();
    else zoomAt(imagePoint(event.clientX, event.clientY), 2.5);
  });

  zoomStage.addEventListener("pointerdown", (event) => {
    zoomStage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b] = [...pointers.values()];
    gesture = b
      ? { distance: Math.hypot(b.x - a.x, b.y - a.y), zoom }
      : { x: a.x, y: a.y, panX, panY };
    zoomStage.classList.toggle("is-dragging", !b && zoom > 1);
  });

  zoomStage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b] = [...pointers.values()];
    if (b && gesture.distance) {
      const mid = imagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAt(mid, (gesture.zoom * Math.hypot(b.x - a.x, b.y - a.y)) / gesture.distance);
    } else if (!b && gesture.panX !== undefined && zoom > 1) {
      panX = gesture.panX + a.x - gesture.x;
      panY = gesture.panY + a.y - gesture.y;
      applyZoom();
    }
  });

  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    const [a] = [...pointers.values()];
    gesture = a ? { x: a.x, y: a.y, panX, panY } : null;
    zoomStage.classList.remove("is-dragging");
  };
  zoomStage.addEventListener("pointerup", endPointer);
  zoomStage.addEventListener("pointercancel", endPointer);

  imageDialog.querySelectorAll("[data-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.zoom;
      if (action === "reset") resetZoom();
      else zoomAtCenter(zoom * (action === "in" ? 1.5 : 1 / 1.5));
    });
  });

  imageDialog.addEventListener("keydown", (event) => {
    if (event.key === "+" || event.key === "=") zoomAtCenter(zoom * 1.5);
    else if (event.key === "-") zoomAtCenter(zoom / 1.5);
    else if (event.key === "0") resetZoom();
  });

  imageDialogImage.addEventListener("load", resetZoom);
  window.addEventListener("resize", applyZoom);
}

const videoDialog = document.querySelector("#video-modal");
const video = videoDialog?.querySelector("video");
const videoEmpty = videoDialog?.querySelector(".video-empty");
const videoTitle = videoDialog?.querySelector("h2");

document.querySelectorAll(".demo-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (!videoDialog || !video || !videoEmpty || !videoTitle) return;
    const src = card.dataset.videoSrc?.trim();
    videoTitle.textContent = card.dataset.title || "Demonstration";
    if (src) {
      video.src = src;
      video.hidden = false;
      videoEmpty.style.display = "none";
    } else {
      video.removeAttribute("src");
      video.load();
      video.hidden = true;
      videoEmpty.style.display = "grid";
    }
    videoDialog.showModal();
  });
});

document.querySelectorAll(".modal-close").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog")?.close());
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    const modalVideo = dialog.querySelector("video");
    if (modalVideo) modalVideo.pause();
    const modalImage = dialog.querySelector("img");
    if (modalImage) {
      modalImage.hidden = true;
      modalImage.removeAttribute("src");
    }
  });
});

const copyButton = document.querySelector("#copy-citation");
const toast = document.querySelector("#toast");

copyButton?.addEventListener("click", async () => {
  const citation = document.querySelector("#bibtex code")?.textContent?.trim();
  if (!citation) return;
  try {
    await navigator.clipboard.writeText(citation);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = citation;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  copyButton.textContent = "Copied";
  toast?.classList.add("show");
  window.setTimeout(() => {
    copyButton.textContent = "Copy BibTeX";
    toast?.classList.remove("show");
  }, 1800);
});

const demoVideos = document.querySelectorAll(".demo-video video");
if ("IntersectionObserver" in window) {
  const demoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    },
    { threshold: 0.4 },
  );
  demoVideos.forEach((demoVideo) => demoObserver.observe(demoVideo));
}
