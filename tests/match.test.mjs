import test from 'node:test';
import assert from 'node:assert/strict';
import { cuts, questions } from '../docs/data.mjs';
import { recommend, validAnswers, preparations } from '../docs/match.mjs';

const steak = {dish:'steak',method:'pan',time:'45',taste:'1',texture:'1',fat:'lean',doneness:'medium',experience:'2',budget:'3'};

test('a mild, tender, lean steak points to tenderloin, never mock tender',()=>{
  const result = recommend(steak);
  assert.equal(result[0].cut.id,'tenderloin');
  assert.ok(!result.some(r=>['mock','blade','brisket'].includes(r.cut.id)));
  assert.equal(recommend({...steak,taste:'3',fat:'marbled',experience:'1'})[0].cut.id,'ribeye');
  assert.equal(recommend({...steak,taste:'3',texture:'2',fat:'cap',budget:'2'})[0].cut.id,'picanha');
});

test('dish, equipment, time and slow cooking cannot be traded away for preferences',()=>{
  assert.deepEqual(recommend({...steak,dish:'stew'}),[]);
  assert.deepEqual(recommend({...steak,dish:'stew',method:'pot',doneness:'braised'}),[]);
  assert.deepEqual(recommend({...steak,dish:'stew',method:'pot',time:'360',doneness:'medium'}),[]);
  const stew = recommend({...steak,dish:'stew',method:'pot',time:'360',doneness:'braised'});
  assert.ok(stew.length>0);
  assert.ok(stew.every(r=>r.plan.slow));
  assert.deepEqual(recommend({...steak,method:'sousvide'}),[]);
  assert.ok(recommend({...steak,method:'sousvide',time:'120'}).length>0);
});

test('all supported combinations respect hard constraints and return at most three unique cuts',()=>{
  const options = id => questions.find(q=>q.id===id).options.map(o=>o[0]);
  for (const dish of options('dish')) for (const method of options('method')) for (const time of options('time')) for (const doneness of options('doneness')) {
    const results = recommend({...steak,dish,method,time,doneness});
    assert.ok(results.length<=3);
    assert.equal(new Set(results.map(r=>r.cut.id)).size,results.length);
    for (const {plan} of results) {
      if(dish!=='any') assert.equal(plan.dish,dish);
      if(method!=='any') assert.equal(plan.method,method);
      assert.ok(plan.minutes<=Number(time));
      if(doneness!=='any') assert.equal(plan.slow,doneness==='braised');
    }
  }
});

test('Israeli 1–19 exist exactly once and specialty cuts remain separate',()=>{
  assert.deepEqual(cuts.filter(c=>c.number).map(c=>c.number),Array.from({length:19},(_,i)=>i+1));
  assert.equal(cuts.length,25);
  assert.ok(preparations(cuts.find(c=>c.id==='picanha')).some(p=>p.dish==='steak'));
  assert.ok(!preparations(cuts.find(c=>c.id==='round')).some(p=>p.dish==='steak'));
  assert.ok(preparations(cuts.find(c=>c.id==='flatiron')).some(p=>p.dish==='steak'));
  assert.ok(!preparations(cuts.find(c=>c.id==='blade')).some(p=>p.dish==='steak'));
  for(const cut of cuts) assert.ok(preparations(cut).length);
});

test('stored or imported answer values are allowlisted',()=>{
  assert.deepEqual(validAnswers(null),{});
  assert.deepEqual(validAnswers(['steak']),{});
  assert.deepEqual(validAnswers({dish:'<script>',method:'pan',time:-2,unknown:true}),{method:'pan'});
  assert.deepEqual(validAnswers(steak),steak);
});

test('soft preference mismatches are disclosed',()=>{
  const results = recommend({...steak,method:'grill',taste:'3',fat:'cap',experience:'1',budget:'1'});
  assert.ok(results.length>0);
  for(const {cut,tradeoffs} of results) {
    if(cut.budget>1) assert.ok(tradeoffs.some(t=>t.includes('יקר')));
    if(!cut.fat.includes('cap')) assert.ok(tradeoffs.some(t=>t.includes('השומן שונה')));
    if(cut.experience>1) assert.ok(tradeoffs.some(t=>t.includes('תשומת לב')));
  }
});
