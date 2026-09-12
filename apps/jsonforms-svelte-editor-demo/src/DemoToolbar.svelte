<script lang="ts">
  let history = $state({ canUndo: false, canRedo: false });
  export function setHistory(value: typeof history) {
    history = value;
  }
  import DiscardDialog from "./DiscardDialog.svelte";
  let dialog: DiscardDialog;
  export function confirmDiscard(message: string) {
    return dialog.confirm(message);
  }
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import { onMount } from "svelte";
  let { examples }: { examples: string[] } = $props();
  let mode = $state("system"),
    systemDark = $state(false);
  onMount(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      systemDark = media.matches;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  });
  import {
    NativeSelect,
    NativeSelectOption,
  } from "@jsonforms-svelte-shadcn-ui/native-select/index.js";
</script>

<header
  class="editor demo-toolbar"
  data-mode={mode}
  class:dark={mode === "dark" || (mode === "system" && systemDark)}
>
  <h1>Editor demo</h1>
  <Button id="undo" variant="outline" disabled={!history.canUndo}>Undo</Button>
  <Button id="redo" variant="outline" disabled={!history.canRedo}>Redo</Button>
  <Button id="new-form" variant="outline">New form</Button>
  <label
    >Example<NativeSelect id="example" aria-label="Example"
      ><NativeSelectOption value="new">New form (blank)</NativeSelectOption
      >{#each examples as name}<NativeSelectOption value={name}
          >{name}</NativeSelectOption
        >{/each}</NativeSelect
    ></label
  >
  <label
    >Integration<NativeSelect id="integration" value="native"
      ><NativeSelectOption value="webcomponent"
        >Web component</NativeSelectOption
      ><NativeSelectOption value="native">Native Svelte</NativeSelectOption
      ></NativeSelect
    ></label
  >
  <label
    >Appearance<NativeSelect id="mode" bind:value={mode}
      ><NativeSelectOption value="system">System</NativeSelectOption
      ><NativeSelectOption value="light">Light</NativeSelectOption
      ><NativeSelectOption value="dark">Dark</NativeSelectOption></NativeSelect
    ></label
  >
  <label
    >Editor language<NativeSelect id="editor-locale" value="en"
      ><NativeSelectOption value="en">English</NativeSelectOption
      ><NativeSelectOption value="bg">Български</NativeSelectOption
      ></NativeSelect
    ></label
  >
  <DiscardDialog bind:this={dialog} target=".demo-toolbar" />
</header>
