import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import routes from '../../data/routes.json';
import TemplateInteractions from '../../components/TemplateInteractions';
import Commerce from '../../components/Commerce';

export const dynamicParams = false;
export function generateStaticParams() {
  return routes.map(({ route }) => ({ slug: route === '/' ? [] : route.slice(1).split('/') }));
}
async function readPage(slug?: string[]) {
  const route = '/' + (slug || []).join('/');
  const entry = routes.find(item => item.route === route);
  if (!entry) notFound();
  return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/pages', entry.key + '.json'), 'utf8'));
}
export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const data = await readPage((await params).slug);
  return { title: data.title, description: data.description };
}
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const data = await readPage((await params).slug);
  return <>
    <style dangerouslySetInnerHTML={{ __html: data.css }} />
    <div id="template-root" dangerouslySetInnerHTML={{ __html: data.html }} />
    <TemplateInteractions route={data.route} />
    <Commerce route={data.route} />
  </>;
}
