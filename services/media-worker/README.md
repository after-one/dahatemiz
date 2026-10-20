# Private Media Worker

Phase 4'te başlayan bu yerel worker, JPEG ve PNG görsellerdeki olası yüz ve plaka bölgelerini OpenCV cascade
detektörleriyle bulup bulanık bir türev üretir. Yüz tanıma, kişi eşleştirme veya kimlik tespiti yapmaz. Çıktıdaki
detektör sayıları yalnızca teknik bulgudur; anonimlik veya yayın güvenliği garantisi değildir. Her çıktı insan
incelemesi gerektirir.

## Yerel kurulum

Python 3.12 veya üstünü kullan. Bağımlılıkları sanal ortama kur:

```sh
cd services/media-worker
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
```

En az 32 baytlık bir `MEDIA_WORKER_SHARED_SECRET` değerini ortam değişkeni olarak ayarla, ardından servisi başlat:

```sh
export MEDIA_WORKER_SHARED_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
python -m app.server
```

Servis varsayılan olarak yalnızca `127.0.0.1:8081` adresinde dinler. `MEDIA_WORKER_HOST` veya `MEDIA_WORKER_PORT`
değerlerini değiştirirken erişimi özel ağla sınırla ve dış erişimi kapalı tut. Bu demo sunucusu tek başına TLS veya
dağıtık sır yönetimi sağlamaz.

## İç işleyiş

- `POST /v1/transform` yalnızca `image/jpeg` veya `image/png` ve Bearer paylaşımlı sır kabul eder.
- İstek boyutu en fazla 12 MiB, çözünürlük en fazla 16 megapiksel ve en uzun kenar 10.000 pikseldir.
- Yüz ve plaka alanları genişletilerek mozaik ve güçlü Gauss bulanıklaştırma uygulanır. EXIF gibi kaynak metadata'sı
  JPEG türevine taşınmaz.
- Yanıt `Cache-Control: no-store`, tespit bölgesi sayıları ve daima `X-Human-Review-Required: true` başlıklarını taşır.
- Görsel nesnesi veya URL'si loglanmaz; worker girdi ya da çıktı dosyasını kalıcı diske yazmaz.
- Cascade tespitleri kaçırma veya yanlış bulgu üretebilir. Özellikle Türkiye plakalarında algılama başarımı henüz
  ölçülmedi. Moderatör türevi özgün kanıtla karşılaştırmalı ve kişileri tanımlayabilecek alanları ayrıca incelemelidir.
- Worker hiçbir içeriği yayınlamaz, veritabanı veya Cloud Storage ile konuşmaz. Türevi ayrı, özel erişimli alanda
  saklama, moderatör incelemesi ve yayın onayı entegrasyonu yapılana kadar bu worker pilotta kullanılamaz.

## Kontroller

Repo kökünden çalıştır:

```sh
python3 -m unittest discover -s services/media-worker/tests -v
```

Testler tespit edilen alanların bulanıklaştırılmasını, boyut ve biçim sınırlarını, kimlik doğrulamayı, cache
başlıklarını ve insan incelemesi zorunluluğunu kapsar. Görüntü örnekleri sentetiktir; gerçek yüz veya plaka görseli
kullanılmaz.
