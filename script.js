document.addEventListener('DOMContentLoaded', () => {
  const surahSelect = document.getElementById('surahSelect');
  const quranContainer = document.getElementById('quranContainer');
  const searchInput = document.getElementById('searchInput');
  const themeToggleBtn = document.getElementById('themeToggle');
  const bookmarkBox = document.getElementById('bookmarkBox');
  const bookmarkInfo = document.getElementById('bookmarkInfo');
  const btnGoBookmark = document.getElementById('btnGoBookmark');

  // Event Elements
  const btnEventInfo = document.getElementById('btnEventInfo');
  const eventModal = document.getElementById('eventModal');
  const closeModal = document.getElementById('closeModal');
  const eventListContainer = document.getElementById('eventListContainer');
  const btnAddEvent = document.getElementById('btnAddEvent');
  const eventFormContainer = document.getElementById('eventFormContainer');
  const btnSaveEvent = document.getElementById('btnSaveEvent');

  const ADMIN_PASSWORD = "1234"; // Ganti password admin di sini!

  // 1. Ambil daftar surah
  async function getSurahList() {
    try {
      const response = await fetch('https://equran.id/api/v2/surat');
      const result = await response.json();
      
      result.data.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.nomor;
        option.textContent = `${surah.nomor}. ${surah.namaLatin} (${surah.nama})`;
        surahSelect.appendChild(option);
      });

      checkBookmark();
    } catch (error) {
      console.error('Gagal mengambil daftar surah:', error);
    }
  }

  // 2. Ambil isi ayat
  async function loadSurah(targetAyat = null) {
    const surahNumber = surahSelect.value;
    if (!surahNumber) {
      quranContainer.innerHTML = '';
      return;
    }

    quranContainer.innerHTML = '<p style="text-align:center;">Memuat ayat...</p>';

    try {
      const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
      const result = await response.json();
      const ayatList = result.data.ayat;
      const surahName = result.data.namaLatin;

      quranContainer.innerHTML = '';
      ayatList.forEach(ayat => {
        const ayatDiv = document.createElement('div');
        ayatDiv.className = 'ayat-card';
        ayatDiv.id = `ayat-${ayat.nomorAyat}`;
        ayatDiv.innerHTML = `
          <div class="arabic">${ayat.teksArab} <span>(${ayat.nomorAyat})</span></div>
          <div class="translation"><strong>${ayat.nomorAyat}.</strong> ${ayat.teksIndonesia}</div>
          <audio controls>
            <source src="${ayat.audio['05']}" type="audio/mp3">
          </audio>
          <div class="ayat-actions">
            <button class="btn-action" onclick="saveBookmark(${surahNumber}, '${surahName}', ${ayat.nomorAyat})">📌 Tandai</button>
            <button class="btn-action" onclick="copyAyat(\`${ayat.teksArab}\`, \`${ayat.teksIndonesia}\`)">📋 Salin</button>
          </div>
        `;
        quranContainer.appendChild(ayatDiv);
      });

      if (targetAyat) {
        setTimeout(() => {
          const el = document.getElementById(`ayat-${targetAyat}`);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }

    } catch (error) {
      quranContainer.innerHTML = '<p style="text-align:center;">Gagal memuat ayat.</p>';
    }
  }

  // 3. FITUR EVENT & INFO
  btnEventInfo.addEventListener('click', () => {
    eventModal.style.display = 'block';
    renderEvents();
  });

  closeModal.addEventListener('click', () => {
    eventModal.style.display = 'none';
    eventFormContainer.style.display = 'none';
  });

  // Proteksi Tombol Tambah Event khusus kamu
  btnAddEvent.addEventListener('click', () => {
    const pass = prompt("Masukkan kata sandi Admin/Pemilik untuk menambah event:");
    if (pass === ADMIN_PASSWORD) {
      eventFormContainer.style.display = 'block';
    } else if (pass !== null) {
      alert("Kata sandi salah! Hanya pemilik yang bisa menambah event.");
    }
  });

  // Simpan Event
  btnSaveEvent.addEventListener('click', () => {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    const img = document.getElementById('eventImage').value;
    const desc = document.getElementById('eventDesc').value;

    if (!title || !time) {
      alert("Judul dan Waktu event wajib diisi!");
      return;
    }

    const events = JSON.parse(localStorage.getItem('quranEvents') || '[]');
    events.push({ title, time, img, desc });
    localStorage.setItem('quranEvents', JSON.stringify(events));

    // Reset Form
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventImage').value = '';
    document.getElementById('eventDesc').value = '';
    eventFormContainer.style.display = 'none';

    renderEvents();
  });

  // Render/Tampilkan List Event
  function renderEvents() {
    const events = JSON.parse(localStorage.getItem('quranEvents') || '[]');
    
    if (events.length === 0) {
      eventListContainer.innerHTML = '<div class="empty-info">tidak ada event atau info pada saat ini</div>';
      return;
    }

    eventListContainer.innerHTML = '';
    events.forEach(item => {
      const formattedTime = new Date(item.time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-time">⏰ Waktu: ${formattedTime}</div>
        <h4 style="margin: 5px 0;">${item.title}</h4>
        <p style="font-size: 13px; margin: 5px 0;">${item.desc}</p>
        ${item.img ? `<img src="${item.img}" alt="Gambar Event">` : ''}
      `;
      eventListContainer.appendChild(card);
    });
  }

  // 4. Bookmark & Fitur Lainnya
  window.saveBookmark = (surahNum, surahName, ayatNum) => {
    localStorage.setItem('quranBookmark', JSON.stringify({ surahNum, surahName, ayatNum }));
    alert(`Berhasil menandai Surah ${surahName} ayat ${ayatNum}`);
    checkBookmark();
  };

  function checkBookmark() {
    const saved = localStorage.getItem('quranBookmark');
    if (saved) {
      const data = JSON.parse(saved);
      bookmarkInfo.textContent = `${data.surahName} (Ayat ${data.ayatNum})`;
      bookmarkBox.style.display = 'flex';
    } else {
      bookmarkBox.style.display = 'none';
    }
  }

  btnGoBookmark.addEventListener('click', () => {
    const saved = localStorage.getItem('quranBookmark');
    if (saved) {
      const data = JSON.parse(saved);
      surahSelect.value = data.surahNum;
      loadSurah(data.ayatNum);
    }
  });

  window.copyAyat = (arab, indo) => {
    navigator.clipboard.writeText(`${arab}\n\nArtinya: "${indo}"`).then(() => {
      alert('Ayat berhasil disalin!');
    });
  };

  function filterSurah() {
    const filter = searchInput.value.toLowerCase();
    const options = surahSelect.getElementsByTagName('option');
    for (let i = 1; i < options.length; i++) {
      options[i].style.display = options[i].textContent.toLowerCase().includes(filter) ? '' : 'none';
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggleBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Mode Terang' : '🌙 Mode Gelap';
  });

  surahSelect.addEventListener('change', () => loadSurah());
  searchInput.addEventListener('keyup', filterSurah);

  getSurahList();
});