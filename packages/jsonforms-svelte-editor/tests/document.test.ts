import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialize, addPreset, insert, move, remove, fields, resolve, updateProperties } from '../src/lib/document/commands.ts';

test('adding a textarea is immutable and creates a field and binding together',()=>{
 const input={schema:{type:'object',properties:{notes:{type:'string'}}},custom:{keep:true}};
 const doc=initialize(input), next=addPreset(doc,[],'textarea');
 assert.equal(fields(doc.schema).length,1);assert.equal(fields(next.schema).length,2);
 assert.equal(next.uischema.elements?.at(-1)?.scope,'#/properties/notes2');
 assert.deepEqual(next.uischema.elements?.at(-1)?.options,{multi:true});
 assert.deepEqual(next.custom,{keep:true});assert.equal('uischema' in input,false);
});
test('escaped nested fields bind and required belongs to the owning object',()=>{
 const doc=initialize({schema:{type:'object',properties:{'a/b':{type:'object',properties:{'c~d':{type:'string'}}}}}});
 const scope=fields(doc.schema).at(-1)!.scope;
 assert.equal(scope,'#/properties/a~1b/properties/c~0d');assert.equal(resolve(doc.schema,scope).type,'string');
 const bound=insert(doc,[],{type:'Control',scope});
 const changed=updateProperties(bound,[1],{label:'Nested',multi:true,required:true});
 assert.deepEqual(resolve(changed.schema,'#/properties/a~1b').required,['c~d']);
});
test('moves adjust shifted destination indexes and reject cycles',()=>{
 let doc=initialize({});doc=addPreset(doc,[],'text');doc=addPreset(doc,[],'Group');
 const moved=move(doc,[0],[1]);assert.equal(moved.uischema.elements?.[0].type,'Group');assert.equal(moved.uischema.elements?.[0].elements?.[0].type,'Control');
 assert.throws(()=>move(moved,[0],[0,0]));assert.deepEqual(remove(moved,[0]).schema,moved.schema);
});
test('categorization accepts only categories and remains editable when empty',()=>{
 let doc=addPreset(initialize({}),[],'Categorization');
 assert.throws(()=>addPreset(doc,[0],'text'));
 doc=remove(doc,[0,0]);assert.deepEqual(doc.uischema.elements?.[0].elements,[]);
 doc=addPreset(doc,[0],'Category');assert.equal(doc.uischema.elements?.[0].elements?.length,1);
});
test('malformed source does not initialize a crashable canvas',()=>{
 assert.throws(()=>initialize({uischema:{type:'Group',elements:['bad']}}));
});
