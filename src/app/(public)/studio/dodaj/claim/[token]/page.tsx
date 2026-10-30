"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function ClaimStudioPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/account/partner/studio/create?draft=${encodeURIComponent(params.token)}`);
  }, [params.token, router]);
  return <p className="p-6">Otwieramy szkic studia…</p>;
}
