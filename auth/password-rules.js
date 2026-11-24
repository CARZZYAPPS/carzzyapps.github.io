// Password requirements checklist, shared by sign-up, the account page
// (set / change password) and the reset-password link page (/auth/action).
// The rules match the Firebase password policy for this project; if that
// policy changes, change RULES here. Styles: .pw-rules in /auth/auth.css.

const RULES = [
  { key: "length", label: "At least 6 characters", test: (p) => p.length >= 6 },
  { key: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "number", label: "A number", test: (p) => /[0-9]/.test(p) },
  { key: "symbol", label: "A symbol, like ! ? # @", test: (p) => /[^A-Za-z0-9\s]/.test(p) }
];

const ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
  '<circle class="pw-dot" cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
  '<path class="pw-tick" d="M4.8 8.3l2.1 2.1 4.3-4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const PASSWORD_RULES_MESSAGE = "Your password doesn't meet all the requirements yet.";

// Fills listEl (an empty <ul>) with the checklist and ticks items off as the
// person types in input. Returns check(showMissing): updates the list and
// returns true if every rule is met; with showMissing, unmet rules turn red
// (use it when they try to submit).
export function attachPasswordChecklist(input, listEl) {
  listEl.classList.add("pw-rules");
  listEl.setAttribute("aria-label", "Password requirements");
  listEl.innerHTML = RULES.map((r) => `<li data-rule="${r.key}">${ICON}<span>${r.label}</span></li>`).join("");
  const items = [...listEl.children];

  function check(showMissing) {
    let allMet = true;
    items.forEach((li, i) => {
      const met = RULES[i].test(input.value);
      li.classList.toggle("is-met", met);
      // Red stays on an unmet rule until it's met.
      if (met) li.classList.remove("is-missing");
      else if (showMissing) li.classList.add("is-missing");
      allMet = allMet && met;
    });
    return allMet;
  }

  input.addEventListener("input", () => check(false));
  return check;
}
