/**
 * MataKuliahPicker — Reusable component for selecting Mata Kuliah.
 * Source: tech-spec.md Section 5.2
 *
 * Used as include wajib (<<Include>>) in "Menentukan dosen verifikator"
 * flow (user-flow.md Section 1.5). Designed as reusable sub-step
 * embedded within assignment forms, NOT a separate page.
 */

interface MataKuliahPickerProps {
  /** Callback when a course is selected */
  onSelect: (courseId: number) => void;
  /** Currently selected course ID */
  selectedCourseId?: number;
  /** Optional semester filter */
  semesterId?: number;
}

export default function MataKuliahPicker({
  onSelect,
  selectedCourseId,
  semesterId,
}: MataKuliahPickerProps) {
  // TODO: Implement picker with:
  // - Searchable/filterable list of MK
  // - Filter by semester if applicable
  // - Highlight selected MK

  return (
    <div>
      <label>Pilih Mata Kuliah</label>
      {/* Skeleton — picker implementation pending */}
      <p>Mata Kuliah Picker (semester: {semesterId}, selected: {selectedCourseId})</p>
    </div>
  );
}
