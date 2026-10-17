import type { UISchemaElement } from '@jsonforms/core';

export type LinkElement = UISchemaElement & {
  type: 'Link';
  label?: string;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
};

export function linkRel(target: string | undefined, rel: string | undefined): string | undefined {
  const tokens = (rel ?? '').split(/\s+/).filter(Boolean);
  if (target === '_blank') {
    for (const required of ['noopener', 'noreferrer'])
      if (!tokens.some((token) => token.toLowerCase() === required)) tokens.push(required);
  }
  return tokens.length ? tokens.join(' ') : undefined;
}
