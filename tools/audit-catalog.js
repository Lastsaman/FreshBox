const fs = require('node:fs');
const path = require('node:path');
const {execFile} = require('node:child_process');
const catalog = require('../reviewed-catalog');
const outputDir = path.join(__dirname, '..', 'reports');
const run = item => new Promise(resolve => execFile('winget', ['show','--id',item.id,'--exact','--source',item.source,'--accept-source-agreements','--disable-interactivity'], {windowsHide:true,timeout:90000,maxBuffer:1024*1024}, (error, stdout='',stderr='') => resolve({ok:!error,output:stdout+stderr,code:error?.code})));
async function probe(url) {
  try {
    const response = await fetch(url, {method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(25000)});
    if(response.ok) return {ok:true,status:response.status,finalUrl:response.url};
    if([403,405,501].includes(response.status)) {
      const ranged = await fetch(url,{headers:{Range:'bytes=0-0'},redirect:'follow',signal:AbortSignal.timeout(25000)});
      await ranged.body?.cancel();
      return {ok:ranged.ok,status:ranged.status,finalUrl:ranged.url};
    }
    return {ok:false,status:response.status,finalUrl:response.url};
  } catch(error) {return {ok:false,error:error.message};}
}
(async()=>{
  fs.mkdirSync(outputDir,{recursive:true});
  let cursor=0,done=0;
  const previous=process.argv.includes('--retry') && fs.existsSync(path.join(outputDir,'catalog-audit.json'))?JSON.parse(fs.readFileSync(path.join(outputDir,'catalog-audit.json'),'utf8')):[];
  const results=[];
  await Promise.all(Array.from({length:4},async()=>{
    while(cursor<catalog.length) {
      const item=catalog[cursor++];
      const cached=previous.find(x=>x.id===item.id&&x.manifestOk&&x.link.ok);
      if(cached){results.push(cached);done++;continue;}
      const result=await run(item);
      const url=result.output.match(/Installer Url:\s*(https?:\/\/\S+)/i)?.[1];
      const version=result.output.match(/^Version:\s*(.+)$/m)?.[1]?.trim();
      const homepage=result.output.match(/^Publisher Url:\s*(https?:\/\/\S+)/mi)?.[1];
      const link=url?await probe(url):item.source==='msstore'&&result.ok?{ok:true,kind:'store-product',note:'Store identity verified; direct installer is managed by Microsoft Store'}:{ok:false,error:'No installer URL reported'};
      results.push({id:item.id,name:item.name,manifestOk:result.ok,version,homepage,installerUrl:url,link,checkedAt:new Date().toISOString(),...(!result.ok?{output:result.output,code:result.code}:{})});
      done++;
      console.log(`${done}/${catalog.length} ${item.id} manifest=${result.ok} link=${link.status||link.error}`);
      fs.writeFileSync(path.join(outputDir,'catalog-audit.json'),JSON.stringify(results,null,2));
    }
  }));
  fs.writeFileSync(path.join(outputDir,'catalog-audit.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({total:results.length,manifests:results.filter(x=>x.manifestOk).length,links:results.filter(x=>x.link.ok).length,failed:results.filter(x=>!x.manifestOk).map(x=>x.id)},null,2));
})();
