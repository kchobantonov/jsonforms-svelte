import type { EditorElement, InitialForm } from '@chobantonov/jsonforms-svelte-editor';
import './style.css';
const resources=import.meta.glob('../../../packages/jsonforms-svelte-demo-common/src/lib/examples/*/*.json',{eager:true,import:'default'}) as Record<string,unknown>;
const examples=new Map<string,InitialForm>();
for(const [path,value] of Object.entries(resources)){
 const match=path.match(/examples\/([^/]+)\/(schema|uischema|uischemas|data|i18n)\.json$/);
 if(!match)continue;const [,name,part]=match;const form=examples.get(name)??{};form[part==='i18n'?'translations':part]=value as InitialForm['data'];examples.set(name,form);
}
await import(/* @vite-ignore */ new URL(`${import.meta.env.BASE_URL}editor/jsonforms-svelte-editor.js`, document.baseURI).href);
await customElements.whenDefined('jsonforms-svelte-editor');
const select=document.querySelector<HTMLSelectElement>('#example')!;
for(const [name,form] of examples){if(!form.schema||!form.uischema)continue;const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option);}
let dirty=false;let draft=false;let current='main';let editor:EditorElement;
function load(name:string){editor=document.createElement('jsonforms-svelte-editor');editor.documentId=name;editor.initialForm=structuredClone(examples.get(name)!);editor.editorMode=document.querySelector<HTMLSelectElement>('#mode')!.value as EditorElement['editorMode'];editor.addEventListener('document-change',()=>dirty=true);editor.addEventListener('draft-change',(event)=>draft=(event as CustomEvent).detail.dirty);document.querySelector('#editor-host')!.replaceChildren(editor);dirty=false;draft=false;current=name;select.value=name;}
load('main');
select.addEventListener('change',()=>{if((dirty||draft)&&!confirm('Discard edits and load another example?')){select.value=current;return;}load(select.value);});
document.querySelector<HTMLSelectElement>('#mode')!.addEventListener('change',(event)=>{editor.editorMode=(event.target as HTMLSelectElement).value as EditorElement['editorMode'];});
window.addEventListener('beforeunload',(event)=>{if(dirty||draft){event.preventDefault();event.returnValue='';}});
