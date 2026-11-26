const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });
const defaultPath=path.join(outDir,'default.webp');
const defaultReady=sharp(path.join(root, 'assets', 'freshbox-logo.png')).resize(96,96,{fit:'contain',background:{r:20,g:33,b:55,alpha:1}}).webp({quality:84}).toFile(defaultPath);
const catalog = require('../reviewed-catalog');
const featuredSlugs = ['googlechrome','firefoxbrowser','brave','telegram','discord','whatsapp','7zip','everything','vlcmediaplayer','spotify','notepadplusplus','obsidian','sumatrapdf','sharex','microsoft','crystal','hwinfo','steam','epicgames','msi','visualstudiocode','git','python','nodedotjs','docker','bitwarden','localsend','rufus','qbittorrent'];
const slugify = value => value.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'').slice(0,55);
const slugs = new Set(catalog.map(x=>x.icon));
const download = url => new Promise((resolve, reject) => https.get(url, response => { if(response.statusCode !== 200){ response.resume(); return reject(new Error(String(response.statusCode))); } const chunks=[]; response.on('data', c=>chunks.push(c)); response.on('end',()=>resolve(Buffer.concat(chunks))); }).on('error', reject));
function fallbackSvg(slug){let hash=0;for(const ch of slug)hash=(hash*31+ch.charCodeAt(0))>>>0;const hue=hash%360;const initials=slug.replace(/[^a-z0-9]/g,'').slice(0,2).toUpperCase()||'FB';return `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="36" fill="hsl(${hue} 55% 28%)"/><circle cx="148" cy="42" r="28" fill="hsl(${(hue+55)%360} 75% 62%)" opacity=".8"/><text x="96" y="116" text-anchor="middle" font-family="Segoe UI,Arial" font-size="62" font-weight="700" fill="white">${initials}</text></svg>`}
async function make(slug){const target=path.join(outDir,`${slug}.webp`);try{const svg=await download(`https://cdn.simpleicons.org/${slug}/d7e7ff`);await sharp(svg,{density:192}).resize(96,96,{fit:'contain',background:{r:20,g:33,b:55,alpha:1}}).webp({quality:84}).toFile(target);return 'ok';}catch{await sharp(Buffer.from(fallbackSvg(slug))).webp({quality:84}).toFile(target);return 'fallback';}}
(async()=>{let ok=0,fallback=0;const list=[...slugs];for(let i=0;i<list.length;i+=8){const results=await Promise.all(list.slice(i,i+8).map(make));ok+=results.filter(x=>x==='ok'||x==='cached').length;fallback+=results.filter(x=>x==='fallback').length;process.stdout.write(`\r${Math.min(i+8,list.length)}/${list.length}`)}console.log(`\nicons ready=${ok} fallback=${fallback}`)})().catch(error=>{console.error(error);process.exit(1)});
