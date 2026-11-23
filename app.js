const KEY='pinevault:v1';
const SEED=[{id:'s1',name:'Example: EMA Cross',desc:'Simple fast/slow EMA crossover. Replace me with your own scripts.',tags:['trend','example'],code:'//@version=6\nindicator("EMA Cross", overlay=true)\nfast = ta.ema(close, 9)\nslow = ta.ema(close, 21)\nplot(fast, "Fast", color.new(color.teal, 0))\nplot(slow, "Slow", color.new(color.orange, 0))\nplotshape(ta.crossover(fast, slow), "Buy", shape.triangleup, location.belowbar, color.green)\nplotshape(ta.crossunder(fast, slow), "Sell", shape.triangledown, location.abovebar, color.red)\n',updated:Date.now()}];
let items=[],sel=null,editing=false;
const $=id=>document.getElementById(id);
function load(){try{const r=localStorage.getItem(KEY);items=r?JSON.parse(r):SEED}catch(e){items=SEED}if(!Array.isArray(items))items=SEED;sel=items[0]?items[0].id:null}
function save(){try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){toast('Could not save in this browser, use Export')}}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function el(tag,props,...kids){const e=document.createElement(tag);Object.assign(e,props||{});kids.forEach(k=>e.append(k));return e}
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch(e){const t=el('textarea',{value:text});document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}t.remove();return ok}}
function normTv(s){s=(s||'').trim();if(!s)return '';if(/^https:\/\/(www\.)?tradingview\.com\//.test(s))return s;if(/^[A-Za-z0-9_-]+(;|%3B)[0-9a-f]+$/i.test(s))return 'https://www.tradingview.com/pine/?id='+encodeURIComponent(decodeURIComponent(s));return ''}
function tvUrl(code){let s='';new TextEncoder().encode(code).forEach(x=>s+=String.fromCharCode(x));const b=btoa(s).split('+').join('-').split('/').join('_').replace(/=+$/,'');return b.length>150000?'https://www.tradingview.com/chart/':'https://www.tradingview.com/chart/#pinevault='+b}
function renderList(){
  const f=$('q').value.toLowerCase().trim(),L=$('list');L.innerHTML='';
  const shown=items.filter(i=>!f||i.name.toLowerCase().includes(f)||i.tags.some(t=>t.toLowerCase().includes(f)));
  if(!shown.length)L.append(el('p',{className:'muted',textContent:'No indicators found.'}));
  shown.forEach(i=>{
    const d=el('div',{className:'item'+(i.id===sel?' active':''),onclick:()=>{sel=i.id;editing=false;render()}},el('b',{textContent:i.name}));
    i.tags.forEach(t=>d.append(el('span',{className:'tag',textContent:t})));
    L.append(d)});
}
function renderView(){
  const v=$('view');v.innerHTML='';
  if(editing)return renderForm(v);
  const i=items.find(x=>x.id===sel);
  if(!i){v.append(el('p',{className:'muted',textContent:'Add your first indicator to get started.'}));return}
  v.append(el('h2',{textContent:i.name,style:'margin:0 0 4px'}),el('p',{className:'muted',textContent:i.desc||'No description.'}));
  const open=el('button',{className:'primary',textContent:'Open in TradingView',onclick:()=>{
    const w=window.open(tvUrl(i.code),'_blank');
    if(!w){toast('Popup blocked. Allow popups for this site, then try again')}
    copy(i.code).then(ok=>{if(w)toast(ok?'Opening TradingView (code also copied)':'Opening TradingView')})}});
  const row=el('div',{className:'row'},open,
    ...(i.tv?[el('button',{textContent:'Open saved script',onclick:()=>window.open(i.tv,'_blank','noopener')})]:[]),el('button',{textContent:'Copy code',onclick:async()=>toast(await copy(i.code)?'Copied':'Copy failed')}),
    el('button',{textContent:'Download .pine',onclick:()=>{const a=el('a',{href:URL.createObjectURL(new Blob([i.code],{type:'text/plain'})),download:i.name.replace(/[^\w-]+/g,'_')+'.pine'});a.click()}}),
    el('button',{textContent:'Edit',onclick:()=>{editing=true;render()}}),
    el('button',{className:'danger',textContent:'Delete',onclick:()=>{if(confirm('Delete “'+i.name+'”?')){items=items.filter(x=>x.id!==i.id);sel=items[0]?items[0].id:null;save();render()}}}));
  v.append(row);
  const steps=el('ol');['Stay logged in to TradingView in this browser.','With the auto-paste userscript installed, it opens the Pine Editor, pastes the code and clicks Add to chart for you.','No userscript, or nothing happens? The code is already on your clipboard: paste it into the Pine Editor and click Add to chart. Nothing is saved or published.'].forEach(s=>steps.append(el('li',{textContent:s})));
  v.append(steps,el('pre',{textContent:i.code}));
}
function renderForm(v){
  const i=items.find(x=>x.id===sel)||{name:'',desc:'',tags:[],code:'//@version=6\nindicator("My Indicator", overlay=true)\n'};
  const n=el('input',{value:i.name,placeholder:'Indicator name'}),d=el('input',{value:i.desc,placeholder:'Short description'}),
  t=el('input',{value:i.tags.join(', '),placeholder:'trend, momentum, volume'}),tv=el('input',{value:i.tv||'',placeholder:'https://www.tradingview.com/pine/?id=USER%3B… or just USER;…'}),c=el('textarea',{value:i.code,spellcheck:false});
  c.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=c.selectionStart;c.setRangeText('    ',s,c.selectionEnd,'end')}});
  v.append(el('label',{textContent:'Name'}),n,el('label',{textContent:'Description'}),d,el('label',{textContent:'Tags (comma separated)'}),t,el('label',{textContent:'TradingView saved-script link or ID (optional, opens the script directly)'}),tv,el('label',{textContent:'Pine Script code'}),c,
    el('div',{className:'row'},
      el('button',{className:'primary',textContent:'Save',onclick:()=>{
        if(!n.value.trim())return toast('Name is required');
        const rec={id:items.find(x=>x.id===sel)?sel:'i'+Date.now(),name:n.value.trim(),desc:d.value.trim(),tags:t.value.split(',').map(s=>s.trim()).filter(Boolean),code:c.value,tv:normTv(tv.value),updated:Date.now()};
        const idx=items.findIndex(x=>x.id===rec.id);idx>=0?items[idx]=rec:items.unshift(rec);sel=rec.id;editing=false;save();render();toast('Saved')}}),
      el('button',{textContent:'Cancel',onclick:()=>{editing=false;render()}})));
}
function render(){renderList();renderView()}
$('q').oninput=renderList;
$('new').onclick=()=>{sel=null;editing=true;render()};
$('exp').onclick=()=>{const a=el('a',{href:URL.createObjectURL(new Blob([JSON.stringify(items,null,2)],{type:'application/json'})),download:'pine-vault-backup.json'});a.click()};
$('imp').onclick=()=>$('file').click();
$('us').onclick=()=>{window.open('pine-vault-autopaste.user.js','_blank')};
$('file').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data))throw 0;
  data.forEach(r=>{if(r&&r.name&&typeof r.code==='string'){r.id=r.id||'i'+Math.random().toString(36).slice(2);r.tags=r.tags||[];r.desc=r.desc||'';const k=items.findIndex(x=>x.id===r.id);k>=0?items[k]=r:items.push(r)}});
  save();render();toast('Imported')}catch(_){toast('Invalid backup file')}e.target.value=''};
load();render();
