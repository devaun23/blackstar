/**
 * USMLE Step 2 CK Discipline Specifications (2025 outline)
 * 5 disciplines with exam weight ranges and shelf mappings.
 * Source: USMLE Step 2 CK Content Description and General Information Booklet
 */
export interface ContentDisciplineSeed {
  code: string;
  display_name: string;
  usmle_label: string;
  weight_min: number;
  weight_max: number;
  maps_to_shelves: string[];
  sort_order: number;
}

export const contentDisciplines: ContentDisciplineSeed[] = [
  {
    code: 'medicine',
    display_name: 'Medicine',
    usmle_label: 'Internal Medicine',
    weight_min: 55, weight_max: 65,
    maps_to_shelves: ['medicine'],
    sort_order: 1,
  },
  {
    code: 'surgery',
    display_name: 'Surgery',
    usmle_label: 'Surgery',
    weight_min: 8, weight_max: 14,
    maps_to_shelves: ['surgery'],
    sort_order: 2,
  },
  {
    code: 'pediatrics',
    display_name: 'Pediatrics',
    usmle_label: 'Pediatrics',
    weight_min: 6, weight_max: 12,
    maps_to_shelves: ['pediatrics'],
    sort_order: 3,
  },
  {
    code: 'obstetrics_gynecology',
    display_name: 'Obstetrics & Gynecology',
    usmle_label: 'Obstetrics & Gynecology',
    weight_min: 6, weight_max: 12,
    maps_to_shelves: ['obgyn'],
    sort_order: 4,
  },
  {
    code: 'psychiatry',
    display_name: 'Psychiatry',
    usmle_label: 'Psychiatry',
    weight_min: 5, weight_max: 10,
    maps_to_shelves: ['psychiatry'],
    sort_order: 5,
  },
];
