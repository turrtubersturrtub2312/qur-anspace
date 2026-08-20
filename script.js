// ISI DENGAN API SUPABASE MILIKMU DARI SUPABASE.COM
const SUPABASE_URL = "https://PROJECT_KAMU.supabase.co";
const SUPABASE_KEY = "KEY_ANON_KAMU";
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

document.addEventListener('DOMContentLoaded', () => {
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

  const OWNER_PASSWORD = "sammy8";

  // --- PERBAIKAN MODE GELAP ---
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️ Mode Terang';
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggleBtn.textContent = isDark ? '☀️ Mode Terang' : '🌙 Mode Gelap';
  });

  // --- AL-QURAN DIGITAL ---
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
        
        const audioUrl = ayat.audio['05'] || ayat.audio['01'];

        ayatDiv.innerHTML = `
          <div class="arabic">${ayat.teksArab} <span>(${ayat.nomorAyat})</span></div>
          <div class="translation"><strong>${ayat.nomorAyat}.</strong> ${ayat.teksIndonesia}</div>
          <audio controls preload="none">
            <source src="${audioUrl}" type="audio/mp3">
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

  // --- DATABASE ONLINE EVENT (SUPABASE) ---
  btnEventInfo.addEventListener('click', () => {
    eventModal.style.display = 'block';
    renderEvents();
  });

  closeModal.addEventListener('click', () => eventModal.style.display = 'none');

  async function renderEvents() {
    eventListContainer.innerHTML = '<p style="text-align:center;">Memuat event dari cloud...</p>';

    if (!supabase) {
      eventListContainer.innerHTML = '<div class="empty-info">Supabase belum dikonfigurasi! Isi SUPABASE_URL dan SUPABASE_KEY di script.js</div>';
      return;
    }

    const { data: events, error } = await supabase.from('events').select('*').order('id', { ascending: false });

    if (error || !events || events.length === 0) {
      eventListContainer.innerHTML = '<div class="empty-info">tidak ada event atau info pada saat ini</div>';
      return;
    }

    eventListContainer.innerHTML = '';
    events.forEach((item) => {
      const formattedTime = new Date(item.time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div style="font-size: 11px; opacity: 0.7;">⏰ Waktu: ${formattedTime}</div>
        <h4 style="margin: 5px 0;">${item.title}</h4>
        <p style="font-size: 13px; margin: 5px 0;">${item.desc}</p>
        ${item.img ? `<img src="${item.img}" style="max-width:100%; border-radius: 6px; margin-top: 5px;">` : ''}
        <br>
        <button onclick="deleteEvent(${item.id})" style="background:red; color:white; font-size:10px; margin-top:5px; padding:3px 7px;">Hapus Event</button>
      `;
      eventListContainer.appendChild(card);
    });
  }

  window.deleteEvent = async (id) => {
    if(!confirm("Yakin ingin menghapus event ini?")) return;
    await supabase.from('events').delete().eq('id', id);
    renderEvents();
  };

  // --- LOGIN OWNER & SIMPAN EVENT ---
  btnAdminAccess.addEventListener('click', (e) => {
    e.preventDefault();
    const pass = prompt("Masukkan Kata Sandi Pemilik:");
    if (pass && pass.trim() === OWNER_PASSWORD) {
      alert("Login Berhasil!");
      eventModal.style.display = 'none';
      adminModal.style.display = 'block';
    } else if(pass !== null) {
      alert("Kata sandi salah!");
    }
  });

  closeAdminModal.addEventListener('click', () => adminModal.style.display = 'none');

  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value.trim();
    const time = document.getElementById('eventTime').value;
    const img = document.getElementById('eventImage').value.trim();
    const desc = document.getElementById('eventDesc').value.trim();

    const btn = document.getElementById('btnSaveEvent');
    btn.textContent = "Menyimpan ke Cloud...";
    btn.disabled = true;

    const { error } = await supabase.from('events').insert([{ title, time, img, desc }]);

    btn.textContent = "Simpan Event";
    btn.disabled = false;

    if (error) {
      alert("Gagal menyimpan ke cloud: " + error.message);
    } else {
      alert("Berhasil! Event tersimpan online dan bisa dilihat oleh teman kamu.");
      eventForm.reset();
      adminModal.style.display = 'none';
    }
  });

  window.addEventListener('click', (event) => {
    if (event.target === eventModal) eventModal.style.display = 'none';
    if (event.target === adminModal) adminModal.style.display = 'none';
  });

  // --- BOOKMARK & UTILITY ---
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