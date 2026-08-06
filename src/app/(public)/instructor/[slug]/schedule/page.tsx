import { notFound } from "next/navigation";

import { getInstructor } from "@/lib/api/getInstructor";

import { InstructorSchedulePage } from "./InstructorSchedulePage";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getInstructor(slug);
  if (!data) return {};
  return { title: `Grafik · ${data.instructor.name} | joga.yoga` };
}

export default async function InstructorSchedulePageRoute({ params }: Props) {
  const { slug } = await params;
  const data = await getInstructor(slug);
  if (!data) notFound();
  return <InstructorSchedulePage instructor={data.instructor} />;
}
