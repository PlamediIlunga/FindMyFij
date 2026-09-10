/**
 * Provinces et territoires du Canada avec leurs principales villes.
 * Utilisé par le formulaire admin pour les listes déroulantes.
 */

export interface CanadianProvince {
  code: string;
  name: string;
  cities: string[];
}

export const CANADIAN_PROVINCES: CanadianProvince[] = [
  {
    code: 'AB',
    name: 'Alberta',
    cities: [
      'Calgary',
      'Edmonton',
      'Red Deer',
      'Lethbridge',
      'Medicine Hat',
      'Grande Prairie',
      'Airdrie',
      'Spruce Grove',
      'Leduc',
      'Fort McMurray',
    ],
  },
  {
    code: 'BC',
    name: 'Colombie-Britannique',
    cities: [
      'Vancouver',
      'Victoria',
      'Surrey',
      'Burnaby',
      'Richmond',
      'Kelowna',
      'Abbotsford',
      'Coquitlam',
      'Langley',
      'Nanaimo',
      'Kamloops',
      'Prince George',
    ],
  },
  {
    code: 'MB',
    name: 'Manitoba',
    cities: ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler'],
  },
  {
    code: 'NB',
    name: 'Nouveau-Brunswick',
    cities: ['Moncton', 'Saint John', 'Fredericton', 'Dieppe', 'Miramichi', 'Edmundston', 'Bathurst'],
  },
  {
    code: 'NL',
    name: 'Terre-Neuve-et-Labrador',
    cities: ["St. John's", 'Mount Pearl', 'Corner Brook', 'Grand Falls-Windsor', 'Gander'],
  },
  {
    code: 'NS',
    name: 'Nouvelle-Écosse',
    cities: ['Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Amherst'],
  },
  {
    code: 'NT',
    name: 'Territoires du Nord-Ouest',
    cities: ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith'],
  },
  {
    code: 'NU',
    name: 'Nunavut',
    cities: ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake'],
  },
  {
    code: 'ON',
    name: 'Ontario',
    cities: [
      'Toronto',
      'Ottawa',
      'Mississauga',
      'Brampton',
      'Hamilton',
      'London',
      'Markham',
      'Vaughan',
      'Kitchener',
      'Windsor',
      'Richmond Hill',
      'Oakville',
      'Burlington',
      'Sudbury',
      'Oshawa',
      'Barrie',
      'Kingston',
      'Guelph',
      'Cambridge',
      'Waterloo',
      'Thunder Bay',
      'St. Catharines',
      'Whitby',
      'Ajax',
      'Pickering',
    ],
  },
  {
    code: 'PE',
    name: 'Île-du-Prince-Édouard',
    cities: ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall'],
  },
  {
    code: 'QC',
    name: 'Québec',
    cities: [
      'Montréal',
      'Québec',
      'Gatineau',
      'Laval',
      'Longueuil',
      'Sherbrooke',
      'Saguenay',
      'Lévis',
      'Trois-Rivières',
      'Terrebonne',
      'Repentigny',
      'Brossard',
      'Drummondville',
      'Saint-Jérôme',
      'Granby',
      'Blainville',
      'Saint-Hyacinthe',
      'Rimouski',
      'Victoriaville',
      'Rouyn-Noranda',
      'Châteauguay',
      'Mascouche',
      'Mirabel',
      'Joliette',
      'Val-d\'Or',
    ],
  },
  {
    code: 'SK',
    name: 'Saskatchewan',
    cities: ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton'],
  },
  {
    code: 'YT',
    name: 'Yukon',
    cities: ['Whitehorse', 'Dawson City', 'Watson Lake'],
  },
];

export const DEFAULT_COUNTRY = 'Canada';

export function getProvinceByCode(code: string): CanadianProvince | undefined {
  return CANADIAN_PROVINCES.find((p) => p.code === code);
}

export function getProvinceName(code: string): string {
  return getProvinceByCode(code)?.name ?? code;
}

export function getCitiesForProvince(code: string): string[] {
  return getProvinceByCode(code)?.cities ?? [];
}
