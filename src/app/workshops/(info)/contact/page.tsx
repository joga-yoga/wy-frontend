import { Metadata } from "next";

import { ContactPageContent } from "@/components/page-contents/(info)/ContactPageContent";
import { buildPageMetadata } from "@/lib/seo";

interface ContactPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const defaultTitle = "Kontakt | joga.yoga";
const defaultDescription =
  "Skontaktuj się z zespołem joga.yoga. Masz pytania dotyczące warsztatów lub kursów? Napisz do nas.";
const takeoverTitle = "Przejęcie wydarzenia | joga.yoga";
const takeoverDescription =
  "Zgłoś przejęcie wydarzenia opublikowanego na joga.yoga. Po weryfikacji pomożemy przypisać Ci kontrolę nad ofertą.";

export const generateMetadata = async (props: ContactPageProps): Promise<Metadata> => {
  const searchParams = await props.searchParams;
  const rawEventId = searchParams.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
  const isTakeoverFlow = Boolean(eventId);

  const title = isTakeoverFlow ? takeoverTitle : defaultTitle;
  const description = isTakeoverFlow ? takeoverDescription : defaultDescription;

  return {
    ...buildPageMetadata({
      project: "workshops",
      title,
      description,
      path: "/wydarzenia/contact",
      noIndex: isTakeoverFlow,
    }),
  };
};

const ContactPage = async (props: ContactPageProps) => {
  const searchParams = await props.searchParams;
  const rawEventId = searchParams.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;

  return <ContactPageContent eventId={eventId} context="workshops" />;
};

export default ContactPage;
