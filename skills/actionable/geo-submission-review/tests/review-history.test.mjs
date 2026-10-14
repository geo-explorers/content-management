import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {recordReview,reportDraft,reviewContentHash,emptyState} from '../scripts/review-core.mjs';
import {prepareHistoryEntry,recordHistoryReceipt,historyKey} from '../scripts/review-history.mjs';
const id=n=>n.toString(16).padStart(32,'0');
const config={dataSourceId:'12345678-1234-1234-1234-123456789abc',databaseUrl:'https://example.org/history',lookupViewUrl:'view://12345678-1234-1234-1234-123456789abc'};
function fixture(){
  const c={id:id(1),fingerprint:'current',curatorId:id(2),curatorName:'Curator',space:'crypto',bountyId:id(3),bountyName:'Posts',spec:{spaceId:id(4)},proposalIds:[id(5)],proposalRefs:{[id(5)]:{spaceId:id(4)}},itemIds:[id(6)],caseKey:'2026-10-13',review:{fingerprint:'current',outcome:'needs_correction',checkedAt:'2026-10-13T12:00:00Z',coverage:[{itemId:id(6),outcome:'needs_correction',evidence:['Fixture requirement']}],requirements:[{criterion:'Attribution',outcome:'needs_correction',evidence:['Fixture specification']}],feedbackPolicy:'error_types_v1',verifiedErrorKinds:['Missing author'],findings:[{itemId:id(6),missingField:true,missingRequirement:'Author relation',excerpt:'',issue:'The author is missing.',errorKind:'Missing author',processQuestion:'How did you check the author before submitting?',repairEligible:true,repairRequest:'Please link the original author.',prevention:'Before submitting, compare the author relation with the original post.',citations:[{url:'https://example.org/post',locator:'Byline',retrievedAt:'2026-10-13T12:00:00Z'}],evidenceDetail:'Fixture author named in byline.'}]}};
  c.delivery={status:'verified',fingerprint:c.fingerprint,reviewContentHash:reviewContentHash(c),receipt:{url:'https://example.org/geo-report',readbackAt:'2026-10-13T13:00:00Z',evidence:['Indexed report and full finding readback']}};return c;
}
const input=c=>({publishedAt:'2026-10-13T13:00:00Z',feedbackSnapshot:'The author is missing. How did you check the author before submitting? Please link the original author. Before submitting, compare the author relation with the original post.',snapshotReviewContentHash:reviewContentHash(c),publicationEvidence:['Verified published feedback capture']});
const receipt=(c,patch={})=>({caseId:c.id,fingerprint:c.fingerprint,key:historyKey(c),snapshotHash:'captured-hash',publishedAt:'2026-10-13T13:00:00Z',status:'unknown',recordedAt:'2026-10-13T13:05:00Z',evidence:['Saved intent journal'],...patch});

test('more than five error types survive recording and recipient rendering, without duplicate examples',()=>{
  const c=fixture(),s=emptyState();s.cases[c.id]=c;
  const r={...structuredClone(c.review),caseId:c.id};r.verifiedErrorKinds=Array.from({length:7},(_,i)=>'Verified error type '+i);r.findings=r.verifiedErrorKinds.map(errorKind=>({...r.findings[0],errorKind,issue:errorKind}));
  recordReview(s,r);const d=reportDraft(c);assert.equal(d.findings.length,7);assert.match(d.markdown,/How did you check the author/);assert.match(d.markdown,/Please link the original author/);assert.match(d.markdown,/Before submitting/);
  assert.throws(()=>recordReview(s,{...r,findings:r.findings.slice(0,6)}),/every verified error type/);
  assert.throws(()=>recordReview(s,{...r,findings:[...r.findings.slice(0,6),r.findings[0]]}),/every verified error type/);
});
test('process questions and prevention are required; futile repairs are rejected',()=>{
  const c=fixture(),s=emptyState();s.cases[c.id]=c;const r={...structuredClone(c.review),caseId:c.id};
  for(const field of ['processQuestion','prevention']){const bad=structuredClone(r);delete bad.findings[0][field];assert.throws(()=>recordReview(s,bad),/process question/);}
  const bad=structuredClone(r);bad.findings[0].repairEligible=false;assert.throws(()=>recordReview(s,bad),/futile repairs/);
  delete bad.findings[0].repairRequest;assert.doesNotThrow(()=>recordReview(s,bad));assert.equal(reportDraft(c).markdown.includes('Please link the original author'),false);assert.match(reportDraft(c).markdown,/Before submitting/);
});
test('history payload retains actual date, all submission links and feedback, without private scoring',()=>{
  const c=fixture();c.review.scoring={rate:999,ruleSource:'PRIVATE_SCORING_SENTINEL'};c.editorDecisions=[{kind:'private',evidence:['PRIVATE_APPROVAL_SENTINEL']}];
  const out=prepareHistoryEntry(c,input(c),config),p=out.create.pages[0].properties;
  assert.equal(out.lookup.mode,'view');assert.equal(out.lookupArchived.is_archived,true);assert.equal(out.lookup.view_url,config.lookupViewUrl);
  assert.equal(p.Curator,'Curator');assert.equal(p['Curator ID'],c.curatorId);assert.equal(p['date:Review date:start'],'2026-10-13T13:00:00.000Z');assert.equal(p['Geo report'],c.delivery.receipt.url);assert.match(p.Submission,/proposalId=/);assert.match(out.create.pages[0].content,/How did you check/);assert.match(out.create.pages[0].content,/does not establish that a Discord message was sent/);assert.equal(JSON.stringify(out).includes('PRIVATE_'),false);
});
test('scan timestamps, private scoring and citation refreshes do not create another review key',()=>{
  const c=fixture(),key=historyKey(c);c.review.checkedAt='2026-10-14T12:00:00Z';c.review.scoring={rate:10};c.review.findings[0].citations[0].retrievedAt='2026-10-14T12:00:00Z';assert.equal(historyKey(c),key);
  c.review.findings[0].prevention='A substantive new prevention instruction.';assert.notEqual(historyKey(c),key);
});
test('no-issue and no-bounty reviews produce truthful logs without manufactured findings',()=>{
  const c=fixture();c.bountyId=null;c.bountyName=null;c.review.outcome='meets_requirements';c.review.findings=[];c.review.verifiedErrorKinds=[];c.delivery.reviewContentHash=reviewContentHash(c);
  const out=prepareHistoryEntry(c,{...input(c),feedbackSnapshot:'No supported issue was found.'},config);assert.equal(out.create.pages[0].properties.Bounty,'No formal bounty');assert.equal(out.create.pages[0].properties['Bounty URL'],null);assert.equal(out.create.pages[0].properties['Error types'],'');
});
test('unfinished, stale or unverified reviews cannot produce a history create payload',()=>{
  const c=fixture();for(const patch of [{status:'unknown'},{fingerprint:'older'},{reviewContentHash:'older'}])assert.throws(()=>prepareHistoryEntry({...c,delivery:{...c.delivery,...patch}},input(c),config));
  assert.throws(()=>prepareHistoryEntry(c,{...input(c),snapshotReviewContentHash:'older'},config),/snapshot/);assert.throws(()=>prepareHistoryEntry(c,{...input(c),publishedAt:null},config),/publication date/);assert.throws(()=>prepareHistoryEntry(c,input(c),{}),/not configured/);
});
test('unknown log outcomes require reconciliation; verified reruns are idempotent',()=>{
  const c=fixture(),s=emptyState();s.cases[c.id]=c;recordHistoryReceipt(s,receipt(c));assert.equal(prepareHistoryEntry(c,input(c),config).status,'reconciliation_needed');
  recordHistoryReceipt(s,receipt(c,{status:'verified',url:'https://example.org/history-row',readbackAt:'2026-10-13T13:06:00Z'}));const before=structuredClone(c.curatorReviewLog);recordHistoryReceipt(s,receipt(c,{status:'verified',url:'https://example.org/history-row',readbackAt:'2026-10-13T13:07:00Z'}));assert.deepEqual(c.curatorReviewLog,before);assert.equal(prepareHistoryEntry(c,input(c),config).status,'already_logged');
  assert.throws(()=>recordHistoryReceipt(s,receipt(c,{status:'verified',url:'https://example.org/duplicate',readbackAt:'2026-10-13T13:08:00Z'})),/Conflicting/);
});
test('positive no-creation evidence permits retry and preserves the journaled snapshot/date',()=>{
  const c=fixture(),s=emptyState();s.cases[c.id]=c;recordHistoryReceipt(s,receipt(c));
  assert.throws(()=>recordHistoryReceipt(s,receipt(c,{snapshotHash:'different'})),/snapshot/);assert.throws(()=>recordHistoryReceipt(s,receipt(c,{publishedAt:'2026-10-14T13:00:00Z'})),/date/);
  assert.throws(()=>recordHistoryReceipt(s,receipt(c,{status:'not_created'})),/positive no-creation/);
  recordHistoryReceipt(s,receipt(c,{status:'not_created',outcome:'verified_not_created',reconciledAt:'2026-10-13T13:10:00Z'}));assert.equal(prepareHistoryEntry(c,input(c),config).status,'prepared');
});
test('older pending log can reconcile after a case revision without claiming the new review was logged',()=>{
  const c=fixture(),s=emptyState();s.cases[c.id]=c;const old=receipt(c);recordHistoryReceipt(s,old);c.fingerprint='revised';c.review.fingerprint='revised';c.review.findings[0].issue='New finding';
  recordHistoryReceipt(s,{...old,status:'verified',url:'https://example.org/old-row',readbackAt:'2026-10-14T13:00:00Z'});assert.notEqual(c.curatorReviewLog.at(-1).key,historyKey(c));assert.equal(c.curatorReviewLog.at(-1).fingerprint,'current');
});

test('repeat reports surface missing and interrupted logging without reopening Geo publication',()=>{
  const c=fixture(),s=emptyState();s.cases[c.id]=c;
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'history-queue-')),stateDir=path.join(dir,'state'),out=path.join(dir,'out');fs.mkdirSync(stateDir);
  const run=()=>{fs.writeFileSync(path.join(stateDir,'state.json'),JSON.stringify(s));const result=spawnSync(process.execPath,[new URL('../scripts/review.mjs',import.meta.url).pathname,'reports','--state',stateDir,'--out',out],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return JSON.parse(fs.readFileSync(path.join(out,'workflow-status.json')));};
  const first=run();assert.equal(first.drafts.length,0);assert.equal(first.historyLoggingPending[0].status,'needs_logging');assert.equal(c.delivery.status,'verified');
  recordHistoryReceipt(s,receipt(c));const pending=run();assert.equal(pending.drafts.length,0);assert.equal(pending.historyLoggingPending.length,1);assert.equal(pending.historyLoggingPending[0].status,'reconciliation_needed');
  recordHistoryReceipt(s,receipt(c,{status:'verified',url:'https://example.org/row',readbackAt:'2026-10-13T13:10:00Z'}));assert.deepEqual(run().historyLoggingPending,[]);
});
