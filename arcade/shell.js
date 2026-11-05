// Shared page chrome for Lazer Arcade pages: account chip + feedback buttons.
import LZ from "/arcade/lz.js";

export const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lzg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset=".55" stop-color="#7c4dff"/><stop offset="1" stop-color="#22e4ff"/></linearGradient></defs><rect x="2" y="2" width="36" height="36" rx="11" fill="#140c36" stroke="url(#lzg)" stroke-width="2.5"/><path d="M12 10v19h16" fill="none" stroke="url(#lzg)" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 10l8 9" stroke="#22e4ff" stroke-width="2.6" stroke-linecap="round"/><circle cx="29" cy="19" r="2.6" fill="#fff"/></svg>`;

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
  document.querySelectorAll("[data-feedback]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); LZ.openFeedback(b.dataset.feedback || "arcade"); }));
  return paint;
}
export default LZ;
