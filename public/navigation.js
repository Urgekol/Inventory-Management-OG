// navigation.js

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");

  function showLoaderAndNavigate(url) {
    if (!loader) {
      window.location.href = url;
      return;
    }

    loader.style.display = "block";
    loader.style.opacity = "1";

    // Small delay so loader is visible before navigation
    setTimeout(() => {
      window.location.href = url;
    }, 150);
  }

  // Intercept anchor clicks
  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");

    // Ignore external or empty links
    if (!href || href.startsWith("#") || href.startsWith("http")) return;

    link.addEventListener("click", e => {
      e.preventDefault();
      showLoaderAndNavigate(href);
    });
  });

  // Expose helper for JS-based navigation
  window.navigateWithLoader = function (url) {
    showLoaderAndNavigate(url);
  };
});
