const catalog = require('./reviewed-catalog');
const byId = new Map(catalog.map(item => [item.id,item]));
function resolveSelection(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > catalog.length) throw new Error('انتخاب برنامه معتبر نیست.');
  return [...new Set(ids)].map(id => {const item=byId.get(id);if(!item)throw new Error('برنامه در فهرست معتبر وجود ندارد.');return item;});
}
function installArgs(item, location='') {
  const args=['install','--id',item.id,'--exact','--source',item.source,'--silent','--accept-package-agreements','--accept-source-agreements','--disable-interactivity'];
  if(location && location.toLowerCase()!=='c:\\program files' && item.source!=='msstore') {
    if(!/^[a-z]:\\[^"<>|?*\x00-\x1f]*$/i.test(location))throw new Error('مسیر نصب باید مطلق و معتبر باشد؛ مثل D:\\Apps');
    // Give every installer its own directory rather than sharing one target folder.
    args.push('--location',require('node:path').win32.join(location,item.name.replace(/[<>:"/\\|?*]/g,'_')));
  }
  return args;
}
module.exports={resolveSelection,installArgs};
