import { initFirebase } from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", async () => {

    const {
        auth,
        googleProvider,
        createUserWithEmailAndPassword,
        signInWithPopup
    } = await initFirebase();

    const form = document.getElementById("signup-form");
    const emailInput = document.getElementById("suEmail");
    const passwordInput = document.getElementById("suPass");
    const googleBtn = document.getElementById("google-btn");

    const toggleSuPass = document.getElementById("toggleSuPass");

    // Show / Hide password
    toggleSuPass.addEventListener("click", () => {
        passwordInput.type =
            passwordInput.type === "password" ? "text" : "password";
    });

    // Email + Password signup
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            await createUserWithEmailAndPassword(
                auth,
                emailInput.value,
                passwordInput.value
            );

            window.location.href = "alreadyRegistered.html";
        } catch (err) {
            alert(err.message);
        }
    });

    // Google signup
    googleBtn.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            window.location.href = "alreadyRegistered.html";
        } catch (err) {
            alert(err.message);
        }
    });
});
