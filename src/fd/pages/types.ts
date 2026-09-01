/** Types shared by FD pages (server row shapes, camel-mapped where the server maps). */
export type GeoStation = {
  id: number; callsign: string; dial: string; name: string; city: string; city_label: string; state: string;
  lat: number; lon: number; coord_basis: string; ring: string; format: string; specialty_program: string;
  gatekeeper_role: string; gatekeeper_name: string; contact_route: string; source_url: string;
  verified_at: string; data_risk: number; angle: string; import_batch: string; updated_at: string;
};
export type StationOverlay = { station_id: number; status: string; total_score: number; suppressed: number; outcomes: number };
