import type { Snippet } from 'svelte';
import type { Styles } from '../layout/styles';

export interface RendererControlWrapperProps {
  id: string;
  description: string;
  errors: string;
  label: string;
  visible: boolean;
  required: boolean;
  persistentHint: boolean;
  isFocused: boolean;
  styles: Styles;
  schema?: { type?: unknown; enum?: unknown };
  children: Snippet;
  layout?: 'vertical' | 'horizontal';
}
