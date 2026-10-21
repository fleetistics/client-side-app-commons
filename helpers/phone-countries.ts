import { I18nManager } from 'react-native';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export const DEFAULT_PHONE_REGION = 'US';

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2 region, e.g. "US". Unlike the dial code it identifies the country uniquely. */
  region: string;
  /** e.g. "+1" */
  dialCode: string;
  name: string;
  flag: string;
};

function regionName(region: string): string {
  try {
    const DisplayNames = (Intl as any)?.DisplayNames;
    if (DisplayNames) return new DisplayNames(['en'], { type: 'region' }).of(region) ?? region;
  } catch {
    // Intl.DisplayNames is not available on every JS engine - fall back to the code.
  }
  return region;
}

function regionFlag(region: string): string {
  return String.fromCodePoint(...[...region].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Every region the library knows a numbering plan for, sorted by name. Built once, lazily. */
let countries: PhoneCountry[] | undefined;
export function GetPhoneCountries(): PhoneCountry[] {
  countries ??= phoneUtil
    .getSupportedRegions()
    .filter((r) => /^[A-Z]{2}$/.test(r))
    .map((region) => ({
      region,
      dialCode: `+${phoneUtil.getCountryCodeForRegion(region)}`,
      name: regionName(region),
      flag: regionFlag(region),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return countries;
}

export function GetPhoneCountry(region: string | null | undefined): PhoneCountry | undefined {
  return GetPhoneCountries().find((c) => c.region === region);
}

function nativeLocale(): string | undefined {
  try {
    return I18nManager.getConstants().localeIdentifier;
  } catch {
    return undefined;
  }
}

function jsLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

/**
 * Best guess of the user's country, from the device locale only (no location, no permission):
 * the region of the native locale ("en_US" -> "US"), then of the JS engine's Intl locale.
 * Falls back to DEFAULT_PHONE_REGION.
 */
export function DetectDeviceRegion(): string {
  const supported = phoneUtil.getSupportedRegions() as string[];
  for (const locale of [nativeLocale(), jsLocale()]) {
    const region = locale ? /[-_]([A-Za-z]{2})/.exec(locale)?.[1]?.toUpperCase() : undefined;
    if (region && supported.includes(region)) return region;
  }
  return DEFAULT_PHONE_REGION;
}

export type PhoneParseResult = {
  /** Text to show in the input: national format when valid, otherwise what the user typed. */
  text: string;
  /** Region of the number when valid (may differ from the one passed in, e.g. user typed "+44 ..."). */
  region: string;
  isValid: boolean;
};

/**
 * Same idea as the mf5 PhoneInput: try to parse what was typed against the selected region; when it is a
 * valid number, reformat it nationally and report the number's own region so the country picker follows it.
 */
export function ParsePhoneInput(text: string, region: string): PhoneParseResult {
  if (text.trim()) {
    try {
      const parsed = phoneUtil.parse(text, region);
      if (phoneUtil.isValidNumber(parsed)) {
        return {
          text: phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL),
          region: phoneUtil.getRegionCodeForNumber(parsed) ?? region,
          isValid: true,
        };
      }
    } catch {
      // not parseable yet - keep what was typed
    }
  }
  return { text, region, isValid: false };
}

/** "Expected: (201) 555-0123 for US (+1)" - the sample number of the region. */
export function GetPhoneFormatHint(region: string): string {
  const sample = phoneUtil.getExampleNumber(region);
  if (!sample) return region;
  return `${phoneUtil.format(sample, PhoneNumberFormat.NATIONAL)} for ${region} (+${sample.getCountryCode()})`;
}

/** Stored form of a number: international format ("+1 813-555-0192"), or "+<cc> <typed>" when it cannot be parsed. */
export function FormatPhoneForStorage(text: string, region: string): string | null {
  const value = text.trim();
  if (!value) return null;
  try {
    const parsed = phoneUtil.parse(value, region);
    if (phoneUtil.isValidNumber(parsed)) return phoneUtil.format(parsed, PhoneNumberFormat.INTERNATIONAL);
  } catch {
    // fall through
  }
  // Already international, just not a valid number (yet): do not prefix the region's code a second time.
  if (value.startsWith('+')) return value;
  return `+${phoneUtil.getCountryCodeForRegion(region)} ${value}`;
}

/** Splits a stored phone ("+1 813-555-0192") into region + national text for the form. */
export function SplitStoredPhone(phone: string | null | undefined): { region: string; national: string } {
  const value = (phone ?? '').trim();
  const fallback = { region: DetectDeviceRegion(), national: value };
  if (!value.startsWith('+')) return fallback;
  const res = ParsePhoneInput(value, DEFAULT_PHONE_REGION);
  if (res.isValid) return { region: res.region, national: res.text };
  // Not a valid number: still peel the country calling code off so the picker matches.
  try {
    const parsed = phoneUtil.parse(value, DEFAULT_PHONE_REGION);
    const region = phoneUtil.getRegionCodeForCountryCode(parsed.getCountryCode() ?? 0);
    if (region && region !== 'ZZ') {
      return { region, national: String(parsed.getNationalNumber() ?? '') };
    }
  } catch {
    // ignore
  }
  return fallback;
}
