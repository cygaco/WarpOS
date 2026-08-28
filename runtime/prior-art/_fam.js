const fs=require('fs');
const lines=fs.readFileSync('_skill-merged.txt','utf8').trim().split(/\r?\n/);
const F=[
 ['sleep-dream', s=>s.startsWith('sleep:')],
 ['memory-learning', s=>s.startsWith('learn:')||s==='memory:verify'||s==='playbook:add'||s.startsWith('fav:')],
 ['beta-judgment', s=>s.startsWith('beta:')||s==='scan:sprint-beta-honesty'],
 ['reasoning-frameworks', s=>s.startsWith('reasoning:')||s.startsWith('fix:')||s==='bootstrap:ponder'],
 ['karpathy-autoresearch', s=>s.startsWith('karpathy:')],
 ['session-state-handoff', s=>['session:checkpoint','session:dump','session:end','session:handoff','session:history','session:recap','session:resume','session:takenotes'].includes(s)],
 ['cross-session-inbox', s=>['session:read','session:write'].includes(s)],
 ['permissions-turbo', s=>['session:turbo','turbo','permissions:authorized','scan:turbo-spend'].includes(s)],
 ['modes-teams', s=>s.startsWith('mode:')||['scan:adhoc-team-hygiene','scan:adhoc-fail-override'].includes(s)],
 ['agent-roster', s=>s.startsWith('agents:')||['scan:role-parity','scan:greek-office-parity','scan:provider-agent-tool-parity'].includes(s)],
 ['model-routing-dispatch', s=>s.startsWith('models:')||['panel:models','scan:model-chain','scan:dispatch-routing-parity','scan:node-procs'].includes(s)],
 ['sprint-lifecycle', s=>s.startsWith('sprint:')||['scan:sprint-hook-coverage','scan:sprint-manager-consult','scan:ac-coverage','scan:planning-principles','scan:requirements'].includes(s)],
 ['oneshot-build', s=>s.startsWith('oneshot:')],
 ['epic-tracking', s=>s.startsWith('epic:')],
 ['enforced-trackers', s=>s.startsWith('trackers:')],
 ['roadmap', s=>s.startsWith('roadmap:')||['panel:roadmap','scan:roadmap-trace'].includes(s)],
 ['enforcement-debt', s=>s.startsWith('enforcement:')||['maps:enforcements','scan:skill-hook-coverage'].includes(s)],
 ['issue-register', s=>s.startsWith('issues:')||['scan:issues','scan:regressions','scan:patterns'].includes(s)],
 ['warpos-distribution-integrity', s=>s.startsWith('scan:warpos-')||['scan:framework-purity','scan:framework-views-fresh','check:framework-purity','check:framework-views-fresh'].includes(s)],
 ['warp-distribution', s=>s.startsWith('warp:')||s.startsWith('manifest:')||['scan:install','check:install','scan:version-coherence'].includes(s)],
 ['paths-registry', s=>s.startsWith('paths:')],
 ['hooks-mgmt', s=>s.startsWith('hooks:')||s==='maps:hooks'],
 ['skills-meta', s=>s.startsWith('skills:')||s.startsWith('etc:')||['maps:skills','scan:etc-harness','scan:scan-coverage'].includes(s)],
 ['research', s=>s.startsWith('research:')],
 ['growth-marketing', s=>s.startsWith('growth:')||s.startsWith('content:')],
 ['qa-redteam-security', s=>s.startsWith('qa:')||s.startsWith('redteam:')||['scan:privacy','scan:docker-secrets','scan:security-binding-lane','scan:ingest-firewall'].includes(s)],
 ['ui-design-review', s=>['ui:review','scan:design-system'].includes(s)],
 ['bootstrap-onramp', s=>['bootstrap:spinup','bootstrap:lastmile','scan:scaffold-coverage'].includes(s)],
 ['portfolio-multiproduct', s=>s.startsWith('portfolio:')],
 ['admin-panels-cockpit', s=>s.startsWith('admin:')||s.startsWith('panel:')||s.startsWith('cockpit:')||['scan:admin-suite-coverage','scan:panel-registry-coverage'].includes(s)],
 ['guides-knowledge', s=>s.startsWith('guides:')||s.startsWith('knowledge:')],
 ['commit-land', s=>s.startsWith('commit:')],
 ['events-telemetry', s=>s.startsWith('events:')],
 ['docs-maps-discovery-reporting', s=>s.startsWith('maps:')||s.startsWith('discover:')||['docs:catalog','report','scan:architecture','scan:references','scan:timeline','scan:coherence','scan:system','scan:cutover-completeness','scan:meta-lockstep'].includes(s)],
 ['system-health-scans', s=>s.startsWith('scan:')||s==='check:all'||s==='linters:run'],
];
const out=[],counts={},unassigned=[];
for(const ln of lines){const [key,dt,desc]=ln.split('|');let fam=null;
 for(const [n,fn] of F){if(fn(key)){fam=n;break;}}
 if(!fam){unassigned.push(key);fam='UNASSIGNED';}
 counts[fam]=(counts[fam]||0)+1;
 const [hash,date]=(dt||'').trim().split(' ');
 out.push({skill:key,family:fam,first_hash:hash,first_date:date,purpose:desc});}
fs.writeFileSync('_skill-fam.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(counts,null,0).replace(/,/g,',\n'));
console.log('TOTAL',out.length,'UNASSIGNED',unassigned.join(','));
// earliest date per family
const e={};for(const o of out){if(!e[o.family]||o.first_date<e[o.family].d)e[o.family]={d:o.first_date,h:o.first_hash};}
console.log('--- earliest per family ---');
Object.entries(e).sort().forEach(([k,v])=>console.log(k,'|',counts[k],'|',v.h,v.d));
