import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const config = window.CARZZY_FIREBASE_CONFIG;
const isConfigured = config && Object.values(config).every(
  (value) => value && !value.startsWith("REPLACE_WITH")
);

if (!isConfigured) {
  console.info("Firebase is not configured; the contact form will use Formcarry.");
} else {
  const app = initializeApp(config);
  const database = getFirestore(app);
  const form = document.querySelector("form");
  const submitButton = form?.querySelector("button[type=submit]");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    submitButton.disabled = true;

    try {
      await addDoc(collection(database, "contactSubmissions"), {
        username: String(formData.get("Username") || "").trim(),
        email: String(formData.get("Email address") || "").trim(),
        comments: String(formData.get("Comments") || "").trim(),
        createdAt: serverTimestamp()
      });
      form.reset();
      alert("Thanks! Your message was sent.");
    } catch (error) {
      console.error("Unable to save contact submission", error);
      alert("We could not send your message. Please try again.");
    } finally {
      submitButton.disabled = false;
    }
  });
}