// --- 1. Booking Form Date Rules ---
// Look for a form on the current page (used on the home and booking pages)
const form = document.querySelector("form");
if (form) {
  const arrival = form.elements.check_in;
  const departure = form.elements.check_out;

  // Turn a JavaScript date into YYYY-MM-DD text so date inputs understand it
  function localDate(d) {
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  }

  // Stop users from picking an arrival date in the past
  if (arrival) {
    arrival.min = localDate(new Date());
  }

  // Make sure departure is always at least one day after arrival
  function syncDates() {
    if (!arrival || !departure) return;
    const baseDate = arrival.value || arrival.min;
    const next = new Date(baseDate + "T12:00:00");
    next.setDate(next.getDate() + 1);
    departure.min = localDate(next);

    // Clear departure if the user already picked an earlier date
    if (departure.value && departure.value < departure.min) {
      departure.value = "";
    }
  }

  if (arrival) {
    arrival.addEventListener("input", syncDates);
  }
  syncDates();
}

// --- 2. Gallery Filters and Big Photo Pop-up ---
const dialog = document.querySelector("dialog");
if (dialog) {
  // Grab all photo blocks in the gallery and turn them into a normal list (array)
  const figures = Array.from(document.querySelectorAll(".journal figure"));
  let active = 0;
  let shown = figures;

  // Show photo number `n` inside the pop-up box
  function showPhoto(n) {
    if (shown.length === 0) return;
    // Wrap around cleanly if going before the first or past the last photo
    active = (n + shown.length) % shown.length;
    const image = shown[active].querySelector("img");
    const dialogImage = dialog.querySelector("img");
    const counter = dialog.querySelector(".viewer span");

    dialogImage.src = image.dataset.full || image.src;
    dialogImage.alt = image.alt;
    if (counter) {
      counter.textContent = `${active + 1} / ${shown.length}`;
    }
  }

  // Open the pop-up when a user clicks a photo button
  for (const figure of figures) {
    const button = figure.querySelector("button");
    if (!button) continue;
    button.onclick = () => {
      // Refresh `shown` to whatever photos are currently visible
      shown = figures.filter((f) => !f.hidden);
      const indexInShown = shown.indexOf(figure);
      showPhoto(indexInShown >= 0 ? indexInShown : 0);
      dialog.showModal();
    };
  }

  // Filter photos when a category button is clicked (All, Pool & gardens, etc.)
  for (const filter of document.querySelectorAll("[data-filter]")) {
    filter.onclick = () => {
      const currentPressed = document.querySelector('.filters [aria-pressed="true"]');
      if (currentPressed) {
        currentPressed.setAttribute("aria-pressed", "false");
      }
      filter.setAttribute("aria-pressed", "true");

      // Hide photos that don't match the selected category
      for (const figure of figures) {
        figure.hidden =
          filter.dataset.filter !== "All" &&
          figure.dataset.category !== filter.dataset.filter;
      }

      // Update the list of currently visible photos for next/prev arrows
      shown = figures.filter((f) => !f.hidden);
      active = 0;
    };
  }

  // Previous and Next buttons inside the pop-up
  for (const button of dialog.querySelectorAll("[data-step]")) {
    button.onclick = () => showPhoto(active + Number(button.dataset.step));
  }

  // Let users press Left and Right arrow keys to flip through photos
  dialog.onkeydown = (e) => {
    if (e.key === "ArrowLeft") showPhoto(active - 1);
    if (e.key === "ArrowRight") showPhoto(active + 1);
  };

  // Close button inside the pop-up
  const closeButton = dialog.querySelector("button");
  if (closeButton) {
    closeButton.onclick = () => dialog.close();
  }

  // Close the pop-up if the user clicks the dark area outside the photo
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  };
}

// --- 3. Slide-out Menu on Smaller Screens ---
const header = document.querySelector("header");
const menuToggle = header ? header.querySelector(".menu-toggle") : null;
const navigation = header ? header.querySelector("nav") : null;

if (header && menuToggle && navigation) {
  // Create a close (X) button at the top of the slide-out menu
  const drawerClose = document.createElement("button");
  drawerClose.className = "drawer-close";
  drawerClose.type = "button";
  drawerClose.setAttribute("aria-label", "Close navigation");
  drawerClose.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  navigation.prepend(drawerClose);

  // Copy the "Book a stay" link into the mobile menu too
  const reserveLink = header.querySelector(".reserve");
  if (reserveLink) {
    const bookingLink = reserveLink.cloneNode(true);
    bookingLink.className = "mobile-reserve";
    navigation.append(bookingLink);
  }

  // Close the menu and optionally put keyboard focus back on the menu button
  function closeNavigation(returnFocus = false) {
    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    if (returnFocus) {
      menuToggle.focus();
    }
  }

  // Toggle the menu open or closed when the hamburger button is clicked
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );
  });

  drawerClose.addEventListener("click", () => closeNavigation(true));

  // Close if the user taps outside the menu
  document.addEventListener("pointerdown", (event) => {
    if (
      header.classList.contains("menu-open") &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeNavigation();
    }
  });

  // Close if the user presses the Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("menu-open")) {
      closeNavigation(true);
    }
  });

  // Close the mobile menu if the screen is resized wider than 1100px
  matchMedia("(max-width: 1100px)").addEventListener("change", () =>
    closeNavigation()
  );
}

// --- 4. Move Theme Button Between Desktop Menu and Mobile Header ---
const compactHeader = matchMedia("(max-width: 1100px)");
const themeControl = header ? header.querySelector(".theme-toggle") : null;

function placeThemeControl() {
  if (!header || !navigation || !themeControl) return;
  const reserveButton = header.querySelector(".reserve");
  if (compactHeader.matches && reserveButton) {
    header.insertBefore(themeControl, reserveButton);
  } else {
    navigation.append(themeControl);
  }
}

placeThemeControl();
compactHeader.addEventListener("change", placeThemeControl);

// --- 5. Villa Photo Slideshow ---
// Fades between slides automatically, lets users pause, and respects reduced motion settings
for (const carousel of document.querySelectorAll("[data-slideshow]")) {
  const slides = [...carousel.querySelectorAll(".slide")];
  const dots = [...carousel.querySelectorAll(".slide-dots button")];
  const pauseButton = carousel.querySelector(".slideshow-pause");
  const prevButton = carousel.querySelector(".prev");
  const nextButton = carousel.querySelector(".next");
  const status = carousel.querySelector(".slide-status");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;
  let paused = reducedMotion.matches;
  let timer;
  let loading = false;

  // Switch to a specific slide once its image is ready to show
  async function selectSlide(index, announce = false) {
    if (loading || slides.length === 0) return;
    const next = (index + slides.length) % slides.length;
    loading = true;

    try {
      await slides[next].decode();
    } catch (error) {
      loading = false;
      return;
    }

    current = next;
    slides.forEach((slide, i) =>
      slide.classList.toggle("is-active", i === current)
    );
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-pressed", String(i === current))
    );

    if (status) {
      status.setAttribute("aria-live", announce ? "polite" : "off");
      status.textContent = `Photograph ${current + 1} of ${slides.length}`;
    }
    loading = false;
  }

  // Start the automatic timer every 5.5 seconds unless paused or hovered/focused
  function schedule() {
    clearInterval(timer);
    if (
      !paused &&
      !document.hidden &&
      !carousel.matches(":hover") &&
      !carousel.contains(document.activeElement)
    ) {
      timer = setInterval(() => selectSlide(current + 1), 4500);
    }
  }

  function updatePauseButton() {
    if (!pauseButton) return;
    pauseButton.textContent = paused ? "Play" : "Pause";
    pauseButton.setAttribute(
      "aria-label",
      paused ? "Play slideshow" : "Pause slideshow"
    );
  }

  function manualSlide(index) {
    selectSlide(index, true);
    schedule();
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => manualSlide(current - 1));
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => manualSlide(current + 1));
  }

  dots.forEach((dot, i) => dot.addEventListener("click", () => manualSlide(i)));

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      paused = !paused;
      updatePauseButton();
      schedule();
    });
  }

  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", schedule);
  carousel.addEventListener("focusin", () => clearInterval(timer));
  carousel.addEventListener("focusout", () => setTimeout(schedule, 0));
  document.addEventListener("visibilitychange", schedule);

  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    updatePauseButton();
    schedule();
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      manualSlide(current + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      manualSlide(current - 1);
    }
  });

  updatePauseButton();
  schedule();
}

// Keep the map crop as tall as the attraction photos, including after resizing.
const mapFrame = document.querySelector(".map-frame");
const attractionPhoto = document.querySelector(".destination-card .location-photo");
if (mapFrame && attractionPhoto) {
  const matchMapHeight = () => {
    mapFrame.style.setProperty("--map-photo-height", `${attractionPhoto.getBoundingClientRect().height}px`);
  };
  new ResizeObserver(matchMapHeight).observe(attractionPhoto);
  attractionPhoto.addEventListener("load", matchMapHeight);
  matchMapHeight();
}
