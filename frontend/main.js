function signup() {
  alert("Signup successful (demo)");
}

function login() {
  const role = "user"; // change to test

  if (role === "user") window.location = "user.html";
  if (role === "doctor") window.location = "doctor.html";
  if (role === "hospital") window.location = "hospital.html";
  if (role === "admin") window.location = "admin.html";
}