# 🧩 3D Rubik Küp Çözücü

🌐 **Web Sitesi:** **[https://ferhatsavtak.github.io/RubiksCubeSolver/](https://ferhatsavtak.github.io/RubiksCubeSolver/)**

---

## 📌 Proje Hakkında Ne Yapar?

Bu proje, elinizdeki karışık 3x3x3 Rubik Küpün renklerini kolayca sisteme aktarmanızı sağlayan ve ardından **Kociemba 2-Aşama (Two-Phase)** matematiksel algoritmasıyla küpü en kısa yoldan çözen interaktif bir 3D web uygulamasıdır.

Çözüm oluştuktan sonra tüm adımları canlı 3D animasyon eşliğinde, her biri tekil **90° çeyrek turlar** halinde elinizdeki fiziksel küple birebir eşzamanlı olarak takip edebilirsiniz.

---

## ✨ Projenin Özellikleri

### 1. 🎮 Çift Renk Giriş Sistemi
- **3D Küp Üzerinde Doğrudan Boyama:** Gerçekçi 3D küp modelini fare veya dokunmatik ekranla 360° serbestçe çevirebilir, seçtiğiniz renkle dilediğiniz kareye dokunarak renklendirebilirsiniz.
- **Genişletilmiş 2D Açılmış Şema (Net):** Tüm 6 yüzeyi tek bir ekranda görüp üstteki renk paletinden hızlıca kareleri boyayabilirsiniz. Masaüstü ve mobil ekranlar için dokunması rahat, büyük kare boyutlarına sahiptir.
- **Canlı Renk Sayaçları:** Her renkten tam olarak 9 adet girilip girilmediğini anlık olarak takip eden akıllı sayaçlar (`9/9`).

### 2. ⚡ Kociemba 2-Aşama Çözüm Motoru (min2phase)
- Dünya çapında hız küpü yarışmalarında kullanılan algoritma entegrasyonu sayesinde küpün durumunu **1-2 milisaniye** içinde hesaplar.
- Herhangi bir geçerli küp durumunu ortalama **20-22 hamle veya daha azında** en optimal şekilde çözer.

### 3. 🎯 Tek Tek ve Net 90° Çeyrek Tur Hamleleri
- Takip etmesi güç olan 180° ikili hamleler (`U2`, `R2`, `F2` vb.) otomatik olarak **iki ayrı 90° adıma** dönüştürülür.
- Çözüm esnasında her hamle kesinlikle tek bir 90° çeyrek turdur.
- Her adım için yön ve derece bilgisi açıkça verilir (`90° Yukarı`, `90° Aşağı`, `90° Saat Yönü`, `90° Ters Yön`).
- Aynı yüzeyde ardışık yapılan hamlelerde kart üzerinde bilgilendirme gösterilir (*"Aynı yönde 90° daha çevirin (2. tur)"*).

### 4. 🎬 3D Çözüm Oynatıcısı ve Adım Takibi
- **Görsel Katman Vurgusu:** Dönmekte olan katmanın kareleri dönüş süresince parlayarak vurgulanır; gözünüz hangi katmanın hareket ettiğini rahatça yakalar.
- **Oynat / Duraklat:** Çözüm hamlelerini otomatik izleyin veya `[Önceki]` / `[Sonraki]` butonlarıyla tek tek uygulayın.
- **Hamleler Arası Belirgin Duraklama:** Otomatik oynatma sırasında her hamle tamamlandıktan sonra duraklayarak kullanıcının elindeki küpü çevirmesine imkan tanır.
- **4 Farklı Hız Seçeneği:**
  - `Çok Yavaş (1100ms)` – Yeni başlayanlar ve gerçek küple takip edenler için sindirerek oynatma
  - `Yavaş (700ms)`
  - `Normal (380ms)`
  - `Hızlı (180ms)`
- **Zaman Çizelgesi (Slider):** Çözümün herhangi bir anına doğrudan atlayabilme.
- **Etkileşimli Hamle Çipleri:** Tüm hamle listesinde tıklanan adıma anında geçiş.

### 5. 📱 Sıfır Kaydırmalı Mobil Deneyim (Mobile-First)
- Mobil cihazlarda ekran yüksekliğine tam oturur (`100dvh`, `overflow: hidden`); çözüm adımları ilerlerken sayfa asla aşağı kaymaz veya zıplamaz.
- Üstte 3D küp, altta ise kontroller tek bir ekranda kaydırma yapmaya gerek kalmadan başparmak mesafesinde toplanmıştır.
- Dokunmatik ekranlarda tek parmakla çevirme ve iki parmakla yakınlaştırma desteği.

### 6. 🛡️ Akıllı Fiziksel Doğrulama (Validator)
- Küp çözülmeden önce fiziksel geçerliliği denetlenir:
  - Eksik veya fazla renkler,
  - Karşıt renklerin aynı kenarda bulunması gibi imkansız parçalar,
  - Tekrarlanan köşe/kenar parçaları,
  - Küpün parçalarının yanlış takılmasıyla oluşan köşe döndürme (*Corner Twist*), kenar tersliği (*Edge Flip*) ve parite hataları Türkçe olarak açıklanır.

### 7. 🔊 Web Audio API Ses Efektleri
- Her katman dönüşünde gerçekçi mekanik speedcube tıklama sesi.
- Çözüm bittiğinde melodik tamamlama akoru.
- İsteğe göre tek tıkla ses açma/kapatma.

### 8. 🎲 Hazır Karışımlar ve Özel Desenler
- **Rastgele Karıştır:** WCA standartlarında 20 hamlelik rastgele küp oluşturur.
- **Satranç Tahtası (Checkerboard)** deseni.
- **Süper Dönüş (Superflip)** deseni (Küpün en zor 20 hamlelik klasik hali).
- **Merkez Değişimi (6 Nokta)** deseni.
- **Basit Karışım (8 Hamle)**.
