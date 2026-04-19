// Hospital Seed Data - Add to Database
// Run this to populate hospitals with real data

const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');

const hospitals = [
  {
    name: "Apollo Hospital",
    address: "123 Main Street, Hyderabad, Telangana 500001",
    phone: "+91 40 2360 1000",
    email: "info@apollohospital.com",
    totalBeds: 250,
    availableBeds: 180,
    departments: [
      { name: "Cardiology", doctorsCount: 15, bedsCount: 45, status: "active" },
      { name: "Neurology", doctorsCount: 10, bedsCount: 35, status: "active" },
      { name: "Emergency", doctorsCount: 20, bedsCount: 50, status: "active" },
      { name: "Orthopedics", doctorsCount: 12, bedsCount: 40, status: "active" }
    ],
    description: "Leading multi-specialty hospital with advanced facilities",
    website: "www.apollohospital.com",
    latitude: 17.3850,
    longitude: 78.4867
  },
  {
    name: "KIMS Hospital",
    address: "8-2-596/5, Osman Nagar, Hyderabad, Telangana 500062",
    phone: "+91 40 2456 7000",
    email: "admin@kimshospital.com",
    totalBeds: 200,
    availableBeds: 145,
    departments: [
      { name: "Cardiology", doctorsCount: 12, bedsCount: 35, status: "active" },
      { name: "General Surgery", doctorsCount: 14, bedsCount: 40, status: "active" },
      { name: "Pediatrics", doctorsCount: 8, bedsCount: 25, status: "active" },
      { name: "Oncology", doctorsCount: 10, bedsCount: 30, status: "active" }
    ],
    description: "Multi-specialty hospital with comprehensive healthcare services",
    website: "www.kimshospital.com",
    latitude: 17.3750,
    longitude: 78.5000
  },
  {
    name: "Yashoda Hospital",
    address: "Opp. Padma Rao Nagar, Somajiguda, Hyderabad, Telangana 500082",
    phone: "+91 40 6723 5000",
    email: "contact@yashodahospital.com",
    totalBeds: 180,
    availableBeds: 120,
    departments: [
      { name: "Ophthalmology", doctorsCount: 8, bedsCount: 20, status: "active" },
      { name: "ENT", doctorsCount: 6, bedsCount: 15, status: "active" },
      { name: "Dermatology", doctorsCount: 7, bedsCount: 12, status: "active" },
      { name: "Gastroenterology", doctorsCount: 9, bedsCount: 25, status: "active" }
    ],
    description: "Specialized hospital focusing on multiple medical specialties",
    website: "www.yashodahospital.com",
    latitude: 17.3900,
    longitude: 78.4650
  },
  {
    name: "Care Hospital",
    address: "Rd. no. 10, HITEC City, Hyderabad, Telangana 500081",
    phone: "+91 40 4440 5000",
    email: "care@carehospital.com",
    totalBeds: 220,
    availableBeds: 160,
    departments: [
      { name: "Urology", doctorsCount: 7, bedsCount: 18, status: "active" },
      { name: "Nephrology", doctorsCount: 5, bedsCount: 12, status: "active" },
      { name: "Orthopedics", doctorsCount: 11, bedsCount: 35, status: "active" },
      { name: "Radiology", doctorsCount: 8, bedsCount: 20, status: "active" }
    ],
    description: "Advanced care hospital with state-of-the-art facilities",
    website: "www.carehospital.com",
    latitude: 17.3600,
    longitude: 78.5500
  },
  {
    name: "Fortis Hospital",
    address: "4-1-868, Somajiguda, Hyderabad, Telangana 500082",
    phone: "+91 40 4866 5000",
    email: "info@fortishospital.com",
    totalBeds: 280,
    availableBeds: 200,
    departments: [
      { name: "Cardiology", doctorsCount: 18, bedsCount: 50, status: "active" },
      { name: "Neurology", doctorsCount: 12, bedsCount: 40, status: "active" },
      { name: "Oncology", doctorsCount: 15, bedsCount: 45, status: "active" },
      { name: "General Surgery", doctorsCount: 16, bedsCount: 48, status: "active" }
    ],
    description: "Premium multi-specialty hospital with comprehensive medical services",
    website: "www.fortishospital.com",
    latitude: 17.3850,
    longitude: 78.4600
  }
];

async function seedHospitals() {
  try {
    // Clear existing hospitals
    await Hospital.deleteMany({});
    
    // Insert new hospitals
    const result = await Hospital.insertMany(hospitals);
    console.log(`✅ Successfully seeded ${result.length} hospitals`);
    console.log("Hospitals added:");
    result.forEach(h => console.log(`  - ${h.name}: ${h.address}`));
    
    return result;
  } catch (error) {
    console.error("❌ Error seeding hospitals:", error);
  }
}

module.exports = seedHospitals;
