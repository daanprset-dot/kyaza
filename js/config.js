// ============ KONFIGURASI KYAZA INISIAL ============
// Isi data GitHub di bawah ini. Data produk disimpan di repo sebagai data.json,
// file upload (gambar/audio) disimpan di folder "uploads".
window.APP_CONFIG = {
  github: {
    owner: "ISI_USERNAME_GITHUB",
    repo: "ISI_NAMA_REPOSITORI",
    token: "ISI_TOKEN_GITHUB",   // fine-grained token: akses Contents (Read & Write) ke repo ini saja
    branch: "main",
    dataFile: "data.json",
    uploadDir: "uploads"
  },
  admin: { username: "admin", password: "admin123" }, // ganti!
  defaults: {
    waNumber: "6295323195263",
    waTemplate: "Halo Admin Kyaza Inisial, saya ingin membeli audio inisial: {JUDUL} dengan harga {HARGA}."
  },
  brand: { logo: "assets/logo.jpg" }
};
