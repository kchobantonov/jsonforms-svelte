import { expect, it } from 'vite-plus/test';
import { createSpecValidatorProfileExample } from './index';

it('exposes the source example and both translation catalogs', () => {
  let locale = 'en';
  const example = createSpecValidatorProfileExample(() => locale);
  expect(example.config).toMatchObject({
    jsonformsExtended: { security: { allowScriptEvaluation: true } },
  });
  const english = example.i18n?.translate?.('intro.text', 'missing');
  locale = 'bg';
  const bulgarian = example.i18n?.translate?.('intro.text', 'missing');
  expect(english).not.toBe('missing');
  expect(bulgarian).not.toBe('missing');
  expect(bulgarian).not.toBe(english);
});
