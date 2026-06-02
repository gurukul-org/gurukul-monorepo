import { redirect } from 'next/navigation';

import { getNavigation } from '@/lib/docs';

export default function Home() {
  const nav = getNavigation();
  const first = nav[0]?.items[0];
  if (first) {
    redirect(first.href);
  }
  redirect('/docs');
}
