(() => {
  if (window.self !== window.top) return;

  const path = window.location.pathname;
  if (/^\/(?:feedback|admin)(?:\/|$)/i.test(path)) return;

  function showFeedbackPopup() {
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

    function closePopup() {
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
        closePopup();
      }
    }

    closeButton.addEventListener("click", closePopup);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closePopup();
    });
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("message", handleMessage);
    document.documentElement.style.overflow = "hidden";
    document.body.append(overlay);
    closeButton.focus({ preventScroll: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showFeedbackPopup, { once: true });
  } else {
    showFeedbackPopup();
  }
})();