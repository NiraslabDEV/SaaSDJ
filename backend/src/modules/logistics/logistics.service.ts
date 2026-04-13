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

export { BASE_FEE, HOURLY_RATE };
