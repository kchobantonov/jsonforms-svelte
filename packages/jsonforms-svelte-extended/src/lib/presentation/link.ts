import type { UISchemaElement } from '@jsonforms/core';

export type LinkElement = UISchemaElement & {
  type: 'Link';
  label?: string;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
};

export function linkRel(target: string | undefined, rel: string | undefined): string | undefined {
  const newWindow = typeof target === 'string' && target.toLowerCase() === '_blank';
  const tokens = (rel ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !newWindow || token.toLowerCase() !== 'opener');
  if (newWindow) {
    for (const required of ['noopener', 'noreferrer'])
      if (!tokens.some((token) => token.toLowerCase() === required)) tokens.push(required);
  }
  return tokens.length ? tokens.join(' ') : undefined;
}
