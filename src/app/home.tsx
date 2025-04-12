"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const UserInfo = () => {
  const { user, loading, signOut } = useAuth();
  console.log("🚀 ~ UserInfo ~ user:", user);
  if (loading)
    return <p className="text-3xl text-brand-yellow text-center font-bold">Loading...</p>;
  if (!user)
    return (
      <Link href="/login" className="mx-auto">
        <Button variant="destructive">Log in</Button>
      </Link>
    );

  return (
    <>
      <h1 className="text-xl text-brand-blue text-center font-bold">
        Welcome, {user.email || user.id}
      </h1>

      <Button onClick={() => signOut()} variant="destructive" className="mx-auto">
        Sign out
      </Button>
    </>
  );
};
export function Home() {
  return (
    <div className="flex flex-col justify-between h-[100svh] w-full bg-black">
      {/* HEADER */}
      <div className=""></div>
      {/* BODY */}
      <div className="flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 max-w-[780px] w-full px-4 xl:px-10 pb-4 pt-12 xl:py-12 mx-auto">
          <p className="text-3xl text-brand-yellow text-center font-bold">W.Y</p>
          <UserInfo />
        </div>
      </div>
      {/* FOOTER */}
      <div className=""></div>
    </div>
  );
}
