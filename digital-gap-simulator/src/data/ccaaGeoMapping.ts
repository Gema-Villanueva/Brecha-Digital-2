/**
 * Links each in-game region `id` (slug from loadRegions) to INE-style `acom_code`
 * in `public/geo/ccaa.geojson` (OpenDataSoft georef-spain-comunidad-autonoma export).
 * Ceuta (18), Melilla (19), and non-associated territory (20) have no game row.
 */
export const REGION_ID_TO_ACOM_CODE: Record<string, string> = {
  andalucia: '01',
  aragon: '02',
  asturias: '03',
  baleares: '04',
  canarias: '05',
  cantabria: '06',
  'castilla-y-leon': '07',
  'castilla-la-mancha': '08',
  cataluna: '09',
  'comunidad-valenciana': '10',
  extremadura: '11',
  galicia: '12',
  madrid: '13',
  murcia: '14',
  navarra: '15',
  'pais-vasco': '16',
  'la-rioja': '17',
}
