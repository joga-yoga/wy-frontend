import type { StudioCardData } from "@/components/common/StudioCard";
import { StudioCard } from "@/components/common/StudioCard";

interface InstructorStudiosSectionProps {
  studios: StudioCardData[];
}

export function InstructorStudiosSection({ studios }: InstructorStudiosSectionProps) {
  if (studios.length === 0) return null;

  return (
    <section id="worksAt" className="mx-auto max-w-5xl px-4 py-5 scroll-mt-16">
      <h2 className="mb-1 text-[18px] font-semibold text-[#222222]">Gdzie mnie znajdziesz</h2>
      <p className="mb-4 text-sm text-[#717171]">Regularnie prowadzę zajęcia w tych miejscach:</p>

      <div className="space-y-3">
        {studios.map((studio) => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </div>
    </section>
  );
}
