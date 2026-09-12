<script lang="ts">
  import { useEditorI18n } from "../i18n/context.js";
  const i18n = useEditorI18n();
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import { dragHandle } from "svelte-dnd-action";
  import DragZone from "../dnd/DragZone.svelte";
  import { componentSections } from "../registrations/control-definitions.js";
  import type { EditorSession } from "../document/history-store.svelte.js";
  import type { DragItem } from "../dnd/payloads.js";
  let { session }: { session: EditorSession } = $props();
  const sections = $derived(
    componentSections.map((section) => ({
      ...section,
      items: section.presets.map(
        (preset) =>
          ({
            id: `${session.dragType}:palette:${preset}`,
            label: preset,
            payload: { kind: "palette-item", preset },
          }) as DragItem,
      ),
    })),
  );
  const categories = $derived<DragItem[]>([
    {
      id: `${session.dragType}:palette:Category`,
      label: "Category",
      payload: { kind: "palette-item", preset: "Category" },
    },
  ]);
</script>

<aside aria-label="Components">
  <div class="panel-heading"><h2>{i18n.t("Components")}</h2></div>
  <p class="muted">{i18n.t("Select a layout, then click or drag.")}</p>
  {#each sections as section}<section class="component-section">
      <h3>{i18n.t(section.title)}</h3>
      <DragZone
        {session}
        sourceItems={section.items}
        label="Component palette"
        handles
        >{#snippet children(item)}<div class="palette-row">
            <span use:dragHandle aria-label={`Drag ${item.label}`}>⠿</span
            ><Button
              variant="ghost"
              class="palette-button"
              disabled={session.locked}
              onclick={() => session.add(item.label)}>{i18n.t(item.label)}</Button
            >
          </div>{/snippet}</DragZone
      >
    </section>{/each}<DragZone
    {session}
    sourceItems={categories}
    group="categories"
    label="Category palette"
    handles
    >{#snippet children(item)}<div class="palette-row">
        <span use:dragHandle aria-label={`Drag ${item.label}`}>⠿</span><Button
          variant="ghost"
          class="palette-button"
          disabled={session.locked}
          onclick={() => session.add(item.label)}>{i18n.t(item.label)}</Button
        >
      </div>{/snippet}</DragZone
  >
</aside>
