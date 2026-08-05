import { EventProgramSectionProps } from "./EventProgramSection.types";
import { RetreatProgramSection } from "./RetreatProgramSection";
import { WorkshopProgramSection } from "./WorkshopProgramSection";

export const EventProgramSection = (props: EventProgramSectionProps) => {
  if (props.project === "workshops") {
    return <WorkshopProgramSection {...props} />;
  }

  return <RetreatProgramSection {...props} />;
};
