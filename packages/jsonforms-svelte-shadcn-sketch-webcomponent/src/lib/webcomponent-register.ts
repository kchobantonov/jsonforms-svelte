import { registerShadcnElement } from '../../../jsonforms-svelte-shadcn-webcomponent/src/lib/registerShadcnElement';
import baseStyles from './webcomponent.css?inline';
import sketchStyles from '@chobantonov/jsonforms-svelte-shadcn-sketch-ui/sketch.css?inline';
import { sketchElements } from '@chobantonov/jsonforms-svelte-shadcn-sketch-ui/outlines';

registerShadcnElement('jsonforms-svelte-shadcn-sketch', {
  styles: baseStyles + sketchStyles,
  attach: (node) => sketchElements(node)?.destroy,
});
