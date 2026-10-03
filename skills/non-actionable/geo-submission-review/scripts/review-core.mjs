import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';

export const SPACES = {
  crypto:{main:'c9f267dcb0d270718c2a3c45a64afd32',datasets:'5908c73ad336472ccbd983491d2d17e4'},
  ai:{main:'41e851610e13a19441c4d980f2f2ce6b',datasets:'941964642f4d3e70ef48f54a3915277d'},
  health:{main:'52c7ae149838b6d47ce0f3b2a5974546',datasets:'44eb138f564fbed6ed9ce543de1b849c'},
  'world-affairs':{main:'89bd89bf28ff8a0963faf92a8c905e20',datasets:'2d48dbdab027c7b497799671d4ce52e2'},
  'us-politics':{main:'4582fbbee28a16589154f7e36f1ee3c5',datasets:'1b3d2963d14de99d4e440000125edb65'}
};
export const normalizeId = s => { const v=String(s??'').replaceAll('-','').toLowerCase(); if(!/^[a-f0-9]{32}$/.test(v))throw Error('Expected a full Geo ID');return v; };
const canonical = v => Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const hash = v => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export const stableId = key => {const h=hash(key).slice(0,32);return h.slice(0,12)+'5'+h.slice(13,16)+'a'+h.slice(17);};
export function atomicJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(temp,file);}
export function withLock(dir,fn){
  fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'.review.lock');let fd;
  try{fd=fs.openSync(file,'wx',0o600);}catch{throw Error('Review lock exists; inspect its owner before retrying.');}
  fs.writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
  return Promise.resolve().then(fn).finally(()=>{fs.closeSync(fd);fs.unlinkSync(file);});
}
export const emptyState = () => ({schemaVersion:1,spaces:{},cases:{},proposals:{},history:[]});
export function loadState(file){if(!fs.existsSync(file))return emptyState();const s=JSON.parse(fs.readFileSync(file,'utf8'));if(s.schemaVersion!==1)throw Error('Unsupported state version');return s;}
export function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
export const lagosDay = value => new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));

// Preserve the full operation stream; a compact entity summary cannot replay a revision.
export function snapshotProposal(proposal,raw){
  if(!Array.isArray(raw)||!raw.length||raw.some(r=>r.err||!Array.isArray(r.edit?.ops)))throw Error('Missing lossless edit snapshot: '+proposal.id);
  const snapshots=raw.map(r=>({cid:r.cid,edit:r.edit}));
  return {proposal:{...proposal,id:normalizeId(proposal.id),proposedBy:normalizeId(proposal.proposedBy)},snapshots,ordering:snapshots.length===1?'single-edit':'requires-explicit-order',hash:hash(snapshots)};
}
export function replayEdits(snapshots,order=null){
  if(snapshots.length>1){if(!order||order.length!==snapshots.length||new Set(order).size!==order.length||snapshots.some(s=>!order.includes(s.cid)))throw Error('Multiple edit payloads require an explicit verified order');snapshots=[...snapshots].sort((a,b)=>order.indexOf(a.cid)-order.indexOf(b.cid));}
  const entities={},relations={};
  for(const s of snapshots)for(const op of s.edit.ops){
    if(['createEntity','updateEntity'].includes(op.type)){
      const id=normalizeId(op.id);const e=entities[id]??={id,deleted:false,values:{},unset:[]};
      e.deleted=false;
      for(const v of op.set??op.values??[])e.values[normalizeId(v.property??v.propertyId)]=v.value;
      for(const u of op.unset??[]){const p=normalizeId(typeof u==='string'?u:u.property??u.propertyId);delete e.values[p];e.unset.push(p);}
    }else if(op.type==='deleteEntity'){
      const id=normalizeId(op.id);entities[id]={...(entities[id]??{id,values:{},unset:[]}),deleted:true};
    }else if(op.type==='createRelation')relations[normalizeId(op.id)]={...op,deleted:false};
    else if(op.type==='deleteRelation'){const id=normalizeId(op.id);relations[id]={...(relations[id]??{id}),deleted:true};}
    else throw Error('Operation requires explicit handling: '+op.type);
  }
  return {entities,relations};
}
export function submittedText(state,ref){
  const record=state.proposals[normalizeId(ref.proposalId)];if(!record)throw Error('Original reference is outside the captured proposals');
  const matches=[];
  for(const s of record.snapshots){if(ref.cid&&ref.cid!==s.cid)continue;
    for(const [i,op] of s.edit.ops.entries()){if(ref.opIndex!==undefined&&ref.opIndex!==i)continue;
      if(!['createEntity','updateEntity'].includes(op.type)||normalizeId(op.id)!==normalizeId(ref.entityId))continue;
      for(const v of op.set??op.values??[])if(normalizeId(v.property??v.propertyId)===normalizeId(ref.propertyId)){
        const text=typeof v.value==='string'?v.value:v.value?.value;
        if(typeof text==='string')matches.push(text);
      }
    }
  }
  if(matches.length!==1)throw Error('Original reference must identify exactly one submitted text value; use cid/opIndex');
  return matches[0];
}

const OUTCOMES=new Set(['meets_requirements','needs_correction','does_not_meet_requirements','unresolved']);
const KINDS=new Set(['news','x','blog','fact-check','organize-claims']);
function eligibleIds(items,kind){const names={news:['News story','News'],x:['Post','Tweet'],blog:['Blog post'], 'fact-check':['Claim'],'organize-claims':['Claim']};return [...new Set(items.filter(i=>names[kind]?.includes(i.kind)).map(i=>normalizeId(i.id)))];}
export function assemble(state,intake,config){
  const {space,manifest,rawEdits,specs,items=[],runStatus}=intake;
  if(!SPACES[space]||runStatus?.state!=='complete'||runStatus?.complete!==true)throw Error('Intake must have a complete run receipt');
  if(runStatus.mode==='selected_replay'&&config.allowSelectedReplay!==true)throw Error('Selected replay requires explicit configuration; it cannot certify discovery coverage');
  const scope=config.spaces?.[space];if(!scope)throw Error('Space configuration missing');
  const partition=(p)=>{
    const explicit=scope.assignments?.[p.id];
    if(explicit)return explicit;
    if(p.bounties.length!==1)return null;
    return [{bountyId:p.bounties[0].id}];
  };
  const newCases=new Set(),changedCases=new Set(),identification=[...(state.spaces[space]?.identification??[])].filter(r=>!manifest.some(p=>normalizeId(p.id)===r.proposalId));
  const sorted=[...manifest].sort((a,b)=>a.createdEpoch-b.createdEpoch||a.id.localeCompare(b.id));
  for(const p0 of sorted){
    const p={...p0,id:normalizeId(p0.id),proposedBy:normalizeId(p0.proposedBy)};
    const disposition=scope.dispositions?.[p.id];
    if(disposition&&!disposition.evidence?.length)throw Error('Non-bounty disposition requires evidence');
    if(!p.contentUris?.length){state.proposals[p.id]={...(state.proposals[p.id]??{}),proposal:p,items:items.filter(i=>i.pid===p.id),snapshots:[],hash:hash(p.actions??[])};identification.push({proposalId:p.id,reason:'no_edit_payload',actions:p.actions??[]});continue;}
    const record=snapshotProposal(p,rawEdits[p.id]);
    const previous=state.proposals[p.id];
    if(previous&&previous.hash!==record.hash)throw Error('Immutable proposal payload changed; reconcile before overwriting '+p.id);
    state.proposals[p.id]={...previous,...record,items:items.filter(i=>i.pid===p.id)};
    const seed=config.reviewHistory?.[p.id];
    if(seed){if(!seed.evidence?.length)throw Error('History seed requires exact-proposal evidence');state.proposals[p.id].priorReview=seed;}
    if(disposition){state.proposals[p.id].disposition=disposition;continue;}
    let partitionRows=partition(p);
    if(!partitionRows?.length){identification.push({proposalId:p.id,reason:p.bounties.length?'mixed_bounty_requires_item_assignment':'bounty_unidentified'});continue;}
    if(p.bounties.length>1&&!partitionRows.every(r=>r.itemIds?.length)){identification.push({proposalId:p.id,reason:'mixed_bounty_requires_item_assignment'});continue;}
    const assigned=new Set();
    for(const row of partitionRows){
      const bountyId=normalizeId(row.bountyId),profile=scope.bountyProfiles?.[bountyId],spec=specs[bountyId];
      if(!profile||!spec?.complete){identification.push({proposalId:p.id,bountyId,reason:!profile?'bounty_profile_needed':'full_bounty_spec_unavailable'});continue;}
      if(!['bespoke','routine'].includes(profile.family)||profile.family==='routine'&&!KINDS.has(profile.kind))throw Error('Invalid bounty profile');
      let replay;
      try{replay=replayEdits(record.snapshots,scope.editOrder?.[p.id]);}
      catch(error){identification.push({proposalId:p.id,bountyId,reason:'operation_or_order_needs_review',detail:error.message});continue;}
      const touched=new Set([...Object.keys(replay.entities),...Object.values(replay.relations).filter(r=>r.from).map(r=>normalizeId(r.from))]);
      const relevant=row.itemIds?.map(normalizeId)??(profile.family==='routine'?eligibleIds(items.filter(i=>i.pid===p.id),profile.kind):Object.keys(replay.entities));
      if(relevant.some(id=>!touched.has(id)))throw Error('Assigned item is not touched by the submitted edit');
      if(!p.bounties.some(b=>normalizeId(b.id)===bountyId)&&!row.evidence)throw Error('Untagged bounty assignment requires recorded evidence');
      if(!relevant.length){identification.push({proposalId:p.id,bountyId,reason:'item_scope_needed'});continue;}
      for(const id of relevant){if(assigned.has(id))throw Error('Same item assigned twice within proposal '+p.id);assigned.add(id);}
      let suffix=row.caseKey;
      if(!suffix&&profile.family==='bespoke'&&profile.singleDeliverable===true)suffix='deliverable';
      if(!suffix&&profile.family==='routine')suffix=lagosDay(p.createdAt);
      if(!suffix){identification.push({proposalId:p.id,bountyId,reason:'distinct_deliverable_key_needed'});continue;}
      // Repairs of an existing routine item update its case, even on a later day.
      const owners=profile.family==='routine'?Object.values(state.cases).filter(c=>c.space===space&&c.curatorId===p.proposedBy&&c.bountyId===bountyId&&relevant.some(id=>c.itemIds.includes(id))):[];
      if(!row.caseKey&&owners.length){
        if(owners.length!==1||!relevant.every(id=>owners[0].itemIds.includes(id))){identification.push({proposalId:p.id,bountyId,reason:'repair_and_new_items_require_partition'});continue;}
        suffix=owners[0].caseKey;
      }
      const key=[space,p.proposedBy,bountyId,suffix].join(':'),id=stableId('submission-case:'+key);
      const old=state.cases[id];
      const next=old??{id,key,caseKey:suffix,space,curatorId:p.proposedBy,curatorName:p.curator,bountyId,bountyName:spec.name,family:profile.family,kind:profile.kind??'bespoke',proposalIds:[],itemIds:[],revisions:[],editorDecisions:[],delivery:{status:'not_prepared'}};
      if(!old)newCases.add(id);
      next.proposalIds=[...new Set([...next.proposalIds,p.id])];next.proposalRefs={...(next.proposalRefs??{}),[p.id]:{spaceId:p.spaceId??(p.space==='main'?SPACES[space].main:SPACES[space].datasets),createdAt:p.createdAt}};next.itemIds=[...new Set([...next.itemIds,...relevant])];
      next.spec=spec;next.profile=profile;next.editOrders={...(next.editOrders??{}),[p.id]:scope.editOrder?.[p.id]??null};
      if(seed)next.historySeeds={...(next.historySeeds??{}),[p.id]:seed};
      const fp=hash({proposals:next.proposalIds.map(pid=>[pid,state.proposals[pid].hash]),items:next.itemIds,spec:spec.contentHash,profile});
      if(next.fingerprint!==fp){if(next.fingerprint)next.revisions.push({fingerprint:next.fingerprint,review:next.review??null,delivery:next.delivery});next.fingerprint=fp;
        next.status=next.proposalIds.every(pid=>state.proposals[pid].priorReview)?'prior_review_recorded':'needs_review';
        next.delivery={...next.delivery,status:next.delivery.reportId?'update_draft_needed':'not_prepared'};changedCases.add(id);}
      state.cases[id]=next;
    }
  }
  state.spaces[space]={...(state.spaces[space]??{}),discoveryCutoff:runStatus.mode==='selected_replay'?state.spaces[space]?.discoveryCutoff??null:runStatus.window.until,identification,latestIntake:config.intakePath??null};
  return {newCases:[...newCases],changedCases:[...changedCases],identification,pendingCases:Object.values(state.cases).filter(c=>c.space===space&&['needs_review','review_unresolved'].includes(c.status)).map(c=>c.id)};
}

export function recordReview(state,review){
  const c=state.cases[review.caseId];if(!c)throw Error('Unknown case');
  if(review.fingerprint!==c.fingerprint)throw Error('Review is stale for the current case');
  if(!OUTCOMES.has(review.outcome))throw Error('Invalid review outcome');
  if(!review.coverage?.length||!review.requirements?.length||!review.checkedAt)throw Error('Review must document item coverage, requirements and evidence cutoff');
  if(c.itemIds.some(id=>!review.coverage.some(r=>r.itemId===id)))throw Error('Review omits an item in the agreed case scope');
  if(new Set(review.coverage.map(r=>r.itemId)).size!==review.coverage.length||review.coverage.some(r=>!c.itemIds.includes(r.itemId)))throw Error('Coverage must contain each scoped item once');
  if(!Number.isFinite(Date.parse(review.checkedAt)))throw Error('Invalid evidence cutoff');
  for(const r of [...review.coverage,...review.requirements])if(!OUTCOMES.has(r.outcome)||!r.evidence?.length)throw Error('Each item/requirement needs an assessment and evidence or a concrete gap');
  const findings=review.findings??[];if(findings.length>5)throw Error('Show at most five distinct priority problems');
  for(const f of findings){
    if(!f.issue||!f.citations?.length||!f.evidenceDetail||!f.itemId||!c.itemIds.includes(f.itemId))throw Error('Incomplete finding or item outside case');
    if(f.originalRef){if(!c.proposalIds.includes(f.originalRef.proposalId))throw Error('Original text comes from another case');if(submittedText(state,f.originalRef)!==f.original)throw Error('Original text is not verbatim');if(!f.excerpt||!f.original.includes(f.excerpt))throw Error('Disputed excerpt is not verbatim');}
    else if(f.missingField!==true||!f.missingRequirement||f.excerpt)throw Error('Missing-field findings need an explicit requirement and no invented excerpt');
    for(const citation of f.citations)if(!/^https:\/\//.test(citation.url)||!citation.locator||!Number.isFinite(Date.parse(citation.retrievedAt)))throw Error('Evidence link needs URL, locator and retrieval time');
  }
  if(c.review)c.reviewHistory=[...(c.reviewHistory??[]),c.review];
  c.review={...review,findings,agentAssessment:true};c.status=review.outcome==='unresolved'?'review_unresolved':'reviewed';
  if(c.delivery?.receipt)c.deliveryHistory=[...(c.deliveryHistory??[]),structuredClone(c.delivery)];
  c.delivery={...c.delivery,status:'draft_ready'};return c;
}

const esc = s => String(s??'').replaceAll('|','\\|').replaceAll('\n','<br>');
export function reportDraft(c){
  if(!c.review||c.review.fingerprint!==c.fingerprint)throw Error('No current recorded review');
  const title=c.curatorName+' — '+c.bountyName+' — submission review · '+c.caseKey;
  const proposalLinks=c.proposalIds.map(id=>`- [Proposal ${id.slice(0,8)}](https://www.geobrowser.io/space/${c.proposalRefs[id].spaceId}/governance?proposalId=${id})`);
  const rows=c.review.findings.map(f=>[f.itemUrl??f.itemId,f.originalRef?f.original:'Not supplied — '+f.missingRequirement,f.excerpt||'Not applicable — missing field',f.issue,f.citations.map(x=>`[${x.locator}](${x.url})`).join('<br>'),f.evidenceDetail]);
  const table=rows.length?'| Entity | Full original statement | Exact excerpt under review | Issue | Citations for quality checks | Relevant quote or evidence detail |\n|---|---|---|---|---|---|\n'+rows.map(r=>'| '+r.map(esc).join(' | ')+' |').join('\n'):'No supported actionable issue was established in the recorded scope.';
  return {schemaVersion:1,caseId:c.id,fingerprint:c.fingerprint,targetSpaceId:SPACES[c.space].datasets,pageId:c.delivery?.reportId??stableId('submission-report:'+c.id),title,publicationStatus:'draft_only',review:c.review,
    markdown:`# ${title}\n\nBounty: [${c.bountyName}](https://www.geobrowser.io/space/${c.spec.spaceId}/${c.bountyId})\n\nAgent assessment: ${c.review.outcome}. Evidence checked: ${c.review.checkedAt}.\n\n## Proposals reviewed\n\n${proposalLinks.join('\n')}\n\n## Review feedback\n\n${table}\n`,
    findings:rows,editorDecisions:c.editorDecisions};
}

export function recordDecision(state,decision){
  const c=state.cases[decision.caseId];if(!c)throw Error('Unknown case');
  if(!decision.id||!decision.evidence?.length||!decision.recordedAt||!decision.kind)throw Error('Editor decision needs stable ID, kind, date and explicit authorization evidence');
  const old=c.editorDecisions.find(d=>d.id===decision.id);if(old&&hash(old)!==hash(decision))throw Error('Existing decision differs; add a superseding decision instead');
  if(!old)c.editorDecisions.push(decision);return c;
}
export function caseEvidence(state,caseId){
  const c=state.cases[caseId];if(!c)throw Error('Unknown case');
  const records=c.proposalIds.map(id=>state.proposals[id]).sort((a,b)=>a.proposal.createdEpoch-b.proposal.createdEpoch||a.proposal.id.localeCompare(b.proposal.id));
  const snapshots=records.flatMap(r=>(r.snapshots.length>1?replayOrder(r,c):r.snapshots).map((s,i)=>({...s,cid:r.proposal.id+':'+i+':'+s.cid})));
  return {case:c,proposals:records,submittedProjection:replayEdits(snapshots,snapshots.map(s=>s.cid)),projectionLimit:'Submitted operations only; unchanged fields require a separately captured baseline. Current graph state is not the historical baseline.'};
}
function replayOrder(r,c){const order=c.editOrders?.[r.proposal.id];replayEdits(r.snapshots,order);return [...r.snapshots].sort((a,b)=>order.indexOf(a.cid)-order.indexOf(b.cid));}

export function recordDelivery(state,delivery){
  const c=state.cases[delivery.caseId];if(!c)throw Error('Unknown case');
  if(delivery.fingerprint!==c.fingerprint)throw Error('Delivery does not match current report revision');
  if(!['submitted','verified','failed','unknown'].includes(delivery.status)||!delivery.receipt?.evidence?.length)throw Error('Delivery needs status and explicit receipt evidence');
  if(delivery.status==='verified'&&(!delivery.reportId||!delivery.receipt.readbackAt||!delivery.receipt.url))throw Error('Verified delivery requires report ID and successful readback');
  c.deliveryHistory=[...(c.deliveryHistory??[]),c.delivery];
  c.delivery={...c.delivery,...delivery};return c;
}

export function prepareReportDraft(c,draftFile){
  const draft=reportDraft(c), fingerprint=hash(draft);
  const changed=c.delivery?.draftFingerprint!==fingerprint;
  if(changed){
    if(c.delivery?.receipt)c.deliveryHistory=[...(c.deliveryHistory??[]),structuredClone(c.delivery)];
    c.delivery={...c.delivery,status:'draft_ready',draftFingerprint:fingerprint,draftFile};
  }else c.delivery={...c.delivery,draftFile};
  return {draft,changed};
}
