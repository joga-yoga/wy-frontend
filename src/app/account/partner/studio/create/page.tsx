import { ImportEntry } from "../import/fitssey/ImportEntry";
import { StudioForm } from "../[studioId]/edit/StudioForm";

export default function CreateStudioPage() {
  return <><ImportEntry/><StudioForm routeId="create" /></>;
}
