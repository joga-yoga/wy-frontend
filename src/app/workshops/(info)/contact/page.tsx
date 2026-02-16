import { Metadata } from "next";

import { ContactPageContent } from "@/components/page-contents/(info)/ContactPageContent";

interface ContactPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const defaultTitle = "Kontakt | wydarzenia.yoga";
const defaultDescription =
  "Skontaktuj się z zespołem wydarzenia.yoga. Masz pytania dotyczące warsztatów lub kursów? Napisz do nas.";
const takeoverTitle = "Przejęcie wydarzenia | wydarzenia.yoga";
const takeoverDescription =
  "Zgłoś przejęcie wydarzenia opublikowanego na wydarzenia.yoga. Po weryfikacji pomożemy przypisać Ci kontrolę nad ofertą.";

export const generateMetadata = async (props: ContactPageProps): Promise<Metadata> => {
  const searchParams = await props.searchParams;
  const rawEventId = searchParams.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
  const isTakeoverFlow = Boolean(eventId);

  const title = isTakeoverFlow ? takeoverTitle : defaultTitle;
  const description = isTakeoverFlow ? takeoverDescription : defaultDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/images/social_wydarzenia.png"],
    },
  };
};

const ContactPage = async (props: ContactPageProps) => {
  const searchParams = await props.searchParams;
  const rawEventId = searchParams.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;

  return <ContactPageContent eventId={eventId} context="workshops" />;
};

export default ContactPage;
