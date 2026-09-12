import { onMount } from "svelte";
/** Resolve system appearance once per editor, keeping the media preference live. */
export function createTheme(mode: () => string) {
  let systemDark = $state(false);
  onMount(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      systemDark = media.matches;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  });
  return {
    get dark() {
      return mode() === "dark" || (mode() === "system" && systemDark);
    },
  };
}
