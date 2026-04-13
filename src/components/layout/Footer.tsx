import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-divider bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 text-center">
        <Link href="/" className="text-lg font-bold">
          🏐 ProMove
        </Link>
        <p className="mt-2 text-sm text-default-500">
          Track and analyze your volleyball explosive movements.
        </p>
        <p className="mt-4 text-xs text-default-400">
          &copy; {new Date().getFullYear()} ProMove. All data stored locally on your device.
        </p>
      </div>
    </footer>
  );
}
