import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/types";
import { ROLE_COLORS, parseJsonArray } from "@/lib/types";

const GP_CENTER: [number, number] = [55.1707, -118.7946];
const GP_ZOOM = 11;

function getMarkerPosition(id: number): [number, number] {
  const latOffset = ((id * 17) % 100 - 50) * 0.003;
  const lngOffset = ((id * 31) % 100 - 50) * 0.004;
  return [GP_CENTER[0] + latOffset, GP_CENTER[1] + lngOffset];
}

const LEGEND_ITEMS = [
  { role: "developer", label: "Developer", color: ROLE_COLORS.developer },
  { role: "trades", label: "Trades", color: ROLE_COLORS.trades },
  { role: "student", label: "Student", color: ROLE_COLORS.student },
  { role: "founder", label: "Founder", color: ROLE_COLORS.founder },
  { role: "operator", label: "Operator", color: ROLE_COLORS.operator },
  { role: "mentor", label: "Mentor", color: ROLE_COLORS.mentor },
];

export default function Map() {
  const { data: profiles, isLoading } = useQuery<Profile[]>({ queryKey: ["/api/profiles"] });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl">
      <div className="space-y-1">
        <h1 className="text-xl font-display font-bold">Community Map</h1>
        <p className="text-sm text-muted-foreground">Members across the Grande Prairie region</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-md" />
      ) : (
        <div className="rounded-md overflow-hidden border border-border" style={{ height: 400 }}>
          <MapContainer
            center={GP_CENTER}
            zoom={GP_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {(profiles ?? []).map((profile) => {
              const position = getMarkerPosition(profile.id);
              const color = ROLE_COLORS[profile.role] ?? "#666666";
              const skills = parseJsonArray(profile.skills);

              return (
                <CircleMarker
                  key={profile.id}
                  center={position}
                  radius={6}
                  pathOptions={{
                    color: "white",
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{profile.name}</div>
                      <div className="text-muted-foreground text-xs capitalize">{profile.role}</div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {LEGEND_ITEMS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
