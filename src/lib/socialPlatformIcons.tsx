import { Globe } from "lucide-react";
import type { IconType } from "react-icons";
import { FaThreads } from "react-icons/fa6";
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoLogoTiktok,
  IoLogoTwitter,
  IoLogoWhatsapp,
  IoLogoYoutube,
} from "react-icons/io5";

import type { SocialPlatform } from "./socialLinks";

/** Brand icons matching the Footer's existing convention (react-icons/io5). Threads has
 * no io5 icon yet, so it borrows from react-icons/fa6 — the one deliberate mix. */
export const SOCIAL_PLATFORM_ICONS: Record<SocialPlatform, IconType> = {
  instagram: IoLogoInstagram,
  facebook: IoLogoFacebook,
  tiktok: IoLogoTiktok,
  youtube: IoLogoYoutube,
  twitter: IoLogoTwitter,
  linkedin: IoLogoLinkedin,
  whatsapp: IoLogoWhatsapp,
  threads: FaThreads,
  custom: Globe,
};
