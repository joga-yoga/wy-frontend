import TagYogaCertificateIcon from "@/components/icons/tags/TagYogaCertificateIcon";
import TagYogaHeartIcon from "@/components/icons/tags/TagYogaHeartIcon";
import TagYogaLotosIcon from "@/components/icons/tags/TagYogaLotosIcon";
import TagYogaMatteIcon from "@/components/icons/tags/TagYogaMatteIcon";
import TagYogaMeditationIcon from "@/components/icons/tags/TagYogaMeditationIcon";
import TagYogaMusicIcon from "@/components/icons/tags/TagYogaMusicIcon";
import TagYogaNoseIcon from "@/components/icons/tags/TagYogaNoseIcon";
import TagYogaStarsIcon from "@/components/icons/tags/TagYogaStarsIcon";
import TagYogaYinYangIcon from "@/components/icons/tags/TagYogaYinYangIcon";

export interface Tag {
  id: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export const PREDEFINED_TAGS: Tag[] = [
  {
    id: "yoga",
    label: "Joga",
    icon: TagYogaMatteIcon,
  },
  {
    id: "pranajama",
    label: "Pranajama",
    icon: TagYogaNoseIcon,
  },
  {
    id: "meditation",
    label: "Medytacja / Relaks",
    icon: TagYogaMeditationIcon,
  },
  {
    id: "yoga-nidra",
    label: "Joga Nidra",
    icon: TagYogaStarsIcon,
  },
  {
    id: "specialized-courses",
    label: "Warsztaty i kursy specjalistyczne",
    icon: TagYogaCertificateIcon,
  },
  {
    id: "therapeutic-yoga",
    label: "Joga terapeutyczna / zdrowotna",
    icon: TagYogaHeartIcon,
  },
  {
    id: "philosophy-development",
    label: "Filozofia / rozwój osobisty",
    icon: TagYogaLotosIcon,
  },
  {
    id: "live-music",
    label: "Wydarzenia z muzyką na żywo",
    icon: TagYogaMusicIcon,
  },
  {
    id: "for-womens",
    label: "Dla kobiet",
    icon: TagYogaYinYangIcon,
  },
  {
    id: "for-mens",
    label: "Dla mężczyzn",
    icon: TagYogaYinYangIcon,
  },
];
