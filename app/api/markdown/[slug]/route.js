import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readPartials } from '../../../../lib/read-partials';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug } = await params;
  const filePath = resolve(process.cwd(), 'content/docs', `${slug}.mdx`);
  const source = await readFile(filePath, 'utf8');
  const imports = [...source.matchAll(/import \w+ from '([^']+)'/g)];
  const partials = await readPartials(imports.map((match) => match[1]), filePath);

  return Response.json({ partials });
}
