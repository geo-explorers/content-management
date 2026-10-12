import {test,expect} from 'bun:test';
import {deleteEntity} from '../src/entity_ops.ts';
import {EXCLUDED_VALUE_PROPERTY_IDS,EXCLUDED_RELATION_TYPE_IDS,RANK_POSITION_RELATION_TYPE_ID,RANK_POSITION_VALUE_PROPERTY_ID,PROPERTIES} from '../src/constants.ts';
const hex=(x:any)=>typeof x==='string'?x:Buffer.from(x).toString('hex');
test('space-scoped deletion preserves generated ranking data while removing ordinary topic assertions',async()=>{
 const regular='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',system='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',entity='cccccccccccccccccccccccccccccccc';
 const ops:any[]=await deleteEntity({entityId:entity,spaceId:'41e851610e13a19441c4d980f2f2ce6b',dryRun:true,skipOrphanCleanup:true,keepIncomingRelations:true,prefetchedEntityData:{values:[{propertyId:PROPERTIES.name},{propertyId:RANK_POSITION_VALUE_PROPERTY_ID}],relations:[{id:regular,typeId:PROPERTIES.types,toEntityId:'5ef5a5860f274d8e8f6c59ae5b3e89e2'},{id:system,typeId:RANK_POSITION_RELATION_TYPE_ID,toEntityId:'dddddddddddddddddddddddddddddddd'}]} as any});
 expect(EXCLUDED_VALUE_PROPERTY_IDS.has(RANK_POSITION_VALUE_PROPERTY_ID)).toBe(true);
 expect(EXCLUDED_RELATION_TYPE_IDS.has(RANK_POSITION_RELATION_TYPE_ID)).toBe(true);
 expect(ops.filter(o=>o.type==='deleteRelation').map(o=>hex(o.id))).toEqual([regular]);
 expect(ops.flatMap(o=>(o.unset??[]).map((v:any)=>hex(v.property)))).toEqual([PROPERTIES.name]);
});
