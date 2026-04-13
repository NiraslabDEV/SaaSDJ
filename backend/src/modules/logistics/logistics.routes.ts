import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { AuthRequest } from '../../middlewares/authenticate';
import * as logisticsService from './logistics.service';

const router = Router();

// Calculate logistics fee between two points
router.post('/calculate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { artistLat, artistLng, eventLat, eventLng, address } = req.body as {
      artistLat?: number; artistLng?: number; eventLat?: number; eventLng?: number; address?: string;
    };

    let finalEventLat = eventLat;
    let finalEventLng = eventLng;

    // If no coordinates provided, try geocoding the address
    if ((!finalEventLat || !finalEventLng) && address) {
      const coords = await logisticsService.geocodeAddress(address);
      if (coords) {
        finalEventLat = coords.lat;
        finalEventLng = coords.lng;
      }
    }

    const fee = logisticsService.calculateLogisticsFee(artistLat ?? null, artistLng ?? null, finalEventLat ?? null, finalEventLng ?? null);
    res.json({ logisticsFee: fee, eventLat: finalEventLat, eventLng: finalEventLng });
  } catch (err) {
    next(err);
  }
});

// Geocode an address
router.post('/geocode', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.body as { address: string };
    if (!address) throw Object.assign(new Error('Endereço é obrigatório.'), { statusCode: 400, code: 'BAD_REQUEST' });
    const coords = await logisticsService.geocodeAddress(address);
    if (!coords) throw Object.assign(new Error('Endereço não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
    res.json(coords);
  } catch (err) {
    next(err);
  }
});

// Estimate Uber ride cost (mock or real API)
router.post('/uber-estimate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.body as {
      startLat: number; startLng: number; endLat: number; endLng: number;
    };
    const estimate = await logisticsService.getUberEstimate(startLat, startLng, endLat, endLng);
    res.json(estimate);
  } catch (err) {
    next(err);
  }
});

export default router;