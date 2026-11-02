import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function getProjectRoot(filePath) {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const contentIndex = parts.lastIndexOf('content');

  if (contentIndex > 0) {
    return resolve(parts.slice(0, contentIndex).join('/'));
  }

  throw new Error(`Cannot find the project root for ${filePath}`);
}

function resolveImportPath(importPath, filePath) {
  if (importPath.startsWith('@/')) {
    return resolve(getProjectRoot(filePath), importPath.slice(2));
  }

  return resolve(dirname(filePath), importPath);
}

export async function readPartials(importPaths, filePath) {
  const partials = [];

  for (const importPath of importPaths) {
    let resolvedPath;

    try {
      resolvedPath = resolveImportPath(importPath, filePath);
    } catch {
      continue;
    }

    try {
      const content = await readFile(resolvedPath, 'utf8');
      partials.push(content);
      const imports = [...content.matchAll(/import \w+ from '([^']+)'/g)];
      const nested = await readPartials(
        imports.map((match) => match[1]),
        resolvedPath,
      );
      partials.push(...nested);
    } catch (error) {
      partials.push({ error: error.code });
    }
  }

  return partials;
}
