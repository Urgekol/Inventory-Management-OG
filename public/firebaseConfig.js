export async function initFirebase() 
{
  const firebaseConfig = await fetch("/config").then(res => res.json());

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js");
  const {
    getAuth,
    GoogleAuthProvider,
    GithubAuthProvider,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
  } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js");

  // initialize firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const googleProvider = new GoogleAuthProvider();
  const githubProvider = new GithubAuthProvider();


  return {
    auth,
    googleProvider,
    githubProvider,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
  };
}
