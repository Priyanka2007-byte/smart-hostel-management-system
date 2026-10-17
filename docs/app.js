const API_BASE = "http://127.0.0.1:8000";

// Tab Switching
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    const targetId = btn.getAttribute("data-tab");
    document.getElementById(targetId).classList.add("active");
    document.getElementById("page-title").innerText = btn.innerText.replace(/[^a-zA-Z ]/g, "").trim();
  });
});

// INITIAL LOAD
async function init() {
  await Promise.all([fetchUsers(), fetchComplaints(), fetchGatePasses()]);
}

// 1. USERS / RESIDENTS
async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/users/`);
    const users = await res.json();

    document.getElementById("stat-students-count").innerText = users.length;

    // Populate Residents Table
    const tbody = document.querySelector("#all-students-table tbody");
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td>${u.room_number || "N/A"}</td>
        <td>${u.role}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
      </tr>
    `).join("");

    // Populate Dropdowns for Complaints & Gate Passes
    const optionsHtml = '<option value="">-- Choose Resident --</option>' +
      users.map(u => `<option value="${u.id}">${u.full_name} (Room: ${u.room_number || "N/A"})</option>`).join("");
    
    document.getElementById("complaint-student-select").innerHTML = optionsHtml;
    document.getElementById("gatepass-student-select").innerHTML = optionsHtml;

  } catch (err) {
    console.error("Error loading users:", err);
  }
}

// 2. COMPLAINTS
async function fetchComplaints() {
  try {
    const res = await fetch(`${API_BASE}/complaints/`);
    const complaints = await res.json();

    document.getElementById("stat-complaints-count").innerText = complaints.length;

    const renderRow = c => `
      <tr>
        <td>#${c.id}</td>
        <td>User #${c.student_id}</td>
        <td>${c.category}</td>
        <td>${c.title}</td>
        <td><span class="badge ${c.priority === 'Urgent' ? 'badge-urgent' : 'badge-pending'}">${c.priority}</span></td>
        <td>${c.sla_hours || 48}h</td>
        <td><span class="badge badge-open">${c.status}</span></td>
      </tr>
    `;

    document.querySelector("#all-complaints-table tbody").innerHTML = complaints.map(renderRow).join("");
    document.querySelector("#recent-complaints-table tbody").innerHTML = complaints.slice(0, 5).map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>User #${c.student_id}</td>
        <td>${c.category}</td>
        <td>${c.title}</td>
        <td><span class="badge ${c.priority === 'Urgent' ? 'badge-urgent' : 'badge-pending'}">${c.priority}</span></td>
        <td><span class="badge badge-open">${c.status}</span></td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading complaints:", err);
  }
}

// 3. GATE PASSES
async function fetchGatePasses() {
  try {
    const res = await fetch(`${API_BASE}/gate-passes/`);
    const passes = await res.json();

    document.getElementById("stat-passes-count").innerText = passes.length;

    const tbody = document.querySelector("#all-gatepass-table tbody");
    tbody.innerHTML = passes.map(p => `
      <tr>
        <td>#${p.id}</td>
        <td>User #${p.student_id}</td>
        <td>${p.reason}</td>
        <td>${new Date(p.out_time).toLocaleString()}</td>
        <td>${new Date(p.in_time).toLocaleString()}</td>
        <td><span class="badge badge-pending">${p.parent_approval}</span></td>
        <td><span class="badge badge-pending">${p.mentor_approval}</span></td>
        <td><span class="badge badge-pending">${p.status}</span></td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading gate passes:", err);
  }
}

// FORM SUBMISSIONS
// A. Register Student
document.getElementById("student-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById("student-name").value,
    email: document.getElementById("student-email").value,
    room_number: document.getElementById("student-room").value,
    role: "student"
  };

  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("Resident registered successfully!");
    e.target.reset();
    fetchUsers();
  } else {
    const err = await res.json();
    alert(`Error: ${err.detail || "Could not register user"}`);
  }
});

// B. File Complaint
document.getElementById("complaint-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    student_id: parseInt(document.getElementById("complaint-student-select").value),
    category: document.getElementById("complaint-category").value,
    priority: document.getElementById("complaint-priority").value,
    title: document.getElementById("complaint-title").value,
    description: document.getElementById("complaint-desc").value
  };

  const res = await fetch(`${API_BASE}/complaints/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("Complaint lodged successfully!");
    e.target.reset();
    fetchComplaints();
  } else {
    alert("Failed to submit complaint.");
  }
});

// C. Apply Gate Pass
document.getElementById("gatepass-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    student_id: parseInt(document.getElementById("gatepass-student-select").value),
    reason: document.getElementById("pass-reason").value,
    out_time: new Date(document.getElementById("pass-out-time").value).toISOString(),
    in_time: new Date(document.getElementById("pass-in-time").value).toISOString()
  };

  const res = await fetch(`${API_BASE}/gate-passes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("Gate pass requested successfully!");
    e.target.reset();
    fetchGatePasses();
  } else {
    alert("Failed to submit gate pass request.");
  }
});

window.onload = init;
// AI Auto-Triage Integration
const titleInput = document.getElementById("complaint-title");
const descInput = document.getElementById("complaint-desc");

async function autoTriageComplaint() {
  const title = titleInput.value.trim();
  const desc = descInput.value.trim();

  if (desc.length > 5) {
    try {
      const res = await fetch("http://127.0.0.1:8001/predict-category/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title, description: desc })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category && data.category !== "General") {
          document.getElementById("complaint-category").value = data.category;
        }
        if (data.priority) {
          document.getElementById("complaint-priority").value = data.priority;
        }
      }
    } catch (err) {
      console.warn("AI service not responding:", err);
    }
  }
}

// Automatically trigger AI classification when the user leaves the description box
descInput.addEventListener("blur", autoTriageComplaint);