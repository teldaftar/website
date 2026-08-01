# Teldaftar — favicon to'plami

Asosiy belgi: telefon shakli ichida daftar chiziqlari. Brend rangi `#0F766E`.

## Fayllar

| Fayl | Nima uchun |
|---|---|
| `teldaftar-icon.svg` | Asosiy vektor belgi — zamonaviy brauzerlar shuni ishlatadi |
| `favicon.ico` | 16/32/48 px, eski brauzerlar va Windows uchun |
| `favicon-16x16.png`, `favicon-32x32.png` | Aniq o'lchamdagi PNG'lar |
| `apple-touch-icon.png` | 180x180, iOS "Add to Home Screen" (burchaklari to'g'ri — iOS o'zi yumaloqlaydi) |
| `icon-192.png`, `icon-512.png` | PWA / Android |
| `icon-512-maskable.png` | Android adaptive icon (belgi xavfsiz zonaga kichraytirilgan) |
| `site.webmanifest` | PWA manifest |
| `preview-512.png` | Katta ko'rinish |
| `alternatives/` | Tanlanmagan variantlar (SVG) |

Hamma fayl `public/` papkasining ildiziga tushadi (Nuxt/Vite uchun `public/`).

## `index.html` ichiga

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/teldaftar-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0F766E">
```

## Rangni o'zgartirish

SVG fayllarida `#0F766E` ni izlab almashtirsang bo'ldi — boshqa hech narsani tegizish shart emas. Keyin PNG'larni qayta chiqarish kerak bo'ladi.
