<script lang="ts">
 import {untrack} from 'svelte';
 import Runtime from './Runtime.svelte';
 import {clone,previewSafe,type Document} from '../../document/commands.js';
 import type {JsonValue} from '../../types.js';
 let {document,mode,visible}:{document:Document;mode:string;visible:boolean}=$props();
 let data=$state<JsonValue>(clone(untrack(()=>document.data??{})));
 const form=$derived({...document,data});
</script>
<section aria-label="Form preview" hidden={!visible}><h2>Form preview</h2>{#if previewSafe(document)}<Runtime {form} {mode} onchange={(value)=>{if(JSON.stringify(value)!==JSON.stringify(data))data=clone(value);}}/>{:else}<p class="notice">This example contains executable extensions. Preview is unavailable until trusted preview isolation is implemented.</p>{/if}</section>
