import { DocsHeader } from '@/components/DocsHeader';
import { Sidebar } from '@/components/Sidebar';
import { getNavigation } from '@/lib/docs';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = getNavigation();

  return (
    <>
      {/* <DocsHeader /> */}
      <div className="docs-shell">
        {/* <Sidebar nav={nav} /> */}
        {children}
      </div>
    </>
  );
}
