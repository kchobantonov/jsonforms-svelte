<script lang="ts">
 import Button from '../ui/button/button.svelte';
 import Inspector from './Inspector.svelte';
 import type {EditorSession} from '../../state/session.svelte.js';
 let {session,mode}:{session:EditorSession;mode:string}=$props();
</script>
<aside aria-label="Properties"><h2>{session.node.type} properties</h2><p class="muted">Changes update the form model.</p><div inert={session.locked}><Inspector document={session.document} node={session.node} {mode} onchange={session.inspect}/></div>{#if session.selected.length}<Button variant="outline" disabled={!session.canMoveUp} onclick={()=>session.reorder(-1)}>Move up</Button><Button variant="outline" disabled={!session.canMoveDown} onclick={()=>session.reorder(1)}>Move down</Button><Button variant="outline" disabled={session.locked} onclick={session.remove}>Remove element</Button>{/if}</aside>
