// Colors
export const C = {
  navy: "#1B2A4A",
  navyLight: "#263B66",
  navyDark: "#111D35",
  red: "#E63946",
  redDark: "#C5303C",
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  green: "#10B981",
  greenBg: "#D1FAE5",
  yellow: "#F59E0B",
  yellowBg: "#FEF3C7",
  redBg: "#FEE2E5",
  blueBg: "#DBEAFE",
  blue: "#3B82F6",
};

// Markets
export const MARKETS = ["ATL", "TPA", "DFW", "NSH"];
export const MARKET_LABELS = { ATL: "Atlanta", TPA: "Tampa", DFW: "Dallas", NSH: "Nashville" };
export const STATES = [
  { code: "FL", name: "Florida", markets: ["TPA"] },
  { code: "GA", name: "Georgia", markets: ["ATL"] },
  { code: "TX", name: "Texas", markets: ["DFW"] },
  { code: "TN", name: "Tennessee", markets: ["NSH"] }
];

// Roles
export const ROLE_PRESETS = {
  admin: { label: "Admin", color: "#E63946" },
  estimator: { label: "Estimator", color: "#3B82F6" },
  reviewer: { label: "Reviewer", color: "#10B981" },
};

// Estimate statuses
export const ESTIMATE_STATUSES = [
  { key: "unassigned", label: "Unassigned", color: C.red, bg: C.redBg },
  { key: "assigned", label: "Assigned", color: C.blue, bg: C.blueBg },
  { key: "in_progress", label: "In Progress", color: C.yellow, bg: C.yellowBg },
  { key: "submitted", label: "Submitted for Review", color: "#8B5CF6", bg: "#EDE9FE" },
  { key: "approved", label: "Approved", color: C.green, bg: C.greenBg },
];

// Estimate types
export const ESTIMATE_TYPES = [
  { key: "shingle", label: "Shingle", icon: "🏠" },
  { key: "tile", label: "Tile", icon: "🧱" },
  { key: "tpo", label: "TPO", icon: "🏢" },
];

// Default shingle materials
export const DEFAULT_SHINGLE_MATERIALS = [
  { id: "m1", name: "Architectural Shingles", spec: "Full roof", unit: "BNDL", category: "shingles", prices: { FL: 29.67, GA: 29.67, TX: 29.67, TN: 29.67 } },
  { id: "m2", name: "Hip and Ridge", spec: "All Ridges and Hips", unit: "BNDL", category: "shingles", prices: { FL: 65, GA: 65, TX: 65, TN: 65 } },
  { id: "m3", name: "Starter Strip", spec: "Rakes and Eaves", unit: "BNDL", category: "shingles", prices: { FL: 42, GA: 42, TX: 42, TN: 42 } },
  { id: "m4", name: "Synthetic Underlayment", spec: "Full roof", unit: "ROLL", category: "underlayment", prices: { FL: 60, GA: 60, TX: 60, TN: 60 } },
  { id: "m5", name: "Ice and Water Shield", spec: "All valleys and step walls", unit: "ROLL", category: "underlayment", prices: { FL: 60, GA: 60, TX: 60, TN: 60 } },
  { id: "m6", name: "Ridge Vent", spec: "All ridges", unit: "EACH", category: "accessories", prices: { FL: 7, GA: 7, TX: 7, TN: 7 } },
  { id: "m7", name: "Off-Ridge Vents", spec: "All off-ridge", unit: "EACH", category: "accessories", prices: { FL: 80, GA: 80, TX: 80, TN: 80 } },
  { id: "m8", name: "Step Flashing", spec: "All step flashing", unit: "BOX", category: "flashing", prices: { FL: 55, GA: 55, TX: 55, TN: 55 } },
  { id: "m9", name: "Drip Edge", spec: "Rakes and Eaves", unit: "EACH", category: "flashing", prices: { FL: 9.75, GA: 9.75, TX: 9.75, TN: 9.75 } },
  { id: "m10", name: "Coil Nails", spec: "Full roof", unit: "BOX", category: "fasteners", prices: { FL: 36, GA: 36, TX: 36, TN: 36 } },
  { id: "m11", name: "Cap Nails", spec: "Full roof", unit: "BOX", category: "fasteners", prices: { FL: 16, GA: 16, TX: 16, TN: 16 } },
  { id: "m12", name: "Pipe Boots", spec: "All pipes", unit: "EACH", category: "accessories", prices: { FL: 4.75, GA: 4.75, TX: 4.75, TN: 4.75 } },
  { id: "m13", name: "Roof Cement", spec: "All Rakes and Eaves", unit: "BCKT", category: "accessories", prices: { FL: 8, GA: 8, TX: 8, TN: 8 } },
  { id: "m14", name: "Touch Paint", spec: "All pipes", unit: "EACH", category: "accessories", prices: { FL: 7.25, GA: 7.25, TX: 7.25, TN: 7.25 } },
  { id: "m15", name: "NP1", spec: "All pipes", unit: "EACH", category: "accessories", prices: { FL: 8, GA: 8, TX: 8, TN: 8 } },
];

// Default labor
export const DEFAULT_LABOR = {
  tearOffRate: 120,
  forkliftCost: 6564,
  dumpsterCost: 19840,
  permitCost: 3440,
  osbPerSheet: 42.95,
  warrantyPerSq: 11,
};

// Default financials
export const DEFAULT_FINANCIALS = {
  margin: 0.25,
  taxRate: 0.075,
};

// Building code warnings
export const BUILDING_CODE_WARNINGS = {
  FL: [
    "FL Building Code requires Miami-Dade approved products in HVHZ zones.",
    "Ice & water shield required in first 3 feet from eave edge.",
    "Minimum 130mph wind-rated shingles required statewide.",
    "FBC 2023 Section 1507.2.8.2 requires enhanced underlayment in HVHZ."
  ],
  GA: [
    "Georgia requires ice barrier in valleys and at eaves per IRC R905.1.2.",
    "Georgia amendments to IRC require Class A fire-rated roofing in WUI areas."
  ],
  TX: [
    "Texas windstorm insurance may require TDI-certified installation.",
    "Check local wind zone requirements — coastal counties have enhanced standards.",
    "Texas Department of Insurance requires WPI-8 certification for windstorm areas."
  ],
  TN: [
    "Tennessee follows IRC 2018. Ice barrier required where average January temp is 25°F or less.",
    "Knox County and surrounding areas may require additional wind resistance documentation."
  ]
};

// Scope items
export const SCOPE_ITEMS = [
  "Install temporary safety equipment to meet or exceed OSHA and company set safety guidelines.",
  "Remove existing shingles roofing system and all related accessories down to exposed roof deck.",
  "Inspect existing roof deck ensuring it is ready for proper installation of the new roof assembly.",
  "Furnish and install ice and water barrier in a three-foot swath at all valleys and roof penetrations.",
  "Furnish and install new synthetic underlayment.",
  "Furnish and install new Architectural Shingles. Color to be determined.",
  "All roofing details including but not limited to drip edge, roof penetrations, hips and ridges, and off-ridge vents shall meet manufacturer's specifications and installation requirements.",
  "Dispose of all debris in an appropriate container and remove from jobsite.",
  "Furnish owner with a Limited Lifetime Manufacturer Warranty.",
  "Furnish owner with two (2) year workmanship warranty.",
];

export const UNIT_COSTS_TEXT = [
  "At discovery if any fascia is determined to be deteriorated, removal and replacement will be billed at $15 per LF.",
  "At discovery if any soffit is determined to be deteriorated, removal and replacement will be billed at $15 per LF.",
  "At discovery if any roof substrate is determined to be deteriorated, removal and replacement will be billed at $95 per 4' x 8' sheet.",
];

export const EXCLUSIONS = "Carpentry, HVAC, Electrical, Plumbing, Asbestos Abatement, and Framing.";

// TPO defaults
export const TPO_UNIT_COSTS = {
  "ROOF MEMBRANE": { cost: 1.85, unit: "SF", category: "material" },
  "TPO ROLL COUNT": { cost: 165.00, unit: "EA", category: "material" },
  "DENS DECK": { cost: 32.00, unit: "EA", category: "material" },
  "ISO INSULATION BOARD": { cost: 55.00, unit: "EA", category: "material" },
  "FASTENER": { cost: 0.18, unit: "EA", category: "material" },
  "PLATE COUNT": { cost: 0.10, unit: "EA", category: "material" },
  "LOW RISE FOAM COUNT": { cost: 425.00, unit: "EA/KIT", category: "material" },
  "SEAM CLEANER": { cost: 12.00, unit: "EA", category: "material" },
  "CAULKING": { cost: 6.50, unit: "EA", category: "material" },
  "T-PATCH": { cost: 4.50, unit: "EA", category: "material" },
  "BONDING ADHESIVE": { cost: 32.00, unit: "EA/GAL", category: "material" },
  "WALK PADS": { cost: 3.25, unit: "SF", category: "material" },
  "MANUFACTURED METAL FASCIA": { cost: 12.00, unit: "LF", category: "accessory" },
  "MANUFACTURED METAL COPING": { cost: 15.00, unit: "LF", category: "accessory" },
  "COUNTER FLASHING @ RTU CURB": { cost: 8.00, unit: "LF", category: "accessory" },
  "8\" FACTORY FINISHED GUTTER": { cost: 12.00, unit: "LF", category: "accessory" },
  "TERMINATION BAR": { cost: 2.00, unit: "LF", category: "accessory" },
  "4\" ROOF DRAINS": { cost: 185.00, unit: "EA", category: "accessory" },
  "6\" ROOF DRAINS": { cost: 225.00, unit: "EA", category: "accessory" },
};

export const TPO_DEFAULT_LABOR = {
  installPerSf: 2.50,
  tearOffPerSf: 0.85,
  cleanupPerSf: 0.15
};

// Utility functions
export const generateId = () => Math.random().toString(36).substring(2, 10);
export const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export const fmtInt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Empty building template
export const EMPTY_BUILDING = {
  siteplanNum: "",
  roofrNum: "",
  phase: 1,
  pipes: 0,
  totalArea: 0,
  pitchedArea: 0,
  flatArea: 0,
  predominantPitch: "4/12",
  wastePercent: 12,
  eaves: 0,
  valleys: 0,
  hips: 0,
  ridges: 0,
  rakes: 0,
  wallFlashing: 0,
  stepFlashing: 0,
  dryerVents: 0,
  twoStory: false,
  twoLayer: false
};

// Nav items
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📋" },
  { key: "estimates", label: "Estimates", icon: "📐" },
  { key: "catalog", label: "Product Catalog", icon: "📦" },
  { key: "vendors", label: "Vendor Catalog", icon: "🏪" },
  { key: "team", label: "Team", icon: "👥" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];
