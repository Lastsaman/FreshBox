const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const {resolveSelection,installArgs} = require('./install-plan');
let jobBusy = false;
// Keep two WinGet jobs active to shorten batch setup time without saturating
// a new PC's disk or making installer prompts compete with each other.
const INSTALL_CONCURRENCY = Math.max(1, Math.min(2, Number(process.env.FRESHBOX_INSTALL_CONCURRENCY) || 2));
const DOWNLOAD_ATTEMPTS = 2;

const startupLog = path.join(app.getPath('temp'), 'FreshBox-startup.log');
function startup(message) {
  try { fs.appendFileSync(startupLog, `[${new Date().toISOString()}] ${message}\n`); } catch (_) {}
}

function writeJobLog(entry) {
  try {
    const dir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'FreshBox-installs.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
  } catch (_) {}
}

// Some Windows GPU drivers crash Chromium before the renderer can create a window.
// FreshBox is an installer utility, so reliable rendering is more important than GPU acceleration.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('in-process-gpu');
app.setPath('cache', path.join(app.getPath('temp'), 'FreshBox-cache'));

function createWindow() {
  startup(`createWindow __dirname=${__dirname}`);
  const win = new BrowserWindow({
    width: 1480, height: 920, minWidth: 1050, minHeight: 680,
    backgroundColor: '#0b1020', icon: path.join(__dirname, 'assets', 'freshbox-logo.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'https://t.me/LASTsaman' || url === 'https://t.me/LASTsaman/') shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('did-fail-load', (_event, code, description, url) => startup(`did-fail-load code=${code} description=${description} url=${url}`));
  win.webContents.on('render-process-gone', (_event, details) => startup(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`));
  win.loadFile(path.join(__dirname, 'index.html')).catch(error => startup(`loadFile-error ${error.message}`));
}

function streamWinget(sender, args, id, total, type, { emitTerminal = true } = {}) {
  return new Promise(resolve => {
    const child = spawn('winget', args, { windowsHide: true, shell: false });
    let output = '';
    let buffer = '';
    let lastProgress = -1;
    let lastPhase = '';
    let settled = false;
    const startedAt = Date.now();
    const sendLine = line => {
      const text = String(line || '').trim();
      if (!text) return;
      output = `${output}\n${text}`.slice(-3000);
      const match = text.match(/(\d{1,3})\s*%/);
      const percent = match ? Math.max(0, Math.min(100, Number(match[1]))) : undefined;
      const phase = /download|downloading|دانلود/i.test(text) ? 'در حال دانلود' : /install|installing|نصب/i.test(text) ? 'در حال نصب' : lastPhase || 'در حال پردازش';
      if (percent !== undefined) lastProgress = percent;
      if (phase) lastPhase = phase;
      sender.send('job-progress', { id, state: 'running', message: text, phase: lastPhase, percent: lastProgress >= 0 ? lastProgress : 0, total });
    };
    const read = chunk => {
      buffer += chunk.toString();
      buffer = buffer.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
      const lines = buffer.split(/[\r\n]+/);
      buffer = lines.pop() || '';
      lines.forEach(sendLine);
    };
    child.stdout.on('data', read);
    child.stderr.on('data', read);
    child.on('error', error => {
      if (settled) return;
      settled = true;
      const message = error.code === 'ENOENT' ? 'WinGet روی این ویندوز پیدا نشد.' : error.message;
      if (emitTerminal) sender.send('job-progress', { id, state: 'failed', message, phase: 'خطا' });
      resolve({ id, ok: false, output: message, error: error.code || 'spawn-error' });
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      if (buffer.trim()) sendLine(buffer);
      const ok = code === 0;
      if (emitTerminal) sender.send('job-progress', { id, state: ok ? 'done' : 'failed', message: ok ? `${id} با موفقیت انجام شد` : `${id} با کد خطای ${code ?? 'نامشخص'} متوقف شد`, phase: ok ? 'کامل شد' : 'ناموفق', percent: ok ? 100 : lastProgress });
      resolve({ id, ok, output: output.trim().slice(-2400), code, elapsedMs: Date.now() - startedAt });
    });
  });
}

function isTransientDownloadFailure(result) {
  if (result.error === 'ENOENT') return false;
  return /(download|network|timeout|timed out|connection|temporar|0x8a150008|http\s*(429|5\d\d)|failed to connect)/i.test(result.output || '');
}

async function runWingetWithRetry(sender, args, id, total, type) {
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
    const result = await streamWinget(sender, args, id, total, type, { emitTerminal: attempt === DOWNLOAD_ATTEMPTS });
    if (result.ok || !isTransientDownloadFailure(result) || attempt === DOWNLOAD_ATTEMPTS) {
      if (!result.ok && attempt < DOWNLOAD_ATTEMPTS) sender.send('job-progress', { id, state: 'failed', message: `${id} با خطا متوقف شد`, phase: 'ناموفق', percent: 0 });
      writeJobLog({ type, id, ok: result.ok, attempt, code: result.code || result.error || null, elapsedMs: result.elapsedMs || null, output: result.output });
      return result;
    }
    sender.send('job-progress', { id, state: 'running', message: `${id}: تلاش دوباره برای دانلود (${attempt + 1}/${DOWNLOAD_ATTEMPTS})`, phase: 'تلاش دوباره', percent: 0 });
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
}

async function runConcurrent(plans, limit, worker) {
  const results = new Array(plans.length);
  let next = 0;
  async function consume() {
    while (true) {
      const index = next++;
      if (index >= plans.length) return;
      results[index] = await worker(plans[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, plans.length) }, consume));
  return results;
}

ipcMain.handle('run-winget', async (_event, ids, requestedLocation) => {
  if (jobBusy) throw new Error('یک عملیات دیگر در حال اجراست.');
  const items=resolveSelection(ids);
  const location=typeof requestedLocation==='string'?requestedLocation.trim():'';
  const plans=items.map(item=>({item,args:installArgs(item,location)}));
  jobBusy=true;
  const results=[];
  try {
    const concurrency = Math.min(INSTALL_CONCURRENCY, plans.length);
    _event.sender.send('job-start',{type:'install',total:items.length,concurrency});
    writeJobLog({ type: 'install-batch', total: items.length, concurrency, ids: items.map(item => item.id) });
    const completed = await runConcurrent(plans, concurrency, async ({item,args}) => {
      _event.sender.send('job-progress',{id:item.id,state:'running',message:`شروع ${item.name}`,phase:'آماده‌سازی',percent:0});
      return runWingetWithRetry(_event.sender,args,item.id,items.length,'install');
    });
    results.push(...completed);
    _event.sender.send('job-finished',{type:'install',results});
    return {ok:results.every(r=>r.ok),results};
  } finally {jobBusy=false;}
});

ipcMain.handle('check-winget', async (_event, ids) => {
  if(jobBusy)throw new Error('یک عملیات دیگر در حال اجراست.');
  const items=resolveSelection(ids);
  jobBusy=true;
  const results=[];
  try {
    _event.sender.send('job-start',{type:'check',total:items.length});
    for(const item of items) {
      const args=['show','--id',item.id,'--exact','--source',item.source,'--accept-source-agreements','--disable-interactivity'];
      const result=await new Promise(resolve=>execFile('winget',args,{windowsHide:true,timeout:60000},(error,stdout='',stderr='')=>resolve({id:item.id,ok:!error,output:(stdout+stderr).slice(-4000),error:error?.code||null})));
      results.push(result);
      writeJobLog({ type: 'check', id: item.id, ok: result.ok, code: result.error || null, output: result.output });
      _event.sender.send('job-progress',{id:item.id,state:result.ok?'done':'failed',message:result.ok?`${item.name}: شناسه و نسخه تأیید شد`:`${item.name}: ${result.output||result.error}`,phase:result.ok?'معتبر':'ناموفق',percent:result.ok?100:0});
    }
    _event.sender.send('job-finished',{type:'check',results});
    return {ok:results.every(r=>r.ok),results};
  } finally {jobBusy=false;}
});

ipcMain.handle('open-settings', async (_event, uri) => { await shell.openExternal(uri); return true; });
ipcMain.handle('choose-install-location', async () => { const result = await dialog.showOpenDialog({ title: 'انتخاب محل نصب', properties: ['openDirectory','createDirectory'] }); return result.canceled ? '' : (result.filePaths[0] || ''); });
ipcMain.handle('confirm-action', async (_event, message) => {
  const result = await dialog.showMessageBox({ type: 'warning', buttons: ['لغو', 'باز کردن تنظیمات'], defaultId: 0, cancelId: 0, title: 'تغییر تنظیمات ویندوز', message });
  return result.response === 1;
});

app.whenReady().then(() => { startup(`ready appPath=${app.getAppPath()}`); createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
