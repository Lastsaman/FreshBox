const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const stage=path.join(root,'release-source');
fs.mkdirSync(stage,{recursive:true});
const pkg=require('../package.json');
for(const file of ['index.html','styles.css','app.js','reviewed-catalog.js','install-plan.js','main.js','preload.js']) {
  let content=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='index.html')content=content.replace(/FreshBox v\d+\.\d+\.\d+/,`FreshBox v${pkg.version}`);
  fs.writeFileSync(path.join(stage,file),content);
}
fs.cpSync(path.join(root,'assets'),path.join(stage,'assets'),{recursive:true});
for(const item of require('../reviewed-catalog')) {
  const icon=path.join(stage,'assets','icons',`${item.icon}.webp`);
  if(!fs.existsSync(icon))fs.copyFileSync(path.join(stage,'assets','icons','default.webp'),icon);
}
fs.writeFileSync(path.join(stage,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,description:pkg.description,main:'main.js',author:'lastsaman'},null,2));
console.log('Release source staged at',stage);
