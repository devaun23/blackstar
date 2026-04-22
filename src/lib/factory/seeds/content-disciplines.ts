/**
 * USMLE Step 2 CK Discipline Specifications (Jan 2026 outline)
 * 5 disciplines with exam weight ranges and shelf mappings.
 * Source: USMLE Step 2 CK Content Outline and Specifications (last updated Jan 2026)
 *
 * NOTE: Discipline weights overlap (a pediatric surgery question counts toward
 * both Surgery and Pediatrics), so ranges sum to >100%.
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
    weight_min: 20, weight_max: 30,
    maps_to_shelves: ['surgery'],
    sort_order: 2,
  },
  {
    code: 'pediatrics',
    display_name: 'Pediatrics',
    usmle_label: 'Pediatrics',
    weight_min: 17, weight_max: 27,
    maps_to_shelves: ['pediatrics'],
    sort_order: 3,
  },
  {
    code: 'obstetrics_gynecology',
    display_name: 'Obstetrics & Gynecology',
    usmle_label: 'Obstetrics & Gynecology',
    weight_min: 10, weight_max: 20,
    maps_to_shelves: ['obgyn'],
    sort_order: 4,
  },
  {
    code: 'psychiatry',
    display_name: 'Psychiatry',
    usmle_label: 'Psychiatry',
    weight_min: 10, weight_max: 15,
    maps_to_shelves: ['psychiatry'],
    sort_order: 5,
  },
];
