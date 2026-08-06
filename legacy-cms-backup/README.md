# Legacy CMS Backup

Snapshot ini dibuat sebelum migrasi CMS baru dimulai.

- `data/` berisi 12 file JSON sumber konten portfolio saat ini.
- `server/` berisi API Express lama yang memakai tabel JSONB per section.

Backup ini hanya referensi dan tidak boleh menjadi sumber data baru setelah cutover ke Prisma/PostgreSQL selesai.
