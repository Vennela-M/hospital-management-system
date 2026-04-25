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

        // GET /api/appointments returns the logged-in doctor's appointments
        const res = await fetch(
            `http://localhost:5000/api/appointments`,
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const json = await res.json();
        const appointments = Array.isArray(json.data?.appointments)
            ? json.data.appointments
            : (Array.isArray(json) ? json : []);

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

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;

        // Basic client-side guard
        if (!name || !email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        // Role is always "patient" for public signup
        const role = "patient";

        const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password, role })
        });

        // Backend wraps payload in { success, message, data: { token, user } }
        const json = await res.json();
        console.log("Signup response:", json);

        if (res.ok && json.success) {
            const { token, user } = json.data;

            localStorage.setItem("user", JSON.stringify({ ...user, token }));

            alert("Account created successfully!");
            window.location = "login.html";

        } else {
            // Show validation errors if present, otherwise show message
            const errMsg = (json.errors && json.errors.length)
                ? json.errors.join("\n")
                : (json.message || "Signup failed");
            console.log("Signup error response:", json);
            alert(errMsg);
        }

    } catch (err) {
        console.error("Signup network/exception error:", err);
        alert("Could not reach the server. Make sure the backend is running on port 5000.");
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
            // Backend validator expects "email" field
            body: JSON.stringify({ email: contact, password })
        });

        const json = await res.json();
        console.log("Login response:", json);

        if (res.ok && json.success) {
            const { token, user } = json.data;

            localStorage.setItem("user", JSON.stringify({ ...user, token }));

            if (user.role === "patient" || user.role === "user")
                window.location = "user.html";

            else if (user.role === "doctor")
                window.location = "doctor.html";

            else if (user.role === "admin")
                window.location = "admin.html";

            else if (user.role === "hospital")
                window.location = "hospital.html";

        } else {

            alert(json.message || "Login failed");

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = "Sign In";
            }
        }

    } catch (err) {

        console.error("Login network/exception error:", err);
        alert("Could not reach the server. Make sure the backend is running on port 5000.");

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
    startAlertPolling(30000);   // poll every 30 s
}


/* =========================
   ALERT BANNER SYSTEM
   ─────────────────────────
   • Auto-shows banners below navbar on page load
   • Emergency/critical → scrolling marquee + pulsing red bar
   • Warning → yellow banner
   • Info/reminder → blue/purple banner
   • Bell icon still shows history panel
   • Polls every 30 s for new alerts
========================= */

// Type → Bootstrap-compatible class suffix (for history panel)
const ALERT_TYPE_CLASS = {
    emergency: 'danger',
    critical:  'danger',
    warning:   'warning',
    outbreak:  'warning',
    info:      'info',
    reminder:  'primary',
};

// Type → Font Awesome icon name
const ALERT_TYPE_ICON = {
    emergency: 'exclamation-triangle',
    critical:  'exclamation-circle',
    warning:   'exclamation-triangle',
    outbreak:  'biohazard',
    info:      'info-circle',
    reminder:  'bell',
};

// Types that get the scrolling marquee treatment
const MARQUEE_TYPES = new Set(['emergency', 'critical']);

let _alertPollTimer  = null;
let _lastUnreadCount = 0;
// Track which alert IDs are already shown as banners (avoid duplicates on re-poll)
const _shownBannerIds = new Set();

// ── Ensure the banner stack container exists ──────────────────────────────────
function _ensureBannerStack() {
    let stack = document.getElementById('alertBannerStack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'alertBannerStack';
        // Insert right after <nav> if present, otherwise at top of body
        const nav = document.querySelector('nav.navbar');
        if (nav && nav.nextSibling) {
            nav.parentNode.insertBefore(stack, nav.nextSibling);
        } else {
            document.body.prepend(stack);
        }
    }
    return stack;
}

// ── Render a single banner ────────────────────────────────────────────────────
function _renderBanner(alert) {
    const stack   = _ensureBannerStack();
    const type    = alert.type || 'info';
    const icon    = ALERT_TYPE_ICON[type] || 'bell';
    const isMarquee = MARQUEE_TYPES.has(type);
    const label   = type.charAt(0).toUpperCase() + type.slice(1);
    const timeStr = new Date(alert.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const banner = document.createElement('div');
    banner.className = `alert-banner alert-banner-${type}`;
    banner.dataset.alertId = alert._id;

    const messageHtml = isMarquee
        ? `<span class="alert-banner-marquee"><span>${alert.message}&nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;${alert.message}</span></span>`
        : `<span>${alert.message}</span>`;

    banner.innerHTML = `
        <i class="fas fa-${icon} alert-banner-icon"></i>
        <div class="alert-banner-body">
            ${messageHtml}
            <small class="d-block opacity-75 mt-1" style="font-size:0.75rem;">${timeStr}</small>
        </div>
        <span class="alert-banner-label">${label}</span>
        <button class="alert-banner-close" onclick="dismissBanner('${alert._id}', this)" title="Dismiss">
            <i class="fas fa-times"></i>
        </button>
    `;

    stack.appendChild(banner);
    _shownBannerIds.add(alert._id);
}

// ── Show "mark all read" bar when there are multiple banners ──────────────────
function _syncMarkAllBar() {
    const stack   = _ensureBannerStack();
    const banners = stack.querySelectorAll('.alert-banner');
    let   bar     = stack.querySelector('.alert-banner-markall');

    if (banners.length >= 2) {
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'alert-banner-markall';
            bar.innerHTML = `
                <button onclick="dismissAllAlerts()">
                    <i class="fas fa-check-double me-1"></i>Mark all as read
                </button>`;
            stack.prepend(bar);
        }
    } else if (bar) {
        bar.remove();
    }
}

// ── Main fetch + render function ──────────────────────────────────────────────
async function loadAlerts() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        const res  = await fetch("http://localhost:5000/api/alerts?status=unread&limit=10", {
            headers: { Authorization: `Bearer ${user.token}` }
        });

        if (!res.ok) {
            console.warn("Could not load alerts:", res.status);
            return;
        }

        const json        = await res.json();
        const alerts      = json.data?.alerts      || [];
        const unreadCount = json.data?.unreadCount ?? alerts.length;

        // Update navbar badge
        _updateAlertBadge(unreadCount);
        _lastUnreadCount = unreadCount;

        // Render new banners (skip already-shown ones)
        alerts.forEach(a => {
            if (!_shownBannerIds.has(a._id)) {
                _renderBanner(a);
            }
        });

        _syncMarkAllBar();

        // Also refresh the history panel if it's open
        const historyContainer = document.getElementById("alertsContainer");
        if (historyContainer && historyContainer.closest('[style*="display: block"], [style*="display:block"]')) {
            _renderHistoryPanel(alerts, historyContainer);
        }

    } catch (err) {
        console.error("Error loading alerts:", err);
    }
}

// ── Dismiss a single banner ───────────────────────────────────────────────────
async function dismissBanner(alertId, btnEl) {
    const banner = btnEl?.closest('.alert-banner');
    if (banner) {
        banner.classList.add('hiding');
        setTimeout(() => { banner.remove(); _syncMarkAllBar(); }, 320);
    }
    _shownBannerIds.delete(alertId);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
    try {
        await fetch(`http://localhost:5000/api/alerts/${alertId}/read`, {
            method:  'PATCH',
            headers: { Authorization: `Bearer ${user.token}` },
        });
        _lastUnreadCount = Math.max(0, _lastUnreadCount - 1);
        _updateAlertBadge(_lastUnreadCount);
    } catch (err) {
        console.error("dismissBanner error:", err);
    }
}

// ── Dismiss all banners ───────────────────────────────────────────────────────
async function dismissAllAlerts() {
    const stack = document.getElementById('alertBannerStack');
    if (stack) {
        stack.querySelectorAll('.alert-banner').forEach(b => {
            b.classList.add('hiding');
            setTimeout(() => b.remove(), 320);
        });
        setTimeout(() => _syncMarkAllBar(), 350);
    }
    _shownBannerIds.clear();

    const historyContainer = document.getElementById("alertsContainer");
    if (historyContainer) historyContainer.innerHTML = '';

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
    try {
        await fetch("http://localhost:5000/api/alerts/read-all", {
            method:  'PATCH',
            headers: { Authorization: `Bearer ${user.token}` },
        });
        _lastUnreadCount = 0;
        _updateAlertBadge(0);
    } catch (err) {
        console.error("dismissAllAlerts error:", err);
    }
}

// ── Legacy: dismiss a single alert from the history panel ────────────────────
async function dismissAlert(alertId, btnEl) {
    return dismissBanner(alertId, btnEl);
}

// ── Render the history panel (bell dropdown) ──────────────────────────────────
function _renderHistoryPanel(alerts, container) {
    if (!container) return;
    if (!alerts.length) {
        container.innerHTML = '<div class="text-center text-muted py-3 small">No unread notifications</div>';
        return;
    }
    container.innerHTML = alerts.map(a => {
        const bsClass = ALERT_TYPE_CLASS[a.type] || 'info';
        const icon    = ALERT_TYPE_ICON[a.type]  || 'bell';
        const timeStr = new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return `
        <div class="alert alert-${bsClass} alert-dismissible fade show d-flex align-items-start gap-2 py-2 mb-2"
             role="alert" data-alert-id="${a._id}">
            <i class="fas fa-${icon} mt-1 flex-shrink-0"></i>
            <div class="flex-fill">
                <span>${a.message}</span>
                <small class="d-block text-muted mt-1">${timeStr}</small>
            </div>
            <button type="button" class="btn-close flex-shrink-0"
                    onclick="dismissAlert('${a._id}', this)"
                    aria-label="Close"></button>
        </div>`;
    }).join("");
}

// ── Navbar badge ──────────────────────────────────────────────────────────────
function _updateAlertBadge(count) {
    const badge = document.getElementById("alertNavBadge");
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// ── Toggle history panel (bell button) ───────────────────────────────────────
function toggleAlertsPanel() {
    const panel = document.getElementById('alertsPanel');
    if (!panel) return;
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        // Refresh history when opening
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;
        fetch("http://localhost:5000/api/alerts?status=unread&limit=20", {
            headers: { Authorization: `Bearer ${user.token}` }
        })
        .then(r => r.json())
        .then(json => {
            const alerts = json.data?.alerts || [];
            _renderHistoryPanel(alerts, document.getElementById("alertsContainer"));
        })
        .catch(err => console.error("toggleAlertsPanel fetch error:", err));
    }
}

// Alias for doctor.html
function toggleDoctorAlertsPanel() { toggleAlertsPanel(); }

// ── Polling ───────────────────────────────────────────────────────────────────
function startAlertPolling(intervalMs = 30000) {
    stopAlertPolling();
    loadAlerts();                                         // immediate first load
    _alertPollTimer = setInterval(loadAlerts, intervalMs);
}

function stopAlertPolling() {
    if (_alertPollTimer) {
        clearInterval(_alertPollTimer);
        _alertPollTimer = null;
    }
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
            fetch(`http://localhost:5000/api/appointments`, {
                headers: { Authorization: `Bearer ${user.token}` }
            }),
            fetch("http://localhost:5000/api/doctor", {
                headers: { Authorization: `Bearer ${user.token}` }
            })
        ]);

        const appointmentsJson = await appointmentsRes.json();
        const doctorsJson = await doctorsRes.json();

        // Both responses are wrapped: { success, message, data: { ... } }
        window.allAppointments  = Array.isArray(appointmentsJson.data?.appointments)
            ? appointmentsJson.data.appointments
            : (Array.isArray(appointmentsJson) ? appointmentsJson : []);
        window.availableDoctors = Array.isArray(doctorsJson.data?.doctors)
            ? doctorsJson.data.doctors
            : (Array.isArray(doctorsJson) ? doctorsJson : []);

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

    // Doctor options: value = Doctor profile _id, label = name + specialization + hospital
    const doctorOptions = doctors.map(doc => {
        const name  = doc.name || doc.user?.name || 'Unknown';
        const spec  = doc.specialization || 'General';
        const hosp  = doc.hospital?.name || '';
        return `<option value="${doc._id}">${name} — ${spec}${hosp ? ' · ' + hosp : ''}</option>`;
    }).join("");

    // Min date = today
    const today = new Date().toISOString().slice(0, 10);

    container.innerHTML = `
        <div class="card mb-4 shadow-sm">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-calendar-plus me-2"></i>Book a New Appointment</h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label fw-semibold">Doctor *</label>
                        <select id="bookingDoctor" class="form-select" onchange="refreshBookingAvailability()">
                            <option value="">Select doctor</option>
                            ${doctorOptions}
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-semibold">Date *</label>
                        <input type="date" id="bookingDate" class="form-control"
                               min="${today}" onchange="refreshBookingAvailability()" />
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-semibold">Time Slot *</label>
                        <select id="bookingSlot" class="form-select">
                            <option value="">Choose a slot</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100" onclick="bookAppointment()">
                            <i class="fas fa-check me-1"></i>Book
                        </button>
                    </div>
                </div>
                <div class="mt-3" id="bookingAvailabilityInfo"></div>
            </div>
        </div>
    `;
}

async function refreshBookingAvailability() {
    const doctorId  = document.getElementById("bookingDoctor")?.value;
    const date      = document.getElementById("bookingDate")?.value;
    const slotSelect = document.getElementById("bookingSlot");
    const info       = document.getElementById("bookingAvailabilityInfo");

    if (!doctorId || !date) {
        if (slotSelect) slotSelect.innerHTML = `<option value="">Choose a slot</option>`;
        if (info) info.innerHTML = `<div class="alert alert-info">Select a doctor and date to see available slots.</div>`;
        return;
    }

    if (info) info.innerHTML = `<div class="text-muted small"><div class="spinner-border spinner-border-sm me-1"></div>Loading slots...</div>`;
    if (slotSelect) slotSelect.innerHTML = `<option value="">Loading...</option>`;

    const user = JSON.parse(localStorage.getItem("user"));
    try {
        // Use the dedicated /slots endpoint — accepts Doctor profile _id
        const response = await fetch(
            `http://localhost:5000/api/doctor/slots?doctorId=${doctorId}&date=${date}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        const json = await response.json();
        console.log("Slots response:", json);

        if (!response.ok) {
            if (info) info.innerHTML = `<div class="alert alert-danger">${json.message || 'Unable to load slots.'}</div>`;
            if (slotSelect) slotSelect.innerHTML = `<option value="">No slots</option>`;
            return;
        }

        // Response: { success, message, data: { freeSlots, bookedSlots, dayAvailable, ... } }
        const data = json.data || {};

        if (!data.dayAvailable) {
            if (slotSelect) slotSelect.innerHTML = `<option value="">Not available</option>`;
            if (info) info.innerHTML = `<div class="alert alert-warning">
                <i class="fas fa-calendar-times me-2"></i>
                Dr. is not available on <strong>${data.dayName || 'this day'}</strong>. Please choose another date.
            </div>`;
            return;
        }

        const freeSlots = data.freeSlots || [];

        if (slotSelect) {
            slotSelect.innerHTML = freeSlots.length
                ? `<option value="">Choose a slot</option>` +
                  freeSlots.map(s => `<option value="${s}">${formatSlot(s)}</option>`).join("")
                : `<option value="">No slots available</option>`;
        }

        if (info) {
            if (freeSlots.length) {
                info.innerHTML = `<div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>${freeSlots.length}</strong> slot${freeSlots.length > 1 ? 's' : ''} available
                    (${data.startTime} – ${data.endTime})
                </div>`;
            } else {
                info.innerHTML = `<div class="alert alert-warning">
                    <i class="fas fa-clock me-2"></i>
                    All slots are booked for this date. Please choose another date.
                </div>`;
            }
        }

        // Store the doctor's User _id so bookAppointment can use it directly
        if (data.doctorUserId) {
            const el = document.getElementById("bookingDoctor");
            if (el) el.dataset.userIdForSelected = data.doctorUserId;
        }

    } catch (err) {
        console.error("refreshBookingAvailability error:", err);
        if (info) info.innerHTML = `<div class="alert alert-danger">Network error loading slots.</div>`;
        if (slotSelect) slotSelect.innerHTML = `<option value="">Error</option>`;
    }
}

// Format "10:00" → "10:00 AM", "14:30" → "2:30 PM"
function formatSlot(time24) {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12    = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${period}`;
}

async function bookAppointment(slot) {
    const user = JSON.parse(localStorage.getItem("user"));
    let doctorId = document.getElementById("bookingDoctor")?.value;
    let date     = document.getElementById("bookingDate")?.value;
    let time     = document.getElementById("bookingSlot")?.value;

    // When called from the availability modal, override with modal values
    if (slot) {
        const availabilityModal = document.getElementById("doctorAvailabilityModal");
        doctorId = availabilityModal?.dataset?.doctorId || doctorId;
        date     = document.getElementById("availabilityDate")?.value || date;
        time     = slot;
    }

    if (!doctorId || !date || !time) {
        alert("Please select a doctor, date, and time slot.");
        return;
    }

    // Disable the book button to prevent double-submit
    const bookBtn = document.querySelector('[onclick="bookAppointment()"]');
    if (bookBtn) { bookBtn.disabled = true; bookBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Booking...'; }

    try {
        const response = await fetch("http://localhost:5000/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`
            },
            body: JSON.stringify({
                doctorId,   // backend resolves Doctor profile _id → User _id automatically
                date,
                time,
                notes: slot ? "Booked from availability modal" : "Booked from patient dashboard"
            })
        });

        const result = await response.json();
        console.log("Book appointment response:", result);

        if (!response.ok) {
            alert(result.errors?.map(e => e.msg).join('\n') || result.message || "Booking failed");
            return;
        }

        alert("Appointment booked successfully!");

        if (slot) {
            const modal = bootstrap.Modal.getInstance(document.getElementById("doctorAvailabilityModal"));
            if (modal) modal.hide();
        }

        // Refresh the appointments view and slot availability
        await showAppointments();

    } catch (err) {
        console.error("Book appointment error:", err);
        alert("Network error. Could not book appointment.");
    } finally {
        if (bookBtn) { bookBtn.disabled = false; bookBtn.innerHTML = '<i class="fas fa-check me-1"></i>Book'; }
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
    title.innerText = `Availability for Dr. ${doctorName.replace(/^Dr\.\s*/i, '')}`;
    dateInput.value = new Date().toISOString().slice(0, 10);
    document.getElementById("doctorAvailabilityModal").dataset.doctorId = doctorId;
    refreshAvailability();
    modal.show();
}

async function refreshAvailability() {
    const doctorId = document.getElementById("doctorAvailabilityModal").dataset.doctorId;
    const date     = document.getElementById("availabilityDate").value;
    const slots    = document.getElementById("availabilitySlots");
    const user     = JSON.parse(localStorage.getItem("user"));

    if (!doctorId || !date) {
        if (slots) slots.innerHTML = "";
        return;
    }

    if (slots) slots.innerHTML = `<div class="col-12 text-center py-3"><div class="spinner-border text-primary"></div></div>`;

    try {
        const response = await fetch(
            `http://localhost:5000/api/doctor/slots?doctorId=${doctorId}&date=${date}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        const json = await response.json();
        console.log("Modal slots response:", json);

        if (!response.ok) {
            slots.innerHTML = `<div class="col-12"><div class="alert alert-danger">${json.message || 'Unable to load slots.'}</div></div>`;
            return;
        }

        const data      = json.data || {};
        const freeSlots = data.freeSlots || [];

        if (!data.dayAvailable) {
            slots.innerHTML = `<div class="col-12"><div class="alert alert-warning">
                <i class="fas fa-calendar-times me-2"></i>
                Not available on <strong>${data.dayName || 'this day'}</strong>. Please choose another date.
            </div></div>`;
            return;
        }

        if (!freeSlots.length) {
            slots.innerHTML = `<div class="col-12"><div class="alert alert-warning">
                <i class="fas fa-clock me-2"></i>All slots are booked for this date.
            </div></div>`;
            return;
        }

        slots.innerHTML = freeSlots.map(slot => `
            <div class="col-md-4 col-6">
                <div class="card p-2 mb-2 text-center">
                    <div class="fw-semibold mb-1">${formatSlot(slot)}</div>
                    <button class="btn btn-sm btn-primary w-100" onclick="bookAppointment('${slot}')">
                        Book
                    </button>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error("refreshAvailability error:", err);
        if (slots) slots.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error loading slots.</div></div>`;
    }
}

function openDoctorChatModal(doctorId, doctorName) {
    document.getElementById("doctorChatTitle").innerText = `Ask Dr. ${doctorName.replace(/^Dr\.\s*/i, '')}`;
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
        const response = await fetch(`http://localhost:5000/api/doctor/${doctorId}/questions`, {
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

    if (!confirm("Cancel this appointment?")) return;

    try {

        const user = JSON.parse(localStorage.getItem("user"));

        // Backend uses PATCH /:id/cancel — there is no DELETE endpoint
        const res = await fetch(
            `http://localhost:5000/api/appointments/${id}/cancel`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const json = await res.json();
        console.log("Cancel appointment response:", json);

        alert(json.message || "Appointment cancelled.");

        showAppointments();

    } catch (err) {

        console.error("Cancel appointment error:", err);

        alert("Failed to cancel appointment");
    }
}


/* =========================
   APPOINTMENT STATS
========================= */

async function updateAppointmentStats() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    try {

        // GET /api/appointments returns the logged-in patient's appointments
        const res = await fetch(
            `http://localhost:5000/api/appointments`,
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const json = await res.json();

        // Unwrap: { success, message, data: { appointments: [...] } }
        const list = Array.isArray(json.data?.appointments)
            ? json.data.appointments
            : (Array.isArray(json) ? json : []);

        if (!list.length) return;

        const upcoming = list.filter(app => new Date(app.date) >= new Date()).length;
        const completed = list.filter(app => app.status === "completed").length;

        document.getElementById("totalAppointments").innerText = list.length;
        if (document.getElementById("upcomingAppointments")) {
            document.getElementById("upcomingAppointments").innerText = upcoming;
        }
        if (document.getElementById("completedAppointments")) {
            document.getElementById("completedAppointments").innerText = completed;
        }
        // reportsCount is updated separately by updateDashboardStats in user.html

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
        const res = await fetch("http://localhost:5000/api/doctor", {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });

        const json = await res.json();
        console.log("Doctors response:", json);

        if (!res.ok) {
            container.innerHTML = `<div class="alert alert-danger">${json.message || 'Unable to load doctors.'}</div>`;
            return;
        }

        // Response shape: { success, message, data: { doctors: [...] } }
        const doctors = json.data?.doctors || [];

        if (doctors.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No doctors found</div>`;
            return;
        }

        container.innerHTML = `
            <div class="section-header mb-3">
                <h2><i class="fas fa-user-md me-2"></i>Find Doctors</h2>
                <p class="text-muted">Choose a doctor, view availability, ask a quick question, or book an appointment.</p>
            </div>
            <div class="row row-cols-1 row-cols-md-2 g-3">
                ${doctors.map(doc => {
                    // Doctor model populates user; name/email may be on doc.user
    const name  = doc.name  || doc.user?.name  || 'N/A';
    const email = doc.email || doc.user?.email || 'N/A';
    // Remove "Dr." prefix if already present to avoid duplicates like "Dr.Dr.Imran Khan"
    const cleanName = name?.replace(/^Dr\.\s*/i, '') || 'N/A';
    return `
                    <div class="col">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title">Dr. ${cleanName}</h5>
                                <p class="card-text mb-1"><strong>Specialization:</strong> ${doc.specialization || 'General'}</p>
                                <p class="card-text mb-1"><strong>Hospital:</strong> ${doc.hospital?.name || 'N/A'}</p>
                                <p class="card-text mb-1"><strong>Email:</strong> ${email}</p>
                                <p class="card-text mb-1"><strong>Experience:</strong> ${doc.experience != null ? doc.experience + ' yrs' : 'N/A'}</p>
                                <div class="mt-3 d-flex flex-wrap gap-2">
                                    <button class="btn btn-sm btn-outline-primary" onclick="openDoctorAvailabilityModal('${doc._id}', '${cleanName}')">View Availability</button>
                                    <button class="btn btn-sm btn-outline-success" onclick="openDoctorChatModal('${doc._id}', '${cleanName}')">Ask Question</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `}).join("")}
            </div>
        `;
    } catch (err) {
        console.error("Error loading doctors:", err);
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
    if (!user) { alert("Login required"); return; }

    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    try {
        const res  = await fetch("http://localhost:5000/api/patient/profile", {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        const json = await res.json();
        console.log("Profile response:", json);

        if (!res.ok) {
            container.innerHTML = `<div class="alert alert-danger">${json.message || 'Unable to load profile.'}</div>`;
            return;
        }

        // Response: { success, message, data: { profile: { user: {name,email}, age, ... } } }
        const p = json.data?.profile || {};
        const u = p.user || {};

        container.innerHTML = `
            <div class="section-header d-flex justify-content-between align-items-center mb-3">
                <h2><i class="fas fa-id-card me-2"></i>My Profile</h2>
                <button class="btn btn-primary" onclick="editProfile()">
                    <i class="fas fa-edit me-1"></i>Edit Profile
                </button>
            </div>

            <!-- View mode -->
            <div id="profileView">
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header"><h5 class="mb-0">Personal Information</h5></div>
                            <div class="card-body">
                                <p><strong>Name:</strong> ${u.name || 'N/A'}</p>
                                <p><strong>Email:</strong> ${u.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> ${p.phone || 'N/A'}</p>
                                <p><strong>Age:</strong> ${p.age || 'N/A'}</p>
                                <p class="mb-0"><strong>Gender:</strong> ${p.gender || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header"><h5 class="mb-0">Medical Information</h5></div>
                            <div class="card-body">
                                <p><strong>Blood Group:</strong> ${p.bloodGroup || 'N/A'}</p>
                                <p><strong>Height:</strong> ${p.height ? p.height + ' cm' : 'N/A'}</p>
                                <p><strong>Weight:</strong> ${p.weight ? p.weight + ' kg' : 'N/A'}</p>
                                <p><strong>Allergies:</strong> ${(p.allergies || []).join(', ') || 'None'}</p>
                                <p class="mb-0"><strong>Chronic Diseases:</strong> ${(p.chronicDiseases || []).join(', ') || 'None'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit mode (hidden by default) -->
            <div id="profileEdit" style="display:none;">
                <div class="card">
                    <div class="card-header"><h5 class="mb-0">Edit Profile</h5></div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Phone</label>
                                <input type="tel" class="form-control" id="editPhone" value="${p.phone || ''}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Age</label>
                                <input type="number" class="form-control" id="editAge" value="${p.age || ''}" min="0" max="150">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Gender</label>
                                <select class="form-select" id="editGender">
                                    <option value="">Select</option>
                                    <option value="male"   ${p.gender==='male'   ? 'selected':''}>Male</option>
                                    <option value="female" ${p.gender==='female' ? 'selected':''}>Female</option>
                                    <option value="other"  ${p.gender==='other'  ? 'selected':''}>Other</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Blood Group</label>
                                <select class="form-select" id="editBloodGroup">
                                    <option value="">Select</option>
                                    ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg =>
                                        `<option value="${bg}" ${p.bloodGroup===bg?'selected':''}>${bg}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Height (cm)</label>
                                <input type="number" class="form-control" id="editHeight" value="${p.height || ''}" min="0">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Weight (kg)</label>
                                <input type="number" class="form-control" id="editWeight" value="${p.weight || ''}" min="0">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Allergies <small class="text-muted">(comma-separated)</small></label>
                                <input type="text" class="form-control" id="editAllergies"
                                       value="${(p.allergies || []).join(', ')}"
                                       placeholder="e.g. Penicillin, Pollen">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Chronic Diseases <small class="text-muted">(comma-separated)</small></label>
                                <input type="text" class="form-control" id="editChronicDiseases"
                                       value="${(p.chronicDiseases || []).join(', ')}"
                                       placeholder="e.g. Diabetes, Hypertension">
                            </div>
                        </div>
                        <div id="profileSaveMsg" class="mt-3"></div>
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-success" onclick="saveProfile()">
                                <i class="fas fa-save me-1"></i>Save Changes
                            </button>
                            <button class="btn btn-secondary" onclick="cancelEditProfile()">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("showProfile error:", err);
        container.innerHTML = `<div class="alert alert-danger">Error loading profile.</div>`;
    }
}

function editProfile() {
    document.getElementById("profileView").style.display = "none";
    document.getElementById("profileEdit").style.display = "block";
}

function cancelEditProfile() {
    document.getElementById("profileView").style.display = "block";
    document.getElementById("profileEdit").style.display = "none";
}

async function saveProfile() {
    const user   = JSON.parse(localStorage.getItem("user"));
    const msgEl  = document.getElementById("profileSaveMsg");
    if (msgEl) msgEl.innerHTML = '';

    const splitTrim = val => val.split(',').map(s => s.trim()).filter(Boolean);

    const body = {
        phone:           document.getElementById("editPhone")?.value.trim() || undefined,
        age:             parseInt(document.getElementById("editAge")?.value) || undefined,
        gender:          document.getElementById("editGender")?.value || undefined,
        bloodGroup:      document.getElementById("editBloodGroup")?.value || undefined,
        height:          parseFloat(document.getElementById("editHeight")?.value) || undefined,
        weight:          parseFloat(document.getElementById("editWeight")?.value) || undefined,
        allergies:       splitTrim(document.getElementById("editAllergies")?.value || ''),
        chronicDiseases: splitTrim(document.getElementById("editChronicDiseases")?.value || ''),
    };

    // Remove undefined keys
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

    try {
        const res  = await fetch("http://localhost:5000/api/patient/profile", {
            method:  "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
            body:    JSON.stringify(body),
        });
        const json = await res.json();
        console.log("Save profile response:", json);

        if (res.ok) {
            if (msgEl) msgEl.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Profile saved successfully!</div>`;
            // Refresh the view after a short delay
            setTimeout(() => showProfile(), 1200);
        } else {
            const errMsg = json.errors?.map(e => e.msg).join(', ') || json.message || 'Failed to save profile';
            if (msgEl) msgEl.innerHTML = `<div class="alert alert-danger">${errMsg}</div>`;
        }
    } catch (err) {
        console.error("saveProfile error:", err);
        if (msgEl) msgEl.innerHTML = `<div class="alert alert-danger">Network error saving profile.</div>`;
    }
}