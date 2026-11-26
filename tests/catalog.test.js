const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../reviewed-catalog');
const {resolveSelection,installArgs}=require('../install-plan');
test('all 145 entries have a valid dedicated WebP asset, not the FreshBox fallback',async()=>{
  const sharp=require('sharp'),path=require('node:path'),crypto=require('node:crypto');
  const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const fallback=hash(path.join(__dirname,'../assets/icons/default.webp'));
  for(const item of catalog){const p=path.join(__dirname,'../assets/icons',`${item.icon}.webp`);assert.ok(fs.existsSync(p),item.name);const m=await sharp(p).metadata();assert.equal(m.format,'webp');assert.ok(m.width>=32&&m.height>=32,item.name);assert.notEqual(hash(p),fallback,item.name);const s=await sharp(p).stats();if(s.channels.length===4)assert.ok(s.channels[3].max>0,item.name+' is invisible');}
});
test('catalog has unique exact identities and meaningful descriptions',()=>{
  assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
  assert.equal(new Set(catalog.map(x=>x.name.toLowerCase())).size,catalog.length);
  for(const item of catalog){assert.ok(item.id&&!item.id.startsWith('name:'));assert.ok(item.desc.length>20);assert.ok(item.cat);}
});
test('WhatsApp cannot install Beeper and Store source is explicit',()=>{
  const item=catalog.find(x=>x.name==='WhatsApp');assert.equal(item.id,'9NKSQGP7F2NH');assert.equal(item.source,'msstore');
  assert.ok(!installArgs(item,'D:\\Apps').includes('--location'));
});
test('unknown identities are rejected and duplicates deduplicated',()=>{
  assert.throws(()=>resolveSelection(['name:اپ']));
  assert.throws(()=>resolveSelection([]));
  assert.equal(resolveSelection(['Google.Chrome','Google.Chrome']).length,1);
});
test('custom folder is isolated per app, exact source and default are preserved',()=>{
  const item=catalog[0];const args=installArgs(item,'D:\\Apps');
  assert.equal(args[args.indexOf('--location')+1],'D:\\Apps\\Google Chrome');
  assert.ok(args.includes('--exact'));assert.equal(args[args.indexOf('--source')+1],'winget');
  assert.ok(!installArgs(item,'C:\\Program Files').includes('--location'));
  assert.throws(()=>installArgs(item,'relative'));
});
test('every catalog entry has current audit evidence',()=>{
  const results=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../reports/catalog-audit.json'),'utf8'));
  assert.equal(results.length,catalog.length);
  for(const item of catalog){const result=results.find(x=>x.id===item.id);assert.ok(result?.manifestOk,item.id);assert.ok(result?.link.ok,item.id);}
});
