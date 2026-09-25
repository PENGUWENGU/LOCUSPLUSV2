export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type TravelMode = 'walk' | 'run' | 'cycle' | 'drive';

export interface TravelModeInfo {
  id: TravelMode;
  title: string;
  icon: string;
  baseSpeed: number; // m/s
}

export interface SavedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export type SpoofStatus = 'idle' | 'connecting' | 'active' | 'reconnecting' | 'dropped';

export interface GPXTrackPoint {
  coordinate: Coordinate;
  elevation?: number;
  time?: string;
}

export interface GPXTrack {
  name?: string;
  segments: GPXTrackPoint[][];
}
