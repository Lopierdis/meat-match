import { cuts, labels, questions, terms } from './data.mjs';
import { recommend, validAnswers, preparations } from './match.mjs';

const main = document.querySelector('main');
const dialog = document.querySelector('#cut-dialog');
const key = 'natach-answers-v1';
let answers = {}, step = 0, filter = 'all', search = '';
try { answers = validAnswers(JSON.parse(localStorage.getItem(key))); } catch { /* Storage may be disabled. */ }
const firstUnanswered = () => { const index = questions.findIndex(q => !answers[q.id]); return index < 0 ? 0 : index; };
step = firstUnanswered();
const persist = () => { try { localStorage.setItem(key, JSON.stringify(answers)); } catch { /* The quiz also works without storage. */ } };
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow = '<span aria-hidden="true">←</span>';
const tag = text => `<span class="tag">${esc(text)}</span>`;
const cutNumber = cut => cut.number ? `מס׳ ${String(cut.number).padStart(2,'0')}` : 'חיתוך מיוחד';
const money = cut => ['','נגיש יחסית','מחיר ביניים','יקר יחסית'][cut.budget];
const art = (cut,large=false) => `<div class="cut-art ${large?'large':''}" aria-hidden="true"><span class="art-number">${cut.number ? String(cut.number).padStart(2,'0') : 'נ.'}</span><svg viewBox="0 0 240 150" fill="none"><path d="M42 99C18 67 42 30 85 29C113 28 119 11 158 23C199 34 219 70 202 105C188 136 146 138 117 123C91 110 65 132 42 99Z" fill="currentColor" opacity=".10"/><path d="M42 99C18 67 42 30 85 29C113 28 119 11 158 23C199 34 219 70 202 105C188 136 146 138 117 123C91 110 65 132 42 99Z" stroke="currentColor" stroke-width="2"/><path d="M49 89C37 62 59 42 88 43C120 43 132 22 161 37C185 48 202 75 186 98C172 121 148 121 119 109C91 96 67 115 49 89Z" stroke="currentColor" stroke-width="1.3"/><path d="m73 52 14 19-8 24m8-24 28 5 17 27m-17-27 11-27m0 0 24 22 23-8m-23 8-1 30m-39-47-14 5m61 26 20 9" stroke="currentColor" stroke-width="1.2" opacity=".65"/></svg><span class="art-caption">${cutNumber(cut)}</span></div>`;
const card = cut => `<article class="cut-card">${art(cut)}<div class="cut-content"><span class="eyebrow">${cutNumber(cut)}</span><h3>${cut.name}</h3><p>${cut.description}</p><div class="tags">${cut.fat.map(f=>tag(labels.fat[f])).join('')}${tag(cut.styles.includes('quick')?'לצריבה':'לבישול ארוך')}</div><button class="text-button" data-cut="${cut.id}">מכירים את הנתח ${arrow}</button></div></article>`;

function home() {
  const started = Object.keys(answers).length > 0;
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="small-line"></span> מהקצב. דרך המטבח. עד הביס.</div><h1>לכל ארוחה<br>יש את <em>הנתח שלה.</em></h1><p>אוהבים רך? מעדיפים משויש? מדליקים מנגל או נותנים לסיר לעבוד? בואו נמצא את הבשר שמתאים לכם.</p><div class="hero-actions"><a href="#quiz" class="button">${started?'ממשיכים לבחור':'מוצאים את הנתח שלי'} ${arrow}</a><a href="#glossary" class="text-button">רק באתי להסתכל</a></div><div class="hero-meta"><span>9 שאלות קצרות</span><span>עד 3 נתחים שמתאימים לכם</span></div></div><div class="hero-image"><img src="assets/steak.jpg" alt="שני סטייקים על קרש עץ, עם שיוש ושכבת שומן חיצונית" fetchpriority="high" width="1600" height="1067"><span class="image-overline">בחירה טובה מתחילה בהיכרות</span><div class="photo-note"><span class="note-star">✳</span><div>לא צריך להיות קצבים.<br><strong>רק לדעת מה אוהבים.</strong></div></div><span class="image-caption">בשר. בלי לנחש.</span></div></section>
  <section class="how-strip" aria-label="איך זה עובד"><div><span class="step-no">01</span><p><strong>מספרים מה אוהבים</strong>טעם, מרקם ומה יש במטבח</p></div><div><span class="step-no">02</span><p><strong>מוצאים התאמה</strong>עד שלושה נתחים, עם הסבר לכל בחירה</p></div><div><span class="step-no">03</span><p><strong>מגיעים לקצב מוכנים</strong>שם הנתח ומה כדאי לבקש</p></div></section>
  <section class="section"><div class="section-heading"><div><span class="eyebrow">קצת היכרות לפני שמתחילים</span><h2>מאחורי כל שם, ביס אחר.</h2></div><a class="text-button" href="#glossary">לכל ${cuts.length} הנתחים ${arrow}</a></div><div class="cut-grid preview-grid">${['ribeye','tenderloin','picanha','shortrib'].map(id=>card(cuts.find(c=>c.id===id))).join('')}</div></section>
  <section class="knowledge-banner"><span class="knowledge-icon" aria-hidden="true">א—ת</span><div><span class="eyebrow">מדברים באותה שפה</span><h2>שיוש? נגד הסיבים? פילה מדומה?</h2><p>מילים ששומעים אצל הקצב, עם הסברים שאפשר להבין.</p></div><a href="#terms" class="button secondary">עושים סדר במושגים ${arrow}</a></section>`;
}

function quiz() {
  const q = questions[step];
  const slow = ['stew','pulled'].includes(answers.dish);
  return `<section class="quiz-page"><div class="quiz-top"><a href="#home" class="text-button">חזרה לבית</a><button data-action="reset" class="text-button muted">מתחילים מחדש</button></div><div class="quiz-layout"><aside class="quiz-aside"><span class="eyebrow">הטעם שלכם. הנתח שלכם.</span><h2>נמצא את<br>הביס הנכון.</h2><p>אפשר לחזור ולשנות כל תשובה. אין צורך להכיר שמות של נתחים.</p><ol>${questions.map((item,i)=>`<li class="${i===step?'current':i<step?'complete':''}"><span>${i<step?'✓':String(i+1).padStart(2,'0')}</span>${{dish:'מה מבשלים',method:'איך מבשלים',time:'כמה זמן',taste:'הטעם',texture:'המרקם',fat:'השומן',doneness:'מידת העשייה',experience:'הניסיון',budget:'התקציב'}[item.id]}</li>`).join('')}</ol><p class="privacy-note">התשובות נשמרות רק בדפדפן הזה.</p></aside><div class="question-panel"><div class="progress-label"><span>שאלה ${step+1} מתוך ${questions.length}</span><span>${Math.round(step/questions.length*100)}%</span></div><progress value="${step}" max="${questions.length}" aria-label="התקדמות בשאלון"></progress><form id="quiz-form"><fieldset><legend id="question-title">${q.title}</legend><p class="question-hint">${q.hint}</p>${q.id==='doneness'&&slow?'<p class="inline-note">למנה שבחרתם מתאימה האפשרות ״מבושל עד שמתרכך״. רייר ומדיום מתאימים לצלייה קצרה.</p>':''}<div class="options ${q.options.length<=3?'single-column':''}">${q.options.map(([value,title,description])=>`<label class="option"><input type="radio" name="${q.id}" value="${value}" ${answers[q.id]===value?'checked':''}><span class="option-content"><strong>${title}</strong><span>${description}</span></span><span class="radio-mark" aria-hidden="true"></span></label>`).join('')}</div></fieldset><div class="quiz-bottom"><button type="button" class="text-button" data-action="back" ${step===0?'disabled':''}>→ הקודם</button><button class="button" type="submit" ${!answers[q.id]?'disabled':''}>${step===questions.length-1?'לנתחים שלי':'ממשיכים'} ${arrow}</button></div></form><p class="quiz-footnote">ההמלצות יתחשבו קודם במנה, בשיטה ובזמן. ההעדפות שלכם יעזרו לבחור ביניהן.</p></div></div></section>`;
}

function results() {
  const matches = recommend(answers);
  return `<section class="section results-page"><span class="eyebrow">עכשיו אפשר ללכת לקצב</span><div class="section-heading"><div><h1>${matches.length?'אלה הנתחים שלכם.':'נשנה משהו קטן בתוכנית?'}</h1><p class="lead">${matches.length?'הבחירות שמתאימות להכנה שלכם, לפי הטעם והמרקם שסימנתם.':'לא מצאנו נתח שמתאים יחד למנה, לשיטת הבישול, לזמן ולמידת העשייה שבחרתם.'}</p></div><button class="text-button" data-action="edit">שינוי תשובות ↗</button></div><div class="answer-summary">${questions.map((q,i)=>`<button data-step="${i}" title="שינוי התשובה">${esc(labels[q.id][answers[q.id]])}<span aria-hidden="true"> ↗</span></button>`).join('')}</div>${matches.length?`<div class="results-grid">${matches.map(({cut,plan,reasons,tradeoffs},i)=>`<article class="result-card ${i===0?'first':''}"><div class="result-top"><span>${i===0?'הבחירה הראשונה שלנו':`עוד אפשרות טובה · ${i+1}`}</span><span>${cutNumber(cut)}</span></div><div class="result-body"><h2>${cut.name}</h2><p class="aliases">${cut.aliases}</p><p>${cut.description}</p><div class="tags">${tag(money(cut))}${tag(labels.method[plan.method])}</div><h3>למה דווקא הוא?</h3><ul class="reasons">${reasons.map(r=>`<li>${r}</li>`).join('')}</ul>${tradeoffs.length?`<div class="tradeoff"><strong>מה כדאי לקחת בחשבון</strong><ul>${tradeoffs.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:'<p class="match-note">תואם את ההעדפות שסימנתם, בכפוף לאיכות הנתח ולהכנה.</p>'}<div class="butcher-note"><span>מה מבקשים מהקצב?</span><p>${cut.tip}</p></div><button class="text-button" data-cut="${cut.id}">עוד על הנתח ${arrow}</button></div></article>`).join('')}</div><div class="results-actions"><button class="button" data-action="copy">מעתיקים רשימה לקצב ${arrow}</button><a class="text-button" href="#glossary">משווים לעוד נתחים</a></div><p class="editorial-note">הדירוג הוא התאמת העדפות, לא הבטחה לתוצאה. הזמנים משוערים ותלויים בעובי, במשקל ובציוד. מידת עשייה היא העדפה קולינרית; הנחיות בטיחות מופיעות <a href="#sources">במקורות</a>.</p>`:`<div class="empty-state"><span class="empty-symbol" aria-hidden="true">↶</span><h2>לכל נתח יש קצב משלו.</h2><p>למשל, קדירה צריכה בישול מלא וזמן לריכוך. סטייק מהיר יתאים למחבת או לגריל. אפשר לשנות רק תשובה אחת ולנסות שוב.</p><div class="empty-actions"><button class="button" data-step="2">שינוי הזמן</button><button class="button secondary" data-step="1">שינוי שיטת הבישול</button><button class="text-button" data-step="6">שינוי מידת העשייה</button></div></div>`}</section>`;
}

function glossary() {
  return `<section class="section glossary-page"><div class="page-intro"><span class="eyebrow">נעים להכיר, בשר</span><h1>מילון הנתחים.</h1><p class="lead">${cuts.length} נתחי בקר, השמות ששומעים בקצבייה ומה עושים עם כל אחד.</p></div><div class="glossary-toolbar"><label class="search-box"><span aria-hidden="true">⌕</span><input type="search" id="cut-search" value="${esc(search)}" placeholder="שם, מספר או כינוי של נתח..." aria-label="חיפוש נתחים לפי שם, מספר או כינוי"></label><div class="filter-buttons" role="group" aria-label="סינון נתחים">${[['all','כל הנתחים'],['quick','לצריבה'],['slow','לבישול ארוך'],['lean','נתחים רזים']].map(([id,title])=>`<button data-filter="${id}" aria-pressed="${filter===id}">${title}</button>`).join('')}</div></div><p class="catalog-note">המספרים לפי הקיצוב המקובל בישראל. חיתוכים מיוחדים מופיעים בנפרד. האיורים להמחשה בלבד.</p><p id="cut-count" class="count-label" role="status"></p><div id="catalog" class="cut-grid"></div></section>`;
}
const normalize = text => text.normalize('NFKD').replace(/[\u0591-\u05C7'׳״"\s־-]/g,'').toLowerCase();
function updateCatalog() {
  const list = cuts.filter(c => (filter==='all'||(filter==='lean'?c.fat.includes('lean'):c.styles.includes(filter))) && (!search.trim() || (/^\d+$/.test(search.trim())?c.number===Number(search):normalize(`${c.name} ${c.aliases}`).includes(normalize(search)))));
  document.querySelector('#catalog').innerHTML = list.length ? list.map(card).join('') : '<div class="empty-state"><h2>לא מצאנו נתח בשם הזה.</h2><p>נסו שם אחר, מספר נתח או חיפוש באנגלית.</p><button class="text-button" data-action="clear-search">ניקוי החיפוש והסינון</button></div>';
  document.querySelector('#cut-count').textContent = `${list.length} נתחים במילון`;
}
function termsPage() {
  return `<section class="section terms-page"><div class="page-intro"><span class="eyebrow">המילון שמאחורי המילון</span><h1>מדברים בשר.</h1><p class="lead">מושגים ששווה להכיר, לפני שמדליקים את האש.</p></div><dl class="terms-list">${terms.map(([term,definition],i)=>`<div><span aria-hidden="true">${String(i+1).padStart(2,'0')}</span><dt>${term}</dt><dd>${definition}</dd></div>`).join('')}</dl><a href="#quiz" class="button">עכשיו מוצאים נתח ${arrow}</a></section>`;
}
function sources() {
  return `<section class="section sources-page"><span class="eyebrow">איך אנחנו בוחרים</span><h1>ידע טוב. בחירה אישית.</h1><p class="lead">נתח הוא מדריך לבחירת נתחי בקר. המילון מציג את 19 המספרים המקובלים בישראל ועוד שישה חיתוכים מיוחדים.</p><h2>איך נוצרות ההמלצות?</h2><p>קודם בודקים שהנתח מתאים למנה, לשיטה, לזמן ולסוג העשייה. אחר כך מדרגים את ההתאמה להעדפות טעם, מרקם, שומן, ניסיון ותקציב. אם יש פשרה, היא מוצגת בתוצאה. אם אין שילוב מתאים, מבקשים לשנות תשובה.</p><p>מאפייני הטעם, המרקם, התקציב, הניסיון והזמן הם הערכות עריכה. הם אינם מדידות או ציונים שניתנו במקורות. איכות הבשר, יישון, גודל והכנה משפיעים על התוצאה. כיסוי המנות והשיטות הוא של גרסה ראשונה ואינו כולל כל שימוש אפשרי בנתח.</p><h2>מקורות לשמות ולשיטות</h2><ul class="source-links"><li><a href="https://meat.org.il/מפת-נתחים/" target="_blank" rel="noopener">מועצת הבקר: מפת הנתחים</a></li><li><a href="https://meat.org.il/חלקי-הבשר-ושימושיהם/" target="_blank" rel="noopener">מועצת הבקר: חלקי הבשר ושימושיהם</a></li><li><a href="https://www.beefitswhatsfordinner.com/cuts" target="_blank" rel="noopener">Beef Checkoff: מדריך נתחים ושיטות הכנה</a></li><li><a href="https://www.hashulchan.co.il/פקיניה-בשר-בקר-ישראלי-טרי/" target="_blank" rel="noopener">השולחן ומועצת הבקר: פיקניה</a></li></ul><h2>מידת עשייה ובטיחות מזון</h2><p>הבחירות רייר ומדיום מתארות העדפה קולינרית, ואינן הבטחת בטיחות. לפי USDA, לנתחי בקר שלמים מומלצת טמפרטורה פנימית של לפחות 63 מעלות צלזיוס ואחריה מנוחה של שלוש דקות; לבשר טחון 71 מעלות. משתמשים במדחום מזון, ולא בצבע בלבד.</p><p><a href="https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry" target="_blank" rel="noopener">הנחיות USDA FSIS לטמפרטורות בטוחות</a></p><h2>פרטיות וקרדיטים</h2><p>השאלון פועל בדפדפן. אין חשבון ואין שליחה של התשובות לשרת. לחיצה על ״מתחילים מחדש״ מוחקת את התשובות שנשמרו במכשיר.</p><p>צילום: <a href="https://images.unsplash.com/photo-1603048297172-c92544798d5a" target="_blank" rel="noopener">Unsplash</a>. האיורים בכרטיסים הם להמחשה ואינם מפת חיתוך אנטומית. מקורות התוכן נבדקו בנובמבר 2026.</p></section>`;
}

function showCut(id) {
  const cut = cuts.find(c=>c.id===id);
  if (!cut) return;
  const methods = [...new Set(preparations(cut).map(p=>labels.method[p.method]))];
  document.querySelector('#dialog-body').innerHTML = `${art(cut,true)}<div class="dialog-copy"><span class="eyebrow">${cutNumber(cut)}</span><h2 id="dialog-title">${cut.name}</h2><p class="aliases">${cut.aliases}</p><p class="lead">${cut.description}</p><dl class="cut-facts"><div><dt>טעם</dt><dd>${labels.taste[cut.taste]}</dd></div><div><dt>מרקם לאחר הכנה</dt><dd>${labels.texture[cut.texture]}</dd></div><div><dt>שומן</dt><dd>${cut.fat.map(f=>labels.fat[f]).join(' / ')}</dd></div><div><dt>מחיר יחסי</dt><dd>${money(cut)}</dd></div></dl><h3>איך מכינים?</h3><div class="tags">${methods.map(tag).join('')}</div><div class="butcher-note"><span>אצל הקצב</span><p>${cut.tip}</p></div><p class="editorial-note">המאפיינים משוערים ומשתנים לפי חומר הגלם וההכנה.</p><a class="button" href="#quiz" data-action="close">הנתח הזה מתאים לי? ${arrow}</a></div>`;
  dialog.showModal();
}

function render() {
  let route = location.hash.slice(1) || 'home';
  if (route==='results' && questions.some(q=>!answers[q.id])) { step=firstUnanswered(); location.hash='quiz'; return; }
  const views = {home,quiz,results,glossary,terms:termsPage,sources};
  if (!views[route]) route='home';
  if (dialog.open) dialog.close();
  main.innerHTML = views[route]();
  document.querySelectorAll('[data-nav]').forEach(a=>{ if(a.dataset.nav===route) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  if (route==='glossary') updateCatalog();
  document.title = `${{home:'הבשר שמתאים לכם',quiz:'מוצאים נתח',results:'הנתחים שלכם',glossary:'מילון הנתחים',terms:'מדברים בשר',sources:'על המדריך'}[route]} · נתח`;
  window.scrollTo({top:0,behavior:'instant'});
  main.focus({preventScroll:true});
}
function gotoStep(index) { step=index; if(location.hash==='#quiz') render(); else location.hash='quiz'; }

document.addEventListener('change',event=>{
  if (!event.target.matches('#quiz-form input')) return;
  answers[questions[step].id] = event.target.value;
  persist();
  document.querySelector('#quiz-form button[type="submit"]').disabled=false;
});
document.addEventListener('submit',event=>{
  if (event.target.id!=='quiz-form') return;
  event.preventDefault();
  if (!answers[questions[step].id]) return;
  if (step<questions.length-1) { step++; render(); } else location.hash='results';
});
document.addEventListener('input',event=>{ if(event.target.id==='cut-search') { search=event.target.value; updateCatalog(); } });
document.addEventListener('click',async event=>{
  const target=event.target.closest('button, a');
  if (!target) return;
  if(target.dataset.cut) return showCut(target.dataset.cut);
  if(target.dataset.step!==undefined) return gotoStep(Number(target.dataset.step));
  if(target.dataset.filter) {
    filter=target.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.filter===filter));
    updateCatalog(); return;
  }
  switch(target.dataset.action) {
    case 'reset': answers={}; step=0; persist(); render(); break;
    case 'back': if(step>0) {step--;render();} break;
    case 'edit': gotoStep(0); break;
    case 'clear-search': search='';filter='all';render();break;
    case 'close': dialog.close();break;
    case 'copy': {
      const text='רשימת הנתחים שלי\n\n'+recommend(answers).map(({cut,plan})=>`${cut.name} · ${cutNumber(cut)}\nל${labels.dish[plan.dish]} ב${labels.method[plan.method]}\n${cut.tip}`).join('\n\n');
      try { await navigator.clipboard.writeText(text); toast('הרשימה הועתקה. אפשר לשלוח לקצב.'); }
      catch { document.querySelector('#dialog-body').innerHTML=`<div class="dialog-copy"><h2 id="dialog-title">הרשימה שלכם לקצב</h2><p>העתקה אוטומטית אינה זמינה. אפשר לסמן ולהעתיק כאן.</p><textarea class="copy-fallback" readonly aria-label="רשימת נתחים להעתקה">${esc(text)}</textarea></div>`;dialog.showModal();document.querySelector('textarea').select(); }
      break;
    }
  }
});
let toastTimer;
function toast(message) { const node=document.querySelector('#toast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),3500); }
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{ if(event.target===dialog) {const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();} });
window.addEventListener('hashchange',render);
render();
