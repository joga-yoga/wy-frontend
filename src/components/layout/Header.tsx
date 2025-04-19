import { PlusCircle, User } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/events" className="flex items-center space-x-2">
          {/* Replace with your actual logo component or SVG */}
          <span className="font-bold text-xl bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center">
            y
          </span>
        </Link>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" passHref legacyBehavior>
            <Button variant="ghost" size="sm" className="text-sm">
              <PlusCircle className="mr-1 h-4 w-4" /> Dodaj wydarzenie za 5 min
            </Button>
          </Link>
          <Link href="/dashboard" passHref legacyBehavior>
            <Button variant="ghost" size="icon" aria-label="Account">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
