console.log("JS Loaded");

let currentSection = "";
let doctorsList = [];

/* =========================
   LOAD DOCTORS (INIT)
========================= */

async function loadDoctorsFromDatabase() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.token) return;

        await fetch("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${user.token}` }
        });

    } catch (err) {
        console.error("Error loading doctors:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadDoctorsFromDatabase);
/* =========================
   LOAD DOCTOR DASHBOARD
========================= */

function loadDoctorDashboard() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "doctor") return;

    const doctorNameElem = document.getElementById("doctorName");

    if (doctorNameElem) {
        doctorNameElem.innerText = "Dr. " + user.name;
    }

    loadDoctorAppointments();
}
/* =========================
   LOAD DOCTOR APPOINTMENTS
========================= */

async function loadDoctorAppointments() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    try {

        const res = await fetch(
            `http://localhost:5000/api/appointments/doctor/${user._id}`,
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const appointments = await res.json();

        displayDoctorAppointments(appointments);

    } catch (err) {

        console.error("Error loading appointments:", err);

    }
}

/* =========================
   DISPLAY DOCTOR APPOINTMENTS
========================= */

function displayDoctorAppointments(appointments) {

    const container = document.getElementById("mainContent");

    if (!container) return;

    if (!appointments.length) {

        container.innerHTML =
            "<div class='alert alert-info'>No appointments found</div>";

        return;
    }

    container.innerHTML = appointments.map(appt => {

        const patientName =
            appt.patient?.name || "Unknown Patient";

        return `
        <div class="card mb-3 p-3">

            <h5>${patientName}</h5>

            <p><strong>Date:</strong> ${appt.date}</p>

            <p><strong>Time:</strong> ${appt.time}</p>

            <p><strong>Status:</strong> ${appt.status}</p>

            <button
                class="btn btn-sm btn-primary"
                onclick="viewPatientDetails('${appt.patient?._id}')"
            >
                View Patient
            </button>

        </div>
        `;

    }).join("");
}

/* =========================
   VIEW PATIENT DETAILS
========================= */

async function viewPatientDetails(patientId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!patientId || !user) {
        alert("Patient information unavailable");
        return;
    }
    try {
        const res = await fetch(
            `http://localhost:5000/api/patients/${patientId}`,
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );
        const patient = await res.json();
        alert(
            `Name: ${patient.name}
            Email: ${patient.email}
            Phone: ${patient.phone}`
        );
    } catch (err) {
        console.error(err);
        alert("Error loading patient details");
    }
}
/* =========================
   SIGNUP
========================= */

async function signup() {
    try {

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const password = document.getElementById("password").value;

        const roleInput = document.querySelector('input[name="role"]');
        const role = roleInput ? roleInput.value : "user";

        const res = await fetch("http://localhost:5000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password, role })
        });

        const data = await res.json();

        if (res.ok && data.user) {

            const userWithToken = {
                ...data.user,
                token: data.token
            };

            localStorage.setItem("user", JSON.stringify(userWithToken));

            if (role === "user" && data.patientId) {
                alert(`Signup successful!\nPatient ID: ${data.patientId}`);
            } else {
                alert("Account created successfully!");
            }

            window.location = "login.html";

        } else {
            alert(data.message || "Signup failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error during signup");
    }
}


/* =========================
   LOGIN
========================= */

async function login() {

    try {

        const contact = document.getElementById("contact").value.trim();
        const password = document.getElementById("password").value;

        if (!contact || !password) {
            alert("Enter email/phone and password");
            return;
        }

        const btn = document.getElementById("loginSubmitBtn");

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Signing in...";
        }

        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contact, password })
        });

        const data = await res.json();

        if (res.ok && data.user && data.user.role) {

            const userWithToken = {
                ...data.user,
                token: data.token
            };

            localStorage.setItem("user", JSON.stringify(userWithToken));

            if (data.user.role === "user")
                window.location = "user.html";

            else if (data.user.role === "doctor")
                window.location = "doctor.html";

            else if (data.user.role === "admin")
                window.location = "admin.html";

        } else {

            alert(data.message || "Login failed");

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = "Sign In";
            }
        }

    } catch (err) {

        console.error(err);
        alert("Server error during login");

        const btn = document.getElementById("loginSubmitBtn");

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "Sign In";
        }
    }
}


/* =========================
   AUTH CHECK
========================= */

function checkAuth() {

    const user = localStorage.getItem("user");

    if (!user) {
        alert("Please login first");
        window.location = "index.html";
    }
}


/* =========================
   USER DASHBOARD
========================= */

function loadUserDashboard() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Login required");
        window.location = "index.html";
        return;
    }

    if (document.getElementById("welcome"))
        document.getElementById("welcome").innerText = "Welcome, " + user.name;

    if (document.getElementById("welcomeText"))
        document.getElementById("welcomeText").innerText = "Welcome " + user.name + " 👋";

    if (document.getElementById("userName"))
        document.getElementById("userName").innerText = user.name;

    updateAppointmentStats();
}


/* =========================
   PASSWORD TOGGLE
========================= */

function togglePassword() {

    const input = document.getElementById("password");

    input.type = input.type === "password"
        ? "text"
        : "password";
}


/* =========================
   SHOW APPOINTMENTS
========================= */

async function showAppointments() {

    const container = document.getElementById("mainContent");

    if (currentSection === "appointments") {
        container.innerHTML = "";
        currentSection = "";
        return;
    }

    currentSection = "appointments";
    container.style.display = "block";

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Login required");
        return;
    }

    try {
        const [appointmentsRes, doctorsRes] = await Promise.all([
            fetch(`http://localhost:5000/api/appointments/patient/${user._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            }),
            fetch("http://localhost:5000/api/doctors", {
                headers: { Authorization: `Bearer ${user.token}` }
            })
        ]);

        const appointments = await appointmentsRes.json();
        const doctors = await doctorsRes.json();

        window.allAppointments = Array.isArray(appointments) ? appointments : [];
        window.availableDoctors = Array.isArray(doctors) ? doctors : [];

        container.innerHTML = `
            <div class="section-header mb-4">
                <div class="d-flex justify-content-between align-items-center flex-wrap">
                    <div>
                        <h2><i class="fas fa-calendar-check me-2"></i>My Appointments</h2>
                        <p class="text-muted mb-0">See your upcoming bookings and create a new appointment.</p>
                    </div>
                    <div>
                        <button class="btn btn-success" onclick="renderAppointmentBooking()">
                            <i class="fas fa-plus me-1"></i>Book Appointment
                        </button>
                    </div>
                </div>
            </div>
            <div id="appointmentBookingContainer"></div>
            <div id="appointmentsList"></div>
        `;

        renderAppointmentBooking();
        displayAppointments(window.allAppointments);
        updateAppointmentStats();
    } catch (err) {
        console.error(err);
        container.innerHTML = "<div class='alert alert-danger'>Error loading appointments</div>";
    }
}


/* =========================
   APPOINTMENT BOOKING
========================= */

function renderAppointmentBooking() {
    const container = document.getElementById("appointmentBookingContainer");
    const doctors = window.availableDoctors || [];

    if (!container) return;

    const doctorOptions = doctors.map(doc => `
        <option value="${doc._id}">${doc.name} - ${doc.specialization || 'General'}</option>
    `).join("");

    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">Book a New Appointment</h5>
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Doctor</label>
                        <select id="bookingDoctor" class="form-select" onchange="refreshBookingAvailability()">
                            <option value="">Select doctor</option>
                            ${doctorOptions}
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Date</label>
                        <input type="date" id="bookingDate" class="form-control" onchange="refreshBookingAvailability()" />
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Time slot</label>
                        <select id="bookingSlot" class="form-select">
                            <option value="">Choose a slot</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100" onclick="bookAppointment()">Book</button>
                    </div>
                </div>
                <div class="mt-3" id="bookingAvailabilityInfo"></div>
            </div>
        </div>
    `;
}

async function refreshBookingAvailability() {
    const doctorId = document.getElementById("bookingDoctor")?.value;
    const date = document.getElementById("bookingDate")?.value;
    const slotSelect = document.getElementById("bookingSlot");
    const info = document.getElementById("bookingAvailabilityInfo");

    if (!doctorId || !date) {
        if (slotSelect) slotSelect.innerHTML = `<option value="">Choose a slot</option>`;
        if (info) info.innerHTML = `<div class="alert alert-info">Select a doctor and date to load availability.</div>`;
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`http://localhost:5000/api/doctors/availability/${doctorId}?date=${date}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        const result = await response.json();

        if (!response.ok) {
            info.innerHTML = `<div class="alert alert-danger">${result.message || 'Unable to load availability.'}</div>`;
            return;
        }

        const freeSlots = Array.isArray(result.freeSlots) ? result.freeSlots : [];
        if (slotSelect) {
            slotSelect.innerHTML = `<option value="">Choose a slot</option>` + freeSlots.map(slot => `<option value="${slot}">${slot}</option>`).join("");
        }

        info.innerHTML = freeSlots.length
            ? `<div class="alert alert-success">${freeSlots.length} slots available for ${date}.</div>`
            : `<div class="alert alert-warning">No free slots available for ${date}. Please choose another date.</div>`;
    } catch (err) {
        console.error(err);
        if (info) info.innerHTML = `<div class="alert alert-danger">Error loading availability.</div>`;
    }
}

async function bookAppointment(slot) {
    const user = JSON.parse(localStorage.getItem("user"));
    let doctorId = document.getElementById("bookingDoctor")?.value;
    let date = document.getElementById("bookingDate")?.value;
    let time = document.getElementById("bookingSlot")?.value;

    if (slot) {
        const availabilityModal = document.getElementById("doctorAvailabilityModal");
        doctorId = availabilityModal?.dataset?.doctorId || doctorId;
        date = document.getElementById("availabilityDate")?.value || date;
        time = slot;
    }

    if (!doctorId || !date || !time) {
        alert("Please select a doctor, date, and time slot.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`
            },
            body: JSON.stringify({
                patient: user._id,
                doctor: doctorId,
                date,
                time,
                status: "hold",
                notes: slot ? "Booked from availability modal" : "Booked from patient dashboard"
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Booking failed");
        }

        alert("Appointment booked successfully.");

        if (slot) {
            const modal = bootstrap.Modal.getInstance(document.getElementById("doctorAvailabilityModal"));
            if (modal) modal.hide();
        }

        showAppointments();
    } catch (err) {
        console.error(err);
        alert(err.message || "Booking failed");
    }
}


/* =========================
   DISPLAY APPOINTMENTS
========================= */

function displayAppointments(list) {

    const container = document.getElementById("appointmentsList");

    if (!container) return;

    if (!list.length) {

        container.innerHTML =
            "<div class='alert alert-info'>No appointments found</div>";

        return;
    }

    let html = "";

    list.forEach(app => {

        const doctor =
            typeof app.doctor === "object"
                ? app.doctor.name
                : app.doctor;

        const statusBadge = app.status === "completed" ? "success" : app.status === "pending" ? "warning" : "secondary";

        html += `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start flex-wrap">
                    <div>
                        <p class="mb-1"><strong>Hospital:</strong> ${app.hospital || 'N/A'}</p>
                        <p class="mb-1"><strong>Doctor:</strong> ${doctor}</p>
                        <p class="mb-1"><strong>Date:</strong> ${app.date}</p>
                        <p class="mb-1"><strong>Time:</strong> ${app.time}</p>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${statusBadge}">${app.status || 'scheduled'}</span>
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-danger me-2" onclick="deleteAppointment('${app._id}')">Delete</button>
                    <button class="btn btn-sm btn-outline-primary" onclick="alert('Doctor: ${doctor}\nStatus: ${app.status || 'scheduled'}')">View details</button>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

async function openDoctorAvailabilityModal(doctorId, doctorName) {
    const title = document.getElementById("doctorAvailabilityTitle");
    const modal = new bootstrap.Modal(document.getElementById("doctorAvailabilityModal"));
    const dateInput = document.getElementById("availabilityDate");
    title.innerText = `Availability for Dr. ${doctorName}`;
    dateInput.value = new Date().toISOString().slice(0, 10);
    document.getElementById("doctorAvailabilityModal").dataset.doctorId = doctorId;
    refreshAvailability();
    modal.show();
}

async function refreshAvailability() {
    const doctorId = document.getElementById("doctorAvailabilityModal").dataset.doctorId;
    const date = document.getElementById("availabilityDate").value;
    const slots = document.getElementById("availabilitySlots");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!doctorId || !date) {
        if (slots) slots.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/doctors/availability/${doctorId}?date=${date}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        const result = await response.json();
        if (!response.ok) {
            slots.innerHTML = `<div class="alert alert-danger">${result.message || 'Unable to load availability.'}</div>`;
            return;
        }

        const freeSlots = Array.isArray(result.freeSlots) ? result.freeSlots : [];
        if (!freeSlots.length) {
            slots.innerHTML = `<div class="alert alert-warning">No available slots for ${date}</div>`;
            return;
        }

        slots.innerHTML = freeSlots.map(slot => `
            <div class="col-md-4">
                <div class="card p-3 mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong>${slot}</strong>
                    </div>
                    <button class="btn btn-sm btn-primary w-100" onclick="bookAppointment('${slot}')">Book ${slot}</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error(err);
        slots.innerHTML = `<div class="alert alert-danger">Error loading availability.</div>`;
    }
}

function openDoctorChatModal(doctorId, doctorName) {
    document.getElementById("doctorChatTitle").innerText = `Ask Dr. ${doctorName}`;
    document.getElementById("doctorQuestionText").value = "";
    document.getElementById("doctorChatModal").dataset.doctorId = doctorId;
    const modal = new bootstrap.Modal(document.getElementById("doctorChatModal"));
    modal.show();
}

async function submitDoctorQuestion() {
    const doctorId = document.getElementById("doctorChatModal").dataset.doctorId;
    const question = document.getElementById("doctorQuestionText").value.trim();
    const user = JSON.parse(localStorage.getItem("user"));

    if (!doctorId || !question) {
        alert("Please enter a question before sending.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/doctors/${doctorId}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Unable to send question.");
        }

        alert("Your question has been sent to the doctor.");
        const modal = bootstrap.Modal.getInstance(document.getElementById("doctorChatModal"));
        modal.hide();
    } catch (err) {
        console.error(err);
        alert(err.message || "Unable to send question.");
    }
}


/* =========================
   DELETE APPOINTMENT
========================= */

async function deleteAppointment(id) {

    if (!confirm("Delete appointment?")) return;

    try {

        const user = JSON.parse(localStorage.getItem("user"));

        const res = await fetch(
            `http://localhost:5000/api/appointments/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const data = await res.json();

        alert(data.message);

        showAppointments();

    } catch (err) {

        console.error(err);

        alert("Delete failed");
    }
}


/* =========================
   APPOINTMENT STATS
========================= */

async function updateAppointmentStats() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    try {

        const res = await fetch(
            `http://localhost:5000/api/appointments/patient/${user._id}`,
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const list = await res.json();

        if (!Array.isArray(list)) return;

        const upcoming = list.filter(app => new Date(app.date) >= new Date()).length;
        const completed = list.filter(app => app.status === "completed").length;

        document.getElementById("totalAppointments").innerText = list.length;
        if (document.getElementById("upcomingAppointments")) {
            document.getElementById("upcomingAppointments").innerText = upcoming;
        }
        if (document.getElementById("completedAppointments")) {
            document.getElementById("completedAppointments").innerText = completed;
        }
        if (document.getElementById("reportsCount")) {
            const userReports = (JSON.parse(localStorage.getItem("user"))?.reports || []).length;
            document.getElementById("reportsCount").innerText = userReports;
        }

    } catch (err) {

        console.error(err);
    }
}


/* =========================
   USER DOCTOR SEARCH
========================= */

async function showDoctors() {
    const container = document.getElementById("mainContent");

    if (currentSection === "doctors") {
        container.innerHTML = "";
        currentSection = "";
        return;
    }

    currentSection = "doctors";
    container.style.display = "block";

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Login required");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/doctors", {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });

        const doctors = await res.json();

        if (!res.ok) {
            container.innerHTML = `<div class="alert alert-danger">${doctors.message || 'Unable to load doctors.'}</div>`;
            return;
        }

        if (!Array.isArray(doctors) || doctors.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No doctors found</div>`;
            return;
        }

        container.innerHTML = `
            <div class="section-header mb-3">
                <h2><i class="fas fa-user-md me-2"></i>Find Doctors</h2>
                <p class="text-muted">Choose a doctor, view availability, ask a quick question, or book an appointment.</p>
            </div>
            <div class="row row-cols-1 row-cols-md-2 g-3">
                ${doctors.map(doc => `
                    <div class="col">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title">Dr. ${doc.name}</h5>
                                <p class="card-text mb-1"><strong>Specialization:</strong> ${doc.specialization || 'General'}</p>
                                <p class="card-text mb-1"><strong>Hospital:</strong> ${doc.hospital || 'N/A'}</p>
                                <p class="card-text mb-1"><strong>Email:</strong> ${doc.email}</p>
                                <p class="card-text mb-1"><strong>Phone:</strong> ${doc.phone || 'N/A'}</p>
                                <div class="mt-3 d-flex flex-wrap gap-2">
                                    <button class="btn btn-sm btn-outline-primary" onclick="openDoctorAvailabilityModal('${doc._id}', '${doc.name}')">View Availability</button>
                                    <button class="btn btn-sm btn-outline-success" onclick="openDoctorChatModal('${doc._id}', '${doc.name}')">Ask Question</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Error loading doctors</div>`;
    }
}


/* =========================
   USER PROFILE
========================= */

async function showProfile() {
    const container = document.getElementById("mainContent");

    if (currentSection === "profile") {
        container.innerHTML = "";
        currentSection = "";
        return;
    }

    currentSection = "profile";
    container.style.display = "block";

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Login required");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/users/profile/${user._id}`, {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });

        const profile = await res.json();

        if (!res.ok) {
            container.innerHTML = `<div class="alert alert-danger">${profile.message || 'Unable to load profile.'}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="section-header mb-3">
                <h2><i class="fas fa-id-card me-2"></i>My Profile</h2>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${profile.name || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Email:</strong> ${profile.email || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Phone:</strong> ${profile.phone || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Gender:</strong> ${profile.gender || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Address:</strong> ${profile.address || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Blood Group:</strong> ${profile.bloodGroup || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Patient ID:</strong> ${profile.patientId || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Error loading profile</div>`;
    }
}
