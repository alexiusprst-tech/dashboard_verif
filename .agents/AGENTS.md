# Project Rules: Website Verifikator

1. **Role Terminology**: Use `Koordinator Mata Kuliah` and `Verifikator`. Do not use `PIC` or `Coordinator` as legacy terminology.
2. **Assignments**: Assignments for Koordinator are stored in `koordinator_assignments` (not in `user_roles`).
3. **Mata Kuliah Mapping**: Use `course_clo` or `mata_kuliah_id` in CLO to map course to CLO.
4. **Verifikator Mapping**: Verifikators are mapped via `penugasan_verifikator` (legacy mapped through `user_roles`).
5. **No Direct PLO Mapping**: Dosen maps Soal directly to CLO. Soal does NOT have `plo_id` mapping from Dosen UI. PLO relationship is implied through CLO.
