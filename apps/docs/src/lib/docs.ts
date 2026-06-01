import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface DocMeta {
  title: string;
  description?: string;
  order?: number;
}

export interface DocFile {
  slug: string[]; // e.g. ["getting-started", "introduction"]
  href: string; // e.g. "/docs/getting-started/introduction"
  meta: DocMeta;
}

export interface NavSection {
  name: string; // folder name, prettified
  slug: string; // raw folder name
  items: DocFile[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function prettifyName(name: string): string {
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMeta(filePath: string): DocMeta {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  return {
    title: data.title ?? prettifyName(path.basename(filePath, '.md')),
    description: data.description,
    order: data.order ?? 999,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Build the full sidebar nav from /content folder structure */
export function getNavigation(): NavSection[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  const sections: NavSection[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sectionPath = path.join(CONTENT_DIR, entry.name);
      const files = fs
        .readdirSync(sectionPath)
        .filter((f) => f.endsWith('.md'));

      const items: DocFile[] = files.map((file) => {
        const filePath = path.join(sectionPath, file);
        const slug = [entry.name, file.replace(/\.md$/, '')];
        return {
          slug,
          href: `/docs/${slug.join('/')}`,
          meta: getMeta(filePath),
        };
      });

      items.sort((a, b) => (a.meta.order ?? 999) - (b.meta.order ?? 999));

      sections.push({
        name: prettifyName(entry.name),
        slug: entry.name,
        items,
      });
    } else if (entry.name.endsWith('.md')) {
      // Top-level .md files go into an implicit "root" section
      const filePath = path.join(CONTENT_DIR, entry.name);
      const slug = [entry.name.replace(/\.md$/, '')];
      const existing = sections.find((s) => s.slug === '__root__');
      const item: DocFile = {
        slug,
        href: `/docs/${slug[0]}`,
        meta: getMeta(filePath),
      };
      if (existing) {
        existing.items.push(item);
      } else {
        sections.push({ name: 'Overview', slug: '__root__', items: [item] });
      }
    }
  }

  return sections;
}

/** Get all slugs for static generation */
export function getAllDocSlugs(): string[][] {
  const nav = getNavigation();
  return nav.flatMap((section) => section.items.map((item) => item.slug));
}

export interface ParsedHeading {
  id: string;
  text: string;
  level: number;
}

export interface DocContent {
  meta: DocMeta;
  contentHtml: string;
  headings: ParsedHeading[];
}

/** Parse a single .md file into HTML + headings for TOC */
export async function getDocContent(
  slug: string[],
): Promise<DocContent | null> {
  const filePath = path.join(CONTENT_DIR, ...slug) + '.md';
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Dynamic imports — avoids issues with ESM in Next.js
  const { unified } = await import('unified');
  const { default: remarkParse } = await import('remark-parse');
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkRehype } = await import('remark-rehype');
  const { default: rehypeSlug } = await import('rehype-slug');
  const { default: rehypeAutolinkHeadings } =
    await import('rehype-autolink-headings');
  const { default: rehypeStringify } = await import('rehype-stringify');

  // Extract headings before HTML transform
  const headings: ParsedHeading[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    headings.push({ id, text, level });
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeStringify);

  const result = await processor.process(content);

  return {
    meta: {
      title: data.title ?? slug[slug.length - 1],
      description: data.description,
      order: data.order,
    },
    contentHtml: String(result),
    headings,
  };
}
