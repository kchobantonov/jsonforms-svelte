import { choiceCardsTester } from '@chobantonov/jsonforms-svelte';
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import renderer from './ChoiceCardsRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = { renderer, tester: choiceCardsTester };
