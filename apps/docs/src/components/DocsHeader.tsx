import Link from 'next/link';

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4 px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            Guru<span className="text-primary">kul</span>
          </span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
          Docs
        </span>
      </div>
    </header>
  );
}
