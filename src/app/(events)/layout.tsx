import { EventsHeader } from "@/components/layout/Header";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EventsHeader />
      {children}
    </>
  );
}
