const COUNTRY_CODES: Record<string, string> = {
  // CONMEBOL
  Argentina: 'AR', Bolivia: 'BO', Brazil: 'BR', Chile: 'CL',
  Colombia: 'CO', Ecuador: 'EC', Paraguay: 'PY', Peru: 'PE',
  Uruguay: 'UY', Venezuela: 'VE',

  // CONCACAF
  Canada: 'CA', 'Costa Rica': 'CR', Cuba: 'CU', 'El Salvador': 'SV',
  Guatemala: 'GT', Haiti: 'HT', Honduras: 'HN', Jamaica: 'JM',
  Mexico: 'MX', Panama: 'PA', 'Trinidad and Tobago': 'TT',
  'United States': 'US', USA: 'US', Belize: 'BZ', Nicaragua: 'NI',
  Suriname: 'SR', Guyana: 'GY', Barbados: 'BB', Bermuda: 'BM',

  // UEFA
  Albania: 'AL', Andorra: 'AD', Armenia: 'AM', Austria: 'AT',
  Azerbaijan: 'AZ', Belarus: 'BY', Belgium: 'BE',
  'Bosnia and Herzegovina': 'BA', Bulgaria: 'BG', Croatia: 'HR',
  Cyprus: 'CY', 'Czech Republic': 'CZ', Czechia: 'CZ',
  Denmark: 'DK', Estonia: 'EE', Finland: 'FI', France: 'FR',
  Georgia: 'GE', Germany: 'DE', Greece: 'GR', Hungary: 'HU',
  Iceland: 'IS', Ireland: 'IE', Italy: 'IT', Kazakhstan: 'KZ',
  Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU', Malta: 'MT',
  Moldova: 'MD', Montenegro: 'ME', Netherlands: 'NL',
  'North Macedonia': 'MK', Norway: 'NO', Poland: 'PL',
  Portugal: 'PT', Romania: 'RO', Serbia: 'RS', Slovakia: 'SK',
  Slovenia: 'SI', Spain: 'ES', Sweden: 'SE', Switzerland: 'CH',
  Turkey: 'TR', Türkiye: 'TR', Ukraine: 'UA',

  // AFC
  Australia: 'AU', Bahrain: 'BH', 'China PR': 'CN', China: 'CN',
  Indonesia: 'ID', Iran: 'IR', Iraq: 'IQ', Japan: 'JP',
  Jordan: 'JO', Kuwait: 'KW', Kyrgyzstan: 'KG', Lebanon: 'LB',
  Malaysia: 'MY', 'North Korea': 'KP', 'Korea DPR': 'KP',
  Oman: 'OM', Pakistan: 'PK', Palestine: 'PS', Philippines: 'PH',
  Qatar: 'QA', 'Saudi Arabia': 'SA', Singapore: 'SG',
  'South Korea': 'KR', 'Korea Republic': 'KR', Syria: 'SY',
  Tajikistan: 'TJ', Thailand: 'TH', 'United Arab Emirates': 'AE',
  UAE: 'AE', Uzbekistan: 'UZ', Vietnam: 'VN', Yemen: 'YE',
  India: 'IN',

  // CAF
  Algeria: 'DZ', Angola: 'AO', Benin: 'BJ', 'Burkina Faso': 'BF',
  Cameroon: 'CM', 'Cape Verde': 'CV', 'DR Congo': 'CD',
  'Democratic Republic of Congo': 'CD', Egypt: 'EG', Eritrea: 'ER',
  Ethiopia: 'ET', Gabon: 'GA', Gambia: 'GM', Ghana: 'GH',
  Guinea: 'GN', 'Guinea-Bissau': 'GW', 'Ivory Coast': 'CI',
  "Côte d'Ivoire": 'CI', Kenya: 'KE', Liberia: 'LR', Libya: 'LY',
  Madagascar: 'MG', Malawi: 'MW', Mali: 'ML', Mauritania: 'MR',
  Morocco: 'MA', Mozambique: 'MZ', Namibia: 'NA', Niger: 'NE',
  Nigeria: 'NG', Rwanda: 'RW', Senegal: 'SN', 'Sierra Leone': 'SL',
  Somalia: 'SO', 'South Africa': 'ZA', Sudan: 'SD', Tanzania: 'TZ',
  Togo: 'TG', Tunisia: 'TN', Uganda: 'UG', Zambia: 'ZM',
  Zimbabwe: 'ZW', Comoros: 'KM', 'Equatorial Guinea': 'GQ',

  // OFC
  'New Zealand': 'NZ', Fiji: 'FJ', 'Papua New Guinea': 'PG',
  Samoa: 'WS', Tonga: 'TO', Vanuatu: 'VU',

  Curaçao: 'CW',
  'Cabo Verde': 'CV',
  'Congo DR': 'CD',
  'IR Iran': 'IR',
};

// Celtic nations use subdivision codes on flagcdn.com
const SPECIAL_CODES: Record<string, string> = {
  England: 'gb-eng',
  Scotland: 'gb-sct',
  Wales: 'gb-wls',
};

export function getFlagUrl(teamName: string): string | null {
  if (teamName in SPECIAL_CODES) {
    return `https://flagcdn.com/w40/${SPECIAL_CODES[teamName]}.png`;
  }
  const code = COUNTRY_CODES[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}
