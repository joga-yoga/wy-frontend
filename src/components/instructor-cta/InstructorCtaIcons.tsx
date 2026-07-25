import Image from "next/image";

type IconProps = {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

function FigmaIcon({ fileName, ...props }: IconProps & { fileName: string }) {
  return (
    <Image
      src={`/images/cta/instructors/icons/${fileName}.svg`}
      alt=""
      width={36}
      height={36}
      draggable={false}
      {...props}
    />
  );
}

export function SearchProcessIcon(props: IconProps) {
  return <FigmaIcon fileName="process-search" {...props} />;
}

export function DraftProcessIcon(props: IconProps) {
  return <FigmaIcon fileName="process-draft" {...props} />;
}

export function RegisterProcessIcon(props: IconProps) {
  return <FigmaIcon fileName="process-register" {...props} />;
}

export function BenefitCalendarIcon(props: IconProps) {
  return <FigmaIcon fileName="benefit-calendar" {...props} />;
}

export function DescriptionPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-description" {...props} />;
}

export function SchedulePropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-schedule" {...props} />;
}

export function RetreatsPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-retreats" {...props} />;
}

export function EventsPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-events" {...props} />;
}

export function CertificatesPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-certificates" {...props} />;
}

export function StylesPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-styles" {...props} />;
}

export function GalleryPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-gallery" {...props} />;
}

export function ContactPropertyIcon(props: IconProps) {
  return <FigmaIcon fileName="property-contact" {...props} />;
}
