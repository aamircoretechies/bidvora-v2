const ISO_COUNTRY_CODES = new Set(
  `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(
    ' ',
  ),
);

const FALLBACK_CURRENCY_CODES =
  `AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VED VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XCG XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL`.split(
    ' ',
  );

type SupportedValuesIntl = typeof Intl & {
  supportedValuesOf?: (key: 'currency') => string[];
};

const supportedCurrencyCodes = new Set(
  (Intl as SupportedValuesIntl).supportedValuesOf?.('currency') ??
    FALLBACK_CURRENCY_CODES,
);

export const COUNTRY_CODES = [...ISO_COUNTRY_CODES];

export function normalizeUppercaseTag(tag: string) {
  return tag.trim().toUpperCase();
}

export function validateSkillTag(tag: string): string | null {
  if (tag.length > 50) return 'Each skill can contain at most 50 characters.';
  if (!/^[\p{L}\p{N} .#+\-/]+$/u.test(tag)) {
    return 'Skills may only contain letters, numbers, spaces, ., #, +, -, and /.';
  }

  const letterOrNumberCount = tag.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  const isCPlusPlus = tag.toLocaleLowerCase() === 'c++';
  if (letterOrNumberCount < 2 && !isCPlusPlus) {
    return 'Each skill must contain at least two letters or numbers.';
  }

  return null;
}

export function validateCurrencyTag(tag: string): string | null {
  return supportedCurrencyCodes.has(tag)
    ? null
    : 'Enter a supported three-letter ISO currency code.';
}

export function validateKeywordTag(tag: string): string | null {
  return tag.length <= 100
    ? null
    : 'Each blacklisted keyword or phrase can contain at most 100 characters.';
}

export function isCaseInsensitiveDuplicate(
  tag: string,
  existingTags: string[],
) {
  const normalizedTag = tag.toLocaleLowerCase();
  return existingTags.some(
    (existingTag) => existingTag.toLocaleLowerCase() === normalizedTag,
  );
}

type ValidatedSettings = {
  targetSkills?: string;
  targetCurrencies?: string;
  excludedCountries?: string;
  blacklistKeywords?: string;
};

type FieldRule = {
  label: string;
  maxTags: number;
  normalize?: (tag: string) => string;
  validate: (tag: string) => string | null;
  preventCaseInsensitiveDuplicates?: boolean;
};

const fieldRules: Record<keyof ValidatedSettings, FieldRule> = {
  targetSkills: {
    label: 'Target Skills',
    maxTags: 20,
    validate: validateSkillTag,
  },
  targetCurrencies: {
    label: 'Target Currencies',
    maxTags: 10,
    normalize: normalizeUppercaseTag,
    validate: validateCurrencyTag,
    preventCaseInsensitiveDuplicates: true,
  },
  excludedCountries: {
    label: 'Excluded Countries',
    maxTags: 50,
    normalize: normalizeUppercaseTag,
    validate: (tag) =>
      ISO_COUNTRY_CODES.has(tag) ? null : 'Select a valid ISO country code.',
    preventCaseInsensitiveDuplicates: true,
  },
  blacklistKeywords: {
    label: 'Blacklisted Keywords',
    maxTags: 50,
    validate: validateKeywordTag,
    preventCaseInsensitiveDuplicates: true,
  },
};

export function validateAndNormalizeBiddingTags(settings: ValidatedSettings): {
  values: ValidatedSettings;
  error: string | null;
} {
  const values: ValidatedSettings = {};

  for (const field of Object.keys(fieldRules) as (keyof ValidatedSettings)[]) {
    const rawValue = settings[field] ?? '';
    const rule = fieldRules[field];

    if (!rawValue.trim()) {
      values[field] = '';
      continue;
    }

    const rawTags = rawValue.split(',');
    if (rawTags.some((tag) => !tag.trim())) {
      return { values, error: `${rule.label}: tags cannot be empty.` };
    }

    const tags = rawTags.map((tag) =>
      (rule.normalize?.(tag.trim()) ?? tag.trim()).trim(),
    );

    if (tags.length > rule.maxTags) {
      return {
        values,
        error: `${rule.label}: you can add up to ${rule.maxTags} entries.`,
      };
    }

    const seen = new Set<string>();
    for (const tag of tags) {
      const validationError = rule.validate(tag);
      if (validationError) {
        return { values, error: `${rule.label}: ${validationError}` };
      }

      if (rule.preventCaseInsensitiveDuplicates) {
        const duplicateKey = tag.toLocaleLowerCase();
        if (seen.has(duplicateKey)) {
          return {
            values,
            error: `${rule.label}: "${tag}" is duplicated.`,
          };
        }
        seen.add(duplicateKey);
      }
    }

    values[field] = tags.join(', ');
  }

  return { values, error: null };
}
