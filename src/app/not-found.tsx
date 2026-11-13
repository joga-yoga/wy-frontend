import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404: This page could not be found.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center text-center font-sans">
      <div>
        <h1 className="mr-5 inline-block border-r border-foreground/30 py-0 pr-[23px] align-top text-2xl font-medium leading-[49px]">
          404
        </h1>
        <div className="inline-block">
          <h2 className="text-sm font-normal leading-[49px]">This page could not be found.</h2>
        </div>
      </div>
    </main>
  );
}
