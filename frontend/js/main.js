console.log("JS Loaded");

let currentSection = "";

const doctorsList = [
{ name: "Dr. Ramesh", hospital: "Yashoda", specialization: "Cardiology" },
{ name: "Dr. Priya", hospital: "Apollo", specialization: "Dermatology" },
{ name: "Dr. Arjun", hospital: "KIMS", specialization: "Neurology" },
{ name: "Dr. Sneha", hospital: "Care Hospital", specialization: "Cardiology" }
];

// SIGNUP
async function signup() {
try {
const name = document.getElementById("name").value;
const contact = document.getElementById("contact").value;
const password = document.getElementById("password").value;

    let email = "";
    let phone = "";

    if (contact.includes("@")) email = contact;
    else phone = contact;

    const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();

    if (res.ok) {
        alert(data.message || "Signup successful");
        window.location = "login.html"; // redirect after signup
    } else {
        alert(data.message || "Signup failed");
    }

} catch (err) {
    console.error(err);
    alert("Server error during signup");
}

}
async function login() {
    try {
    const contact = document.getElementById("contact").value;
    const password = document.getElementById("password").value;
    
        let email = "";
        let phone = "";
    
        if (contact.includes("@")) email = contact;
        else phone = contact;
    
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, phone, password })
            });
    
        const data = await res.json();
    
        if (res.ok && data.role) {
            localStorage.setItem("user", JSON.stringify(data));
    
            if (data.role === "user") window.location = "user.html";
            else if (data.role === "doctor") window.location = "doctor.html";
            else if (data.role === "hospital") window.location = "hospital.html";
            else if (data.role === "admin") window.location = "admin.html";
        } else {
            alert(data.message || "Login failed");
        }
    
    } catch (err) {
        console.error(err);
        alert("Server error during login");
    }
    
    }
// DASHBOARD
function loadUserDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (user) {
        document.getElementById("welcome").innerText = "Welcome, " + user.name;
        document.getElementById("welcomeText").innerText = "Welcome " + user.name + " 👋";
    } else {
        alert("Please login first");
        window.location = "index.html";
    }
    
    }
    
    function checkAuth() {
    const user = localStorage.getItem("user");
    
    if (!user) {
        alert("Please login first");
        window.location = "index.html";
    }
    
    }

    //APPOINTMENTS
    async function showAppointments() {
    const container = document.getElementById("mainContent");
    
    if (currentSection === "appointments") {
        container.innerHTML = "";
        currentSection = "";
        return;
    }
    
    currentSection = "appointments";
    container.innerHTML = "";
    
    try {
        const res = await fetch("http://localhost:5000/api/appointments");
        const data = await res.json();
    
        let output = `
            <h3>Your Appointments</h3>
    
            <h5>Book Appointment</h5>
            <input id="hospital" placeholder="Hospital" class="form-control mb-2">
            <input id="doctor" placeholder="Doctor" class="form-control mb-2">
            <input id="date" type="date" class="form-control mb-2">
    
            <button class="btn btn-primary mb-3" onclick="bookAppointment()">Book</button>
    
            <div id="appointmentsList"></div>
        `;
    
        data.forEach(app => {
            if (!app.hospital || !app.doctor) return;
        
            output += `
            <div class="card p-2 mb-2">
                <p><b>Hospital:</b> ${app.hospital}</p>
                <p><b>Doctor:</b> ${app.doctor}</p>
                <p><b>Date:</b> ${app.date}</p>
            
                <button class="btn btn-danger btn-sm" onclick="deleteAppointment('${app._id}')">
                    Delete
                </button>
            </div>
            `;
        });
    
        container.innerHTML = output;
    
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading appointments</p>";
    }
    
    }
    //BOOK APPOINTMENT
    async function bookAppointment() {
        const user = JSON.parse(localStorage.getItem("user"));
        const hospital = document.getElementById("hospital").value;
        const doctor = document.getElementById("doctor").value;
        const date = document.getElementById("date").value;
        
        try {
            if (!user) {
                alert("Please login first");
                window.location = "index.html";
                return;
            }
        
            const res = await fetch("http://localhost:5000/api/appointments/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: user.name,
                    hospital,
                    doctor,
                    date
                })
            });
        
            const data = await res.json();

if (res.ok) {
    alert(data.message || "Appointment booked successfully");
} else {
    alert(data.error || "Booking failed");
}
        
        } catch (err) {
            console.error(err);
            alert("Server error");
        }
        
        }
// DOCTORS
function showDoctors() {
    const container = document.getElementById("mainContent");
    
    if (currentSection === "doctors") {
        container.innerHTML = "";
        currentSection = "";
        return;
    }
    
    currentSection = "doctors";
    
    let output = `
        <h3>Select Specialization</h3>
    
        <select id="specialization" class="form-control mb-3" onchange="filterDoctors()">
            <option value="">Select</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
        </select>
    
        <div id="doctorList"></div>
    `;
    
    container.innerHTML = output;
    
    }
    //FILTER DOCTORS
    function filterDoctors() {
        const selected = document.getElementById("specialization").value;
        const listDiv = document.getElementById("doctorList");
        
        const filtered = doctorsList.filter(d => d.specialization === selected);
        
        if (filtered.length === 0) {
            listDiv.innerHTML = "<p>No doctors found</p>";
            return;
        }
        
        let output = "";
        
        filtered.forEach(d => {
            output += `
            <div class="card p-2 mb-2">
                <p><b>Name:</b> ${d.name}</p>
                <p><b>Hospital:</b> ${d.hospital}</p>
                <p><b>Specialization:</b> ${d.specialization}</p>
        
                <button class="btn btn-success" onclick="quickBook('${d.name}', '${d.hospital}')">
                    Book Now
                </button>
            </div>
            `;
        });
        
        listDiv.innerHTML = output;
        
        }

//QUICK BOOK
function quickBook(doctor, hospital) {
    localStorage.setItem("selectedDoctor", JSON.stringify({ doctor, hospital }));

    // automatically open appointments
    showAppointments();

    // small delay to allow UI to render
    setTimeout(() => {
        document.getElementById("doctor").value = doctor;
        document.getElementById("hospital").value = hospital;
    }, 200);
}

//SHOW PROFILE
async function showProfile() {
    const container = document.getElementById("mainContent");
    
    if (currentSection === "profile") {
        container.innerHTML = "";
        currentSection = "";
        return;
    }
    
    currentSection = "profile";
    
    const user = JSON.parse(localStorage.getItem("user"));
    const identifier = user.email || user.phone;
    
    try {
        const res = await fetch(`http://localhost:5000/api/auth/getProfile/${identifier}`);
        const data = await res.json();
    
        let output = `
        <h3>Profile</h3>
    
        <h5 class="mt-3">Basic Info</h5>
        <input id="p_name" class="form-control mb-2" value="${data.name || ""}" placeholder="Name">
        <input id="p_email" class="form-control mb-2" value="${data.email || ""}" placeholder="Email">
        <input id="p_phone" class="form-control mb-2" value="${data.phone || ""}" placeholder="Phone">
    
        <h5 class="mt-3">Personal / Medical Info</h5>
        <input id="p_age" class="form-control mb-2" placeholder="Age" value="${data.age || ""}">
        <input id="p_gender" class="form-control mb-2" placeholder="Gender" value="${data.gender || ""}">
        <input id="p_height" class="form-control mb-2" placeholder="Height" value="${data.height || ""}">
        <input id="p_weight" class="form-control mb-2" placeholder="Weight" value="${data.weight || ""}">
        <input id="p_blood" class="form-control mb-2" placeholder="Blood Group" value="${data.bloodGroup || ""}">
    
        <input id="p_disease" class="form-control mb-2" placeholder="Chronic Diseases" value="${data.diseases || ""}">
        <input id="p_surgeries" class="form-control mb-2" placeholder="Past Surgeries" value="${data.surgeries || ""}">
        <input id="p_allergies" class="form-control mb-2" placeholder="Allergies" value="${data.allergies || ""}">
        <input id="p_medications" class="form-control mb-2" placeholder="Current Medications" value="${data.medications || ""}">
    
        <h5 class="mt-3">Emergency</h5>
        <input id="p_emergency_name" class="form-control mb-2" placeholder="Emergency Contact Name" value="${data.emergencyContactName || ""}">
        <input id="p_emergency_number" class="form-control mb-2" placeholder="Emergency Contact Number" value="${data.emergencyContactNumber || ""}">
    
        <h5 class="mt-3">Reports</h5>
        <input type="file" id="reportFile" class="form-control mb-2">
        <button class="btn btn-primary mb-2" onclick="uploadReport()">Upload Report</button>
    
        ${data.reports && data.reports.length > 0
            ? data.reports.map(r => `
                <div>
                    <a href="http://localhost:5000/uploads/${r}" target="_blank">📄 View Report</a>
                </div>
            `).join("")
            : "<p>No reports uploaded</p>"
        }
    
        <button class="btn btn-success mt-3" onclick="saveProfile()">Save</button>
        `;
    
        container.innerHTML = output;
    
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading profile</p>";
    }
    
    }

    
//SAVE PROFILE
window.saveProfile = async function () {
    try {
        const user = JSON.parse(localStorage.getItem("user"));

        // 🔹 BASIC
        const name = document.getElementById("p_name").value;
        const phone = document.getElementById("p_phone").value;
        const email = document.getElementById("p_email").value;

        // 🔹 PERSONAL
        const age = document.getElementById("p_age").value;
        const gender = document.getElementById("p_gender").value;
        const bloodGroup = document.getElementById("p_blood").value;
        const height = document.getElementById("p_height").value;
        const weight = document.getElementById("p_weight").value;

        // 🔹 MEDICAL
        const diseases = document.getElementById("p_disease").value;
        const allergies = document.getElementById("p_allergies").value;
        const medications = document.getElementById("p_medications").value;
        const surgeries = document.getElementById("p_surgeries").value;

        // 🔹 EMERGENCY
        const emergencyContactName = document.getElementById("p_emergency_name").value;
        const emergencyContactNumber = document.getElementById("p_emergency_number").value;

        const res = await fetch("http://localhost:5000/api/auth/updateProfile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: user.email, // identify user

                name,
                phone,
                email,

                age,
                gender,
                bloodGroup,
                height,
                weight,

                diseases,
                allergies,
                medications,
                surgeries,

                emergencyContactName,
                emergencyContactNumber
            })
        });

        const data = await res.json();
        alert(data.message);

        showProfile(); // refresh UI

    } catch (err) {
        console.error(err);
        alert("Error saving profile");
    }
};

//UPLOAD REPORT
async function uploadReport() {
    try {
    const user = JSON.parse(localStorage.getItem("user"));
    const fileInput = document.getElementById("reportFile");
    const file = fileInput.files[0];
    
        // 🔴 Check if user exists
        if (!user) {
            alert("Please login first");
            window.location = "index.html";
            return;
        }
    
        // 🔴 Check if file is selected
        if (!file) {
            alert("Please select a file to upload");
            return;
        }
    
        const formData = new FormData();
        formData.append("report", file);
        formData.append("email", user.email);
        formData.append("phone", user.phone);
    
        const res = await fetch("http://localhost:5000/api/auth/uploadReport", {
            method: "POST",
            body: formData
        });
    
        const data = await res.json();
    
        if (res.ok) {
            alert(data.message || "Report uploaded successfully");
            showProfile(); // refresh UI
        } else {
            alert(data.message || "Upload failed");
        }
    
    } catch (err) {
        console.error(err);
        alert("Error uploading report");
    }
    
    }

// PASSWORD
function togglePassword() {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
    }

//DELETE APPOINTMENT
async function deleteAppointment(id) {
        if (!confirm("Are you sure you want to delete this appointment?")) return;
    
        try {
            const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
                method: "DELETE"
            });
    
            const data = await res.json();
            alert(data.message);
    
            showAppointments(); // refresh
    
        } catch (err) {
            console.error(err);
            alert("Error deleting appointment");
        }
    }