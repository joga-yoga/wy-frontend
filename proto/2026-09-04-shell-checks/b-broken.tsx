// Deliberately broken — criterion 13. Do NOT "fix" this.
//
// It throws at RUNTIME from well-typed code, on purpose: decision D4 keeps proto/ inside the
// production type check, so a TYPE error here would fail `next build` instead of demonstrating
// inline error isolation. Those are different failures with different correct responses.
export default function Broken(): React.ReactNode {
  throw new Error("Deliberate failure: this prototype demonstrates inline error isolation.");
}
