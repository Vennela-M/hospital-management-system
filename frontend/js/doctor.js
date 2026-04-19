// Doctor Dashboard Functions

// LOAD DOCTOR DASHBOARD
function loadDoctorDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (user) {
        // Display doctor name with "Dr." prefix
        const doctorNameElem = document.getElementById("doctorName");
        if (doctorNameElem) {
            doctorNameElem.innerText = "Dr. " + (user.name || "Doctor");
        }
        updateDoctorStats();
    } else {
        alert("Please login first");
        window.location = "index.html";
    }
}

// UPDATE DOCTOR STATS
async function updateDoctorStats() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
    
    try {
        const headers = { "Authorization": `Bearer ${user.token}` };
        const res = await fetch(`http://localhost:5000/api/appointments/doctor/${user._id}`, {
            headers: headers
        });
        const appointments = await res.json();
        
        if (Array.isArray(appointments)) {
            const today = new Date().toDateString();
            const todayAppointments = appointments.filter(a => new Date(a.date).toDateString() === today).length;
            const totalPatients = new Set(appointments.map(a => {
                if (a.patient && typeof a.patient === 'object') return a.patient._id;
                return null;
            })).size;
            
            const todayElem = document.getElementById('todayAppointments');
            const totalPatientElem = document.getElementById('totalPatients');
            
            if (todayElem) todayElem.innerText = todayAppointments;
            if (totalPatientElem) totalPatientElem.innerText = totalPatients;
        }
    } catch (err) {
        console.error('Error updating doctor stats:', err);
    }
}

// VIEW TODAY'S APPOINTMENTS (All Appointments)
async function showTodayAppointments() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please login first");
        return;
    }
    
    try {
        const headers = { "Authorization": `Bearer ${user.token}` };
        const res = await fetch(`http://localhost:5000/api/appointments/doctor/${user._id}`, {
            headers: headers
        });
        const appointments = await res.json();
        
        let output = `
            <h3>My Appointments</h3>
            <div class="mb-3">
                <input type="text" class="form-control" id="searchAppointments" placeholder="Search by patient name or date..." onkeyup="filterDoctorAppointments()">
            </div>
            <div id="appointmentsList"></div>
        `;
        
        const container = document.getElementById("mainContent");
        if (container) container.innerHTML = output;
        
        // Store appointments for filtering
        window.allDoctorAppointments = Array.isArray(appointments) ? appointments : [];
        displayDoctorAppointments(window.allDoctorAppointments);
        
    } catch (err) {
        console.error(err);
        alert("Error loading appointments");
    }
}

// Display doctor appointments with proper formatting
function displayDoctorAppointments(appointments) {
    let output = "";
    
    if (appointments.length === 0) {
        output = "<div class='alert alert-info'>No appointments found</div>";
    } else {
        appointments.forEach(appt => {
            const patientName = appt.patient && typeof appt.patient === 'object' ? appt.patient.name : 'Unknown Patient';
            const patientEmail = appt.patient && typeof appt.patient === 'object' ? appt.patient.email : 'N/A';
            const patientPhone = appt.patient && typeof appt.patient === 'object' ? appt.patient.phone : 'N/A';
            const statusColor = appt.status === 'pending' ? 'warning' : appt.status === 'confirmed' ? 'success' : 'info';
            
            output += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">${patientName}</h5>
                            <p class="mb-2"><strong>📧 Email:</strong> ${patientEmail}</p>
                            <p class="mb-2"><strong>📞 Phone:</strong> ${patientPhone}</p>
                            <p class="mb-2"><strong>📅 Date:</strong> ${appt.date}</p>
                            <p class="mb-2"><strong>🕐 Time:</strong> ${appt.time}</p>
                            <p class="mb-2"><strong>Status:</strong> <span class="badge bg-${statusColor}">${appt.status}</span></p>
                            ${appt.notes ? `<p class="mb-0"><strong>Notes:</strong> ${appt.notes}</p>` : ''}
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-success mb-2" onclick="markAppointmentComplete('${appt._id}')">
                                <i class="fas fa-check me-1"></i>Complete
                            </button>
                            <br>
                            <button class="btn btn-sm btn-info" onclick="viewPatientDetails('${appt.patient._id || ''}')">
                                <i class="fas fa-user-check me-1"></i>Patient Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });
    }
    
    const container = document.getElementById("appointmentsList");
    if (container) container.innerHTML = output;
}

// Filter doctor appointments
function filterDoctorAppointments() {
    const searchTerm = document.getElementById("searchAppointments").value.toLowerCase();
    const filtered = window.allDoctorAppointments.filter(appt => {
        const patientName = (appt.patient && typeof appt.patient === 'object' ? appt.patient.name : 'Unknown').toLowerCase();
        const date = (appt.date || '').toLowerCase();
        return patientName.includes(searchTerm) || date.includes(searchTerm);
    });
    displayDoctorAppointments(filtered);
}

// Mark appointment as complete
async function markAppointmentComplete(appointmentId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please login first");
        return;
    }
    
    if (!confirm("Mark this appointment as complete?")) return;
    
    try {
        const headers = { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
        };
        const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify({ status: "completed" })
        });
        
        if (res.ok) {
            alert("Appointment marked as complete");
            showTodayAppointments(); // Refresh
        } else {
            alert("Error updating appointment");
        }
    } catch (err) {
        console.error(err);
        alert("Error updating appointment");
    }
}

// View patient details
function viewPatientDetails(patientId) {
    if (!patientId) {
        alert("Patient information not available");
        return;
    }
    alert("Patient details:\nID: " + patientId + "\n\nFull patient history view coming soon");
}

// VIEW PATIENT RECORDS
async function showPatientRecords() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please login first");
        return;
    }
    
    try {
        const headers = { "Authorization": `Bearer ${user.token}` };
        const res = await fetch(`http://localhost:5000/api/appointments/doctor/${user._id}`, {
            headers: headers
        });
        const appointments = await res.json();
        
        let output = "<h3>Patient Records</h3>";
        const patients = new Map();
        
        if (Array.isArray(appointments)) {
            appointments.forEach(appt => {
                if (appt.patient) {
                    const pid = appt.patient._id || appt.patient;
                    if (!patients.has(pid)) {
                        patients.set(pid, appt.patient);
                    }
                }
            });
            
            if (patients.size === 0) {
                output += "<p class='text-muted'>No patient records found</p>";
            } else {
                patients.forEach((patient, id) => {
                    const patientName = typeof patient === 'object' ? patient.name : 'Unknown';
                    const patientEmail = typeof patient === 'object' ? patient.email : 'N/A';
                    const patientPhone = typeof patient === 'object' ? patient.phone : 'N/A';
                    output += `
                    <div class="card p-3 mb-2">
                        <p><b>Name:</b> ${patientName}</p>
                        <p><b>Email:</b> ${patientEmail}</p>
                        <p><b>Phone:</b> ${patientPhone}</p>
                        <button class="btn btn-sm btn-primary" onclick="alert('Patient details view coming soon')">View Details</button>
                    </div>
                    `;
                });
            }
        }
        
        const container = document.getElementById("mainContent");
        if (container) container.innerHTML = output;
    } catch (err) {
        console.error(err);
        alert("Error loading patient records");
    }
}

// SET AVAILABILITY
function setAvailability() {
    const container = document.getElementById("mainContent");
    let output = `
        <h3>Set Availability</h3>
        <form>
            <div class="mb-3">
                <label>Available From:</label>
                <input type="time" id="availFrom" class="form-control" />
            </div>
            <div class="mb-3">
                <label>Available To:</label>
                <input type="time" id="availTo" class="form-control" />
            </div>
            <div class="mb-3">
                <label>Select Days:</label>
                <div>
                    <input type="checkbox" id="mon" /> <label for="mon">Monday</label>
                    <input type="checkbox" id="tue" /> <label for="tue">Tuesday</label>
                    <input type="checkbox" id="wed" /> <label for="wed">Wednesday</label>
                    <input type="checkbox" id="thu" /> <label for="thu">Thursday</label>
                    <input type="checkbox" id="fri" /> <label for="fri">Friday</label>
                    <input type="checkbox" id="sat" /> <label for="sat">Saturday</label>
                </div>
            </div>
            <button type="button" class="btn btn-primary" onclick="alert('Availability saved!')">Save Availability</button>
        </form>
    `;
    if (container) container.innerHTML = output;
}

// LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location = "index.html";
}

// CHECK AUTH
function checkAuth() {
    const user = localStorage.getItem("user");
    
    if (!user) {
        alert("Please login first");
        window.location = "index.html";
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDoctorDashboard();
});
