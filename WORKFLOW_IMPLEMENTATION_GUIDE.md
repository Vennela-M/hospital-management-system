# Complete Hospital Workflow Implementation Guide

## 🏥 THE THREE-TIER WORKFLOW

```
PATIENT JOURNEY:
┌─────────────────────────────────────────────────────────────┐
│  HOME PAGE - Search for nearby hospitals, view availability │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PATIENT GOES TO HOSPITAL & REGISTRATION AT RECEPTION       │
│  - Admin staff registers patient with unique hospital ID    │
│  - Patient provides contact info or uses existing account   │
│  - Admin assigns appropriate doctor                         │
│  - Patient notified of doctor assignment                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  DOCTOR SEES PATIENT                                        │
│  - Doctor views patient details in their dashboard          │
│  - Tests are ordered and uploaded by admin                 │
│  - Doctor reviews tests and adds prescription               │
│  - Marks appointment as completed                           │
│  - Patient is notified of completion & prescription         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PATIENT SEES RESULTS IN DASHBOARD                          │
│  - Completed appointment shows with date/time               │
│  - Test reports visible                                     │
│  - Doctor prescription available                            │
│  - Option to book follow-up appointment                     │
└─────────────────────────────────────────────────────────────┘
```

## 📱 PAGE STRUCTURES NEEDED

### 1. HOME PAGE - "Hospitals Available Near You"
**Current**: Shows stats only
**Needed**:
```
[Search Bar] ← Type hospital name or area
[Filters] ← By specialization, distance, rating
[Hospital Cards] ← Each shows:
  - Hospital name & address
  - Distance from you (in km)
  - Available beds (ICU, General, Private)
  - Doctors available
  - Click to see full details/book appointment
```

### 2. ADMIN DASHBOARD (NEW)
```
Main Tab:
├── Unregistered Patients [Count]
│   └── Form to register new patient
│       - Name, Contact, Email, Age
│       - Emergency contact
│       - Medical history
├── Registered Patients [List View]
│   └── Each patient shows:
│       - Basic info
│       - Assigned doctor
│       - Status (registered/admitted/discharged)
│       - Test reports uploaded
│       - [Edit] [Assign Doctor] [Upload Tests] buttons
├── Test Upload
│   └── Select patient
│       Upload file (PDF, Image)
│       Test type (Blood, X-Ray, CT Scan, etc.)
│       [Submit]
└── Reports
    └── All tests uploaded today
        Filter by doctor/patient
```

### 3. DOCTOR DASHBOARD (UPDATE)
**Current**: Basic appointment list
**Needed**:
```
Today's Schedule:
├── Patient Name
├── Test Reports (if any)
│   └── [View Report] ← Opens PDF/Image
├── Notes/Medical History
├── [Mark Complete] button
│   After click:
│   ├── Add prescription field
│   ├── Add notes field
│   └── [Save] button

Patient Records Tab:
├── List of all assigned patients
├── Each patient shows:
│   ├── Last visit date
│   ├── Current medications
│   ├── [View Full History]
│   └── [Add Notes]
```

### 4. PATIENT DASHBOARD (UPDATE)
**Current**: Just appointments
**Needed**:
```
Appointment History:
├── Upcoming Appointments
│   └── Hospital, Doctor, Date/Time, Status
├── Completed Appointments
│   └── Hospital, Doctor, Date/Time
│       [View Details]:
│       - Tests done
│       - Doctor notes
│       - Prescription
│       - [Download Report] button

Medical Records:
├── All test reports from all hospitals
├── All prescriptions
├── Allergies & medical history
├── [Add Medical History] option
```

## 💾 DATABASE SCHEMA UPDATES

### Update 1: Appointment Model
```javascript
{
  patient: ObjectId,
  doctor: ObjectId,
  hospital: ObjectId,  // ← CHANGE: ref instead of string
  date: String,
  time: String,
  
  // NEW FIELDS:
  tests: [
    {
      testName: String,           // "Blood Test", "X-Ray"
      description: String,
      uploadedDate: Date,
      uploadedBy: ObjectId,       // Admin ID
      filePath: String,           // URL to file
      result: String,             // Optional
    }
  ],
  
  prescription: {
    medicines: [String],          // ["Aspirin 100mg", ...]
    instructions: String,
    followUpDays: Number,         // Days until follow-up
    addedBy: ObjectId,            // Doctor ID
    addedDate: Date,
  },
  
  adminNotes: String,
  doctorNotes: String,
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled",
  
  // For tracking visit
  checkInTime: Date,
  checkOutTime: Date,
  visitDuration: Number,          // minutes
}
```

### Update 2: User Model (for Patient fields)
```javascript
{
  // ... existing fields ...
  
  // Patient-specific:
  hospitalID: ObjectId,           // Current hospital
  admissionStatus: "registered" | "admitted" | "discharged",
  assignedDoctors: [ObjectId],   // Array of doctors
  
  medicalHistory: {
    allergies: [String],
    chronicDiseases: [String],
    surgeries: [String],
    currentMedications: [String],
    bloodGroup: String,
  },
  
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  
  registrationNotes: String,      // By admin during registration
  registeredAt: Date,
  registeredBy: ObjectId,         // Admin ID
}
```

### Update 3: Hospital Model
```javascript
{
  // ... existing fields ...
  
  // Location fields:
  latitude: Number,               // 17.3850
  longitude: Number,              // 78.4867
  city: String,                   // "Hyderabad"
  area: String,                   // "HITEC City"
  
  availability: {
    generalBeds: {
      total: Number,
      occupied: Number,
      available: Number,           // Calculated
    },
    icuBeds: {
      total: Number,
      occupied: Number,
      available: Number,
    },
    privateBeds: {
      total: Number,
      occupied: Number,
      available: Number,
    },
    lastUpdated: Date,
  },
  
  emergencyServices: Boolean,
  ambulanceAvailable: Boolean,
  rating: Number,                 // 1-5 stars
  reviews: [String],
}
```

## 🔌 NEW API ENDPOINTS NEEDED

### Admin Endpoints
```
POST   /api/admin/register-patient          - Register new patient
PUT    /api/admin/patient/:id               - Update patient info
DELETE /api/admin/patient/:id               - Discharge patient

POST   /api/admin/upload-test               - Upload test report
GET    /api/admin/tests/patient/:id         - Get patient tests
DELETE /api/admin/test/:id                  - Remove test

PUT    /api/admin/assign-doctor             - Assign doctor to patient
GET    /api/admin/patients                  - List all patients
GET    /api/admin/unregistered              - Unregistered patients
```

### Doctor Endpoints
```
GET    /api/doctor/appointments/today       - Today's schedule
POST   /api/doctor/prescription             - Add prescription
GET    /api/doctor/patient/:id              - Patient full details
PUT    /api/doctor/appointment/:id/complete - Mark appointment complete
GET    /api/doctor/assigned-patients        - List all assigned patients
```

### Patient Endpoints (Updates)
```
GET    /api/patient/medical-records         - All test reports
GET    /api/patient/appointments/completed  - Past appointments
GET    /api/patient/prescriptions          - All prescriptions
```

### Public Endpoints
```
GET    /api/hospitals/nearby                - Hospitals within X km
GET    /api/hospitals/search?q=name&city=   - Search hospitals
GET    /api/hospital/:id/availability       - Real-time bed status
```

## 🎨 UI/UX IMPROVEMENTS

### Homepage "Hospitals Near You" Card
```html
<div class="hospital-card">
  <div class="header">
    <h3>Apollo Hospital</h3>
    <span class="distance">2.3 km away</span>
  </div>
  <div class="location">
    <i class="fas fa-map-pin"></i> HITEC City, Hyderabad
  </div>
  <div class="beds-status">
    <div class="bed-type">
      <span>General Beds:</span>
      <progress value="150" max="200"></progress>
      <span>150/200 Available</span>
    </div>
    <div class="bed-type">
      <span>ICU Beds:</span>
      <progress value="8" max="15"></progress>
      <span>8/15 Available</span>
    </div>
  </div>
  <div class="doctors">
    <span>Doctors: 45 Available</span>
  </div>
  <button class="btn btn-primary" onclick="bookAppointment('apollo-hospital')">
    Book Appointment
  </button>
</div>
```

### Responsive Layout
- **Desktop**: 3 hospital cards per row
- **Tablet**: 2 hospital cards per row
- **Mobile**: 1 hospital card per row

## 🔐 ROLE-BASED ACCESS CONTROL

```
PATIENT can:
  ✓ View own appointments
  ✓ View own medical records
  ✓ Book appointments
  ✓ View prescriptions
  ✗ Modify others' records

DOCTOR can:
  ✓ View assigned patients
  ✓ View patient tests
  ✓ Add prescriptions
  ✓ Complete appointments
  ✗ Register patients
  ✗ Upload tests

ADMIN can:
  ✓ Register patients
  ✓ Upload tests
  ✓ Assign doctors
  ✓ Manage hospital info
  ✓ View all data
  ✗ Make medical decisions

HOSPITAL (future) can:
  ✓ Manage bed inventory
  ✓ View availability
  ✓ Update staff list
```

## 📧 NOTIFICATION SYSTEM

**When to Notify**:
1. Doctor Assigned → Patient notification
2. Test Uploaded → Doctor notification
3. Prescription Added → Patient notification
4. Appointment Completed → Patient notification
5. Follow-up Needed → Reminder notification

**Notification Types**:
- In-app badge
- Email (future)
- SMS (future)
- Push notification (future)

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Database (Week 1)
- [ ] Update Appointment model
- [ ] Update User model
- [ ] Update Hospital model
- [ ] Run migrations
- [ ] Create indexes for performance

### Phase 2: Backend APIs (Week 2)
- [ ] Admin routes for registration
- [ ] Test upload endpoint
- [ ] Doctor assignment endpoint
- [ ] Public hospital search endpoints
- [ ] Implement authorization checks

### Phase 3: Admin Pages (Week 3)
- [ ] Create admin-register.html
- [ ] Patient registration form
- [ ] Test upload interface
- [ ] Patient list view
- [ ] Doctor assignment modal

### Phase 4: Homepage Updates (Week 3-4)
- [ ] Add geolocation request
- [ ] Hospital search interface
- [ ] Distance calculation
- [ ] Bed availability display
- [ ] Responsive layout

### Phase 5: Doctor Page Updates (Week 4)
- [ ] Patient details view
- [ ] Test report viewer
- [ ] Prescription form
- [ ] Completion workflow
- [ ] History view

### Phase 6: Patient Page Updates (Week 4)
- [ ] Medical records section
- [ ] Test reports display
- [ ] Prescription view
- [ ] Completed appointments with details
- [ ] Download reports feature

### Phase 7: Testing & Deployment (Week 5)
- [ ] Unit tests
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Deploy to production

---

**Estimated Total Time**: 5-6 weeks with full team
**Team Size Recommended**: 2 developers + 1 designer
**Priority**: Hospital registration is blocking everything else
