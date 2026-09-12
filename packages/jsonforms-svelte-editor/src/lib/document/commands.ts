import type { InitialForm, JsonValue } from '../types.js';
export type ObjectValue = { [key: string]: JsonValue };
export type Node = ObjectValue & { type: string; elements?: Node[] };
export type Document = InitialForm & { uischema: Node };
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const object = (value: unknown): ObjectValue => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ObjectValue : {};
export const escapePointer = (value: string) => value.replace(/~/g, '~0').replace(/\//g, '~1');
export function resolve(schema: unknown, scope: unknown): ObjectValue {
 if (typeof scope !== 'string' || !scope.startsWith('#/')) return {};
 try { return object(decodeURIComponent(scope.slice(2)).split('/').reduce<unknown>((value, part) => object(value)[part.replace(/~1/g,'/').replace(/~0/g,'~')], schema)); } catch { return {}; }
}
export function fields(schema: unknown, prefix = '#'): { name: string; scope: string }[] {
 return Object.entries(object(object(schema).properties)).flatMap(([name, value]) => {
 const scope = `${prefix}/properties/${escapePointer(name)}`;
 return [{ name, scope }, ...fields(value, scope)];
 });
}
export function initialize(input: InitialForm): Document {
 if(!input || typeof input!=='object'||Array.isArray(input))throw new Error('The form model must be an object.');
 if(input.schema!==undefined && typeof input.schema!=='boolean' && (input.schema===null || typeof input.schema!=='object'||Array.isArray(input.schema)))throw new Error('Schema must be an object or boolean.');
 function validateNode(value:unknown):void {const n=object(value);if(typeof n.type!=='string')throw new Error('Every UI element needs a type.');if(n.elements!==undefined){if(!Array.isArray(n.elements))throw new Error('Layout elements must be an array.');n.elements.forEach(validateNode);}}
 if(input.uischema!==undefined)validateNode(input.uischema);
 const doc = clone(input);
 doc.schema ??= {type:'object',properties:{}};
 doc.uischema ??= { type:'VerticalLayout', elements: fields(doc.schema).filter(f => f.scope.split('/').length===3).map(f=>({type:'Control',scope:f.scope})) };
 return doc as Document;
}
export function at(root: Node, path: number[]): Node {
 return path.reduce((node,index) => { const child=node.elements?.[index]; if(!child) throw new Error('The selected element no longer exists.'); return child; },root);
}
export const containers = new Set(['VerticalLayout','HorizontalLayout','Group','Category','Categorization']);
export function accepts(parent: Node, child: Node) {
 return containers.has(parent.type) && (parent.type==='Categorization' ? child.type==='Category' : child.type!=='Category');
}
export function insert(doc: Document, parentPath: number[], node: Node): Document {
 const next=clone(doc), parent=at(next.uischema,parentPath);
 if(!accepts(parent,node)) throw new Error('Choose a compatible layout. Categories belong inside a categorization.');
 (parent.elements ??= []).push(clone(node)); return next;
}
export function remove(doc: Document, path: number[]): Document {
 if(!path.length) throw new Error('The root layout cannot be removed.');
 const next=clone(doc);at(next.uischema,path.slice(0,-1)).elements!.splice(path.at(-1)!,1);return next;
}
export function move(doc: Document, source: number[], target: number[]): Document {
 if(!source.length || source.every((part,index)=>target[index]===part)) throw new Error('An element cannot move into itself or its descendants.');
 const node=at(doc.uischema,source);
 if(!accepts(at(doc.uischema,target),node)) throw new Error('Choose a compatible layout.');
 const adjusted=[...target],parent=source.slice(0,-1),index=source.at(-1)!;
 if(parent.every((part,i)=>target[i]===part) && target.length>parent.length && target[parent.length]>index) adjusted[parent.length]!--;
 return insert(remove(doc,source),adjusted,node);
}
export function addPreset(doc: Document, target: number[], preset: string): Document {
 if(containers.has(preset)) return insert(doc,target,{type:preset,...(['Group','Category'].includes(preset)?{label:preset}:{}),elements:preset==='Categorization'?[{type:'Category',label:'New tab',elements:[]}]:[]});
 if(object(doc.schema).type!=='object') throw new Error('New fields currently require a root object schema.');
 const next=clone(doc),schema=object(next.schema),properties=object(schema.properties);
 const base=preset==='textarea'?'notes':preset==='number'?'number':preset==='checkbox'?'enabled':'text';
 let key=base,index=2;while(key in properties)key=`${base}${index++}`;
 properties[key]={type:preset==='number'?'number':preset==='checkbox'?'boolean':'string'};schema.properties=properties;
 return insert(next,target,{type:'Control',scope:`#/properties/${escapePointer(key)}`,...(preset==='textarea'?{options:{multi:true}}:{})});
}
export function updateProperties(doc: Document,path:number[],data: {label:string;multi:boolean;required:boolean}): Document {
 const next=clone(doc),node=at(next.uischema,path);
 if(data.label!==String(node.label??''))node.label=data.label;
 if(node.type==='Control') {
 const options=object(node.options);if(Boolean(options.multi)!==data.multi)node.options={...options,multi:data.multi};
 const scope=String(node.scope??''), parts=scope.split('/'), encoded=parts.at(-1)!;
 const parent=resolve(next.schema,parts.slice(0,-2).join('/') || '#');
 const owner=parts.length===3?object(next.schema):parent;
 const name=encoded.replace(/~1/g,'/').replace(/~0/g,'~');
 if(parts.at(-2)==='properties' && name in object(owner.properties)) {
 const required=Array.isArray(owner.required)?owner.required:[];
 if(data.required&&!required.includes(name))owner.required=[...required,name];
 if(!data.required&&required.includes(name))owner.required=required.filter(key=>key!==name);
 }
 }return next;
}
export function properties(doc:Document,node:Node) {
 const scope=String(node.scope??''),parts=scope.split('/');
 const owner=parts.length===3?object(doc.schema):resolve(doc.schema,parts.slice(0,-2).join('/'));
 return {label:String(node.label??''),multi:Boolean(object(node.options).multi),required:Array.isArray(owner.required)&&owner.required.includes(parts.at(-1)!.replace(/~1/g,'/').replace(/~0/g,'~'))};
}
/** Script-bearing repository extensions require a separate trusted preview policy. */
export function previewSafe(value: unknown): boolean {
 if(Array.isArray(value))return value.every(previewSafe);
 if(value && typeof value==='object')return Object.entries(value).every(([key,item])=> !(['tester','validate','template'].includes(key)&&typeof item==='string') && previewSafe(item));
 return true;
}
