import { Coordinate, GPXTrack, GPXTrackPoint, TravelMode } from '../types';

export const EARTH_RADIUS = 6378137.0;

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function getDistance(coord1: Coordinate, coord2: Coordinate): number {
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Offsets a coordinate by east and north meters (matches Locus Engine)
 */
export function offsetCoordinate(
  coord: Coordinate,
  eastMeters: number,
  northMeters: number
): Coordinate {
  const dLat = (northMeters / EARTH_RADIUS) * (180 / Math.PI);
  const dLon =
    (eastMeters / (EARTH_RADIUS * Math.cos((coord.latitude * Math.PI) / 180))) *
    (180 / Math.PI);
  return {
    latitude: Number((coord.latitude + dLat).toFixed(7)),
    longitude: Number((coord.longitude + dLon).toFixed(7)),
  };
}

/**
 * Speed input parser matching Swift's SpeedInput:
 * Parses text into safe finite number between 0.05 m/s and 1000 m/s
 */
export const SpeedInput = {
  minimumMetersPerSecond: 0.05,
  maximumMetersPerSecond: 1000,

  parse(text: string): number | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(',', '.');
    const val = parseFloat(normalized);
    if (isNaN(val) || !isFinite(val) || val <= 0) return null;
    return Math.min(
      Math.max(val, SpeedInput.minimumMetersPerSecond),
      SpeedInput.maximumMetersPerSecond
    );
  },
};

/**
 * Samples coordinates along lines every `meters`
 */
export function sampleCoordinates(
  coordinates: Coordinate[],
  meters: number = 10
): Coordinate[] {
  if (coordinates.length <= 1) return [...coordinates];

  const sampled: Coordinate[] = [{ ...coordinates[0] }];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = coordinates[i];
    const b = coordinates[i + 1];
    const dist = getDistance(a, b);
    const steps = Math.max(1, Math.ceil(dist / meters));

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      sampled.push({
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      });
    }
  }
  return sampled;
}

/**
 * Parses GPX XML string into GPXTrack
 */
export function parseGPX(xmlText: string): GPXTrack {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('This isn’t a valid GPX/XML file');
  }

  const nameElem = xmlDoc.querySelector('trk > name');
  const trackName = nameElem?.textContent?.trim() || 'Imported Route';

  const segments: GPXTrackPoint[][] = [];
  const trksegs = xmlDoc.getElementsByTagName('trkseg');

  if (trksegs.length > 0) {
    for (let i = 0; i < trksegs.length; i++) {
      const segElem = trksegs[i];
      const ptElems = segElem.getElementsByTagName('trkpt');
      const segmentPoints: GPXTrackPoint[] = [];

      for (let j = 0; j < ptElems.length; j++) {
        const pt = ptElems[j];
        const lat = parseFloat(pt.getAttribute('lat') || '');
        const lon = parseFloat(pt.getAttribute('lon') || '');

        if (!isNaN(lat) && !isNaN(lon)) {
          const eleElem = pt.getElementsByTagName('ele')[0];
          const timeElem = pt.getElementsByTagName('time')[0];
          segmentPoints.push({
            coordinate: { latitude: lat, longitude: lon },
            elevation: eleElem?.textContent ? parseFloat(eleElem.textContent) : undefined,
            time: timeElem?.textContent?.trim(),
          });
        }
      }
      if (segmentPoints.length > 0) {
        segments.push(segmentPoints);
      }
    }
  } else {
    // Check for direct trkpt
    const ptElems = xmlDoc.getElementsByTagName('trkpt');
    const segmentPoints: GPXTrackPoint[] = [];
    for (let j = 0; j < ptElems.length; j++) {
      const pt = ptElems[j];
      const lat = parseFloat(pt.getAttribute('lat') || '');
      const lon = parseFloat(pt.getAttribute('lon') || '');
      if (!isNaN(lat) && !isNaN(lon)) {
        segmentPoints.push({ coordinate: { latitude: lat, longitude: lon } });
      }
    }
    if (segmentPoints.length > 0) {
      segments.push(segmentPoints);
    }
  }

  if (segments.length === 0 || segments.every((s) => s.length === 0)) {
    throw new Error('This GPX file doesn’t contain any track points.');
  }

  return { name: trackName, segments };
}

/**
 * Calculates total route distance in meters
 */
export function calculateTotalDistance(coordinates: Coordinate[]): number {
  if (coordinates.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += getDistance(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

export interface GPXExportOptions {
  name?: string;
  description?: string;
  speedMPS?: number;
  includeWaypoints?: boolean;
  startTime?: Date;
}

/**
 * Exports GPXTrack or flat coordinate array into standard GPX 1.1 XML string
 * compatible with other mapping applications (Garmin, Strava, Komoot, Google Earth, OsmAnd)
 */
export function exportGPX(
  trackOrCoords: GPXTrack | Coordinate[],
  optionsOrName?: string | GPXExportOptions
): string {
  let segments: GPXTrackPoint[][];
  let options: GPXExportOptions = {};

  if (typeof optionsOrName === 'string') {
    options = { name: optionsOrName };
  } else if (optionsOrName) {
    options = optionsOrName;
  }

  const trackName = options.name || (Array.isArray(trackOrCoords) ? 'Locus Route' : trackOrCoords.name) || 'Locus Route';
  const speed = options.speedMPS && options.speedMPS > 0 ? options.speedMPS : 3.0; // default 3 m/s (~11 km/h)
  const startTime = options.startTime || new Date();

  if (Array.isArray(trackOrCoords)) {
    // Generate timestamps if not present based on distance and speed
    let currentTimeMs = startTime.getTime();
    const points: GPXTrackPoint[] = [];

    for (let i = 0; i < trackOrCoords.length; i++) {
      const coord = trackOrCoords[i];
      if (i > 0) {
        const dist = getDistance(trackOrCoords[i - 1], coord);
        const dtSeconds = Math.max(1, dist / speed);
        currentTimeMs += dtSeconds * 1000;
      }
      points.push({
        coordinate: coord,
        time: new Date(currentTimeMs).toISOString(),
      });
    }
    segments = [points];
  } else {
    segments = trackOrCoords.segments;
  }

  const allCoords = segments.flatMap((seg) => seg.map((p) => p.coordinate));
  const totalMeters = calculateTotalDistance(allCoords);
  const totalKm = (totalMeters / 1000).toFixed(2);
  const totalMi = (totalMeters * 0.000621371).toFixed(2);
  const desc = options.description || `Generated by Locus. Distance: ${totalKm} km (${totalMi} mi), ${allCoords.length} points.`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<gpx version="1.1" creator="Locus GPS Simulator" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n`;
  xml += `  <metadata>\n`;
  xml += `    <name>${escapeXml(trackName)}</name>\n`;
  xml += `    <desc>${escapeXml(desc)}</desc>\n`;
  xml += `    <time>${startTime.toISOString()}</time>\n`;
  xml += `  </metadata>\n`;

  // Waypoints for Start and Finish if requested or by default if coordinates exist
  if (options.includeWaypoints !== false && allCoords.length >= 2) {
    const startPt = allCoords[0];
    const endPt = allCoords[allCoords.length - 1];
    xml += `  <wpt lat="${startPt.latitude.toFixed(7)}" lon="${startPt.longitude.toFixed(7)}">\n`;
    xml += `    <name>Start</name>\n`;
    xml += `    <desc>Route origin</desc>\n`;
    xml += `    <sym>Flag, Green</sym>\n`;
    xml += `  </wpt>\n`;
    xml += `  <wpt lat="${endPt.latitude.toFixed(7)}" lon="${endPt.longitude.toFixed(7)}">\n`;
    xml += `    <name>Destination</name>\n`;
    xml += `    <desc>Route endpoint</desc>\n`;
    xml += `    <sym>Flag, Red</sym>\n`;
    xml += `  </wpt>\n`;
  }

  xml += `  <trk>\n`;
  xml += `    <name>${escapeXml(trackName)}</name>\n`;
  xml += `    <desc>${escapeXml(desc)}</desc>\n`;

  for (const seg of segments) {
    xml += '    <trkseg>\n';
    for (const pt of seg) {
      xml += `      <trkpt lat="${pt.coordinate.latitude.toFixed(7)}" lon="${pt.coordinate.longitude.toFixed(7)}">`;
      let hasChild = false;
      if (pt.elevation !== undefined && isFinite(pt.elevation)) {
        xml += `\n        <ele>${pt.elevation.toFixed(2)}</ele>`;
        hasChild = true;
      }
      if (pt.time) {
        xml += `\n        <time>${pt.time}</time>`;
        hasChild = true;
      }
      xml += hasChild ? '\n      </trkpt>\n' : '</trkpt>\n';
    }
    xml += '    </trkseg>\n';
  }

  xml += '  </trk>\n</gpx>';
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Calculates road route using OSRM public API, with fallback to straight-line interpolation
 */
export async function fetchRoadRoute(
  start: Coordinate,
  end: Coordinate,
  mode: TravelMode
): Promise<Coordinate[]> {
  const profile = mode === 'drive' ? 'driving' : mode === 'cycle' ? 'bike' : 'foot';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Route service returned ' + res.status);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const geoCoords: [number, number][] = data.routes[0].geometry.coordinates;
      const coords = geoCoords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
      return sampleCoordinates(coords, 12);
    }
  } catch (err) {
    console.warn('OSRM routing request failed, falling back to direct path:', err);
  }

  // Fallback: interpolate directly between start and end
  return sampleCoordinates([start, end], 12);
}
