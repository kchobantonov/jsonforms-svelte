<script lang="ts">
 import {untrack} from 'svelte';
 import EditorToolbar from './components/editor/EditorToolbar.svelte';
 import ComponentPalette from './components/editor/ComponentPalette.svelte';
 import CanvasNode from './components/editor/CanvasNode.svelte';
 import PropertyPanel from './components/editor/PropertyPanel.svelte';
 import SourcePanel from './components/editor/SourcePanel.svelte';
 import PreviewPanel from './components/editor/PreviewPanel.svelte';
 import {createSession} from './state/session.svelte.js';
 import type {Document} from './document/commands.js';
 import type {InitialForm} from './types.js';
 let {initialForm,documentId,editorMode,onchange,ondraft}:{initialForm:InitialForm;documentId:string;editorMode:'light'|'dark'|'system';onchange:(document:Document,revision:number)=>void;ondraft:(dirty:boolean)=>void}=$props();
 const session=createSession(untrack(()=>initialForm),(document,revision)=>onchange(document,revision));
 let source=$state(false),preview=$state(false),sourceMounted=$state(false),previewMounted=$state(false);
</script>
<section class="editor" data-mode={editorMode} aria-label="Form editor">
 <EditorToolbar {session} title={documentId} {source} {preview} ontoggleSource={()=>{source=!source;sourceMounted=true;}} ontogglePreview={()=>{preview=!preview;previewMounted=true;}}/>
 {#if session.message}<p role="alert" class="notice">{session.message}</p>{/if}
 {#if session.locked}<p class="notice">Source has unapplied changes. Apply or revert to resume visual editing.</p>{/if}
 <div class="workspace">
  <ComponentPalette {session}/>
  <main><div class="canvas-heading"><h2>Form designer</h2><span class="badge">Select · Add · Drag to a layout</span></div><CanvasNode node={session.document.uischema} path={[]} document={session.document} selected={JSON.stringify(session.selected)} mode={editorMode} locked={session.locked} onselect={session.select} ondropnode={session.drop}/>
  {#if sourceMounted}<SourcePanel {session} mode={editorMode} visible={source} {ondraft}/>{/if}
  {#if previewMounted}<PreviewPanel document={session.document} mode={editorMode} visible={preview}/>{/if}
  </main>
  <PropertyPanel {session} mode={editorMode}/>
 </div>
</section>
