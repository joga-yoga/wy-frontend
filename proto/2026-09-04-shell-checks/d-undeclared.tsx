// On disk but absent from meta.json — exercises the registry's undeclared-file warning.
export default function Undeclared() {
  return <div className="p-4">Nie wymieniony w meta.json</div>;
}
