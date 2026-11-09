// Shared page chrome for Lazer Arcade pages: account chip + feedback buttons.
import LZ from "/arcade/lz.js";

export const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lzg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset=".55" stop-color="#7c4dff"/><stop offset="1" stop-color="#22e4ff"/></linearGradient></defs><rect x="2" y="2" width="36" height="36" rx="11" fill="#140c36" stroke="url(#lzg)" stroke-width="2.5"/><path d="M12 10v19h16" fill="none" stroke="url(#lzg)" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 10l8 9" stroke="#22e4ff" stroke-width="2.6" stroke-linecap="round"/><circle cx="29" cy="19" r="2.6" fill="#fff"/></svg>`;

function mountEmailVerificationPrompt() {
  let overlay = null;

  function hide() {
    overlay?.remove();
    overlay = null;
  }

  function show() {
    if (overlay) return;

    const style = document.createElement("style");
    style.textContent = `
      .lz-verify-overlay{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:20px;background:rgba(7,5,26,.82);backdrop-filter:blur(8px)}
      .lz-verify-dialog{position:relative;width:min(440px,100%);padding:30px 26px 24px;border:1px solid rgba(124,77,255,.55);border-radius:20px;background:linear-gradient(180deg,#1a1240,#0e0a2a);color:#f3efff;box-shadow:0 20px 60px rgba(0,0,0,.58),0 0 36px rgba(124,77,255,.2);font:500 16px/1.5 Manrope,system-ui,-apple-system,"Segoe UI",sans-serif}
      .lz-verify-dialog:before{content:"";position:absolute;top:0;left:24px;right:24px;height:3px;border-radius:3px;background:linear-gradient(90deg,#8b5cff,#4f7bff 55%,#22d3ee)}
      .lz-verify-dialog h2{margin:0 0 10px;color:#fff;font:800 25px/1.2 Unbounded,Manrope,system-ui,sans-serif;letter-spacing:-.02em}
      .lz-verify-dialog p{margin:0 0 20px;color:#c4bbe8}
      .lz-verify-dialog .lz-verify-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin-top:10px;padding:12px 16px;border:1px solid transparent;border-radius:13px;background:linear-gradient(90deg,#8b5cff,#4f7bff 55%,#22d3ee);color:#fff;font:800 15px Manrope,system-ui,sans-serif;text-decoration:none;cursor:pointer;box-shadow:0 8px 26px rgba(124,77,255,.28)}
      .lz-verify-dialog .lz-verify-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
      .lz-verify-dialog .lz-verify-btn.secondary{border-color:#3d3089;background:#130d33;box-shadow:none}
      .lz-verify-dialog .lz-verify-btn.secondary:hover{border-color:#22e4ff;background:#1a1240}
      @media(prefers-reduced-motion:reduce){.lz-verify-dialog .lz-verify-btn{transition:none}}
    `;

    overlay = document.createElement("div");
    overlay.className = "lz-verify-overlay";
    overlay.innerHTML = `<section class="lz-verify-dialog" role="dialog" aria-modal="true" aria-labelledby="lz-verify-title" aria-describedby="lz-verify-copy">
      <h2 id="lz-verify-title">Verify your email</h2>
      <p id="lz-verify-copy">Your email address isn't verified yet. Verify it to help keep your Carzzy Apps account secure.</p>
      <a class="lz-verify-btn" href="/auth/verify-email">Verify email</a>
      <button class="lz-verify-btn secondary" type="button" data-signout>Sign out</button>
    </section>`;
    overlay.prepend(style);
    document.body.appendChild(overlay);

    overlay.querySelector("[data-signout]").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "Signing out…";
      try {
        await LZ.logout();
        hide();
      } catch (error) {
        button.disabled = false;
        button.textContent = "Sign out";
        console.error("Arcade sign out failed.", error);
      }
    });
  }

  LZ.onChange((user) => {
    if (!user || user.emailVerified) hide();
    else show();
  });
}

export function mountShell() {
  document.querySelectorAll("[data-logo]").forEach((el) => (el.innerHTML = LOGO + el.innerHTML));
  const chip = document.getElementById("acct");
  async function paint() {
    if (!chip) return;
    if (LZ.signedIn()) {
      const m = await LZ.me();
      chip.className = "acct";
      chip.innerHTML = `<span>${LZ.esc(LZ.username)}</span><span class="lp">${LZ.fmt(m ? m.lp : 0)} LP</span>`;
    } else {
      const p = LZ.pendingLP();
      chip.className = "acct out";
      chip.innerHTML = p ? `Sign in · save ${LZ.fmt(p)} LP` : "Sign in";
    }
  }
  if (chip) chip.onclick = () => (LZ.signedIn() ? LZ.accountMenu() : LZ.openAccount("signin"));
  LZ.onChange(() => paint());
  mountEmailVerificationPrompt();
  document.querySelectorAll("[data-feedback]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); LZ.openFeedback(b.dataset.feedback || "arcade"); }));
  return paint;
}
export default LZ;
