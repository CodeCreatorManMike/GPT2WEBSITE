import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Marker, Line, ZoomableGroup } from "react-simple-maps";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip as RechartsTooltip, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";

// TopoJSON source for world map (110m). This is a lightweight dataset suitable for an interactive landing page.
const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

// Primary brand color (Savills Yellow) & accents
const SAVILLS_YELLOW = "#ffe600"; // primary
const SAVILLS_YELLOW_DARK = "#e6cf00"; // darker for emphasis
const ACCENT_BLUE = "#2563eb"; // Viadex DC beacons
const ACCENT_SLATE = "#0f172a"; // deep slate for headings

// Company meta
const COMPANY = {
  name: "Savills",
  domain: "savills.com",
  logo: "https://s3.amazonaws.com/media.mixrank.com/hero-img/c06042b477148f1ad3fc06c738c6e82c",
  employees: 40267,
  officesTotal: 700,
  slaDays: 2,
};

// Countries where Savills has offices (by name as seen in the client brief)
const officeCountries = [
  "Abu Dhabi", "Antigua", "Australia", "Austria", "The Bahamas", "Bahrain", "Barbados", "Belgium", "Botswana", "Bulgaria", "Canada", "The Cayman Islands", "China", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Dubai", "Egypt", "Estonia", "Finland", "France", "Germany", "Gibraltar", "Greece", "Guernsey", "Hong Kong SAR", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Jersey", "Kenya", "Korea", "Latvia", "Lithuania", "Luxembourg", "Macao SAR", "Malaysia", "Mauritius", "Mexico", "Monaco", "Montenegro", "Mozambique", "Namibia", "The Netherlands", "New Zealand", "Norway", "Oman", "Pakistan", "The Philippines", "Poland", "Portugal", "Puerto Rico", "Romania", "Saudi Arabia", "Serbia", "The Seychelles", "Sharjah", "Singapore", "South Africa", "Spain", "St Kitts & Nevis", "Sweden", "Switzerland", "Taiwan, China", "Thailand", "Turks & Caicos", "UAE", "United Kingdom", "United States", "Vietnam", "Zambia", "Zimbabwe"
];

// Percent distribution for heatmap (country -> percentage). Names normalized to align with geographies later.
const heatmapPercent = {
  "Abu Dhabi, United Arab Emirates": 1,
  "Antigua and Barbuda": 1,
  "Australia": 7,
  "Austria": 1,
  "The Bahamas": 1,
  "Bahrain": 1,
  "Barbados": 1,
  "Belgium": 1,
  "Botswana": 1,
  "Bulgaria": 1,
  "Canada": 1,
  "The Cayman Islands": 1,
  "China": 10,
  "Croatia": 1,
  "Cyprus": 1,
  "Czech Republic": 1,
  "Denmark": 1,
  "Dubai, United Arab Emirates": 1,
  "Egypt": 1,
  "Estonia": 1,
  "Finland": 1,
  "France": 3,
  "Germany": 3,
  "Gibraltar": 1,
  "Greece": 1,
  "Guernsey": 1,
  "Hong Kong SAR": 6,
  "Hungary": 1,
  "India": 3,
  "Indonesia": 1,
  "Ireland": 2,
  "Israel": 1,
  "Italy": 2,
  "Japan": 2,
  "Jersey": 1,
  "Kenya": 1,
  "South Korea": 1,
  "Latvia": 1,
  "Lithuania": 1,
  "Luxembourg": 1,
  "Macao SAR, China": 1,
  "Malaysia": 1,
  "Mauritius": 1,
  "Mexico": 1,
  "Monaco": 1,
  "Montenegro": 1,
  "Mozambique": 1,
  "Namibia": 1,
  "Netherlands": 2,
  "New Zealand": 1,
  "Norway": 1,
  "Oman": 1,
  "Pakistan": 1,
  "Philippines": 1,
  "Poland": 1,
  "Portugal": 1,
  "Puerto Rico": 1,
  "Romania": 1,
  "Saudi Arabia": 1,
  "Serbia": 1,
  "Seychelles": 1,
  "Sharjah, United Arab Emirates": 1,
  "Singapore": 3,
  "South Africa": 2,
  "Spain": 2,
  "Saint Kitts and Nevis": 1,
  "Sweden": 1,
  "Switzerland": 1,
  "Taiwan": 1,
  "Thailand": 1,
  "Turks and Caicos Islands": 1,
  "United Arab Emirates": 2,
  "United Kingdom": 25,
  "United States": 4,
  "Vietnam": 1,
  "Zambia": 1,
  "Zimbabwe": 1,
};

// Viadex Distribution Centres (blue beacons) with rough coordinates
const viadexDCs = [
  { name: "Montreal", country: "Canada", coord: [ -73.5673, 45.5017 ] },
  { name: "Houston", country: "USA", coord: [ -95.3698, 29.7604 ] },
  { name: "San Luis Potosi", country: "Mexico", coord: [ -100.9855, 22.1565 ] },
  { name: "Barranquilla", country: "Colombia", coord: [ -74.8069, 10.9639 ] },
  { name: "Santiago", country: "Chile", coord: [ -70.6693, -33.4489 ] },
  { name: "Sao Paulo", country: "Brazil", coord: [ -46.6333, -23.5505 ] },
  { name: "Buenos Aires", country: "Argentina", coord: [ -58.3816, -34.6037 ] },
  { name: "Malmo", country: "Sweden", coord: [ 13.0038, 55.6050 ] },
  { name: "Villejust", country: "France", coord: [ 2.2137, 48.6866 ] },
  { name: "Basingstoke", country: "United Kingdom", coord: [ -1.0876, 51.2665 ] },
  { name: "Schlieren", country: "Switzerland", coord: [ 8.4477, 47.3962 ] },
  { name: "Rho", country: "Italy", coord: [ 9.0360, 45.5235 ] },
  { name: "Prague", country: "Czech Republic", coord: [ 14.4378, 50.0755 ] },
  { name: "Bielany Wroclawskie", country: "Poland", coord: [ 16.9700, 51.0300 ] },
  { name: "Budapest", country: "Hungary", coord: [ 19.0402, 47.4979 ] },
  { name: "Cluj-Napoca", country: "Romania", coord: [ 23.5940, 46.7712 ] },
  { name: "Istanbul", country: "Turkey", coord: [ 28.9784, 41.0082 ] },
  { name: "Athens", country: "Greece", coord: [ 23.7275, 37.9838 ] },
  { name: "Kigali", country: "Rwanda", coord: [ 30.0588, -1.9441 ] },
  { name: "Midrand", country: "South Africa", coord: [ 28.1272, -25.9992 ] },
  { name: "Abu Dhabi", country: "UAE", coord: [ 54.3773, 24.4539 ] },
  { name: "Gazipur", country: "Bangladesh", coord: [ 90.4203, 23.9999 ] },
  { name: "Bangalore", country: "India", coord: [ 77.5946, 12.9716 ] },
  { name: "Petaling Jaya", country: "Malaysia", coord: [ 101.6517, 3.1073 ] },
  { name: "Singapore", country: "Singapore", coord: [ 103.8198, 1.3521 ] },
  { name: "Jakarta", country: "Indonesia", coord: [ 106.8456, -6.2088 ] },
  { name: "Makati", country: "Philippines", coord: [ 121.0244, 14.5547 ] },
  { name: "Yagoona", country: "Australia", coord: [ 151.0195, -33.9020 ] },
  { name: "Hong Kong", country: "Hong Kong", coord: [ 114.1694, 22.3193 ] },
  { name: "Shenzhen", country: "China", coord: [ 114.0579, 22.5431 ] },
  { name: "Hanoi", country: "Vietnam", coord: [ 105.8342, 21.0278 ] },
  { name: "Samut Prakan", country: "Thailand", coord: [ 100.5980, 13.5991 ] },
  { name: "Busan", country: "South Korea", coord: [ 129.0756, 35.1796 ] },
  { name: "Tokyo", country: "Japan", coord: [ 139.6917, 35.6895 ] },
];

// Helper: Haversine distance for nearest DC selection
function haversine([lon1, lat1], [lon2, lat2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Normalize map country names to match our heatmap dictionary keys.
function normalizeName(name) {
  return name
    .replace("United States of America", "United States")
    .replace("Russian Federation", "Russia")
    .replace("Czechia", "Czech Republic")
    .replace("Korea, Republic of", "South Korea")
    .replace("Korea (Republic of)", "South Korea")
    .replace("Korea, South", "South Korea")
    .replace("Taiwan, Province of China", "Taiwan")
    .replace("Hong Kong", "Hong Kong SAR")
    .replace("Macao", "Macao SAR, China")
    .replace("Netherlands", "Netherlands")
    .replace("United Arab Emirates", "United Arab Emirates")
    .replace("Bahamas", "The Bahamas")
    .replace("Cayman Islands", "The Cayman Islands")
    .replace("Seychelles", "Seychelles");
}

// Derived: quick palette from light to dark yellow for heatmap
const yellowScale = (pct) => {
  if (!pct || pct <= 0) return "#fffbe6"; // very light
  const min = 1, max = 25;
  const t = Math.min(1, Math.max(0, (pct - min) / (max - min)));
  // interpolate between light (#fff7a1) and dark (SAVILLS_YELLOW_DARK)
  const lerp = (a,b,t)=>Math.round(a+(b-a)*t);
  const c1 = { r: 255, g: 247, b: 161 };
  const c2 = { r: 230, g: 207, b: 0 };
  const r = lerp(c1.r,c2.r,t);
  const g = lerp(c1.g,c2.g,t);
  const b = lerp(c1.b,c2.b,t);
  return `rgb(${r}, ${g}, ${b})`;
};

// Charts data (personalized to Savills headcount)
const employees = COMPANY.employees;
const hourlyLoss = employees * 50; // hours/year lost
const dexCostGBP = employees * 50 * 25; // £25/hour
const nexthinkDollarsPer10k = 25000000; // $25M / 10k employees
const scaledNexthinkUSD = (employees / 10000) * nexthinkDollarsPer10k;

const pieData = [
  { name: "Productive Time", value: Math.max(0, 2080 - 50) }, // ~working hours/year minus 50 lost (illustrative)
  { name: "IT Interruptions", value: 50 },
];

const barData = [
  { name: "DEX loss (£)", value: Math.round(dexCostGBP) },
  { name: "Nexthink model ($)", value: Math.round(scaledNexthinkUSD) },
];

// Tooltip component for the map
function MapTooltip({ hovered }) {
  if (!hovered) return null;
  const { name, pct, x, y } = hovered;
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-white px-3 py-2 text-sm shadow-xl ring-1 ring-black/10"
      style={{ left: x, top: y }}
    >
      <div className="font-semibold text-slate-800">{name}</div>
      {pct != null && (
        <div className="text-slate-600">{pct}% of employees</div>
      )}
    </div>
  );
}

export default function SavillsLanding() {
  const [hovered, setHovered] = useState(null);

  // On-the-fly cache of centroids for drawing connectors
  const [centroids, setCentroids] = useState({});

  // Precompute nearest DC for each office country once centroids are known
  const connections = useMemo(() => {
    const lines = [];
    Object.entries(centroids).forEach(([country, c]) => {
      const nearest = viadexDCs.reduce((best, dc) => {
        const d = haversine([c[0], c[1]], dc.coord);
        return !best || d < best.d ? { d, dc } : best;
      }, null);
      if (nearest) {
        lines.push({ from: [c[0], c[1]], to: nearest.dc.coord, dc: nearest.dc, country });
      }
    });
    return lines;
  }, [centroids]);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={COMPANY.logo} alt="Savills" className="h-10 w-10 rounded" />
            <div>
              <h1 className="text-xl font-bold" style={{ color: ACCENT_SLATE }}>{COMPANY.name}</h1>
              <p className="text-xs text-slate-500">{COMPANY.domain}</p>
            </div>
          </div>
          <Badge className="text-slate-900" style={{ backgroundColor: SAVILLS_YELLOW }}>
            SLA: {COMPANY.slaDays} Days
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight" style={{ color: ACCENT_SLATE }}>
              Global real estate expertise, visualised.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Explore {COMPANY.name}'s worldwide footprint and how Viadex Distribution Centres connect
              every office to resilient supply chains.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: SAVILLS_YELLOW }}></span>
                <span className="text-sm text-slate-600">Savills Offices Heatmap</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: ACCENT_BLUE }}></span>
                <span className="text-sm text-slate-600">Viadex Distribution Centres</span>
              </div>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="overflow-hidden border-slate-100 shadow-xl">
              <CardContent className="p-0">
                {/* Interactive 2D Globe (world map) */}
                <div className="relative">
                  <ComposableMap projectionConfig={{ scale: 155 }} height={420} style={{ width: "100%", height: "auto" }}>
                    <ZoomableGroup zoom={1} center={[10, 20]}>
                      <Graticule stroke="#e2e8f0" strokeWidth={0.5} />
                      <Geographies geography={geoUrl}>
                        {({ geographies }) => (
                          <>
                            {geographies.map((geo) => {
                              const rawName = geo.properties.name;
                              const name = normalizeName(rawName);
                              const pct = heatmapPercent[name] ?? null;
                              // Capture centroids for connector lines if this is an office location country
                              const hasOffice = Object.keys(heatmapPercent).includes(name) || officeCountries.includes(name) || officeCountries.includes(rawName);
                              const [cx, cy] = geoCentroid(geo);
                              if (hasOffice && cx && cy) {
                                // lon,lat pair in projection space requires geographic coords; we store lon,lat
                                centroids[name] || (centroids[name] = [cx, cy]);
                              }
                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  onMouseEnter={(evt) => {
                                    const { pageX, pageY } = evt;
                                    setHovered({ name, pct, x: pageX, y: pageY });
                                  }}
                                  onMouseLeave={() => setHovered(null)}
                                  style={{
                                    default: { fill: pct ? yellowScale(pct) : "#f8fafc", outline: "none" },
                                    hover: { fill: SAVILLS_YELLOW, outline: "none" },
                                    pressed: { fill: SAVILLS_YELLOW_DARK, outline: "none" },
                                  }}
                                  stroke="#e5e7eb"
                                  strokeWidth={0.5}
                                />
                              );
                            })}
                          </>
                        )}
                      </Geographies>

                      {/* Connector lines from office countries to nearest DC */}
                      {connections.map((ln, idx) => (
                        <Line key={idx} from={ln.from} to={ln.to} stroke={ACCENT_BLUE} strokeWidth={0.6} strokeOpacity={0.35} />
                      ))}

                      {/* Viadex DC beacons */}
                      {viadexDCs.map((dc, i) => (
                        <Marker key={i} coordinates={dc.coord}>
                          <g className="animate-ping" style={{ animationDuration: "2.2s" }}>
                            <circle r={5} fill={ACCENT_BLUE} opacity={0.35} />
                          </g>
                          <circle r={3} fill={ACCENT_BLUE} stroke="#fff" strokeWidth={0.8} />
                        </Marker>
                      ))}
                    </ZoomableGroup>
                  </ComposableMap>
                  <MapTooltip hovered={hovered} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="mx-auto mt-10 max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 md:grid-cols-4">
          <KPI label="Global Offices" value={`>${COMPANY.officesTotal}`} sub="across 70+ countries" />
          <KPI label="Employees" value={COMPANY.employees.toLocaleString()} sub="worldwide team" />
          <KPI label="SLA" value={`${COMPANY.slaDays} days`} sub="standard delivery" />
          <KPI label="UK Share" value="25%" sub="employee distribution" />
        </div>
      </section>

      {/* Insights & Charts */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 border-slate-100">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold" style={{ color: ACCENT_SLATE }}>Digital Experience (DEX) impact at {COMPANY.name}</h3>
              <p className="mt-2 text-slate-600">
                Based on industry studies (Microsoft/Techaisle; Nexthink), older devices and IT interruptions can erode productivity. Here’s what that looks like for a team of {employees.toLocaleString()}.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="text-sm text-slate-500">Annual hours at risk</div>
                  <div className="mt-1 text-3xl font-extrabold" style={{ color: ACCENT_SLATE }}>{hourlyLoss.toLocaleString()} hrs</div>
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 1 ? SAVILLS_YELLOW : "#e2e8f0"} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="text-sm text-slate-500">Modeled annual cost impact</div>
                  <div className="mt-1 text-3xl font-extrabold" style={{ color: ACCENT_SLATE }}>£{Math.round(dexCostGBP).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">@ £25/hour fully-loaded; 50 hours/employee/year</div>
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="value" fill={SAVILLS_YELLOW} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-600">
                <li><span className="font-semibold">2.7×</span> higher repair likelihood for PCs older than 4 years (Microsoft/Techaisle).</li>
                <li>~<span className="font-semibold">112 hours</span> of lost productivity per affected old device annually.</li>
                <li>Need-based refresh can <span className="font-semibold">defer spend 1–2 years</span> while reducing downtime risk.</li>
                <li>Only ~55% of IT issues are reported—unreported issues can nearly <span className="font-semibold">double</span> the impact (Nexthink).</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardContent className="p-6">
              <h4 className="text-xl font-bold" style={{ color: ACCENT_SLATE }}>Why this matters</h4>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold">Every 1,000 employees</span> ≈ £1.25M/year in lost productivity.</p>
                <p>At {COMPANY.name} scale ({employees.toLocaleString()} employees), that’s roughly <span className="font-semibold">£{Math.round(dexCostGBP/1_000_000)}M</span> per year.</p>
                <p>Alternative model (Nexthink): about <span className="font-semibold">${Math.round(scaledNexthinkUSD/1_000_000)}M</span> per year in losses.</p>
                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs">
                  <div className="font-semibold">SLA</div>
                  <div>Standard delivery target: <span className="font-semibold">{COMPANY.slaDays} days</span>.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={COMPANY.logo} alt="Savills" className="h-8 w-8 rounded" />
            <span className="text-sm text-slate-500">© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a className="hover:underline" href="#">Privacy</a>
            <a className="hover:underline" href="#">Terms</a>
            <a className="hover:underline" href="#">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// Helper components
function KPI({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold" style={{ color: ACCENT_SLATE }}>{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

// We need a centroid utility compatible with react-simple-maps geographies
function geoCentroid(geo) {
  // Basic centroid approximation using the bbox if available; otherwise use react-simple-maps utils
  const { rsmKey, coordinates, type, bbox } = geo;
  if (bbox && bbox.length === 4) {
    const [minX, minY, maxX, maxY] = bbox;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return [cx, cy];
  }
  // Fallback: traverse coordinates (lon/lat order) and average simple points
  let sumX = 0, sumY = 0, count = 0;
  const add = (pt) => { sumX += pt[0]; sumY += pt[1]; count++; };
  if (type === "Polygon") {
    coordinates[0].forEach(add);
  } else if (type === "MultiPolygon") {
    coordinates.forEach(poly => poly[0].forEach(add));
  }
  if (count === 0) return [0, 0];
  return [sumX / count, sumY / count];
}
