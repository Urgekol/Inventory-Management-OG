import { initFirebase } from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", async () => {
  const {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    onAuthStateChanged
  } = await initFirebase();

  const emailInput = document.getElementById("liEmail");
  const passwordInput = document.getElementById("liPass");
  const togglePassword = document.getElementById("toggleLiPass");
  const loginForm = document.getElementById("form-box");
  const loginBtn = document.getElementById("primary-btn");
  const googleBtn = document.getElementById("google-btn");

  // Auth guard
  onAuthStateChanged(auth, user => {
    if (user) {
      window.location.replace("/index.html");
    } else {
      document.body.style.visibility = "visible";
    }
  });

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
    });
  }


  loginForm.addEventListener("submit", async e => {
    e.preventDefault();

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Signing in...";

      await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
      );
    } catch (err) {
      alert(err.message);
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });

  googleBtn.addEventListener("click", async () => {
    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Signing in...";

      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      alert(err.message);
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
});
