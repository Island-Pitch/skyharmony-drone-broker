import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  KNOWN_LOCATIONS,
  findLocation,
  distanceBetween,
  haversineDistance,
} from '../data/locations.js';

const router = Router();

const OptimizeSchema = z.object({
  pickup: z.string().min(1),
  deliveries: z.array(z.string().min(1)).min(1),
});

/**
 * POST /api/routes/optimize
 * Given a pickup point and list of delivery locations, calculates optimal
 * route order using nearest-neighbor heuristic with Haversine distances.
 */
router.post('/routes/optimize', auth, validate(OptimizeSchema), async (req, res) => {
  try {
    const { pickup, deliveries } = req.body as z.infer<typeof OptimizeSchema>;

    const pickupLoc = findLocation(pickup);
    if (!pickupLoc) {
      res.status(400).json({ error: `Unknown pickup location: ${pickup}` });
      return;
    }

    // Validate all delivery locations
    const unknownDeliveries: string[] = [];
    for (const d of deliveries) {
      if (!findLocation(d)) unknownDeliveries.push(d);
    }
    if (unknownDeliveries.length > 0) {
      res.status(400).json({
        error: `Unknown delivery locations: ${unknownDeliveries.join(', ')}`,
      });
      return;
    }

    // Nearest-neighbor heuristic
    const remaining = new Set(deliveries.map((d) => d.toLowerCase()));
    const optimizedOrder: string[] = [];
    const legs: { from: string; to: string; distance: number }[] = [];
    let currentLoc = pickupLoc;
    let totalDistance = 0;

    while (remaining.size > 0) {
      let nearest: string | null = null;
      let nearestDist = Infinity;

      for (const name of remaining) {
        const loc = findLocation(name)!;
        const dist = haversineDistance(currentLoc.lat, currentLoc.lng, loc.lat, loc.lng);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = name;
        }
      }

      if (!nearest) break;

      const nextLoc = findLocation(nearest)!;
      const fromName = currentLoc.name;
      const roundedDist = Math.round(nearestDist * 100) / 100;

      optimizedOrder.push(nextLoc.name);
      legs.push({ from: fromName, to: nextLoc.name, distance: roundedDist });
      totalDistance += nearestDist;
      remaining.delete(nearest);
      currentLoc = nextLoc;
    }

    res.json({
      data: {
        optimized_order: optimizedOrder,
        total_distance_miles: Math.round(totalDistance * 100) / 100,
        legs,
      },
    });
  } catch (err) {
    console.error('Route optimization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/routes/distances
 * Returns distance matrix between all known locations.
 */
router.get('/routes/distances', auth, async (_req, res) => {
  try {
    const matrix: { from: string; to: string; distance: number }[] = [];

    for (let i = 0; i < KNOWN_LOCATIONS.length; i++) {
      for (let j = i + 1; j < KNOWN_LOCATIONS.length; j++) {
        const a = KNOWN_LOCATIONS[i];
        const b = KNOWN_LOCATIONS[j];
        const dist = distanceBetween(a.name, b.name);
        if (dist !== null) {
          matrix.push({
            from: a.name,
            to: b.name,
            distance: Math.round(dist * 100) / 100,
          });
        }
      }
    }

    res.json({ data: { locations: KNOWN_LOCATIONS.map((l) => l.name), matrix } });
  } catch (err) {
    console.error('Distance matrix error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
