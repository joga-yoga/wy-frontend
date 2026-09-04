// blank mode: no product imports, no product classes, no token stylesheet (§4).
// Plain markup only — so whatever font and size this renders at is the browser default,
// not Hind Siliguri. That is what criterion 8 asserts.
export default function Plain() {
  return (
    <div id="blank-probe">
      <h1>Zapisz się na zajęcia</h1>
      <p>Wariant bez żadnych klas produktowych.</p>
    </div>
  );
}
