/**
 * Escaping a substituted value so it cannot introduce Markdown.
 *
 * A module of its own, with no dependencies, because of **where** it is
 * needed. The interpolation path has to escape values before handing them to
 * the parser, but a label that interpolates without asking for Markdown must
 * not download a parser. Leaving this in `markdown.tsx` - which imports
 * markdown-it - would have put the parser in the interpolation chunk, which
 * is exactly the coupling the lazy split exists to avoid.
 */

/**
 * Escapes every character that could start a Markdown construct.
 *
 * Section 9: "Markdown substitutions are escaped before parsing." The order
 * is interpolate -> escape -> parse, and swapping the last two makes the
 * escaping pointless - by then the link already exists.
 *
 * Applied to **substituted values only**, never to the whole template: the
 * author's own `**bold**` in the surrounding text has to keep working, and
 * escaping the finished string would kill it.
 *
 * `<` and `>` are deliberately absent. Raw HTML is not a Markdown construct
 * here - the parser runs with `html: false`, and the result is rendered as
 * React text nodes, which React escapes. Adding them would put visible
 * backslashes in front of ordinary punctuation for no gain.
 */
export const escapeMarkdown = (text: string): string =>
  text.replace(/[\\`*_{}[\]()#+\-.!>|~]/g, (match) => `\\${match}`);

/** URL substitutions are components, so encoded values cannot change the
 * authored link target's path structure or introduce Markdown syntax. */
export const escapeMarkdownSubstitution = (
  text: string,
  index: number,
  segments: import('./interpolate').TemplateSegment[],
): string => {
  let depth = 0;
  let brackets = 0;
  let codeTicks = 0;
  let titleQuote: string | undefined;
  for (const segment of segments.slice(0, index)) {
    if (segment.kind !== 'literal') continue;
    for (let offset = 0; offset < segment.text.length; offset++) {
      const char = segment.text[offset];
      if (char === '\\') {
        offset++;
        continue;
      }
      if (depth > 0) {
        if (titleQuote) {
          if (char === titleQuote) titleQuote = undefined;
        } else if (
          depth === 1 &&
          (char === '"' || char === "'") &&
          /\s/.test(segment.text[offset - 1] ?? '')
        ) {
          titleQuote = char;
        } else if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
        }
        continue;
      }
      if (char === '`') {
        let run = 1;
        while (segment.text[offset + run] === '`') run++;
        if (codeTicks === 0) codeTicks = run;
        else if (codeTicks === run) codeTicks = 0;
        offset += run - 1;
        continue;
      }
      if (codeTicks > 0) continue;
      if (char === '[') brackets++;
      else if (char === ']' && brackets > 0) {
        brackets--;
        if (segment.text[offset + 1] === '(') {
          depth = 1;
          offset++;
        }
      }
    }
  }
  // encodeURIComponent leaves parentheses unchanged. In a Markdown link target
  // an unmatched `)` ends the authored link, so encode those delimiters too.
  return depth > 0 && !titleQuote
    ? encodeURIComponent(text).replace(/[()]/g, (char) => (char === '(' ? '%28' : '%29'))
    : escapeMarkdown(text);
};
