import { cuts, labels, questions } from './data.mjs';

export function validAnswers(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(questions.filter(q => q.options.some(([value]) => value === input[q.id])).map(q => [q.id, input[q.id]]));
}

export function preparations(cut) {
  const plans = [];
  const add = (dish,methods,minutes,slow=false) => methods.forEach(method => plans.push({dish,method,minutes,slow}));
  if (cut.styles.includes('quick')) {
    add('steak',['pan','grill'],35);
    add('stirfry',['pan'],25);
    add('steak',['sousvide'],120);
  }
  if (cut.styles.includes('roast')) add('roast',['oven','grill'],120);
  if (cut.styles.includes('slow')) {
    add('stew',['pot','oven'],cut.id === 'brisket' ? 360 : 240,true);
    add('stew',['pressure'],120,true);
    if (!cut.fat.includes('lean')) {
      add('pulled',['pot','oven'],360,true);
      add('pulled',['pressure'],120,true);
    }
  }
  if (cut.styles.includes('smoke')) add('pulled',['smoker'],720,true);
  return plans;
}

// ponytail: explicit culinary rules and editorial weights; expand curated preparations
// when adding dishes. A model or server would not improve this small, auditable catalog.
export function recommend(input) {
  const a = validAnswers(input);
  return cuts.flatMap(cut => {
    const plan = preparations(cut).find(p =>
      (!a.dish || a.dish === 'any' || p.dish === a.dish) &&
      (!a.method || a.method === 'any' || p.method === a.method) &&
      (!a.time || p.minutes <= Number(a.time)) &&
      (!a.doneness || a.doneness === 'any' || (p.slow ? a.doneness === 'braised' : a.doneness !== 'braised'))
    );
    if (!plan) return [];
    let score = 0;
    const reasons = [`מתאים ל${labels.dish[plan.dish]} ב${labels.method[plan.method]}`];
    const tradeoffs = [];
    for (const [key,weight] of [['taste',3],['texture',3]]) {
      if (a[key] && a[key] !== 'any') {
        const distance = Math.abs(cut[key] - Number(a[key]));
        score += (2-distance)*weight;
        if (distance === 0) reasons.push(key === 'taste' ? `טעם ${labels.taste[a[key]]}` : `מרקם ${labels.texture[a[key]]} בהכנה מתאימה`);
        else tradeoffs.push(key === 'taste' ? `הטעם נוטה ל${labels.taste[cut.taste]}, ולא בדיוק להעדפה שסימנתם` : `המרקם נוטה ל${labels.texture[cut.texture]}`);
      }
    }
    if (a.fat && a.fat !== 'any') {
      if (cut.fat.includes(a.fat)) { score += 7; reasons.push(`פרופיל שומן: ${labels.fat[a.fat]}`); }
      else { score -= 3; tradeoffs.push(`השומן שונה מההעדפה: ${cut.fat.map(f => labels.fat[f]).join(' / ')}`); }
    }
    if (a.experience && cut.experience > Number(a.experience)) { score -= 3; tradeoffs.push('דורש יותר תשומת לב לניקוי או לעשייה. כדאי להיעזר בקצב ובמדחום'); }
    else if (a.experience === '1') { score += 3; reasons.push('בחירה נוחה יחסית גם למתחילים'); }
    if (a.budget && cut.budget > Number(a.budget)) { score -= 4*(cut.budget-Number(a.budget)); tradeoffs.push('עשוי להיות יקר יותר מרמת התקציב שבחרתם'); }
    else if (a.budget === '1') { score += 3; reasons.push('ברמת מחיר יחסית נגישה'); }
    if (a.doneness === 'well' && cut.fat.includes('lean')) { score -= 5; tradeoffs.push('בנתח רזה, עשייה מלאה עלולה לייבש את הבשר'); }
    return [{cut,plan,score,reasons,tradeoffs}];
  }).sort((a,b) => b.score-a.score || a.cut.name.localeCompare(b.cut.name,'he')).slice(0,3);
}
