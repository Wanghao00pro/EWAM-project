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
    imageDialog.showModal();
  });
});

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
