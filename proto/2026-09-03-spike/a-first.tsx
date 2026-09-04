// T01/T02 spike variant.
// - PROTO_SPIKE_MARKER_ALPHA is the criterion-2 sentinel (must not appear in .next/).
// - bg-fuchsia-700 is the criterion-3 sentinel: used nowhere in src/, so if it turns up in
//   the production stylesheet the `@source not` in globals.css has stopped working.
// - text-brand-green-700 proves the proto build really has the product theme from tokens.css.
export default function SpikeFirst() {
  return (
    <div className="bg-fuchsia-700 text-brand-green-700 text-h-small">
      PROTO_SPIKE_MARKER_ALPHA — first variant
    </div>
  );
}
