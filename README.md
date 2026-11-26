# FreshBox | فرش‌باکس

![FreshBox](assets/freshbox-logo.png)

[دانلود نسخه نصبی و پرتابل · Download Setup & Portable](https://github.com/Lastsaman/FreshBox/releases/latest)

## فارسی

فرش‌باکس ابزاری برای آماده‌کردن ویندوز تازه است: از میان ۱۴۵ برنامه کاربردی انتخاب کنید و نصب را به Windows Package Manager بسپارید. دسته‌بندی روشن، توضیح کاربرد هر برنامه، آیکون‌های WebP محلی، جست‌وجو، انتخاب گروهی، مسیر نصب دلخواه و گزارش پیشرفت در دسترس است. هیچ برنامه‌ای پیش‌فرض تیک ندارد.

رابط فارسی، انگلیسی و روسی دارد. شناسه و منبع هر برنامه صریح است؛ واتس‌اپ از Microsoft Store دریافت می‌شود. نرم‌افزارهای تجاری همچنان به مجوز خودشان نیاز دارند. مسیر سفارشی فقط برای نصاب‌های پشتیبان آن اعمال می‌شود.

**نصب:** فایل Setup را از Releases دریافت و اجرا کنید. **پرتابل:** فایل Portable.zip را کامل استخراج و `FreshBox.exe` را اجرا کنید؛ DLLها و پوشه resources باید کنار EXE بمانند.

پیش‌نیاز: Windows 10/11 نسخه ۶۴ بیتی، اینترنت و WinGet. دریافت بسته‌های Store ممکن است به دسترسی فروشگاه نیاز داشته باشد. درخواست‌های امنیتی ویندوز و نصاب‌ها باید توسط کاربر تأیید شوند.

## English

FreshBox helps set up a freshly installed Windows PC. Select from 145 practical applications and install them through Windows Package Manager. It includes clear categories, Persian application descriptions, bundled WebP icons, search, batch selection, a custom installation folder, and progress logs. Nothing is selected by default.

The interface supports Persian, English, and Russian. Each application has an explicit package ID and source. WhatsApp uses Microsoft Store. Commercial applications still require their own licenses, and custom install folders only work with installers that support them.

**Setup:** download and run the Setup executable from Releases. **Portable:** extract the entire Portable.zip archive and run `FreshBox.exe`; keep its DLLs and resources directory beside it.

Requires 64-bit Windows 10/11, an internet connection, and WinGet. Store packages require Microsoft Store access. Windows and installer security prompts remain under the user's control.

## Development / توسعه

```powershell
npm ci
npm start
npm test
npm run audit:catalog
node tools/smoke-ui.js
npm run build:all
```

Electron and plain JavaScript; the catalog is in `reviewed-catalog.js`. The build stages clean application files in `release-source`. Reports live in `reports`.

الکترون و جاوااسکریپت ساده؛ فهرست برنامه‌ها در فایل بالا و گزارش بررسی منابع در پوشه reports است. ساخت از پوشه تمیز release-source انجام می‌شود.

## Verification / حدود آزمون

All 145 package identities were checked. 144 direct installer URLs responded successfully, and one Store identity was verified. Two sample installers (7-Zip and SumatraPDF) were fully downloaded and hash-checked. Every application has a local WebP image; some Windows components use their publisher's mark. See [icon sources and notices](THIRD_PARTY_NOTICES.md).

شناسه‌های ۱۴۵ برنامه بررسی شده‌اند: لینک مستقیم ۱۴۴ نصاب پاسخ موفق داده و یک محصول Store تأیید شده است. دانلود کامل و صحت هش دو نمونه آزمایش شده؛ همه برنامه‌ها روی سیستم نصب نشده‌اند. دسترسی آینده لینک‌ها و موفقیت نصب روی همه دستگاه‌ها تضمین نمی‌شود.

Created by [lastsaman](https://t.me/LASTsaman) · ساخته‌شده توسط lastsaman
