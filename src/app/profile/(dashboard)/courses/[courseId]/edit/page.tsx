import { CourseForm } from "./CourseForm";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseForm routeId={courseId} />;
}
