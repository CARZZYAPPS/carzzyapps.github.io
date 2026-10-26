(() => {
  if (window.self !== window.top) return;

  const path = window.location.pathname;
  if (/^\/(?:feedback|admin)(?:\/|$)/i.test(path)) return;
  const submissionStorageKey = "carzzyFeedbackSubmitted";
  const dismissalStorageKey = "carzzyFeedbackDismissedAt";
  const dismissalDurationMs = 30 * 24 * 60 * 60 * 1000;

  const launcherStyles = document.createElement("style");
  launcherStyles.textContent = `
    #feedback-launcher {
      position: fixed !important;
      right: 8px !important;
      bottom: 8px !important;
      z-index: 9999 !important;
      display: inline-flex !important;
      width: auto !important;
      min-width: 0 !important;
      min-height: 0 !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 12px 18px !important;
      border: 1px solid #00d1b2 !important;
      border-radius: 999px !important;
      appearance: none !important;
      background: #080a09 !important;
      box-shadow: 0 5px 18px rgb(0 0 0 / 35%) !important;
      color: #00d1b2 !important;
      font: 700 15px/1.2 'Segoe UI', sans-serif !important;
      text-align: center !important;
      cursor: pointer !important;
    }

    #feedback-launcher:hover,
    #feedback-launcher:focus-visible {
      background: #00d1b2 !important;
      color: #080a09 !important;
    }

    #feedback-launcher:focus-visible {
      outline: 2px solid #fff !important;
      outline-offset: 3px !important;
    }

  `;
  document.head.append(launcherStyles);

  function getSubmissionStatus() {
    try {
      const savedStatus = localStorage.getItem(submissionStorageKey);
      if (savedStatus === null) {
        localStorage.setItem(submissionStorageKey, "false");
        return false;
      }
      return savedStatus === "true";
    } catch (error) {
      console.error("Unable to read feedback submission status", error);
      return false;
    }
  }

  function saveSubmissionStatus(submitted) {
    try {
      localStorage.setItem(submissionStorageKey, String(submitted));
    } catch (error) {
      console.error("Unable to save feedback submission status", error);
    }
  }

  function isDismissalActive() {
    try {
      const dismissedAt = Number(localStorage.getItem(dismissalStorageKey));
      if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) return false;
      if (Date.now() < dismissedAt + dismissalDurationMs) return true;
      localStorage.removeItem(dismissalStorageKey);
    } catch (error) {
      console.error("Unable to read feedback popup dismissal status", error);
    }
    return false;
  }

  function saveDismissalStatus() {
    try {
      localStorage.setItem(dismissalStorageKey, String(Date.now()));
    } catch (error) {
      console.error("Unable to save feedback popup dismissal status", error);
    }
  }

  function showFeedbackPopup(force = false) {
    if (!force && (getSubmissionStatus() || isDismissalActive())) return;
    if (document.querySelector("#feedback-popup")) return;

    const previousOverflow = document.documentElement.style.overflow;
    const overlay = document.createElement("div");
    overlay.id = "feedback-popup";
    overlay.innerHTML = `
      <style>
        #feedback-popup {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: rgb(0 0 0 / 78%);
        }

        #feedback-popup .feedback-popup__dialog {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(464px, 100%);
          max-height: calc(100dvh - 68px);
        }

        #feedback-popup iframe {
          display: block;
          width: 100%;
          height: min(640px, calc(100dvh - 68px));
          border: 0;
          border-radius: 16px;
          background: transparent;
        }

        #feedback-popup .feedback-popup__close {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          place-items: center;
          padding: 0 0 2px;
          border: 1px solid #00d1b2;
          border-radius: 50%;
          background: #080a09;
          color: #00d1b2;
          font: 700 23px/1 'Segoe UI', sans-serif;
          cursor: pointer;
        }

        #feedback-popup .feedback-popup__close:hover,
        #feedback-popup .feedback-popup__close:focus-visible {
          background: #00d1b2;
          color: #080a09;
        }

        #feedback-popup .feedback-popup__close:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }

      </style>
      <div class="feedback-popup__dialog" role="dialog" aria-modal="true" aria-label="Carzzy Apps feedback">
        <iframe src="/feedback/?embed=1" title="Carzzy Apps feedback form"></iframe>
        <button class="feedback-popup__close" type="button" aria-label="Close feedback form">×</button>
      </div>
    `;

    const closeButton = overlay.querySelector(".feedback-popup__close");
    const frame = overlay.querySelector("iframe");

    function closePopup(submitted = false, dismissed = false) {
      if (submitted) saveSubmissionStatus(true);
      if (dismissed) saveDismissalStatus();
      overlay.remove();
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("message", handleMessage);
    }

    function handleKeydown(event) {
      if (event.key === "Escape") closePopup();
    }

    function handleMessage(event) {
      if (
        event.origin === window.location.origin
        && event.source === frame.contentWindow
        && event.data?.type === "carzzy-feedback-submitted"
      ) {
        closePopup(true);
      }
    }

    closeButton.addEventListener("click", () => closePopup(false, true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closePopup();
    });
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("message", handleMessage);
    document.documentElement.style.overflow = "hidden";
    document.body.append(overlay);
    closeButton.focus({ preventScroll: true });
  }

  function addHomepageLauncher() {
    if (!/^\/(?:index\.html)?$/i.test(path) || document.querySelector("#feedback-launcher")) return;

    const launcher = document.createElement("button");
    launcher.id = "feedback-launcher";
    launcher.type = "button";
    launcher.textContent = "Send Feedback";
    launcher.setAttribute("aria-label", "Open feedback form");
    launcher.addEventListener("click", () => showFeedbackPopup(true));
    document.body.append(launcher);
  }

  window.addEventListener("pageshow", () => showFeedbackPopup());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      addHomepageLauncher();
      showFeedbackPopup();
    }, { once: true });
  } else {
    addHomepageLauncher();
    showFeedbackPopup();
  }
})();