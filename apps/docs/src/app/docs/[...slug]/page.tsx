import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { TableOfContents } from '@/components/TableOfContents';
import { getAllDocSlugs, getDocContent } from '@/lib/docs';

interface Params {
  slug: string[];
}

export async function generateStaticParams(): Promise<Params[]> {
  return getAllDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const doc = await getDocContent(params.slug);
  if (!doc) return { title: 'Not Found' };
  return {
    title: `${doc.meta.title} | Gurukul Docs`,
    description: doc.meta.description,
  };
}

export default async function DocPage({ params }: { params: Params }) {
  const doc = await getDocContent(params.slug);
  if (!doc) notFound();

  return (
    <div className="xl:grid xl:grid-cols-[1fr_300px] xl:gap-10">
      <div className="space-y-4 px-8">
        <div className="space-y-2">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-foreground">
            {doc.meta.title}
          </h1>
          {doc.meta.description && (
            <p className="text-lg text-muted-foreground">
              {doc.meta.description}
            </p>
          )}
        </div>
        <div
          className="prose prose-zinc dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
        />
      </div>
      <TableOfContents headings={doc.headings} />
    </div>
  );
}
