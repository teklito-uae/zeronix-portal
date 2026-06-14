/**
 * Phone number to country flag emoji + country name resolver.
 * Uses E.164 prefix matching, longest-prefix-first.
 */

interface CountryInfo {
  flag: string;
  name: string;
  code: string;
}

// Sorted longest-prefix first for accurate matching
const PHONE_PREFIX_MAP: [string, CountryInfo][] = [
  // 4-digit prefixes first
  ['+1242', { flag: '🇧🇸', name: 'Bahamas', code: 'BS' }],
  ['+1246', { flag: '🇧🇧', name: 'Barbados', code: 'BB' }],
  ['+1264', { flag: '🇦🇮', name: 'Anguilla', code: 'AI' }],
  ['+1268', { flag: '🇦🇬', name: 'Antigua', code: 'AG' }],
  ['+1284', { flag: '🇻🇬', name: 'British Virgin Islands', code: 'VG' }],
  ['+1340', { flag: '🇻🇮', name: 'US Virgin Islands', code: 'VI' }],
  ['+1345', { flag: '🇰🇾', name: 'Cayman Islands', code: 'KY' }],
  ['+1441', { flag: '🇧🇲', name: 'Bermuda', code: 'BM' }],
  ['+1473', { flag: '🇬🇩', name: 'Grenada', code: 'GD' }],
  ['+1649', { flag: '🇹🇨', name: 'Turks and Caicos', code: 'TC' }],
  ['+1664', { flag: '🇲🇸', name: 'Montserrat', code: 'MS' }],
  ['+1671', { flag: '🇬🇺', name: 'Guam', code: 'GU' }],
  ['+1684', { flag: '🇦🇸', name: 'American Samoa', code: 'AS' }],
  ['+1758', { flag: '🇱🇨', name: 'Saint Lucia', code: 'LC' }],
  ['+1767', { flag: '🇩🇲', name: 'Dominica', code: 'DM' }],
  ['+1784', { flag: '🇻🇨', name: 'St. Vincent', code: 'VC' }],
  ['+1787', { flag: '🇵🇷', name: 'Puerto Rico', code: 'PR' }],
  ['+1809', { flag: '🇩🇴', name: 'Dominican Republic', code: 'DO' }],
  ['+1868', { flag: '🇹🇹', name: 'Trinidad & Tobago', code: 'TT' }],
  ['+1869', { flag: '🇰🇳', name: 'St. Kitts & Nevis', code: 'KN' }],
  ['+1876', { flag: '🇯🇲', name: 'Jamaica', code: 'JM' }],
  // 3-digit prefixes
  ['+971', { flag: '🇦🇪', name: 'UAE', code: 'AE' }],
  ['+966', { flag: '🇸🇦', name: 'Saudi Arabia', code: 'SA' }],
  ['+965', { flag: '🇰🇼', name: 'Kuwait', code: 'KW' }],
  ['+968', { flag: '🇴🇲', name: 'Oman', code: 'OM' }],
  ['+974', { flag: '🇶🇦', name: 'Qatar', code: 'QA' }],
  ['+973', { flag: '🇧🇭', name: 'Bahrain', code: 'BH' }],
  ['+967', { flag: '🇾🇪', name: 'Yemen', code: 'YE' }],
  ['+962', { flag: '🇯🇴', name: 'Jordan', code: 'JO' }],
  ['+961', { flag: '🇱🇧', name: 'Lebanon', code: 'LB' }],
  ['+963', { flag: '🇸🇾', name: 'Syria', code: 'SY' }],
  ['+964', { flag: '🇮🇶', name: 'Iraq', code: 'IQ' }],
  ['+972', { flag: '🇮🇱', name: 'Israel', code: 'IL' }],
  ['+970', { flag: '🇵🇸', name: 'Palestine', code: 'PS' }],
  ['+998', { flag: '🇺🇿', name: 'Uzbekistan', code: 'UZ' }],
  ['+994', { flag: '🇦🇿', name: 'Azerbaijan', code: 'AZ' }],
  ['+993', { flag: '🇹🇲', name: 'Turkmenistan', code: 'TM' }],
  ['+992', { flag: '🇹🇯', name: 'Tajikistan', code: 'TJ' }],
  ['+996', { flag: '🇰🇬', name: 'Kyrgyzstan', code: 'KG' }],
  ['+995', { flag: '🇬🇪', name: 'Georgia', code: 'GE' }],
  ['+374', { flag: '🇦🇲', name: 'Armenia', code: 'AM' }],
  ['+380', { flag: '🇺🇦', name: 'Ukraine', code: 'UA' }],
  ['+375', { flag: '🇧🇾', name: 'Belarus', code: 'BY' }],
  ['+373', { flag: '🇲🇩', name: 'Moldova', code: 'MD' }],
  ['+370', { flag: '🇱🇹', name: 'Lithuania', code: 'LT' }],
  ['+371', { flag: '🇱🇻', name: 'Latvia', code: 'LV' }],
  ['+372', { flag: '🇪🇪', name: 'Estonia', code: 'EE' }],
  ['+358', { flag: '🇫🇮', name: 'Finland', code: 'FI' }],
  ['+359', { flag: '🇧🇬', name: 'Bulgaria', code: 'BG' }],
  ['+381', { flag: '🇷🇸', name: 'Serbia', code: 'RS' }],
  ['+385', { flag: '🇭🇷', name: 'Croatia', code: 'HR' }],
  ['+386', { flag: '🇸🇮', name: 'Slovenia', code: 'SI' }],
  ['+387', { flag: '🇧🇦', name: 'Bosnia', code: 'BA' }],
  ['+382', { flag: '🇲🇪', name: 'Montenegro', code: 'ME' }],
  ['+389', { flag: '🇲🇰', name: 'North Macedonia', code: 'MK' }],
  ['+383', { flag: '🇽🇰', name: 'Kosovo', code: 'XK' }],
  ['+355', { flag: '🇦🇱', name: 'Albania', code: 'AL' }],
  ['+356', { flag: '🇲🇹', name: 'Malta', code: 'MT' }],
  ['+357', { flag: '🇨🇾', name: 'Cyprus', code: 'CY' }],
  ['+353', { flag: '🇮🇪', name: 'Ireland', code: 'IE' }],
  ['+354', { flag: '🇮🇸', name: 'Iceland', code: 'IS' }],
  ['+352', { flag: '🇱🇺', name: 'Luxembourg', code: 'LU' }],
  ['+351', { flag: '🇵🇹', name: 'Portugal', code: 'PT' }],
  ['+350', { flag: '🇬🇮', name: 'Gibraltar', code: 'GI' }],
  ['+377', { flag: '🇲🇨', name: 'Monaco', code: 'MC' }],
  ['+376', { flag: '🇦🇩', name: 'Andorra', code: 'AD' }],
  ['+378', { flag: '🇸🇲', name: 'San Marino', code: 'SM' }],
  ['+379', { flag: '🇻🇦', name: 'Vatican', code: 'VA' }],
  ['+212', { flag: '🇲🇦', name: 'Morocco', code: 'MA' }],
  ['+213', { flag: '🇩🇿', name: 'Algeria', code: 'DZ' }],
  ['+216', { flag: '🇹🇳', name: 'Tunisia', code: 'TN' }],
  ['+218', { flag: '🇱🇾', name: 'Libya', code: 'LY' }],
  ['+220', { flag: '🇬🇲', name: 'Gambia', code: 'GM' }],
  ['+221', { flag: '🇸🇳', name: 'Senegal', code: 'SN' }],
  ['+222', { flag: '🇲🇷', name: 'Mauritania', code: 'MR' }],
  ['+223', { flag: '🇲🇱', name: 'Mali', code: 'ML' }],
  ['+224', { flag: '🇬🇳', name: 'Guinea', code: 'GN' }],
  ['+225', { flag: '🇨🇮', name: 'Côte d\'Ivoire', code: 'CI' }],
  ['+226', { flag: '🇧🇫', name: 'Burkina Faso', code: 'BF' }],
  ['+227', { flag: '🇳🇪', name: 'Niger', code: 'NE' }],
  ['+228', { flag: '🇹🇬', name: 'Togo', code: 'TG' }],
  ['+229', { flag: '🇧🇯', name: 'Benin', code: 'BJ' }],
  ['+230', { flag: '🇲🇺', name: 'Mauritius', code: 'MU' }],
  ['+231', { flag: '🇱🇷', name: 'Liberia', code: 'LR' }],
  ['+232', { flag: '🇸🇱', name: 'Sierra Leone', code: 'SL' }],
  ['+233', { flag: '🇬🇭', name: 'Ghana', code: 'GH' }],
  ['+234', { flag: '🇳🇬', name: 'Nigeria', code: 'NG' }],
  ['+235', { flag: '🇹🇩', name: 'Chad', code: 'TD' }],
  ['+236', { flag: '🇨🇫', name: 'Central African Republic', code: 'CF' }],
  ['+237', { flag: '🇨🇲', name: 'Cameroon', code: 'CM' }],
  ['+238', { flag: '🇨🇻', name: 'Cape Verde', code: 'CV' }],
  ['+240', { flag: '🇬🇶', name: 'Equatorial Guinea', code: 'GQ' }],
  ['+241', { flag: '🇬🇦', name: 'Gabon', code: 'GA' }],
  ['+242', { flag: '🇨🇬', name: 'Congo', code: 'CG' }],
  ['+243', { flag: '🇨🇩', name: 'DR Congo', code: 'CD' }],
  ['+244', { flag: '🇦🇴', name: 'Angola', code: 'AO' }],
  ['+245', { flag: '🇬🇼', name: 'Guinea-Bissau', code: 'GW' }],
  ['+246', { flag: '🇮🇴', name: 'British Indian Ocean', code: 'IO' }],
  ['+248', { flag: '🇸🇨', name: 'Seychelles', code: 'SC' }],
  ['+249', { flag: '🇸🇩', name: 'Sudan', code: 'SD' }],
  ['+250', { flag: '🇷🇼', name: 'Rwanda', code: 'RW' }],
  ['+251', { flag: '🇪🇹', name: 'Ethiopia', code: 'ET' }],
  ['+252', { flag: '🇸🇴', name: 'Somalia', code: 'SO' }],
  ['+253', { flag: '🇩🇯', name: 'Djibouti', code: 'DJ' }],
  ['+254', { flag: '🇰🇪', name: 'Kenya', code: 'KE' }],
  ['+255', { flag: '🇹🇿', name: 'Tanzania', code: 'TZ' }],
  ['+256', { flag: '🇺🇬', name: 'Uganda', code: 'UG' }],
  ['+257', { flag: '🇧🇮', name: 'Burundi', code: 'BI' }],
  ['+258', { flag: '🇲🇿', name: 'Mozambique', code: 'MZ' }],
  ['+260', { flag: '🇿🇲', name: 'Zambia', code: 'ZM' }],
  ['+261', { flag: '🇲🇬', name: 'Madagascar', code: 'MG' }],
  ['+262', { flag: '🇷🇪', name: 'Réunion', code: 'RE' }],
  ['+263', { flag: '🇿🇼', name: 'Zimbabwe', code: 'ZW' }],
  ['+264', { flag: '🇳🇦', name: 'Namibia', code: 'NA' }],
  ['+265', { flag: '🇲🇼', name: 'Malawi', code: 'MW' }],
  ['+266', { flag: '🇱🇸', name: 'Lesotho', code: 'LS' }],
  ['+267', { flag: '🇧🇼', name: 'Botswana', code: 'BW' }],
  ['+268', { flag: '🇸🇿', name: 'Eswatini', code: 'SZ' }],
  ['+269', { flag: '🇰🇲', name: 'Comoros', code: 'KM' }],
  // 2-digit prefixes
  ['+91', { flag: '🇮🇳', name: 'India', code: 'IN' }],
  ['+92', { flag: '🇵🇰', name: 'Pakistan', code: 'PK' }],
  ['+93', { flag: '🇦🇫', name: 'Afghanistan', code: 'AF' }],
  ['+94', { flag: '🇱🇰', name: 'Sri Lanka', code: 'LK' }],
  ['+95', { flag: '🇲🇲', name: 'Myanmar', code: 'MM' }],
  ['+96', { flag: '🇮🇷', name: 'Iran', code: 'IR' }],
  ['+98', { flag: '🇮🇷', name: 'Iran', code: 'IR' }],
  ['+60', { flag: '🇲🇾', name: 'Malaysia', code: 'MY' }],
  ['+61', { flag: '🇦🇺', name: 'Australia', code: 'AU' }],
  ['+62', { flag: '🇮🇩', name: 'Indonesia', code: 'ID' }],
  ['+63', { flag: '🇵🇭', name: 'Philippines', code: 'PH' }],
  ['+64', { flag: '🇳🇿', name: 'New Zealand', code: 'NZ' }],
  ['+65', { flag: '🇸🇬', name: 'Singapore', code: 'SG' }],
  ['+66', { flag: '🇹🇭', name: 'Thailand', code: 'TH' }],
  ['+81', { flag: '🇯🇵', name: 'Japan', code: 'JP' }],
  ['+82', { flag: '🇰🇷', name: 'South Korea', code: 'KR' }],
  ['+84', { flag: '🇻🇳', name: 'Vietnam', code: 'VN' }],
  ['+86', { flag: '🇨🇳', name: 'China', code: 'CN' }],
  ['+852', { flag: '🇭🇰', name: 'Hong Kong', code: 'HK' }],
  ['+853', { flag: '🇲🇴', name: 'Macao', code: 'MO' }],
  ['+855', { flag: '🇰🇭', name: 'Cambodia', code: 'KH' }],
  ['+856', { flag: '🇱🇦', name: 'Laos', code: 'LA' }],
  ['+880', { flag: '🇧🇩', name: 'Bangladesh', code: 'BD' }],
  ['+886', { flag: '🇹🇼', name: 'Taiwan', code: 'TW' }],
  ['+44', { flag: '🇬🇧', name: 'United Kingdom', code: 'GB' }],
  ['+45', { flag: '🇩🇰', name: 'Denmark', code: 'DK' }],
  ['+46', { flag: '🇸🇪', name: 'Sweden', code: 'SE' }],
  ['+47', { flag: '🇳🇴', name: 'Norway', code: 'NO' }],
  ['+48', { flag: '🇵🇱', name: 'Poland', code: 'PL' }],
  ['+49', { flag: '🇩🇪', name: 'Germany', code: 'DE' }],
  ['+30', { flag: '🇬🇷', name: 'Greece', code: 'GR' }],
  ['+31', { flag: '🇳🇱', name: 'Netherlands', code: 'NL' }],
  ['+32', { flag: '🇧🇪', name: 'Belgium', code: 'BE' }],
  ['+33', { flag: '🇫🇷', name: 'France', code: 'FR' }],
  ['+34', { flag: '🇪🇸', name: 'Spain', code: 'ES' }],
  ['+36', { flag: '🇭🇺', name: 'Hungary', code: 'HU' }],
  ['+39', { flag: '🇮🇹', name: 'Italy', code: 'IT' }],
  ['+40', { flag: '🇷🇴', name: 'Romania', code: 'RO' }],
  ['+41', { flag: '🇨🇭', name: 'Switzerland', code: 'CH' }],
  ['+43', { flag: '🇦🇹', name: 'Austria', code: 'AT' }],
  ['+20', { flag: '🇪🇬', name: 'Egypt', code: 'EG' }],
  ['+27', { flag: '🇿🇦', name: 'South Africa', code: 'ZA' }],
  ['+1',  { flag: '🇺🇸', name: 'US/Canada', code: 'US' }],
  ['+7',  { flag: '🇷🇺', name: 'Russia', code: 'RU' }],
];

/**
 * Resolve country info from a phone number string.
 * Normalizes the number first (handles 00 prefix, spaces, dashes).
 * Returns null if no match found.
 */
export function getCountryFromPhone(phone: string | null | undefined): CountryInfo | null {
  if (!phone) return null;

  // Normalize: strip spaces, dashes, parens
  let normalized = phone.replace(/[\s\-().]/g, '');

  // Convert 00xx to +xx
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }

  // If no + prefix and looks like a UAE local number, assume UAE
  if (!normalized.startsWith('+')) {
    if (/^(050|055|056|058|052|054|057|02|03|04|06|07)/.test(normalized)) {
      normalized = '+971' + normalized;
    } else {
      return null;
    }
  }

  // Match longest prefix first
  for (const [prefix, info] of PHONE_PREFIX_MAP) {
    if (normalized.startsWith(prefix)) {
      return info;
    }
  }

  return null;
}

/**
 * Renders a country flag + name badge as a React element string.
 * Returns null when phone is absent or country unknown.
 */
export function getPhoneDisplay(phone: string | null | undefined): { flag: string; country: string } | null {
  const info = getCountryFromPhone(phone);
  if (!info) return null;
  return { flag: info.flag, country: info.name };
}
