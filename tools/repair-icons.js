const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const crypto=require('node:crypto');
const catalog=require('../reviewed-catalog');
const audit=require('../reports/catalog-audit.json');
const root=path.resolve(__dirname,'..');
const aliases={
  'Google.Chrome':'google-chrome','Mozilla.Firefox':'firefox','Microsoft.Edge':'microsoft-edge','TorProject.TorBrowser':'tor',
  'Telegram.TelegramDesktop':'telegram','OpenWhisperSystems.Signal':'signal','9NKSQGP7F2NH':'whatsapp',
  'Mozilla.Thunderbird':'thunderbird','7zip.7zip':'7zip','RARLab.WinRAR':'winrar','Giorgiotani.Peazip':'peazip',
  'voidtools.Everything':'everything','Tonec.InternetDownloadManager':'internet-download-manager',
  'SoftDeluxe.FreeDownloadManager':'free-download-manager','AppWork.JDownloader':'jdownloader',
  'VideoLAN.VLC':'vlc','clsid2.mpc-hc':'mpc-hc','TheDocumentFoundation.LibreOffice':'libreoffice',
  'ONLYOFFICE.DesktopEditors':'onlyoffice','Microsoft.Office':'microsoft-office','Adobe.Acrobat.Reader.64-bit':'adobe-acrobat',
  'Notepad++.Notepad++':'notepad-plus-plus','JGraph.Draw':'draw-io','OBSProject.OBSStudio':'obs',
  'GIMP.GIMP.3':'gimp','KDE.Krita':'krita','BlenderFoundation.Blender':'blender','dotPDN.PaintDotNet':'paint-net',
  'ByteDance.CapCut':'capcut','Microsoft.PowerToys':'microsoft-powertoys','Valve.Steam':'steam',
  'EpicGames.EpicGamesLauncher':'epic-games','ElectronicArts.EADesktop':'ea','Blizzard.BattleNet':'battle-net',
  'Microsoft.VCRedist.2015+.x64':'visual-studio','Microsoft.VCRedist.2015+.x86':'visual-studio',
  'Microsoft.DotNet.DesktopRuntime.8':'dotnet','Microsoft.DotNet.DesktopRuntime.10':'dotnet',
  'Microsoft.EdgeWebView2Runtime':'microsoft-edge','Microsoft.DirectX':'directx','EclipseAdoptium.Temurin.21.JRE':'java',
  'Microsoft.OneDrive':'microsoft-onedrive','Google.GoogleDrive':'google-drive','Mega.MEGASync':'mega',
  'KeePassXCTeam.KeePassXC':'keepassxc','AgileBits.1Password':'1password','ente-io.auth-desktop':'ente-auth',
  'AnyDesk.AnyDesk':'anydesk','WinSCP.WinSCP':'winscp','OpenVPNTechnologies.OpenVPN':'openvpn',
  'Cloudflare.Warp':'cloudflare','KDE.KDEConnect':'kde-connect','Google.PlatformTools':'android',
  'Google.QuickShare':'quick-share','Apple.iTunes':'itunes','Microsoft.VisualStudioCode':'visual-studio-code',
  'Python.Python.3.14':'python','OpenJS.NodeJS.LTS':'nodejs','Microsoft.PowerShell':'powershell',
  'Microsoft.WindowsTerminal':'windows-terminal','JetBrains.Toolbox':'jetbrains','Google.AndroidStudio':'android-studio'
};
Object.assign(aliases,{'Microsoft.VCRedist.2015+.x64':'visual-studio-2026','Microsoft.VCRedist.2015+.x86':'visual-studio-2026','Microsoft.DirectX':'microsoft-windows','Mega.MEGASync':'mega-nz','Google.QuickShare':'quickshare'});
Object.assign(aliases,{'Microsoft.PowerToys':'microsoft-windows','Microsoft.Sysinternals.Autoruns':'microsoft-windows','Microsoft.Sysinternals.ProcessExplorer':'microsoft-windows','Microsoft.WindowsTerminal':'microsoft-windows'});
const directIcons={'Giorgiotani.Peazip':'https://a.fsdn.com/allura/p/peazip/icon','Ditto.Ditto':'https://a.fsdn.com/allura/p/ditto-cp/icon','PDFgear.PDFgear':'https://www.pdfgear.com/img/pdfgear_headr_icon.svg','Microsoft.PowerToys':'https://raw.githubusercontent.com/microsoft/PowerToys/main/doc/images/icons/PowerToys%20icon/ICO/PowerToys.ico'};
directIcons['IDRIX.VeraCrypt']='https://a.fsdn.com/allura/p/veracrypt/icon';
const officialSites={
 'SoftDeluxe.FreeDownloadManager':'https://www.freedownloadmanager.org/','Giorgiotani.Peazip':'https://peazip.github.io/',
 'RARLab.WinRAR':'https://www.win-rar.com/','voidtools.Everything':'https://www.voidtools.com/',
 'Tonec.InternetDownloadManager':'https://www.internetdownloadmanager.com/','Rufus.Rufus':'https://rufus.ie/',
 'Ventoy.Ventoy':'https://www.ventoy.net/','Ghisler.TotalCommander':'https://www.ghisler.com/',
 'clsid2.mpc-hc':'https://mpc-hc.org/','PeterPawlowski.foobar2000':'https://www.foobar2000.org/',
 'Nikse.SubtitleEdit':'https://www.nikse.dk/','Adobe.Acrobat.Reader.64-bit':'https://www.adobe.com/',
 'PDFgear.PDFgear':'https://www.pdfgear.com/','SumatraPDF.SumatraPDF':'https://www.sumatrapdfreader.org/',
 'ShareX.ShareX':'https://getsharex.com/','Ditto.Ditto':'https://ditto-cp.sourceforge.io/',
 'Flow-Launcher.Flow-Launcher':'https://www.flowlauncher.com/','KDE.Krita':'https://krita.org/',
 'DuongDieuPhap.ImageGlass':'https://imageglass.org/','dotPDN.PaintDotNet':'https://www.getpaint.net/',
 'Microsoft.PowerToys':'https://learn.microsoft.com/','KDE.Kdenlive':'https://kdenlive.org/',
 'Guru3D.Afterburner':'https://www.msi.com/','CrystalDewWorld.CrystalDiskMark':'https://crystalmark.info/',
 'REALiX.HWiNFO':'https://www.hwinfo.com/','CrystalDewWorld.CrystalDiskInfo':'https://crystalmark.info/',
 'RevoUninstaller.RevoUninstaller':'https://www.revouninstaller.com/','ElectronicArts.EADesktop':'https://www.ea.com/',
 'HeroicGamesLauncher.HeroicGamesLauncher':'https://heroicgameslauncher.com/','Playnite.Playnite':'https://playnite.link/',
 'Microsoft.Sysinternals.Autoruns':'https://learn.microsoft.com/','Microsoft.Sysinternals.ProcessExplorer':'https://learn.microsoft.com/',
 'Ubisoft.Connect':'https://www.ubisoft.com/','IDRIX.VeraCrypt':'https://www.veracrypt.fr/',
 'WinSCP.WinSCP':'https://winscp.net/','Samsung.SmartSwitch':'https://www.samsung.com/',
 'KDE.KDEConnect':'https://kdeconnect.kde.org/','LocalSend.LocalSend':'https://localsend.org/',
 'Apple.iTunes':'https://www.apple.com/','rocksdanister.LivelyWallpaper':'https://www.rocksdanister.com/lively/',
 'Microsoft.WindowsTerminal':'https://learn.microsoft.com/','xanderfrangos.twinkletray':'https://twinkletray.com/',
 'Rainmeter.Rainmeter':'https://www.rainmeter.net/'
};
function decodeIco(bytes){
 if(bytes.length<6||bytes.readUInt16LE(0)!==0||bytes.readUInt16LE(2)!==1)return bytes;
 const frames=[];for(let i=0;i<bytes.readUInt16LE(4);i++){const p=6+i*16;const size=bytes.readUInt32LE(p+8),offset=bytes.readUInt32LE(p+12);frames.push({w:bytes[p]||256,h:bytes[p+1]||256,data:bytes.subarray(offset,offset+size)});}
 frames.sort((a,b)=>b.w-a.w);
 const png=frames.find(x=>x.data.subarray(1,4).toString()==='PNG');if(png)return png.data;
 const frame=frames.find(x=>x.data.length>=40&&[1,4,8,24,32].includes(x.data.readUInt16LE(14)));if(!frame)throw Error('Unsupported ICO bitmap');
 const {w,h,data}=frame,header=data.readUInt32LE(0),bits=data.readUInt16LE(14),palette=bits<=8?(data.readUInt32LE(32)||2**bits):0,start=header+palette*4,stride=Math.ceil(w*bits/32)*4,maskStride=Math.ceil(w/32)*4,rgba=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const row=h-1-y,to=(y*w+x)*4,byte=start+row*stride+Math.floor(x*bits/8);let color=byte;if(bits<=8){const index=(data[byte]>>(8-bits-(x*bits%8)))&((1<<bits)-1);color=header+index*4;}rgba[to]=data[color+2];rgba[to+1]=data[color+1];rgba[to+2]=data[color];const mask=data[start+stride*h+row*maskStride+Math.floor(x/8)]||0;rgba[to+3]=bits===32?data[color+3]:((mask>>(7-x%8))&1?0:255);}
 if(bits===32&&!rgba.some((v,i)=>i%4===3&&v>0)){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const mask=data[start+stride*h+(h-1-y)*maskStride+Math.floor(x/8)]||0;rgba[(y*w+x)*4+3]=(mask>>(7-x%8))&1?0:255;}}
 return {rgba,w,h};
}
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(16000),headers:{'User-Agent':'FreshBox-icon-maintenance'}});if(!r.ok)throw Error(`HTTP ${r.status}`);const b=Buffer.from(await r.arrayBuffer());if(b.length>4*1024*1024)throw Error('image too large');return b;}
async function writeIcon(bytes,target){const decoded=decodeIco(bytes);let image=decoded.rgba?sharp(decoded.rgba,{raw:{width:decoded.w,height:decoded.h,channels:4}}):sharp(decoded,{density:144});const m=await image.metadata();if(m.width<16||m.height<16)throw Error('Icon too small');const buffer=await image.resize(96,96,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90}).toBuffer();const stats=await sharp(buffer).stats();if(stats.channels.length===4&&stats.channels[3].max===0)throw Error('Invisible icon');fs.writeFileSync(target,buffer);}
(async()=>{
  const tree=await (await fetch('https://api.github.com/repos/homarr-labs/dashboard-icons/git/trees/main?recursive=1')).json();
  const available=new Set((tree.tree||[]).map(x=>x.path));
  const records=[];let cursor=0;
  const previous=fs.existsSync(path.join(root,'assets/icon-sources.json'))?JSON.parse(fs.readFileSync(path.join(root,'assets/icon-sources.json'),'utf8')):[];
  await Promise.all(Array.from({length:8},async()=>{while(cursor<catalog.length){
    const item=catalog[cursor++],target=path.join(root,'assets','icons',`${item.icon}.webp`);
    const cached=previous.find(x=>x.id===item.id&&x.source&&x.source!=='existing-local-icon'&&!x.source.includes('github.com/fluidicon'));
    const invisible=fs.existsSync(target)?await sharp(target).stats().then(s=>s.channels.length===4&&s.channels[3].max===0):true;
    if(process.argv.includes('--retry')&&cached&&fs.existsSync(target)&&!invisible&&(!directIcons[item.id]||cached.source===directIcons[item.id])){records.push(cached);continue;}
    const slug=aliases[item.id]||item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const candidates=[];
    if(directIcons[item.id])candidates.push(directIcons[item.id]);
    for(const ext of ['webp','png','svg'])if(available.has(`${ext}/${slug}.${ext}`))candidates.push(`https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/${ext}/${slug}.${ext}`);
    const entry=audit.find(x=>x.id===item.id);
    if(officialSites[item.id]||entry?.homepage){const origin=new URL(officialSites[item.id]||entry.homepage).origin.replace(/^http:/,'https:');
      try{const html=(await get(origin)).toString();const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]).filter(x=>/rel\s*=\s*["'][^"']*(?:icon)/i.test(x));for(const tag of links){const href=tag.match(/href\s*=\s*["']([^"']+)/i)?.[1];if(href)candidates.push(new URL(href,origin).href);}}catch{}
      candidates.push(`${origin}/favicon.ico`,`${origin}/favicon.png`);
    }
    let source;for(const url of [...new Set(candidates)]){try{await writeIcon(await get(url),target);source=url;break;}catch{}}
    if(!source&&fs.existsSync(target)&&!invisible)source='existing-local-icon';
    records.push({id:item.id,icon:item.icon,source:source||null,sha256:fs.existsSync(target)?crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'):null});
    console.log(`${records.length}/${catalog.length} ${item.name}: ${source||'MISSING'}`);
  }}));
  fs.writeFileSync(path.join(root,'assets','icon-sources.json'),JSON.stringify(records,null,2));
  console.log('Missing:',records.filter(x=>!x.source).map(x=>x.id));
})().catch(e=>{console.error(e);process.exitCode=1});
