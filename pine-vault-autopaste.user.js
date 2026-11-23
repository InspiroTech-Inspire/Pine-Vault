// ==UserScript==
// @name Pine Vault auto-paste
// @namespace pinevault
// @match https://www.tradingview.com/*
// @run-at document-start
// @grant none
// ==/UserScript==
(function(){
var raw=null,m=location.hash.match(/pinevault=([A-Za-z0-9_-]+)/);
try{if(m){raw=m[1];sessionStorage.setItem('pinevault',raw)}else{raw=sessionStorage.getItem('pinevault')}}catch(e){}
if(!raw)return;
var code;try{var b=raw.split('-').join('+').split('_').join('/');while(b.length%4)b+='=';var bin=atob(b);code=new TextDecoder().decode(Uint8Array.from(bin,function(c){return c.charCodeAt(0)}))}catch(e){return}
var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
async function waitFor(fn,t){var s=Date.now();while(Date.now()-s<t){var v=fn();if(v)return v;await sleep(300)}return null}
function byText(sel,re){return Array.prototype.find.call(document.querySelectorAll(sel),function(e){return e.offsetParent!==null&&re.test((e.getAttribute('aria-label')||'')+' '+(e.title||'')+' '+e.textContent)})}
var ed=function(){return document.querySelector('.monaco-editor textarea')};
async function run(){
await waitFor(function(){return document.querySelector('[data-name=legend]')},40000);
await sleep(1500);
if(!ed()){var tab=await waitFor(function(){return byText('button,[role=tab]',/pine editor/i)},15000);if(tab)tab.click()}
var ta=await waitFor(ed,15000);
if(!ta){alert('Pine Vault: could not find the Pine Editor.');return}
ta.focus();document.execCommand('selectAll');
if(!document.execCommand('insertText',false,code)){try{await navigator.clipboard.writeText(code)}catch(e){}alert('Pine Vault: auto-paste failed. Code copied, paste it with Ctrl/Cmd+V.');return}
await sleep(800);
var add=await waitFor(function(){return byText('button',/add to chart|update on chart/i)},8000);
if(add)add.click();else alert('Pine Vault: code pasted. Click Add to chart.');
try{sessionStorage.removeItem('pinevault')}catch(e){}
}
run();
})();
