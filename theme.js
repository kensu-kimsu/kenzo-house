// Wrap everything in a function so our variables don't clash with other code
(function () {
  // Check if the device prefers dark mode
  const preference = window.matchMedia("(prefers-color-scheme: dark)");

  // Start on light mode unless the user picks dark mode or has a saved setting
  let selectedTheme = "light";

  // Try to read a saved theme from the browser (wrapped in try/catch in case storage is blocked)
  try {
    const saved = localStorage.getItem("kenzo-house-theme");
    if (saved === "light" || saved === "dark") {
      selectedTheme = saved;
    }
  } catch (error) {
    // If browser storage is off, no worries, the button still works on the page
  }

  // When opening HTML files straight from the computer (file://), each page can have separate memory.
  // This grabs ?theme=light or ?theme=dark from the web address so the choice carries over.
  const linkedTheme = new URLSearchParams(window.location.search).get("theme");
  if (linkedTheme === "light" || linkedTheme === "dark") {
    selectedTheme = linkedTheme;
    try {
      localStorage.setItem("kenzo-house-theme", selectedTheme);
    } catch (error) {
      // Ignore if saving is blocked
    }
  }

  // Apply the chosen theme to the page and update the toggle button
  function applyTheme() {
    // Use the picked theme if there is one; otherwise follow the device setting
    const theme = selectedTheme || (preference.matches ? "dark" : "light");
    const isDark = theme === "dark";

    // If viewing local files directly, add ?theme=... to page links so dark/light mode stays on the next page
    if (window.location.protocol === "file:") {
      document.querySelectorAll("a[href]").forEach(function (link) {
        const target = new URL(link.getAttribute("href"), window.location.href);
        if (target.protocol === "file:" && /\.html$/.test(target.pathname)) {
          target.searchParams.set("theme", theme);
          link.href = target.href;
        }
      });
    }

    // Set data-theme on the <html> tag so CSS knows whether to show light or dark styles
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    // Find the theme button and update its text, icon, and accessibility labels
    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      toggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";

      const icon = toggle.querySelector(".theme-icon");
      if (icon) {
        icon.innerHTML = isDark
          ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" fill="currentColor"/></svg>'
          : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
      }

      const label = toggle.querySelector(".theme-label");
      if (label) {
        label.textContent = isDark ? "Light mode" : "Dark mode";
      }
    }
  }

  // Run once right away so the page loads in the right colours without flashing
  applyTheme();

  // Once the whole HTML page finishes loading, wire up the click on the theme button
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        // Flip between dark and light
        selectedTheme =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem("kenzo-house-theme", selectedTheme);
        } catch (error) {
          // Still switch on screen even if saving isn't allowed
        }
        applyTheme();
      });
    }
  });

  // If the computer or phone switches dark/light mode, update the site (unless user picked manually)
  preference.addEventListener("change", function () {
    if (!selectedTheme) {
      applyTheme();
    }
  });

  // If the theme changes in another open tab, sync this tab too
  window.addEventListener("storage", function (event) {
    if (event.key !== "kenzo-house-theme") return;
    selectedTheme =
      event.newValue === "dark" || event.newValue === "light"
        ? event.newValue
        : null;
    applyTheme();
  });
})();
