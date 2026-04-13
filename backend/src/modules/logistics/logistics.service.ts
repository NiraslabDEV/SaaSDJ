const BASE_FEE = 1200;
const HOURLY_RATE = 300;
const COST_PER_KM = 2.5;
const FALLBACK_LOGISTICS = 150;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function calculateLogisticsFee(
  artistLat: number | null,
  artistLng: number | null,
  eventLat: number | null,
  eventLng: number | null,
): number {
  if (artistLat && artistLng && eventLat && eventLng) {
    const distKm = haversineKm(artistLat, artistLng, eventLat, eventLng);
    return distKm * 2 * COST_PER_KM;
  }
  return FALLBACK_LOGISTICS;
}

export function calculateTotal(durationHours: number, logisticsFee: number): number {
  return BASE_FEE + HOURLY_RATE * durationHours + logisticsFee;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'PulsoMusical/1.0' } });
    const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

interface UberEstimate {
  distanceKm: number;
  durationMin: number;
  estimateLow: number;
  estimateHigh: number;
  currency: string;
  provider: string;
}

export async function getUberEstimate(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<UberEstimate> {
  const distKm = haversineKm(startLat, startLng, endLat, endLng);
  const durationMin = Math.round(distKm * 2.5); // ~2.5 min/km average urban

  // If Uber API credentials are configured, try real API
  if (process.env.UBER_SERVER_TOKEN) {
    try {
      const url = `https://api.uber.com/v1.2/estimates/price?start_latitude=${startLat}&start_longitude=${startLng}&end_latitude=${endLat}&end_longitude=${endLng}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Token ${process.env.UBER_SERVER_TOKEN}` },
      });
      const data = await resp.json() as { prices?: Array<{ localized_display_name: string; low_estimate: number; high_estimate: number; currency_code: string }> };
      const uberX = data.prices?.find(p => p.localized_display_name === 'UberX');
      if (uberX) {
        return {
          distanceKm: Math.round(distKm * 10) / 10,
          durationMin,
          estimateLow: uberX.low_estimate,
          estimateHigh: uberX.high_estimate,
          currency: uberX.currency_code || 'BRL',
          provider: 'Uber',
        };
      }
    } catch (err) {
      console.error('[UBER API] Failed, using mock estimate:', err);
    }
  }

  // Mock estimate: R$ 2.50/km + R$ 5 base
  const baseFare = 5;
  const perKm = 2.5;
  const low = Math.round((baseFare + distKm * perKm) * 100) / 100;
  const high = Math.round(low * 1.4 * 100) / 100;

  return {
    distanceKm: Math.round(distKm * 10) / 10,
    durationMin,
    estimateLow: low,
    estimateHigh: high,
    currency: 'BRL',
    provider: 'mock',
  };
}

export { BASE_FEE, HOURLY_RATE };
