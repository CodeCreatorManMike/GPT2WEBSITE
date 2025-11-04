'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Graticule, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip as ReTooltip } from 'recharts';
import { COMPANY, geoUrl, heatmapPercent, viadexDCs } from '../lib/data';

const SAVILLS_YELLOW = '#ffe600';
const SAVILLS_YELLOW_DARK = '#e6cf00';
const ACCENT_BLUE = '#2563eb';
const ACCENT_SLATE = '#0f172a';

function haversine([lon1, lat1], [lon2, lat2]) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function normalizeName(name) {
  return name
    .replace('United States of America', 'United States')
    .replace('Russian Federation', 'Russia')
    .replace('Czechia', 'Czech Republic')
    .replace('Korea, Republic of', 'South Korea')
    .replace('Korea (Republic of)', 'South Korea')
    .replace('Korea, South', 'South Korea')
    .replace('Taiwan, Province of China', 'Taiwan')
    .replace('Hong Kong', 'Hong Kong SAR')
    .replace('Macao', 'Macao SAR, China')
    .replace('Bahamas', 'The Bahamas')
    .replace('Cayman Islands', 'The Cayman Islands')
    .replace('Netherlands', 'Netherlands')
    .replace('United Arab Emirates', 'United Arab Emirates');
}

function yellowScale(pct) {
  if (!pct || pct <= 0) return '#fffbe6';
  const min = 1, max = 25;
  const t = Math.min(1, Math.max(0, (pct - min) / (max - min)));
  const lerp = (a,b,t)=>Math.round(a+(b-a)*t);
  const c1 = { r:255,g:247,b:161 };
  const c2 = { r:230,g:207,b:0 };
  const r = lerp(c1.r,c2.r,t), g = lerp(c1.g,c2.g,t), b = lerp(c1.b,c2.b,t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Simple centroid approximation
function geoCentroid(geo) {
  const { bbox, type, coordinates } = geo;
  if (bbox && bbox.length === 4) {
    const [minX, minY, maxX, maxY] = bbox;
    return [(minX+maxX)/2, (minY+maxY)/2];
  }
  let sumX=0,sumY=0,count=0;
  const add = (pt)=>{ sumX+=pt[0]; sumY+=pt[1]; count++; };
  if (type==='Polygon') { coordinates[0].forEach(add); }
  else if (type==='MultiPolygon') { coordinates.forEach(poly=>poly[0].forEach(add)); }
  if (!count) return [0,0];
  return [sumX/count, sumY/count];
}

function KPI({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold" style={{ color: ACCENT_SLATE }}>{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function MapTooltip({ hovered }) {
  if (!hovered) return null;
  const { name, pct, x, y } = hovered;
  return (
    <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-white px-3 py-2 text-sm shadow-xl ring-1 ring-black/10" style={{ left: x, top: y }}>
      <div className="font-semibold text-slate-800">{name}</div>
      {pct != null && <div className="text-slate-600">{pct}% of employees</div>}
    </div>
  );
}

export default function Page() {
  const [hovered, setHovered] = React.useState(null);
  const [centroids, setCentroids] = React.useState({});
  const [connections, setConnections] = React.useState([]);

  React.useEffect(()=>{
    // compute connections whenever centroids change
    const lines = [];
    Object.entries(centroids).forEach(([country, c])=>{
      const nearest = viadexDCs.reduce((best, dc)=>{
        const d = haversine([c[0], c[1]], dc.coord);
        return !best || d < best.d ? { d, dc } : best;
      }, null);
      if (nearest) lines.push({ from:[c[0], c[1]], to: nearest.dc.coord, dc: nearest.dc, country });
    });
    setConnections(lines);
  }, [centroids]);

  const employees = COMPANY.employees;
  const hourlyLoss = employees * 50;
  const dexCostGBP = employees * 50 * 25;
  const pieData = [
    { name: 'Productive Time', value: Math.max(0, 2080 - 50) },
    { name: 'IT Interruptions', value: 50 },
  ];
  const barData = [
    { name: 'DEX loss (£)', value: Math.round(dexCostGBP) },
    { name: 'Nexthink model ($)', value: Math.round((employees/10000) * 25000000) },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src={COMPANY.logo} alt="Savills" width={40} height={40} className="rounded" />
            <div>
              <h1 className="text-xl font-bold" style={{ color: ACCENT_SLATE }}>{COMPANY.name}</h1>
              <p className="text-xs text-slate-500">{COMPANY.domain}</p>
            </div>
          </div>
          <Badge className="text-slate-900" style={{ backgroundColor: SAVILLS_YELLOW }}>SLA: {COMPANY.slaDays} Days</Badge>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight" style={{ color: ACCENT_SLATE }}>
              Global real estate expertise, visualised.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Explore {COMPANY.name}'s worldwide footprint and how Viadex Distribution Centres connect every office to resilient supply chains.
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
                <div className="relative">
                  <ComposableMap projectionConfig={{ scale: 155 }} height={420} style={{ width: '100%', height: 'auto' }}>
                    <ZoomableGroup zoom={1} center={[10, 20]}>
                      <Graticule stroke="#e2e8f0" strokeWidth={0.5} />
                      <Geographies geography={geoUrl}>
                        {({ geographies }) => (
                          <>
                            {geographies.map((geo) => {
                              const rawName = geo.properties.name;
                              const name = normalizeName(rawName);
                              const pct = heatmapPercent[name] ?? null;
                              const [cx, cy] = geoCentroid(geo);
                              // Track centroids for countries included in heatmap
                              const hasOffice = Object.keys(heatmapPercent).includes(name);
                              if (hasOffice && cx && cy) {
                                // Update state lazily (avoid infinite loop)
                                if (!centroids[name]) {
                                  setCentroids(prev => ({ ...prev, [name]: [cx, cy] }));
                                }
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
                                    default: { fill: pct ? yellowScale(pct) : '#f8fafc', outline: 'none' },
                                    hover: { fill: SAVILLS_YELLOW, outline: 'none' },
                                    pressed: { fill: SAVILLS_YELLOW_DARK, outline: 'none' },
                                  }}
                                  stroke="#e5e7eb"
                                  strokeWidth={0.5}
                                />
                              );
                            })}
                          </>
                        )}
                      </Geographies>

                      {connections.map((ln, idx) => (
                        <Line key={idx} from={ln.from} to={ln.to} stroke={ACCENT_BLUE} strokeWidth={0.6} strokeOpacity={0.35} />
                      ))}

                      {viadexDCs.map((dc, i) => (
                        <Marker key={i} coordinates={dc.coord}>
                          <g className="animate-ping" style={{ animationDuration: '2.2s' }}>
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

      <section className="mx-auto mt-10 max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 md:grid-cols-4">
          <KPI label="Global Offices" value={">" + COMPANY.officesTotal} sub="across 70+ countries" />
          <KPI label="Employees" value={COMPANY.employees.toLocaleString()} sub="worldwide team" />
          <KPI label="SLA" value={`${COMPANY.slaDays} days`} sub="standard delivery" />
          <KPI label="UK Share" value="25%" sub="employee distribution" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 border-slate-100">
            <CardContent>
              <h3 className="text-2xl font-bold" style={{ color: ACCENT_SLATE }}>Digital Experience (DEX) impact at {COMPANY.name}</h3>
              <p className="mt-2 text-slate-600">
                Based on industry studies (Microsoft/Techaisle; Nexthink), older devices and IT interruptions can erode productivity. Here’s what that looks like for a team of {COMPANY.employees.toLocaleString()}.
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
                            <Cell key={`cell-${index}`} fill={index === 1 ? SAVILLS_YELLOW : '#e2e8f0'} />
                          ))}
                        </Pie>
                        <ReTooltip />
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
                        <ReTooltip />
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
            <CardContent>
              <h4 className="text-xl font-bold" style={{ color: ACCENT_SLATE }}>Why this matters</h4>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold">Every 1,000 employees</span> ≈ £1.25M/year in lost productivity.</p>
                <p>At {COMPANY.name} scale ({COMPANY.employees.toLocaleString()} employees), that’s roughly <span className="font-semibold">£{Math.round(dexCostGBP/1_000_000)}M</span> per year.</p>
                <p>Alternative model (Nexthink): about <span className="font-semibold">${Math.round((COMPANY.employees/10000)*25000000/1_000_000)}M</span> per year in losses.</p>
                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs">
                  <div className="font-semibold">SLA</div>
                  <div>Standard delivery target: <span className="font-semibold">{COMPANY.slaDays} days</span>.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-3">
            <Image src={COMPANY.logo} alt="Savills" width={32} height={32} className="rounded" />
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
