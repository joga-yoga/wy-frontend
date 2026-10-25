"use client";

import { Award } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { getCertificateMark } from "./certificateMarks";
import type { InstructorCertificateViewModel } from "./viewModel";

export function InstructorCertificateCard({
  certificate,
}: {
  certificate: InstructorCertificateViewModel;
}) {
  const [markFailed, setMarkFailed] = useState(false);
  const [documentFailed, setDocumentFailed] = useState(false);
  const mark = getCertificateMark(certificate.name);

  const content = (
    <>
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-[#717171]">
        {certificate.imageId && !documentFailed ? (
          <WyImage
            src={certificate.imageId}
            alt=""
            fill
            sizes="80px"
            className="object-contain"
            onError={() => setDocumentFailed(true)}
          />
        ) : mark && !markFailed ? (
          <Image
            src={mark}
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-contain"
            onError={() => setMarkFailed(true)}
          />
        ) : (
          <Award className="h-6 w-6" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-semibold leading-5 text-[#222222]">
          {certificate.name}
        </p>
        {certificate.imageId && (
          <p className="mt-2 text-sm text-brand-green-700">
            {documentFailed ? "Zdjęcie niedostępne" : "Zobacz certyfikat"}
          </p>
        )}
      </div>
    </>
  );

  return (
    <article className="min-w-0 rounded-2xl border border-[#EBEBEB] bg-white">
      <Dialog>
        {certificate.imageId && !documentFailed ? (
          <DialogTrigger
            className="flex w-full min-w-0 items-center gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Zobacz certyfikat: ${certificate.name}`}
          >
            {content}
          </DialogTrigger>
        ) : (
          <div className="flex min-w-0 items-center gap-3 p-4">{content}</div>
        )}
        {certificate.imageId && (
          <DialogContent
            closeLabel="Zamknij"
            className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"
          >
            <DialogTitle className="break-words pr-8 leading-6">{certificate.name}</DialogTitle>
            {documentFailed ? (
              <p className="py-8 text-center text-muted-foreground">Zdjęcie niedostępne</p>
            ) : (
              <div className="relative h-[65dvh] w-full">
                <WyImage
                  src={certificate.imageId}
                  alt={certificate.name}
                  fill
                  sizes="(min-width: 768px) 720px, 90vw"
                  className="object-contain"
                  onError={() => setDocumentFailed(true)}
                />
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </article>
  );
}
