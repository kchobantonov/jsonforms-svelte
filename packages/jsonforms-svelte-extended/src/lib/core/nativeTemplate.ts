import type { UrlPolicy } from '@chobantonov/jsonforms-svelte';
import type { Component, Snippet } from 'svelte';
import type { ErrorObject } from 'ajv';
import type {
  BaseUISchemaElement,
  JsonSchema,
  UISchemaElement,
  JsonFormsRendererRegistryEntry,
  JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import type { FormContext, NamedUISchemaElement } from './types';

export interface NativeTemplateSlotProps {
  name: string;
  children?: Snippet;
}
/** A compiled Svelte component supplied by trusted host code; no source is evaluated. */
export interface NativeTemplateProps<TData = unknown> {
  data: TData;
  errors: ErrorObject[];
  context: FormContext;
  elements: NamedUISchemaElement[];
  schema: JsonSchema;
  path: string;
  enabled: boolean;
  readonly: boolean;
  urlPolicy: UrlPolicy;
  translate: (key: string, fallback?: string) => string;
  Slot: Component<NativeTemplateSlotProps>;
}
export interface NativeTemplateLayout<TData = unknown> extends BaseUISchemaElement {
  type: 'TemplateLayout';
  template: Component<NativeTemplateProps<TData>> | NativeTemplateDescriptor<TData>;
  elements?: UISchemaElement[];
}
export interface NativeTemplateSlotContext {
  readonly elements: Record<string, UISchemaElement>;
  readonly schema: JsonSchema;
  readonly path: string;
  readonly enabled: boolean;
  readonly renderers: JsonFormsRendererRegistryEntry[];
  readonly cells: JsonFormsCellRendererRegistryEntry[];
}
export const nativeTemplateSlotContext = Symbol('native template slots');

export type NativeTemplateMountSlot = (
  target: HTMLElement,
  name: string,
  onMissing: (missing: boolean) => void,
) => () => void | Promise<void>;
export interface NativeTemplateHandle<TData = unknown> {
  update(props: NativeTemplateProps<TData>): void;
  destroy(): void | Promise<void>;
}
export interface NativeTemplateDescriptor<TData = unknown> {
  readonly kind: 'svelte-component';
  mount(
    target: HTMLElement,
    props: NativeTemplateProps<TData>,
    mountSlot: NativeTemplateMountSlot,
  ): NativeTemplateHandle<TData>;
}
export const nativeTemplateMountSlotContext = Symbol('native template slot mounting');
