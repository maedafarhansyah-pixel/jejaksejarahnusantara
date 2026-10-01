/* =========================================================
   core.js — State, Save/Load, Utilitas, Notifikasi
   Jejak Sejarah Nusantara
   ========================================================= */
const JN = (function () {
  "use strict";

  const KUNCI_SAVE = "jejak_sejarah_nusantara_save_v1";
  const VERSI_SAVE = 1;

  /* ---------- State Default ---------- */
  function stateBaru() {
    return {
      versi: VERSI_SAVE,
      dibuat: Date.now(),
      diubah: Date.now(),
      pemain: { nama: "Penjelajah", avatar: "🧭" },
      progres: {},
      eraTerbuka: ["era01"],
      kodeks: [],
      artefak: [],
      jurnal: [],
      pilihan: {},
      stat: { poinKronik: 0, akurasiBenar: 0, akurasiTotal: 0, empati: 0 }
    };
  }

  let S = null;

  /* ---------- Muat & Simpan ---------- */
  function muat() {
    try {
      const mentah = localStorage.getItem(KUNCI_SAVE);
      S = mentah ? JSON.parse(mentah) : stateBaru();
      if (!S.versi || S.versi < VERSI_SAVE) S = migrasi(S);
    } catch (e) {
      console.warn("Save rusak, membuat baru.", e);
      S = stateBaru();
    }
    return S;
  }

  function simpan() {
    if (!S) return;
    S.diubah = Date.now();
    try {
      localStorage.setItem(KUNCI_SAVE, JSON.stringify(S));
    } catch (e) {
      console.error("Gagal menyimpan:", e);
      if (typeof toast === "function") {
        toast("⚠️", "Penyimpanan penuh", "Progres mungkin tidak tersimpan.");
      }
    }
  }

  function migrasi(lama) {
    const baru = stateBaru();
    return Object.assign(baru, lama, { versi: VERSI_SAVE });
  }

  function reset() {
    S = stateBaru();
    simpan();
    return S;
  }

  function adaSave() {
    return !!localStorage.getItem(KUNCI_SAVE);
  }

  /* ---------- Getter ---------- */
  const get = () => S;

  /* ---------- Progres ---------- */
  function babSelesai(eraId, babId) {
    return !!(S.progres[eraId] && S.progres[eraId][babId] &&
              S.progres[eraId][babId].selesai);
  }

  function tandaiBabSelesai(eraId, babId, poin) {
    if (!S.progres[eraId]) S.progres[eraId] = {};
    const lama = S.progres[eraId][babId] || {};
    S.progres[eraId][babId] = {
      selesai: true,
      pecahan: true,
      poin: Math.max(lama.poin || 0, poin || 0)
    };
    simpan();
  }

  function progresEra(eraId, totalBab) {
    const p = S.progres[eraId] || {};
    const selesai = Object.values(p).filter(b => b.selesai).length;
    return {
      selesai,
      total: totalBab,
      persen: totalBab ? Math.round(selesai / totalBab * 100) : 0
    };
  }

  function bukaEra(eraId) {
    if (!S.eraTerbuka.includes(eraId)) {
      S.eraTerbuka.push(eraId);
      simpan();
    }
  }

  function eraTerbuka(eraId) {
    return S.eraTerbuka.includes(eraId);
  }

  /* ---------- Kodeks ---------- */
  function tambahKodeks(daftar) {
    if (!daftar || !daftar.length) return [];
    const baru = daftar.filter(id => !S.kodeks.includes(id));
    if (baru.length) {
      S.kodeks.push(...baru);
      simpan();
      baru.forEach(id => {
        const e = (window.KODEKS && window.KODEKS[id]) || null;
        toast("📖", "Entri Kodeks Baru", e ? e.judul : id);
      });
    }
    return baru;
  }

  function punyaKodeks(id) { return S.kodeks.includes(id); }

  /* ---------- Artefak ---------- */
  function tambahArtefak(daftar) {
    if (!daftar || !daftar.length) return [];
    const baru = daftar.filter(id => !S.artefak.includes(id));
    if (baru.length) {
      S.artefak.push(...baru);
      simpan();
      baru.forEach(id => {
        const a = (window.ARTEFAK && window.ARTEFAK[id]) || null;
        toast("🏺", "Artefak Ditemukan", a ? a.nama : id);
      });
    }
    return baru;
  }

  function punyaArtefak(id) { return S.artefak.includes(id); }

  /* ---------- Statistik ---------- */
  function tambahPoin(n) {
    if (!n) return;
    S.stat.poinKronik += n;
    simpan();
  }

  function catatAkurasi(benar, total) {
    S.stat.akurasiBenar += (benar || 0);
    S.stat.akurasiTotal += (total || 0);
    simpan();
  }

  function tambahEmpati(n) {
    if (!n) return;
    S.stat.empati += n;
    simpan();
  }

  function akurasiPersen() {
    if (!S.stat.akurasiTotal) return 0;
    return Math.round(S.stat.akurasiBenar / S.stat.akurasiTotal * 100);
  }

  /* ---------- Flag / Pilihan ---------- */
  function setFlag(nama, nilai) {
    S.pilihan[nama] = nilai === undefined ? true : nilai;
    simpan();
  }
  function ambilFlag(nama) { return S.pilihan[nama]; }

  /* ---------- Jurnal ---------- */
  function tambahJurnal(eraId, babId, pertanyaan, jawaban) {
    S.jurnal.push({
      era: eraId,
      bab: babId,
      tanya: pertanyaan,
      jawab: jawaban,
      waktu: Date.now()
    });
    simpan();
  }

  /* ---------- Efek (dipakai engine) ---------- */
  function terapkanEfek(efek) {
    if (!efek) return;
    if (efek.kodeks)  tambahKodeks(efek.kodeks);
    if (efek.artefak) tambahArtefak(efek.artefak);
    if (efek.poin)    tambahPoin(efek.poin);
    if (efek.empati)  tambahEmpati(efek.empati);
    if (efek.akurasi) catatAkurasi(efek.akurasi.benar, efek.akurasi.total);
    if (efek.flag)    efek.flag.forEach(f => setFlag(f));
    if (efek.buka)    efek.buka.forEach(e => bukaEra(e));
  }

  /* ---------- Toast ---------- */
  function toast(ikon, judul, isi, durasi) {
    let wadah = document.getElementById("toast-wadah");
    if (!wadah) {
      wadah = document.createElement("div");
      wadah.id = "toast-wadah";
      document.body.appendChild(wadah);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<span class="ikon">' + ikon + '</span>' +
      '<div><div class="judul">' + judul + '</div>' +
      '<div class="isi">' + isi + '</div></div>';
    wadah.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .35s, transform .35s";
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      setTimeout(() => el.remove(), 380);
    }, durasi || 3200);
  }

  /* ---------- Utilitas ---------- */
  const el  = (sel) => document.querySelector(sel);
  const els = (sel) => Array.from(document.querySelectorAll(sel));

  function buat(tag, kelas, isi) {
    const n = document.createElement(tag);
    if (kelas) n.className = kelas;
    if (isi !== undefined) n.innerHTML = isi;
    return n;
  }

  function acak(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function kabur(teks) {
    return String(teks)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function tanggal(ms) {
    return new Date(ms).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  }

  function eksporSave() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jejak-sejarah-nusantara-save-" +
      (S.pemain.nama || "penjelajah").toLowerCase().replace(/\s+/g, "-") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function imporSave(file, cb) {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const d = JSON.parse(e.target.result);
        S = Object.assign(stateBaru(), d);
        simpan();
        cb && cb(true);
      } catch (err) {
        cb && cb(false, err);
      }
    };
    r.readAsText(file);
  }

  /* ---------- Auto-init ---------- */
  if (typeof window !== "undefined") {
    muat();
  }

  /* ---------- API Publik ---------- */
  return {
    muat, simpan, reset, adaSave, get,
    babSelesai, tandaiBabSelesai, progresEra,
    bukaEra, eraTerbuka,
    tambahKodeks, punyaKodeks,
    tambahArtefak, punyaArtefak,
    tambahPoin, catatAkurasi, tambahEmpati, akurasiPersen,
    setFlag, ambilFlag,
    tambahJurnal,
    terapkanEfek,
    toast,
    el, els, buat, acak, kabur, tanggal,
    eksporSave, imporSave
  };
})();
