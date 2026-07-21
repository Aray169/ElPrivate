// ==========================================
// UTILITY: FORMATTING RUPIAH & TANGGAL
// ==========================================
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatTanggalIndo(tanggalString) {
    if (!tanggalString) return "Belum diisi";
    const d = new Date(tanggalString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ==========================================
// UTILITY & DINAMISASI DROPDOWN KLIEN
// ==========================================
function updateDropdownKlien() {
    const clientSelect = document.getElementById('client-select');
    if (!clientSelect) return;

    const klienData = JSON.parse(localStorage.getItem('daftar_klien')) || [];
    clientSelect.innerHTML = '<option value="">-- Pilih Klien Terdaftar --</option>';
    
    klienData.forEach(klien => {
        if (klien.status === "Aktif") {
            const option = document.createElement('option');
            option.value = klien.nama;
            option.textContent = klien.nama;
            option.dataset.wa = klien.wa;
            clientSelect.appendChild(option);
        }
    });
}

function autoFillNomorWA() {
    const clientSelect = document.getElementById('client-select');
    const phoneInput = document.getElementById('client-phone');
    if (!clientSelect || !phoneInput) return;

    const selectedOption = clientSelect.options[clientSelect.selectedIndex];
    if (selectedOption && selectedOption.value !== "") {
        phoneInput.value = selectedOption.dataset.wa;
    } else {
        phoneInput.value = "";
    }
}

// ==========================================
// FUNGSI DINAMIS MANAJEMEN TABEL INPUT (INDEX / MAIN FORM)
// ==========================================
function tambahBarisSesi(dataLoad = null) {
    const id = dataLoad ? dataLoad.id : Date.now();
    const defaultDate = dataLoad ? dataLoad.tanggal : new Date().toISOString().split('T')[0];
    const defaultProgram = dataLoad ? dataLoad.program : '';
    const defaultHarga = dataLoad ? dataLoad.harga : '';
    const defaultTipe = dataLoad ? dataLoad.pengali : '1';
    
    const htmlRow = `
        <tr id="row-${id}">
            <td><input type="date" class="date-input" value="${defaultDate}" onchange="hitungTotalSemua()"></td>
            <td><input type="text" class="program-name-input" value="${defaultProgram}" placeholder="Misal: Weight & Strength" oninput="hitungTotalSemua()"></td>
            <td><input type="number" class="program-price-input" value="${defaultHarga}" placeholder="0" min="0" oninput="hitungTotalSemua()"></td>
            <td>
                <select class="type-input" onchange="hitungTotalSemua()">
                    <option value="1" ${defaultTipe == '1' ? 'selected' : ''}>Private Session</option>
                    <option value="2" ${defaultTipe == '2' ? 'selected' : ''}>Couple Session</option>
                    <option value="2" ${defaultTipe == '3' ? 'selected' : ''}>Group Session</option>
                </select>
            </td>
            <td style="text-align: center;"><button type="button" class="btn-delete-sm" onclick="hapusBarisSesi(${id})">Hapus</button></td>
        </tr>
    `;
    
    const tbody = document.getElementById('session-body');
    if (tbody) {
        tbody.insertAdjacentHTML('beforeend', htmlRow);
        hitungTotalSemua();
    }
}

function hapusBarisSesi(id) {
    const row = document.getElementById(`row-${id}`);
    if (row) row.remove();
    hitungTotalSemua();
}

function hitungTotalSemua() {
    let totalAkumulasi = 0;
    const rows = document.querySelectorAll('#session-body tr');
    
    rows.forEach(row => {
        const hargaInput = row.querySelector('.program-price-input').value;
        const hargaDasar = hargaInput ? parseInt(hargaInput) : 0;
        totalAkumulasi += hargaDasar;
    });

    const totalBiayaEl = document.getElementById('total-biaya');
    if (totalBiayaEl) totalBiayaEl.innerText = formatRupiah(totalAkumulasi);
    return totalAkumulasi;
}

// ==========================================
// AMBIL STRUKTUR DATA DARI FORM UTAMA (INDEX)
// ==========================================
function ekstrakDataForm() {
    const clientSelect = document.getElementById('client-select');
    if (!clientSelect) return null;

    const namaKlien = clientSelect.value;
    let noWA = document.getElementById('client-phone').value.trim();
    const rows = document.querySelectorAll('#session-body tr');

    if (!namaKlien || !noWA || rows.length === 0) {
        alert('Pastikan Pilihan Klien dan data Sesi Latihan telah diisi lengkap.');
        return null;
    }

    let valid = true;
    const listSesiArray = [];
    let totalKeseluruhan = 0;

    rows.forEach(row => {
        const idBaris = row.id.replace('row-', '');
        const tanggalVal = row.querySelector('.date-input').value;
        const namaProgram = row.querySelector('.program-name-input').value.trim();
        const hargaDasar = row.querySelector('.program-price-input').value;
        const tipeEl = row.querySelector('.type-input');
        const labelTipe = tipeEl.options[tipeEl.selectedIndex].text;
        const nilaiTipe = tipeEl.value;

        if (!namaProgram || !hargaDasar) valid = false;

        const hargaAngka = parseInt(hargaDasar || 0);
        totalKeseluruhan += hargaAngka;

        listSesiArray.push({
            id: idBaris,
            tanggal: tanggalVal,
            program: namaProgram,
            harga: hargaAngka,
            tipeText: labelTipe,
            pengali: nilaiTipe,
            subtotal: hargaAngka
        });
    });

    if (!valid) {
        alert('Harap isi Nama Program Latihan dan Harga Satuan pada tabel dengan benar.');
        return null;
    }

    if (noWA.startsWith('0')) noWA = '62' + noWA.slice(1);
    else if (noWA.startsWith('+62')) noWA = '62' + noWA.slice(3);

    return { namaKlien, noWA, listSesiArray, totalKeseluruhan, jumlahSesi: rows.length };
}

// SIMPAN PROGRAM BARU DARI HALAMAN UTAMA
// SIMPAN PROGRAM BARU DARI HALAMAN UTAMA (INDEX)
function simpanKeDaftarProgram() {
    const data = ekstrakDataForm();
    if (!data) return; // Berhenti jika data form utama tidak valid/lengkap

    const daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    const uniqueId = Date.now();
    const randomRepId = 'PRG-' + Math.floor(1000 + Math.random() * 9000);

    // Langsung push sebagai data baru (tidak perlu cek mode edit halaman lagi)
    daftarProgram.unshift({
        id: `program-row-${uniqueId}`,
        repId: `#${randomRepId}`,
        nama: data.namaKlien,
        noWA: data.noWA,
        jumlahSesi: `${data.jumlahSesi} Sesi`,
        total: formatRupiah(data.totalKeseluruhan),
        status: "Draft",
        rincianTabel: data.listSesiArray
    });

    localStorage.setItem('daftar_program', JSON.stringify(daftarProgram));
    alert("Berhasil disimpan ke Daftar Program!");

    // Reset Form Utama setelah berhasil disimpan
    document.getElementById('client-select').value = "";
    document.getElementById('client-phone').value = "";
    document.getElementById('session-body').innerHTML = "";
    tambahBarisSesi();
}

// KIRIM WA LANGSUNG DARI HALAMAN UTAMA
function kirimLaporanWA() {
    const data = ekstrakDataForm();
    if (!data) return;

    let detailSesiTeks = '';
    data.listSesiArray.forEach((sesi, index) => {
        detailSesiTeks += `${index + 1}. [${formatTanggalIndo(sesi.tanggal)}] *${sesi.program}* (${sesi.tipeText}) — _${formatRupiah(sesi.subtotal)}_%0A`;
    });

    const pesan = `*LAPORAN & REKAPITULASI PROGRAM LATIHAN*%0A%0A` +
                  `Halo *${data.namaKlien}*, berikut adalah rekapitulasi riwayat sesi latihan yang telah kamu selesaikan beserta rinciannya:%0A%0A` +
                  `${detailSesiTeks}%0A` +
                  `*TOTAL TAGIHAN AKUMULASI:* *${formatRupiah(data.totalKeseluruhan)}*%0A%0A` +
                  `Kerja bagus! Selalu jaga konsistensi dan pola makan untuk hasil yang maksimal! 🏋️‍♂️🔥💪%0A%0A` +
                  `_Laporan resmi dibuat dan dikirim langsung oleh Coach._`;

    window.open(`https://api.whatsapp.com/send?phone=${data.noWA}&text=${pesan}`, '_blank');
}

// ==========================================
// RENDER & LOGIKA HALAMAN DAFTAR PROGRAM
// ==========================================
function renderDaftarProgram() {
    const programBody = document.getElementById('program-body');
    if (!programBody) return;

    const daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    
    if (daftarProgram.length === 0) {
        programBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">Belum ada data program tersimpan.</td></tr>`;
        return;
    }

    let html = '';
    daftarProgram.forEach(item => {
        html += `
            <tr onclick="bukaModalDetail('${item.id}')">
                <td>${item.repId}</td>
                <td><strong>${item.nama}</strong></td>
                <td>${item.jumlahSesi}</td>
                <td>${item.total}</td>
                <td><span class="badge" style="background-color: #f59e0b; color: #fff;">${item.status}</span></td>
                <td style="text-align: center;" onclick="event.stopPropagation();">
                    <button class="btn-delete-sm" style="background-color: #3b82f6; margin-right: 4px;" onclick="bukaModalEditProgram('${item.id}')">Edit</button>
                    <button class="btn-delete-sm" onclick="hapusDataStorage('daftar_program', '${item.id}')">Hapus</button>
                </td>
            </tr>
        `;
    });
    programBody.innerHTML = html;
}

// ==========================================
// PREVIEW DETAIL MODAL
// ==========================================
// ==========================================
// PREVIEW DETAIL MODAL (DENGAN WA & APPROVE)
// ==========================================
function bukaModalDetail(rowId) {
    const daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    const reportData = daftarProgram.find(item => item.id === rowId);

    if (!reportData) return alert("Data program tidak ditemukan.");

    // Simpan ID program ke input hidden di dalam modal preview
    document.getElementById('modal-program-id').value = reportData.id;

    document.getElementById('modal-title').innerText = `Preview Program ${reportData.repId}`;
    document.getElementById('modal-client-name').innerText = reportData.nama;
    document.getElementById('modal-total-biaya').innerText = reportData.total;

    // Atur Badge Status di dalam Modal Preview
    const statusBadge = document.getElementById('modal-status-badge');
    if (statusBadge) {
        statusBadge.innerText = reportData.status;
        if (reportData.status === "Approved") {
            statusBadge.style.backgroundColor = "#10b981"; // Hijau
            statusBadge.style.color = "#fff";
            // Sembunyikan tombol approve jika statusnya sudah Approved
            document.getElementById('btn-approve-modal').style.display = "none";
        } else {
            statusBadge.style.backgroundColor = "#f59e0b"; // Amber/Orange untuk Draft
            statusBadge.style.color = "#fff";
            document.getElementById('btn-approve-modal').style.display = "flex";
        }
    }

    // Render tabel rincian
    const modalBodyTable = document.getElementById('modal-table-body');
    let htmlRows = '';

    if (reportData.rincianTabel && reportData.rincianTabel.length > 0) {
        reportData.rincianTabel.forEach(sesi => {
            htmlRows += `
                <tr>
                    <td>${formatTanggalIndo(sesi.tanggal)}</td>
                    <td><strong>${sesi.program}</strong></td>
                    <td>${formatRupiah(sesi.harga)}</td>
                    <td>${sesi.tipeText}</td>
                    <td style="color:#10b981; font-weight:600;">${formatRupiah(sesi.subtotal)}</td>
                </tr>
            `;
        });
    } else {
        htmlRows = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Tidak ada rincian sesi.</td></tr>`;
    }

    modalBodyTable.innerHTML = htmlRows;

    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.add('show');
}

function kirimWADariPreview() {
    const idProgram = document.getElementById('modal-program-id').value;
    const daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    const reportData = daftarProgram.find(item => item.id === idProgram);

    if (!reportData) return alert("Data program tidak ditemukan!");

    // Ambil data profil dari Pengaturan, jika kosong gunakan default fallback
    const profilCoach = JSON.parse(localStorage.getItem('profil_coach')) || {
        headCoach: "Coach",
        namaKursus: "CoachLog System"
    };

    let detailSesiTeks = '';
    
    if (reportData.rincianTabel && reportData.rincianTabel.length > 0) {
        reportData.rincianTabel.forEach((sesi, index) => {
            const tgl = sesi.tanggal ? formatTanggalIndo(sesi.tanggal) : "-";
            const prog = sesi.program ? sesi.program.trim() : "Program Latihan";
            const hrg = formatRupiah(sesi.harga || 0);
            const tipe = sesi.tipeText || "Private Session";
            
            detailSesiTeks += `   ▪️ *Session ${index + 1}* | ${tgl}\n`;
            detailSesiTeks += `     Itemn Training: *${prog}* (${tipe})\n`;
            detailSesiTeks += `     IDR: _${hrg}_\n\n`;
        });
    } else {
        detailSesiTeks = "   _(Belum ada rincian sesi latihan)_\n\n";
    }

    // Template pesan dinamis menggunakan data Pengaturan
    const teksMentah = `*🔥 MONTHLY TRAINING PROGRESS REPORT  🔥*

Halo *${reportData.nama || 'Klien'}*, 👋

Terima kasih telah berkomitmen untuk terus meningkatkan kebugaran dan performa bersama kami. 
Berikut adalah rangkuman training progress Anda sejauh ini.

📋 *PROGRAM DETAILS*
${detailSesiTeks.trim()}

💳 *TOTAL HEALTH INVESTMENT*
*IDR ${reportData.total || '0'}*
BCA 7380621830 A.N Rafaeldo


⚡ TRAIN TO IMPROVE YOUR PERFORMANCE ⚡
Secure your next session and keep making progress !!!
#ELprivate #ELperformance #BeyondYourLimits

_Rencana program resmi diterbitkan oleh:_
*${profilCoach.headCoach}* | _${profilCoach.namaKursus}_`.trim();

    let noWABersih = reportData.noWA ? reportData.noWA.replace(/[^0-9]/g, '') : '';
    const pesanEncoded = encodeURIComponent(teksMentah);

    window.open(`https://api.whatsapp.com/send?phone=${noWABersih}&text=${pesanEncoded}`, '_blank');
}

// FUNGSI UNTUK APPROVE PROGRAM LANGSUNG DARI PREVIEW MODAL
function approveProgramDariPreview() {
    const idProgram = document.getElementById('modal-program-id').value;
    let daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    const index = daftarProgram.findIndex(item => item.id === idProgram);

    if (index === -1) return alert("Data program tidak ditemukan!");

    if (confirm(`Apakah Anda yakin ingin menyetujui (Approve) program untuk ${daftarProgram[index].nama}?`)) {
        daftarProgram[index].status = "Approved";
        localStorage.setItem('daftar_program', JSON.stringify(daftarProgram));
        
        alert("Program berhasil di-Approve!");
        tutupModal();
        renderDaftarProgram(); // Refresh tabel utama agar status ter-update di layar
    }
}

function tutupModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.remove('show');
}

// ==========================================
// POP-UP MODAL EDIT PROGRAM (IN-PLACE EDITING)
// ==========================================
function bukaModalEditProgram(idProgram) {
    const modal = document.getElementById('editProgramModal');
    if (!modal) return;

    const daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    const target = daftarProgram.find(p => p.id === idProgram);

    if (!target) return alert("Data program tidak ditemukan!");

    // Set value kepala form edit modal
    document.getElementById('edit-program-id').value = target.id;
    document.getElementById('edit-modal-client-name').innerText = target.nama;

    // Bersihkan & isi tabel dinamis di dalam modal
    const tbodyModal = document.getElementById('modal-edit-session-body');
    tbodyModal.innerHTML = "";

    target.rincianTabel.forEach(sesi => {
        tambahBarisSesiModal(sesi);
    });

    hitungTotalEditModal();
    modal.classList.add('show');
}

function tutupModalEditProgram() {
    const modal = document.getElementById('editProgramModal');
    if (modal) modal.classList.remove('show');
}

function tambahBarisSesiModal(dataLoad = null) {
    const id = dataLoad ? dataLoad.id : Date.now();
    const defaultDate = dataLoad ? dataLoad.tanggal : new Date().toISOString().split('T')[0];
    const defaultProgram = dataLoad ? dataLoad.program : '';
    const defaultHarga = dataLoad ? dataLoad.harga : '';
    const defaultTipe = dataLoad ? dataLoad.pengali : '1';

    const htmlRow = `
        <tr id="modal-row-${id}">
            <td><input type="date" class="modal-date-input" value="${defaultDate}" onchange="hitungTotalEditModal()"></td>
            <td><input type="text" class="modal-program-name-input" value="${defaultProgram}" placeholder="Misal: Weight & Strength" oninput="hitungTotalEditModal()"></td>
            <td><input type="number" class="modal-program-price-input" value="${defaultHarga}" placeholder="0" min="0" oninput="hitungTotalEditModal()"></td>
            <td>
                <select class="modal-type-input" onchange="hitungTotalEditModal()">
                    <option value="1" ${defaultTipe == '1' ? 'selected' : ''}>Private Session</option>
                    <option value="2" ${defaultTipe == '2' ? 'selected' : ''}>Couple Session</option>
                    <option value="2" ${defaultTipe == '3' ? 'selected' : ''}>Group Session</option>
                </select>
            </td>
            <td style="text-align: center;"><button type="button" class="btn-delete-sm" onclick="hapusBarisSesiModal(${id})">Hapus</button></td>
        </tr>
    `;
    
    const tbodyModal = document.getElementById('modal-edit-session-body');
    if (tbodyModal) {
        tbodyModal.insertAdjacentHTML('beforeend', htmlRow);
    }
}

function hapusBarisSesiModal(id) {
    const row = document.getElementById(`modal-row-${id}`);
    if (row) row.remove();
    hitungTotalEditModal();
}

function hitungTotalEditModal() {
    let totalAkumulasi = 0;
    const rows = document.querySelectorAll('#modal-edit-session-body tr');
    
    rows.forEach(row => {
        const hargaInput = row.querySelector('.modal-program-price-input').value;
        const hargaDasar = hargaInput ? parseInt(hargaInput) : 0;
        totalAkumulasi += hargaDasar;
    });

    document.getElementById('modal-edit-total-biaya').innerText = formatRupiah(totalAkumulasi);
    return totalAkumulasi;
}

function simpanPerubahanProgram() {
    const idProgram = document.getElementById('edit-program-id').value;
    const rows = document.querySelectorAll('#modal-edit-session-body tr');

    if (rows.length === 0) {
        return alert("Data sesi program latihan tidak boleh kosong.");
    }

    let valid = true;
    const listSesiArray = [];
    let totalKeseluruhan = 0;

    rows.forEach(row => {
        const idBaris = row.id.replace('modal-row-', '');
        const tanggalVal = row.querySelector('.modal-date-input').value;
        const namaProgram = row.querySelector('.modal-program-name-input').value.trim();
        const hargaDasar = row.querySelector('.modal-program-price-input').value;
        const tipeEl = row.querySelector('.modal-type-input');
        const labelTipe = tipeEl.options[tipeEl.selectedIndex].text;
        const nilaiTipe = tipeEl.value;

        if (!namaProgram || !hargaDasar) valid = false;

        const hargaAngka = parseInt(hargaDasar || 0);
        totalKeseluruhan += hargaAngka;

        listSesiArray.push({
            id: idBaris,
            tanggal: tanggalVal,
            program: namaProgram,
            harga: hargaAngka,
            tipeText: labelTipe,
            pengali: nilaiTipe,
            subtotal: hargaAngka
        });
    });

    if (!valid) {
        return alert('Harap isi Nama Program Latihan dan Harga Satuan dengan benar.');
    }

    let daftarProgram = JSON.parse(localStorage.getItem('daftar_program')) || [];
    const index = daftarProgram.findIndex(p => p.id === idProgram);

    if (index !== -1) {
        daftarProgram[index].jumlahSesi = `${rows.length} Sesi`;
        daftarProgram[index].total = formatRupiah(totalKeseluruhan);
        daftarProgram[index].rincianTabel = listSesiArray;
        daftarProgram[index].status = "Draft Terupdate";

        localStorage.setItem('daftar_program', JSON.stringify(daftarProgram));
        alert("Perubahan program berhasil disimpan!");
        tutupModalEditProgram();
        renderDaftarProgram();
    }
}

// ==========================================
// MANAGEMENT KLIEN MODAL & CRUD
// ==========================================
function bukaModalKlien(idKlien = null) {
    const modal = document.getElementById('klienModal');
    const title = document.getElementById('klien-modal-title');
    const form = document.getElementById('form-klien');
    
    if (!modal || !form) return;
    form.reset();
    document.getElementById('klien-id-edit').value = "";
    title.innerText = "Tambah Klien Baru";

    if (idKlien) {
        title.innerText = "Edit Data Klien";
        const klienData = JSON.parse(localStorage.getItem('daftar_klien')) || [];
        const target = klienData.find(k => k.id === idKlien);
        
        if (target) {
            document.getElementById('klien-id-edit').value = target.id;
            document.getElementById('klien-nama').value = target.nama;
            document.getElementById('klien-wa').value = target.wa;
            document.getElementById('klien-tinggi').value = target.tinggi;
            document.getElementById('klien-berat').value = target.berat;
            document.getElementById('klien-umur').value = target.umur;
            document.getElementById('klien-target').value = target.target;
            document.getElementById('klien-status').value = target.status;
        }
    }
    modal.classList.add('show');
}

function tutupModalKlien() {
    const modal = document.getElementById('klienModal');
    if (modal) modal.classList.remove('show');
}

function simpanDataKlien(event) {
    event.preventDefault();
    
    const idEdit = document.getElementById('klien-id-edit').value;
    const nama = document.getElementById('klien-nama').value.trim();
    const wa = document.getElementById('klien-wa').value.trim();
    const tinggi = document.getElementById('klien-tinggi').value;
    const berat = document.getElementById('klien-berat').value;
    const umur = document.getElementById('klien-umur').value;
    const target = document.getElementById('klien-target').value.trim();
    const status = document.getElementById('klien-status').value;

    let klienData = JSON.parse(localStorage.getItem('daftar_klien')) || [];

    if (idEdit) {
        const idx = klienData.findIndex(k => k.id === idEdit);
        if (idx !== -1) {
            klienData[idx] = { id: idEdit, nama, wa, tinggi, berat, umur, target, status };
            alert("Data klien berhasil diperbarui!");
        }
    } else {
        if (klienData.some(k => k.nama.toLowerCase() === nama.toLowerCase())) {
            return alert("Nama klien ini sudah terdaftar!");
        }
        klienData.unshift({
            id: `client-row-${Date.now()}`,
            nama, wa, tinggi, berat, umur, target, status
        });
        alert("Klien baru berhasil ditambahkan!");
    }

    localStorage.setItem('daftar_klien', JSON.stringify(klienData));
    tutupModalKlien();
    renderKlien();
}

function renderKlien() {
    const clientsBody = document.getElementById('clients-body');
    if (!clientsBody) return;

    const klienData = JSON.parse(localStorage.getItem('daftar_klien')) || [];
    if (klienData.length === 0) {
        clientsBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">Belum ada klien terdaftar.</td></tr>`;
        return;
    }

    let html = '';
    klienData.forEach(item => {
        const badgeColor = item.status === 'Aktif' ? '#10b981' : '#64748b';
        html += `
            <tr id="${item.id}">
                <td><strong>${item.nama}</strong></td>
                <td>${item.wa}</td>
                <td><small>TB: ${item.tinggi}cm | BB: ${item.berat}kg | Umur: ${item.umur}thn</small></td>
                <td><span style="font-size: 13px; color:#475569;">${item.target}</span></td>
                <td><span class="badge" style="background-color: ${badgeColor}; color: #fff;">${item.status}</span></td>
                <td style="text-align: center;">
                    <button class="btn-delete-sm" style="background-color: #3b82f6; margin-right: 4px;" onclick="bukaModalKlien('${item.id}')">Edit</button>
                    <button class="btn-delete-sm" onclick="hapusDataStorage('daftar_klien', '${item.id}')">Hapus</button>
                </td>
            </tr>
        `;
    });
    clientsBody.innerHTML = html;
}

// Window global click handler untuk menutup semua modal
window.onclick = function(event) {
    const detailModal = document.getElementById('detailModal');
    const klienModal = document.getElementById('klienModal');
    const editProgramModal = document.getElementById('editProgramModal');
    
    if (event.target === detailModal) tutupModal();
    if (event.target === klienModal) tutupModalKlien();
    if (event.target === editProgramModal) tutupModalEditProgram();
}

function hapusDataStorage(key, id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        let data = JSON.parse(localStorage.getItem(key)) || [];
        data = data.filter(item => item.id !== id);
        localStorage.setItem(key, JSON.stringify(data));
        renderDaftarProgram();
        renderKlien();
    }
}

function kosongkanRiwayat() {
    if (confirm("Apakah Anda yakin ingin menghapus semua data program?")) {
        localStorage.removeItem('daftar_program');
        renderDaftarProgram();
    }
}

// ==========================================
// INITIAL LOAD CONTROLLER
// ==========================================
window.onload = function() {
    if (document.getElementById('client-select')) {
        updateDropdownKlien();
    }
    if (document.getElementById('session-body')) {
        tambahBarisSesi(); 
    }
    if (document.getElementById('program-body')) {
        renderDaftarProgram();
    }
    if (document.getElementById('clients-body')) {
        renderKlien();
    }
};

// =======================================================
// 💾 1. FUNGSI MENYIMPAN PENGATURAN (FORM SUBMIT)
// =======================================================
function simpanPengaturan() {
    const inputCoach = document.getElementById('input-head-coach');
    const inputKursus = document.getElementById('input-nama-kursus');

    if (!inputCoach || !inputKursus) return;

    const headCoach = inputCoach.value.trim();
    const namaKursus = inputKursus.value.trim();

    if (!headCoach || !namaKursus) {
        alert("⚠️ Harap isi nama Head Coach dan nama Kursus/Gym terlebih dahulu!");
        return;
    }

    // Simpan ke LocalStorage sebagai JSON
    const profilCoach = {
        headCoach: headCoach,
        namaKursus: namaKursus
    };

    localStorage.setItem('profil_coach', JSON.stringify(profilCoach));

    // Langsung update tampilan tanpa perlu reload halaman
    updateSemuaTampilanProfil(headCoach, namaKursus);

    alert("✅ Pengaturan profil berhasil disimpan!");
}

// =======================================================
// 🔄 2. FUNGSI MEMUAT DATA DARI LOCALSTORAGE
// =======================================================
function loadPengaturan() {
    const dataSaved = localStorage.getItem('profil_coach');
    
    let headCoach = "Head Coach";
    let namaKursus = "CoachLog.";

    if (dataSaved) {
        try {
            const profilCoach = JSON.parse(dataSaved);
            if (profilCoach.headCoach) headCoach = profilCoach.headCoach;
            if (profilCoach.namaKursus) namaKursus = profilCoach.namaKursus;
        } catch (e) {
            console.error("Gagal membaca data profil_coach dari localStorage", e);
        }
    }

    // Isi nilai input form jika berada di halaman Pengaturan
    const inputCoach = document.getElementById('input-head-coach');
    const inputKursus = document.getElementById('input-nama-kursus');

    if (inputCoach) inputCoach.value = dataSaved ? headCoach : "";
    if (inputKursus) inputKursus.value = dataSaved ? namaKursus : "";

    // Terapkan data ke semua komponen UI
    updateSemuaTampilanProfil(headCoach, namaKursus);
}

// =======================================================
// 🎯 3. FUNGSI UPDATE UI (DESKTOP SIDEBAR + MOBILE HEADER)
// =======================================================
function updateSemuaTampilanProfil(nama, kursus) {
    // --- A. UPDATE DESKTOP SIDEBAR ---
    const desktopBrand = document.querySelector('.sidebar .brand span');
    const desktopName  = document.querySelector('.sidebar .user-info h4');
    const desktopRole  = document.querySelector('.sidebar .user-info p');

    if (desktopBrand) desktopBrand.textContent = kursus;
    if (desktopName)  desktopName.textContent = nama;
    if (desktopRole)  desktopRole.textContent = "Head Coach";

    // --- B. UPDATE MOBILE HEADER ---
    const mobileGymEl    = document.getElementById('mobile-gym-name');
    const mobileNameEl   = document.getElementById('mobile-user-name');
    const mobileRoleEl   = document.getElementById('mobile-user-role');
    const mobileAvatarEl = document.getElementById('mobile-avatar-initial');

    if (mobileGymEl)  mobileGymEl.textContent = kursus;
    if (mobileNameEl) mobileNameEl.textContent = nama;
    if (mobileRoleEl) mobileRoleEl.textContent = "Head Coach";

    // Set Huruf Depan Avatar Mobile (Contoh: "Rafael" -> "R")
    if (mobileAvatarEl && nama.trim() !== '') {
        mobileAvatarEl.textContent = nama.trim().charAt(0).toUpperCase();
    }

    // --- C. UPDATE ELEMEN DENGAN CLASS GLOBAL (JIKA ADA) ---
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = nama);
    document.querySelectorAll('.user-role-display').forEach(el => el.textContent = "Head Coach");
    document.querySelectorAll('.gym-name-display').forEach(el => el.textContent = kursus);
}

// =======================================================
// 📅 4. FUNGSI UPDATE TANGGAL AUTOMATIS HARIAN
// =======================================================
function updateMobileDate() {
    const dateEl = document.getElementById('mobile-current-date');
    if (dateEl) {
        const today = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dateEl.textContent = today.toLocaleDateString('id-ID', options);
    }
}

// =======================================================
// 🚀 INITIATOR (JALANKAN SAAT OTOMATIS LOAD)
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    loadPengaturan();
    updateMobileDate();
});
