/**
 * exportDatabase.js
 * -----------------
 * AEROSCOPE · Firebase Firestore Seeder & Exporter
 *
 * What this script does:
 *  1. Seeds Firestore with 15 Indian cities (air quality data)
 *  2. Seeds 5 sample alerts
 *  3. Seeds the admin user record
 *  4. Reads ALL collections back from Firestore
 *  5. Writes everything to database.json in this directory
 *
 * Prerequisites (choose ONE of the following):
 *  Option A — Service Account JSON (recommended for local use):
 *    1. Go to Firebase Console → Project Settings → Service Accounts
 *    2. Click "Generate new private key" → save as serviceAccount.json
 *       in the backend/ folder (it's already git-ignored)
 *    3. Add to backend/.env:  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
 *
 *  Option B — Google Cloud ADC:
 *    Run:  gcloud auth application-default login
 *
 * Usage:
 *   node exportDatabase.js
 */

require('dotenv').config();          // Load .env so GOOGLE_APPLICATION_CREDENTIALS is picked up
const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// If GOOGLE_APPLICATION_CREDENTIALS points to a relative path, resolve it
if (process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    __dirname,
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
// Uses Application Default Credentials (ADC).
// Make sure you have run:
//   gcloud auth application-default login
// OR set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON.
admin.initializeApp({
  projectId: 'aeroscope-9fb6d',
});

const db = admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();

function aqiCategory(aqi) {
  if (aqi <= 50)  return { label: 'Good',          color: '#22c55e' };
  if (aqi <= 100) return { label: 'Moderate',       color: '#eab308' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#f97316' };
  if (aqi <= 200) return { label: 'Unhealthy',      color: '#ef4444' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#a855f7' };
  return           { label: 'Hazardous',             color: '#7f1d1d' };
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

/** 15 Indian cities with realistic air-quality metrics */
const CITIES = [
  {
    id: 'Delhi',
    name: 'Delhi',
    lat: 28.7041, lon: 77.1025,
    aqi: 312, pm2_5: 185.4, pm10: 240.6, co2: 430, no2: 78.3,
    so2: 22.1, co: 1.8,
    weather: { temperature: 35, humidity: 45, windSpeed: 3.2, visibility: 4.5, pressure: 1008 },
  },
  {
    id: 'Mumbai',
    name: 'Mumbai',
    lat: 19.0760, lon: 72.8777,
    aqi: 128, pm2_5: 62.1, pm10: 98.4, co2: 412, no2: 45.6,
    so2: 14.3, co: 0.9,
    weather: { temperature: 31, humidity: 78, windSpeed: 5.1, visibility: 8.2, pressure: 1012 },
  },
  {
    id: 'Bangalore',
    name: 'Bangalore',
    lat: 12.9716, lon: 77.5946,
    aqi: 89,  pm2_5: 38.7, pm10: 62.3, co2: 405, no2: 32.1,
    so2: 8.6,  co: 0.6,
    weather: { temperature: 26, humidity: 65, windSpeed: 4.3, visibility: 10.0, pressure: 1015 },
  },
  {
    id: 'Chennai',
    name: 'Chennai',
    lat: 13.0827, lon: 80.2707,
    aqi: 104, pm2_5: 48.2, pm10: 79.5, co2: 408, no2: 38.9,
    so2: 11.2, co: 0.7,
    weather: { temperature: 33, humidity: 72, windSpeed: 6.0, visibility: 9.0, pressure: 1010 },
  },
  {
    id: 'Kolkata',
    name: 'Kolkata',
    lat: 22.5726, lon: 88.3639,
    aqi: 178, pm2_5: 95.3, pm10: 148.7, co2: 420, no2: 58.4,
    so2: 18.7, co: 1.3,
    weather: { temperature: 34, humidity: 82, windSpeed: 2.8, visibility: 6.5, pressure: 1009 },
  },
  {
    id: 'Hyderabad',
    name: 'Hyderabad',
    lat: 17.3850, lon: 78.4867,
    aqi: 96,  pm2_5: 43.5, pm10: 71.2, co2: 407, no2: 35.7,
    so2: 9.4,  co: 0.65,
    weather: { temperature: 30, humidity: 58, windSpeed: 4.7, visibility: 9.5, pressure: 1013 },
  },
  {
    id: 'Pune',
    name: 'Pune',
    lat: 18.5204, lon: 73.8567,
    aqi: 82,  pm2_5: 34.1, pm10: 55.8, co2: 403, no2: 29.3,
    so2: 7.1,  co: 0.55,
    weather: { temperature: 28, humidity: 60, windSpeed: 5.5, visibility: 10.5, pressure: 1014 },
  },
  {
    id: 'Ahmedabad',
    name: 'Ahmedabad',
    lat: 23.0225, lon: 72.5714,
    aqi: 143, pm2_5: 72.6, pm10: 112.3, co2: 415, no2: 50.2,
    so2: 15.8, co: 1.1,
    weather: { temperature: 38, humidity: 42, windSpeed: 3.9, visibility: 7.0, pressure: 1007 },
  },
  {
    id: 'Jaipur',
    name: 'Jaipur',
    lat: 26.9124, lon: 75.7873,
    aqi: 161, pm2_5: 84.8, pm10: 131.4, co2: 418, no2: 55.1,
    so2: 17.2, co: 1.2,
    weather: { temperature: 39, humidity: 38, windSpeed: 3.5, visibility: 6.0, pressure: 1006 },
  },
  {
    id: 'Lucknow',
    name: 'Lucknow',
    lat: 26.8467, lon: 80.9462,
    aqi: 207, pm2_5: 118.6, pm10: 172.4, co2: 424, no2: 63.8,
    so2: 20.4, co: 1.5,
    weather: { temperature: 36, humidity: 50, windSpeed: 2.6, visibility: 5.5, pressure: 1007 },
  },
  {
    id: 'Chandigarh',
    name: 'Chandigarh',
    lat: 30.7333, lon: 76.7794,
    aqi: 75,  pm2_5: 30.4, pm10: 50.9, co2: 401, no2: 26.5,
    so2: 6.3,  co: 0.5,
    weather: { temperature: 28, humidity: 55, windSpeed: 4.8, visibility: 11.0, pressure: 1016 },
  },
  {
    id: 'Surat',
    name: 'Surat',
    lat: 21.1702, lon: 72.8311,
    aqi: 119, pm2_5: 57.3, pm10: 91.6, co2: 410, no2: 42.7,
    so2: 13.5, co: 0.85,
    weather: { temperature: 32, humidity: 70, windSpeed: 5.8, visibility: 8.8, pressure: 1011 },
  },
  {
    id: 'Patna',
    name: 'Patna',
    lat: 25.5941, lon: 85.1376,
    aqi: 245, pm2_5: 142.7, pm10: 198.3, co2: 427, no2: 70.1,
    so2: 21.8, co: 1.65,
    weather: { temperature: 37, humidity: 56, windSpeed: 2.2, visibility: 4.8, pressure: 1007 },
  },
  {
    id: 'Bhopal',
    name: 'Bhopal',
    lat: 23.2599, lon: 77.4126,
    aqi: 113, pm2_5: 53.8, pm10: 86.2, co2: 409, no2: 40.4,
    so2: 12.0, co: 0.8,
    weather: { temperature: 33, humidity: 52, windSpeed: 4.1, visibility: 9.2, pressure: 1012 },
  },
  {
    id: 'Kochi',
    name: 'Kochi',
    lat: 9.9312, lon: 76.2673,
    aqi: 58,  pm2_5: 21.6, pm10: 38.4, co2: 399, no2: 20.8,
    so2: 5.1,  co: 0.4,
    weather: { temperature: 29, humidity: 85, windSpeed: 6.5, visibility: 12.0, pressure: 1014 },
  },
];

/** 5 sample alerts */
const ALERTS = [
  {
    id: 'alert_001',
    city: 'Delhi',
    type: 'HAZARDOUS_AQI',
    severity: 'critical',
    message: 'AQI in Delhi has crossed 300 — Hazardous level. Outdoor activities strongly discouraged.',
    aqi: 312,
    threshold: 300,
    triggeredAt: now(),
    resolved: false,
    notifiedUsers: ['admin@aeroscope.io'],
  },
  {
    id: 'alert_002',
    city: 'Patna',
    type: 'HIGH_PM2_5',
    severity: 'high',
    message: 'PM2.5 in Patna (142.7 µg/m³) is well above the safe limit of 60 µg/m³.',
    pm2_5: 142.7,
    threshold: 60,
    triggeredAt: now(),
    resolved: false,
    notifiedUsers: ['admin@aeroscope.io'],
  },
  {
    id: 'alert_003',
    city: 'Lucknow',
    type: 'VERY_UNHEALTHY_AQI',
    severity: 'high',
    message: 'Lucknow AQI has entered the Very Unhealthy range (207). Vulnerable groups should stay indoors.',
    aqi: 207,
    threshold: 200,
    triggeredAt: now(),
    resolved: false,
    notifiedUsers: ['admin@aeroscope.io'],
  },
  {
    id: 'alert_004',
    city: 'Kolkata',
    type: 'HIGH_NO2',
    severity: 'medium',
    message: 'NO₂ concentration in Kolkata (58.4 µg/m³) exceeds the WHO guideline of 40 µg/m³.',
    no2: 58.4,
    threshold: 40,
    triggeredAt: now(),
    resolved: false,
    notifiedUsers: ['admin@aeroscope.io'],
  },
  {
    id: 'alert_005',
    city: 'Jaipur',
    type: 'HIGH_PM10',
    severity: 'medium',
    message: 'PM10 in Jaipur (131.4 µg/m³) exceeds the 24-hour average limit of 100 µg/m³.',
    pm10: 131.4,
    threshold: 100,
    triggeredAt: now(),
    resolved: true,
    resolvedAt: now(),
    notifiedUsers: ['admin@aeroscope.io'],
  },
];

/** Admin user record */
const ADMIN_USER = {
  id: 'admin_001',
  uid: 'admin_firebase_uid_placeholder',   // Replace with real Firebase Auth UID if needed
  email: 'admin@aeroscope.io',
  displayName: 'AEROSCOPE Admin',
  role: 'admin',
  createdAt: '2026-04-21T04:52:00.000Z',
  lastLogin: now(),
  isActive: true,
  permissions: ['read', 'write', 'delete', 'manage_users', 'export_data'],
};

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedCities() {
  console.log('\n📍 Seeding air_quality_data collection (15 cities)...');
  const batch = db.batch();

  for (const city of CITIES) {
    const category = aqiCategory(city.aqi);
    const doc = {
      id:   city.id,
      name: city.name,
      lat:  city.lat,
      lon:  city.lon,
      aqi:  city.aqi,
      aqiCategory:  category.label,
      aqiColor:     category.color,
      pollutants: {
        pm2_5: city.pm2_5,
        pm10:  city.pm10,
        co2:   city.co2,
        no2:   city.no2,
        so2:   city.so2,
        co:    city.co,
      },
      weather:     city.weather,
      lastUpdated: now(),
    };

    const ref = db.collection('air_quality_data').doc(city.id);
    batch.set(ref, doc, { merge: true });
    console.log(`   ✓ ${city.name}  AQI=${city.aqi}  PM2.5=${city.pm2_5}  PM10=${city.pm10}  CO2=${city.co2}  NO2=${city.no2}`);
  }

  await batch.commit();
  console.log('   ✅ All 15 cities seeded successfully.');
}

async function seedAlerts() {
  console.log('\n🚨 Seeding alerts collection (5 alerts)...');
  const batch = db.batch();

  for (const alert of ALERTS) {
    const ref = db.collection('alerts').doc(alert.id);
    batch.set(ref, alert, { merge: true });
    console.log(`   ✓ [${alert.severity.toUpperCase()}] ${alert.id} — ${alert.city} — ${alert.type}`);
  }

  await batch.commit();
  console.log('   ✅ All 5 alerts seeded successfully.');
}

async function seedAdminUser() {
  console.log('\n👤 Seeding users collection (admin user)...');
  const ref = db.collection('users').doc(ADMIN_USER.id);
  await ref.set(ADMIN_USER, { merge: true });
  console.log(`   ✓ ${ADMIN_USER.email} (role: ${ADMIN_USER.role})`);
  console.log('   ✅ Admin user seeded successfully.');
}

async function seedMetadata() {
  console.log('\n🗂️  Seeding metadata...');
  await db.collection('metadata').doc('last_update').set({
    timestamp: now(),
    seededBy:  'exportDatabase.js',
    totalCities: CITIES.length,
    totalAlerts: ALERTS.length,
  }, { merge: true });
  console.log('   ✅ Metadata written.');
}

// ─── Export Function ──────────────────────────────────────────────────────────

async function exportAllCollections() {
  console.log('\n📤 Exporting all Firestore collections to database.json...');

  const collectionsToExport = [
    'air_quality_data',
    'alerts',
    'users',
    'metadata',
  ];

  const output = {
    exportedAt: now(),
    projectId:  'aeroscope-9fb6d',
    collections: {},
  };

  for (const collectionName of collectionsToExport) {
    const snapshot = await db.collection(collectionName).get();
    output.collections[collectionName] = {};

    snapshot.forEach(doc => {
      output.collections[collectionName][doc.id] = doc.data();
    });

    const count = snapshot.size;
    console.log(`   ✓ ${collectionName}: ${count} document${count !== 1 ? 's' : ''} exported`);
  }

  const outputPath = path.join(__dirname, 'database.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ database.json written to: ${outputPath}`);
  return output;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  AEROSCOPE — Firestore Seeder & Exporter');
  console.log('  Project: aeroscope-9fb6d');
  console.log('══════════════════════════════════════════════════════');

  try {
    // 1. Seed all data
    await seedCities();
    await seedAlerts();
    await seedAdminUser();
    await seedMetadata();

    // 2. Export everything to database.json
    const exported = await exportAllCollections();

    // 3. Summary
    const airCount  = Object.keys(exported.collections.air_quality_data || {}).length;
    const alrtCount = Object.keys(exported.collections.alerts || {}).length;
    const userCount = Object.keys(exported.collections.users || {}).length;
    const metaCount = Object.keys(exported.collections.metadata || {}).length;

    console.log('\n══════════════════════════════════════════════════════');
    console.log('  📊 Export Summary');
    console.log('──────────────────────────────────────────────────────');
    console.log(`  🏙️  Cities (air_quality_data) : ${airCount}`);
    console.log(`  🚨 Alerts                     : ${alrtCount}`);
    console.log(`  👤 Users                      : ${userCount}`);
    console.log(`  🗂️  Metadata documents         : ${metaCount}`);
    console.log('──────────────────────────────────────────────────────');
    console.log(`  📁 Output file : database.json`);
    console.log(`  🕐 Exported at : ${exported.exportedAt}`);
    console.log('══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    if (err.code === 16 || err.message.includes('credentials')) {
      console.error('\n💡 Credentials hint:');
      console.error('   Run:  gcloud auth application-default login');
      console.error('   OR set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json\n');
    }
    process.exit(1);
  }
}

main();
