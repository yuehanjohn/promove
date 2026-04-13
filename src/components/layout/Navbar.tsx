"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

export function Navbar() {
  return (
    <nav className="border-b border-default-200 bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🏐</span>
          ProMove
        </Link>

        <Link href="/tracker">
          <Button variant="primary" size="sm">
            Open App
          </Button>
        </Link>
      </div>
    </nav>
  );
}
