// Colors
export const C = {
  navy: "#252842",
  navyLight: "#2f3355",
  navyDark: "#1a1d33",
  red: "#E30613",
  redDark: "#c70511",
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

// CSS variable mapping
export const CSS_VARS = {
  '--colony-navy': '#252842',
  '--colony-red': '#E30613',
  '--colony-white': '#FFFFFF',
  '--colony-gray-light': '#F5F5F7',
  '--colony-gray-mid': '#6B7280',
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
export const ROLES = {
  admin: { label: 'Admin', color: '#E30613', permissions: ['view_all','edit_all','assign','review','approve','view_margin','edit_settings','export_all','manage_team'] },
  lead_estimator: { label: 'Lead Estimator', color: '#252842', permissions: ['view_all','edit_all','assign','review','approve','view_margin','export_all'] },
  staff_estimator: { label: 'Staff Estimator', color: '#3B82F6', permissions: ['view_all','edit_assigned','submit_for_review','export_basic'] },
};
export const MARGIN_VISIBLE_ROLES = ['admin', 'lead_estimator'];
// Backward compat alias
export const ROLE_PRESETS = ROLES;

// Estimate statuses
export const ESTIMATE_STATUSES = [
  'unassigned','assigned','waiting_on_measurements','pricing','ready_for_review','rejected','approved','proposal_sent','awarded','lost','no_response'
];
export const STATUS_CONFIG = {
  unassigned: { label: 'Unassigned', color: '#E30613', bg: '#FEE2E5', description: 'No estimator assigned yet' },
  assigned: { label: 'Assigned', color: '#3B82F6', bg: '#DBEAFE', description: 'Estimator assigned, not yet started' },
  waiting_on_measurements: { label: 'Waiting on Measurements', color: '#8B5CF6', bg: '#EDE9FE', description: 'Waiting for RoofR/Beam AI data' },
  pricing: { label: 'Pricing', color: '#F59E0B', bg: '#FEF3C7', description: 'Actively pricing the job' },
  ready_for_review: { label: 'Ready for Review', color: '#6366F1', bg: '#E0E7FF', description: 'Submitted for lead estimator approval' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2', description: 'Sent back with notes for revision' },
  approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5', description: 'Lead estimator approved' },
  proposal_sent: { label: 'Proposal Sent', color: '#0EA5E9', bg: '#E0F2FE', description: 'Proposal delivered to client' },
  awarded: { label: 'Awarded', color: '#059669', bg: '#A7F3D0', description: 'Client signed contract' },
  lost: { label: 'Lost', color: '#6B7280', bg: '#F3F4F6', description: 'Proposal not accepted' },
  no_response: { label: 'No Response', color: '#9CA3AF', bg: '#F9FAFB', description: 'Client never responded' },
};
export const KANBAN_COLUMNS = ['unassigned','assigned','waiting_on_measurements','pricing','ready_for_review','approved','proposal_sent'];
export const TERMINAL_STATUSES = ['awarded','lost','no_response'];

// Estimate types
export const ESTIMATE_TYPES = [
  { key: "shingle", label: "Shingle", icon: "🏠" },
  { key: "tile", label: "Tile", icon: "🧱" },
  { key: "tpo", label: "TPO", icon: "🏢" },
];

// App version and data version
export const APP_VERSION = '2.0.0';
export const DATA_VERSION = 2;

// Default margin thresholds by state
export const DEFAULT_MARGIN_THRESHOLDS = { FL: 25, GA: 25, TX: 25, TN: 25 };

// Job types
export const JOB_TYPES = [
  { value: 'shingle', label: 'Shingle', category: 'replacement' },
  { value: 'tile', label: 'Tile', category: 'replacement' },
  { value: 'tpo', label: 'TPO / Flat Roof', category: 'commercial' },
  { value: 'metal', label: 'Metal', category: 'both' },
  { value: 'new_construction', label: 'New Construction', category: 'new_construction' },
];

// Deadline types
export const DEADLINE_TYPES = {
  hard: { label: 'Hard Deadline', color: '#DC2626' },
  flexible: { label: 'Flexible', color: '#F59E0B' },
  none: { label: 'No Deadline', color: '#6B7280' },
};

// Loss reasons
export const LOSS_REASONS = [
  'Price too high','Went with competitor','Project cancelled','Client chose to DIY / defer','Scope changed','Financing fell through','Other',
];

// Notification events
export const NOTIFICATION_EVENTS = {
  job_assigned: { label: 'Job Assigned', audience: 'assignee' },
  estimate_rejected: { label: 'Estimate Rejected', audience: 'assignee' },
  bid_due_24hr: { label: 'Bid Due in 24hrs', audience: 'assignee' },
  bid_due_today: { label: 'Bid Due Today', audience: 'assignee' },
  new_job_in_queue: { label: 'New Job in Queue', audience: 'lead_estimator' },
  estimate_submitted: { label: 'Estimate Submitted for Review', audience: 'lead_estimator' },
};

// Pricing tiers
export const PRICING_TIERS = {
  good: { label: 'Good', description: 'Standard materials and installation' },
  better: { label: 'Better', description: 'Upgraded materials with enhanced warranty' },
  best: { label: 'Best', description: 'Premium materials with maximum warranty coverage' },
};

// Default shingle materials — state-specific pricing from FL & GA spreadsheets
// TX and TN default to FL pricing until real spreadsheets are provided
export const DEFAULT_SHINGLE_MATERIALS = [
  { id: "m1", name: "Architectural Shingles", spec: "Full roof", unit: "BNDL", category: "shingles", prices: { FL: 29.67, GA: 29.67, TX: 29.67, TN: 29.67 } },
  { id: "m2", name: "Hip and Ridge", spec: "All Ridges and Hips", unit: "BNDL", category: "shingles", prices: { FL: 65, GA: 65, TX: 65, TN: 65 } },
  { id: "m3", name: "Starter Strip", spec: "Rakes and Eaves", unit: "BNDL", category: "shingles", prices: { FL: 42, GA: 42, TX: 42, TN: 42 } },
  { id: "m4", name: "Synthetic Underlayment", spec: "Full roof", unit: "ROLL", category: "underlayment", prices: { FL: 60, GA: 60, TX: 60, TN: 60 } },
  { id: "m5", name: "Ice and Water Shield", spec: "All valleys and step walls", unit: "ROLL", category: "underlayment", prices: { FL: 60, GA: 60, TX: 60, TN: 60 } },
  { id: "m6", name: "Ridge Vent", spec: "All ridges", unit: "EACH", category: "accessories", prices: { FL: 7, GA: 7, TX: 7, TN: 7 } },
  { id: "m7", name: "Off-Ridge Vents", spec: "All off-ridge", unit: "EACH", category: "accessories", prices: { FL: 80, GA: 0, TX: 0, TN: 0 }, stateExclude: ["GA", "TX", "TN"] },
  { id: "m8", name: "Step Flashing", spec: "All step flashing", unit: "BOX", category: "flashing", prices: { FL: 55, GA: 55, TX: 55, TN: 55 } },
  { id: "m9", name: "Drip Edge", spec: "Rakes and Eaves", unit: "EACH", category: "flashing", prices: { FL: 9.75, GA: 6.95, TX: 6.95, TN: 6.95 } },
  { id: "m10", name: "Coil Nails", spec: "Full roof", unit: "BOX", category: "fasteners", prices: { FL: 36, GA: 40, TX: 40, TN: 40 } },
  { id: "m11", name: "Cap Nails", spec: "Full roof", unit: "BOX", category: "fasteners", prices: { FL: 16, GA: 22, TX: 22, TN: 22 } },
  { id: "m12", name: "Pipe Boots", spec: "All pipes", unit: "EACH", category: "accessories", prices: { FL: 4.75, GA: 4.95, TX: 4.95, TN: 4.95 } },
  { id: "m13", name: "Roof Cement", spec: "All Rakes and Eaves", unit: "BCKT", category: "accessories", prices: { FL: 8, GA: 0, TX: 0, TN: 0 }, stateExclude: ["GA", "TX", "TN"] },
  { id: "m14", name: "Touch Paint", spec: "All pipes", unit: "EACH", category: "accessories", prices: { FL: 7.25, GA: 6.95, TX: 6.95, TN: 6.95 } },
  { id: "m15", name: "NP1", spec: "All pipes", unit: "EACH", category: "accessories", prices: { FL: 8, GA: 8, TX: 8, TN: 8 } },
];

// State-specific labor rates (from FL & GA spreadsheets)
// TX defaults to FL, TN defaults to GA
export const STATE_LABOR = {
  FL: { laborPerSquare: 120, forkliftCost: 6564, dumpsterCost: 19840, permitCost: 3440, osbPerSheet: 42.95, warrantyPerSq: 11, tearOffPerSquare: 50, laborBasis: 'pitched' },
  GA: { laborPerSquare: 75, forkliftCost: 7373, dumpsterCost: 23120, permitCost: 4825, osbPerSheet: 42.95, warrantyPerSq: 11, tearOffPerSquare: 45, laborBasis: 'pitched' },
  TX: { laborPerSquare: 75, forkliftCost: 7373, dumpsterCost: 23120, permitCost: 4825, osbPerSheet: 42.95, warrantyPerSq: 11, tearOffPerSquare: 45, laborBasis: 'pitched' },
  TN: { laborPerSquare: 75, forkliftCost: 7373, dumpsterCost: 23120, permitCost: 4825, osbPerSheet: 42.95, warrantyPerSq: 11, tearOffPerSquare: 45, laborBasis: 'pitched' },
};

// State-specific financials (from FL & GA spreadsheets)
export const STATE_FINANCIALS = {
  FL: { margin: 0.25, taxRate: 0.075 },
  GA: { margin: 0.30, taxRate: 0.089 },
  TX: { margin: 0.30, taxRate: 0.089 },
  TN: { margin: 0.30, taxRate: 0.089 },
};

// Legacy defaults (for backward compat / non-shingle calcs)
export const DEFAULT_LABOR = {
  tearOffRate: 120,
  forkliftCost: 6564,
  dumpsterCost: 19840,
  permitCost: 3440,
  osbPerSheet: 42.95,
  warrantyPerSq: 11,
};
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

// Scope items - type-specific
export const SCOPE_ITEMS_SHINGLE = [
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

export const SCOPE_ITEMS_TILE = [
  "Install temporary safety equipment to meet or exceed OSHA and company set safety guidelines.",
  "Remove existing tile roofing system and all related accessories down to exposed roof deck.",
  "Inspect existing roof deck ensuring it is ready for proper installation of the new roof assembly.",
  "Furnish and install ice and water barrier in a three-foot swath at all valleys and roof penetrations.",
  "Furnish and install new synthetic underlayment.",
  "Furnish and install new concrete roof tiles per manufacturer specifications. Color and profile to be determined.",
  "Install new ridge and hip tiles with appropriate adhesive and fasteners.",
  "All roofing details including but not limited to flashing, roof penetrations, hips and ridges shall meet manufacturer's specifications and installation requirements.",
  "Dispose of all debris in an appropriate container and remove from jobsite.",
  "Furnish owner with a Limited Lifetime Manufacturer Warranty.",
  "Furnish owner with two (2) year workmanship warranty.",
];

export const SCOPE_ITEMS_TPO = [
  "Install temporary safety equipment to meet or exceed OSHA and company set safety guidelines.",
  "Remove existing roofing system and all related accessories down to structural deck.",
  "Inspect existing roof deck ensuring it is ready for proper installation of the new roof assembly.",
  "Furnish and install new ISO insulation board to achieve minimum R-value per code requirements.",
  "Furnish and install new TPO single-ply membrane. Color and mil thickness to be determined.",
  "All roofing details including but not limited to flashing, curbs, penetrations, drains, and terminations shall meet manufacturer's specifications.",
  "Dispose of all debris in an appropriate container and remove from jobsite.",
  "Furnish owner with a 20-year NDL Manufacturer Warranty.",
  "Furnish owner with two (2) year workmanship warranty.",
];

// Backward compatibility alias
export const SCOPE_ITEMS = SCOPE_ITEMS_SHINGLE;

export const UNIT_COSTS_TEXT = [
  "At discovery if any fascia is determined to be deteriorated, removal and replacement will be billed at $15 per LF.",
  "At discovery if any soffit is determined to be deteriorated, removal and replacement will be billed at $15 per LF.",
  "At discovery if any roof substrate is determined to be deteriorated, removal and replacement will be billed at $95 per 4' x 8' sheet.",
];

export const EXCLUSIONS = "Carpentry, HVAC, Electrical, Plumbing, Asbestos Abatement, and Framing.";

// Company info
export const COMPANY_INFO = {
  name: "Colony Roofers",
  phone: "(404) 610-1178",
  email: "info@colonyroofers.com",
  website: "www.colonyroofers.com",
  address: "",
  licenseGA: "",
  licenseFl: "",
};

// Contract terms
export const CONTRACT_TERMS = [
  "50% deposit required to schedule. Remaining balance due upon substantial completion.",
  "This estimate is valid for 30 days from the date above.",
  "All work carries a manufacturer warranty and a two (2) year workmanship warranty.",
  "Any additional work discovered during tear-off (decking replacement, structural repair) will be documented and billed at the unit rates listed above.",
  "Timeline is subject to weather conditions, material availability, and permitting schedules.",
  "Upon final payment, Colony Roofers will provide lien waivers from all subcontractors and material suppliers.",
];

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
