// loader.js

const loader = document.getElementById("loader");

if (loader) {
  loader.style.display = "block";
  loader.style.opacity = "1";
}

// Expose globally so any page script can call it
window.hideLoader = function () {
  if (!loader) return;

  loader.style.opacity = "0";

  setTimeout(() => {
    loader.style.display = "none";
  }, 400);
};
