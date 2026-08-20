document.addEventListener('DOMContentLoaded', () => {
  // Selectors
  const surahSelect = document.getElementById('surahSelect');
  const quranContainer = document.getElementById('quranContainer');
  const searchInput = document.getElementById('searchInput');
  const themeToggleBtn = document.getElementById('themeToggle');
  const bookmarkBox = document.getElementById('bookmarkBox');
  const bookmarkInfo = document.getElementById('bookmarkInfo');
  const btnGoBookmark = document.getElementById('btnGoBookmark');

  const btnEventInfo = document.getElementById('btnEventInfo');
  const eventModal = document.getElementById('eventModal');
  const closeModal = document.getElementById('closeModal');
  const eventListContainer = document.getElementById('eventListContainer');

  const btnAdminAccess = document.getElementById('btnAdminAccess');
  const adminModal = document.getElementById('adminModal');
  const closeAdminModal = document.getElementById('closeAdminModal');
  const eventForm = document.getElementById('eventForm');

  // Password Owner
  const OWNER_PASSWORD = "sammy8";

  // 1. Ambil Daftar Surah
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

  // 2. Load Ayat Surah + Audio Lengkap
  async function loadSurah(targetAyat = null) {
    const surahNumber = surahSelect.value;
    if (!surahNumber) {
      quranContainer.innerHTML = '';
      return;
    }

    quranContainer.innerHTML = '<p style="text-align:center;">Memuat ayat dan audio...</p>';

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
        
        // Memasang Audio Murottal per ayat
        const audioUrl = ayat.audio['05'] || ayat.audio['01'];

        ayatDiv.innerHTML = `
          <div class="arabic">${ayat.teksArab} <span>(${ayat.nomorAyat})</span></div>
          <div class="translation"><strong>${ayat.nomorAyat}.</strong> ${ayat.teksIndonesia}</div>
          
          <!-- Pemutar Audio Al-Qur'an -->
          <audio controls preload="none">
            <source src="${audioUrl}" type="audio/mp3">
            Browser kamu tidak mendukung pemutar audio.
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

  // 3. Modal Event Info
  btnEventInfo.addEventListener('click', () => {
    eventModal.style.display = 'block';
    renderEvents();
  });

  closeModal.addEventListener('click', () => {
    eventModal.style.display = 'none';
  });

  function renderEvents() {
    const events = JSON.parse(localStorage.getItem('quranEvents') || '[]');
    
    if (events.length === 0) {
      eventListContainer.innerHTML = '<div class="empty-info">tidak ada event atau info pada saat ini</div>';
      return;
    }

    eventListContainer.innerHTML = '';
    events.forEach((item, index) => {
      const formattedTime = new Date(item.time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div style="font-size: 11px; color: #888;">⏰ Waktu: ${formattedTime}</div>
        <h4 style="margin: 5px 0;">${item.title}</h4>
        <p style="font-size: 13px; margin: 5px 0;">${item.desc}</p>
        ${item.img ? `<img src="${item.img}" style="max-width:100%; border-radius: 6px; margin-top: 5px;">` : ''}
        <br>
        <button onclick="deleteEvent(${index})" style="background:red; color:white; font-size:10px; margin-top:5px; padding:3px 7px;">Hapus Event</button>
      `;
      eventListContainer.appendChild(card);
    });
  }

  // Hapus Event
  window.deleteEvent = (index) => {
    const events = JSON.parse(localStorage.getItem('quranEvents') || '[]');
    events.splice(index, 1);
    localStorage.setItem('quranEvents', JSON.stringify(events));
    renderEvents();
  };

  // 4. Login Owner
  btnAdminAccess.addEventListener('click', (e) => {
    e.preventDefault();

    const pass = prompt("Masukkan Kata Sandi Pemilik:");

    if (pass === null) return;

    if (pass.trim() === OWNER_PASSWORD) {
      alert("Login Berhasil! Membuka Panel Pemilik...");
      eventModal.style.display = 'none';
      adminModal.style.display = 'block';
    } else {
      alert("Kata sandi salah! Akses ditolak.");
    }
  });

  closeAdminModal.addEventListener('click', () => {
    adminModal.style.display = 'none';
  });

  // 5. Simpan Event Baru
  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value.trim();
    const time = document.getElementById('eventTime').value;
    const img = document.getElementById('eventImage').value.trim();
    const desc = document.getElementById('eventDesc').value.trim();

    const events = JSON.parse(localStorage.getItem('quranEvents') || '[]');
    events.push({ title, time, img, desc });
    
    localStorage.setItem('quranEvents', JSON.stringify(events));

    alert("Event berhasil ditambahkan!");
    eventForm.reset();
    adminModal.style.display = 'none';
  });

  // 6. Penutupan Modal Area Luar
  window.addEventListener('click', (event) => {
    if (event.target === eventModal) eventModal.style.display = 'none';
    if (event.target === adminModal) adminModal.style.display = 'none';
  });

  // 7. Bookmark & Fitur Salin
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
      bookmarkBox.style.display = 'block';
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

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  surahSelect.addEventListener('change', () => loadSurah());
  
  searchInput.addEventListener('keyup', () => {
    const filter = searchInput.value.toLowerCase();
    const options = surahSelect.getElementsByTagName('option');
    for (let i = 1; i < options.length; i++) {
      options[i].style.display = options[i].textContent.toLowerCase().includes(filter) ? '' : 'none';
    }
  });

  getSurahList();
});