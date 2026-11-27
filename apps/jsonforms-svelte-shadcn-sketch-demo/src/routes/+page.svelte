<script lang="ts">
  import HomePage from '$shadcnDemo/HomePage.svelte';
</script>

<HomePage library="Sketch Shadcn">
  {#snippet logo()}<div
      data-slot="card"
      class="bg-card text-foreground absolute inset-0 z-10 grid place-items-center text-8xl"
      aria-hidden="true"
    >
      ✎
    </div>{/snippet}
</HomePage>
