import { ApiError } from "@/lib/http";

type RestCountryPayload = {
  name?: {
    common?: string;
    official?: string;
  };
  currencies?: Record<
    string,
    {
      name?: string;
      symbol?: string;
    }
  >;
};

export type CountryCurrency = {
  country: string;
  officialName: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
};

let countryCache: CountryCurrency[] | null = null;
let lastCountriesFetchAt = 0;

const COUNTRY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetchCountriesFromSource(): Promise<CountryCurrency[]> {
  const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(502, "Unable to fetch countries and currencies.");
  }

  const payload = (await response.json()) as RestCountryPayload[];

  return payload
    .flatMap((country) => {
      if (!country.name?.common || !country.currencies) {
        return [];
      }

      const currencyEntry = Object.entries(country.currencies)[0];
      if (!currencyEntry) {
        return [];
      }

      const [currencyCode, currencyDetails] = currencyEntry;
      return [
        {
          country: country.name.common,
          officialName: country.name.official ?? country.name.common,
          currencyCode: currencyCode.toUpperCase(),
          currencyName: currencyDetails.name ?? currencyCode.toUpperCase(),
          currencySymbol: currencyDetails.symbol ?? "",
        },
      ];
    })
    .sort((a, b) => a.country.localeCompare(b.country));
}

export async function listCountriesWithCurrencies() {
  const isCacheFresh = countryCache && Date.now() - lastCountriesFetchAt < COUNTRY_CACHE_TTL_MS;

  if (isCacheFresh && countryCache) {
    return countryCache;
  }

  const countries = await fetchCountriesFromSource();
  countryCache = countries;
  lastCountriesFetchAt = Date.now();

  return countries;
}

export async function resolveCurrencyByCountry(countryName: string) {
  const countries = await listCountriesWithCurrencies();
  const normalizedInput = normalizeCountryName(countryName);

  const match = countries.find((country) => {
    return (
      normalizeCountryName(country.country) === normalizedInput ||
      normalizeCountryName(country.officialName) === normalizedInput
    );
  });

  if (!match) {
    throw new ApiError(404, `No currency mapping found for country \"${countryName}\".`);
  }

  return match;
}

export async function convertAmount(params: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}) {
  const sourceCurrency = params.fromCurrency.toUpperCase();
  const targetCurrency = params.toCurrency.toUpperCase();

  if (sourceCurrency === targetCurrency) {
    return Number(params.amount.toFixed(2));
  }

  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${sourceCurrency}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(
      502,
      `Unable to fetch exchange rates for base currency ${sourceCurrency}.`,
    );
  }

  const payload = (await response.json()) as {
    rates?: Record<string, number>;
  };

  const targetRate = payload.rates?.[targetCurrency];
  if (!targetRate) {
    throw new ApiError(422, `Conversion rate from ${sourceCurrency} to ${targetCurrency} is unavailable.`);
  }

  const converted = params.amount * targetRate;
  return Number(converted.toFixed(2));
}
