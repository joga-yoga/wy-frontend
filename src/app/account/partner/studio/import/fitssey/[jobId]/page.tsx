import { ImportWorkspace } from "../ImportWorkspace";
export default async function ImportJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ImportWorkspace id={jobId} />;
}
