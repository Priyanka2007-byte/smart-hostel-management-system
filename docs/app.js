const API_BASE = "http://127.0.0.1:8000";
const AI_BASE = "http://127.0.0.1:8001";

// In-memory demo data store (ensures mobile users on GitHub Pages see full working data)
let mockResidents = [
  { id: 1, full_name: "Priyanka Barik", email: "priyanka.test@example.com", room_number: "B-204", guardian: "+91 98765 43210 (Father)" },
  { id: 2, full_name: "Satya ranjan sahoo", email: "satya2008@gmail.com", room_number: "B-209", guardian: "+91 98765 43211 (Mother)" },
  { id: 3, full_name: "SONA SWAIN", email: "swain_sona@gmail.com", room_number: "G-105", guardian: "+91 98765 43212 (Father)" },
  { id: 4, full_name: "Rahul Verma", email: "rahul.v@example.com", room_number: "A-102", guardian: "+91 98765 43213 (Guardian)" }
];

let mockComplaints = [
  { id: 1, student_id: 1, category: "Electrical", title: "Ceiling fan sparked and stopped", priority: "Urgent", status: "In Progress" },
  { id: 2, student_id: 2, category: "Plumbing", title: "Tap leakage in washroom", priority: "High", status: "Pending" },
  { id: 3, student_id: 3, category: "Carpentry", title: "Cupboard door hinge broken", priority: "Medium", status: "Resolved" }
];

let mockGatePasses = [
  {
    id: 1,
    student_id: 1,
    reason: "Going home for festive weekend",
    out_time: "2026-10-23T16:00",
    in_time: "2026-10-26T08:30",
    parent_approval: "Approved",
    mentor_approval: "Approved",
    final_status: "Issued"
  },
  {
    id: 2,
    student_id: 2,
    reason: "Medical checkup at City Clinic",
    out_time: "2026-10-24T10:00",
    in_time: "2026-10-24T18:00",
    parent_approval: "Approved",
    mentor_approval: "Pending",
    final_status: "Awaiting Mentor"
  }
];

let isBackendLive = false;

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
async function init() {
  setupTabs();
  await checkBackendStatus();
  renderAll();
  setupAIAutoTriage();
}

// ─── TABS NAVIGATION ─────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      button.classList.add("active");
      const tabId = "tab-" + button.dataset.tab;
      document.getElementById(tabId)?.classList.add("active");
    });
  });
}

// ─── CHECK CONNECTION ────────────────────────────────────────────────────────
async function checkBackendStatus() {
  const statusText = document.getElementById("conn-text");
  const indicator = document.querySelector(".status-indicator");
  try {
    const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      isBackendLive = true;
      statusText.innerText = "Live MySQL Backend Connected";
      indicator.style.background = "#10b981";
      return;
    }
  } catch (err) {
    // Falls back gracefully
  }
  isBackendLive = false;
  statusText.innerText = "Demo Cloud Mode (Offline Sync)";
  indicator.style.background = "#38bdf8";
}

// ─── HELPER: GET STUDENT NAME ────────────────────────────────────────────────
function getStudentName(id) {
  const s = mockResidents.find(r => r.id === Number(id));
  return s ? s.full_name : `Student #${id}`;
}

// ─── RENDER EVERYTHING ───────────────────────────────────────────────────────
function renderAll() {
  renderResidents();
  renderComplaints();
  renderGatePasses();
  updateDashboardStats();
}

function updateDashboardStats() {
  document.getElementById("dash-residents").innerText = mockResidents.length;
  const activeCount = mockComplaints.filter(c => c.status !== "Resolved").length;
  document.getElementById("dash-complaints").innerText = activeCount;
  document.getElementById("dash-gatepasses").innerText = mockGatePasses.length;

  const dashTable = document.getElementById("dash-complaints-table");
  dashTable.innerHTML = "";
  mockComplaints.slice(0, 5).forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${c.id}</td>
      <td><strong>${getStudentName(c.student_id)}</strong></td>
      <td>${c.category}</td>
      <td>${c.title}</td>
      <td><span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
      <td><span class="badge badge-${c.status === 'Resolved' ? 'approved' : c.status === 'In Progress' ? 'inprogress' : 'pending'}">${c.status}</span></td>
    `;
    dashTable.appendChild(tr);
  });
}

// ─── RESIDENTS ───────────────────────────────────────────────────────────────
function renderResidents() {
  const resSelectComp = document.getElementById("complaint-resident");
  const resSelectGate = document.getElementById("gatepass-resident");
  const resTbody = document.getElementById("residents-table-body");

  resSelectComp.innerHTML = '<option value="">-- Choose Resident --</option>';
  resSelectGate.innerHTML = '<option value="">-- Choose Resident --</option>';
  resTbody.innerHTML = "";

  mockResidents.forEach(r => {
    resSelectComp.innerHTML += `<option value="${r.id}">${r.full_name} (${r.room_number})</option>`;
    resSelectGate.innerHTML += `<option value="${r.id}">${r.full_name} (${r.room_number})</option>`;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${r.id}</td>
      <td><strong>${r.full_name}</strong></td>
      <td>${r.email}</td>
      <td>${r.room_number}</td>
      <td>${r.guardian || "+91 98111 22233 (Parent)"}</td>
    `;
    resTbody.appendChild(tr);
  });
}

// ─── COMPLAINTS & LIFECYCLE ──────────────────────────────────────────────────
function renderComplaints() {
  const tbody = document.getElementById("complaints-table-body");
  tbody.innerHTML = "";

  mockComplaints.forEach(c => {
    const tr = document.createElement("tr");
    const statusClass = c.status === "Resolved" ? "badge-approved" : c.status === "In Progress" ? "badge-inprogress" : "badge-pending";

    tr.innerHTML = `
      <td>#${c.id}</td>
      <td><strong>${getStudentName(c.student_id)}</strong></td>
      <td>${c.category}</td>
      <td>${c.title}</td>
      <td><span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
      <td><span class="badge ${statusClass}">${c.status}</span></td>
      <td>
        <select onchange="updateComplaintStatus(${c.id}, this.value)" class="action-dropdown">
          <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
          <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
          <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>✅ Resolved / Done</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.updateComplaintStatus = function(id, newStatus) {
  const complaint = mockComplaints.find(c => c.id === id);
  if (complaint) {
    complaint.status = newStatus;
    renderAll();
  }
};

// ─── GATE PASSES & APPROVAL WORKFLOW ─────────────────────────────────────────
function renderGatePasses() {
  const tbody = document.getElementById("gatepass-table-body");
  tbody.innerHTML = "";

  mockGatePasses.forEach(gp => {
    const parentClass = gp.parent_approval === "Approved" ? "badge-approved" : "badge-pending";
    const mentorClass = gp.mentor_approval === "Approved" ? "badge-approved" : gp.mentor_approval === "Rejected" ? "badge-urgent" : "badge-pending";
    const clearanceClass = gp.final_status === "Issued" ? "badge-approved" : "badge-pending";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#GP-${gp.id}</td>
      <td><strong>${getStudentName(gp.student_id)}</strong></td>
      <td>${gp.reason}</td>
      <td>${new Date(gp.out_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
      <td>${new Date(gp.in_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
      <td>
        <button class="badge ${parentClass} btn-toggle" onclick="toggleParentApproval(${gp.id})">
          ${gp.parent_approval === 'Approved' ? '✅ Parent Verified' : '⏳ Awaiting Parent SMS'}
        </button>
      </td>
      <td>
        <button class="badge ${mentorClass} btn-toggle" onclick="toggleMentorApproval(${gp.id})">
          ${gp.mentor_approval === 'Approved' ? '✅ Mentor Cleared' : '⏳ Mentor Review'}
        </button>
      </td>
      <td><span class="badge ${clearanceClass}"><strong>${gp.final_status}</strong></span></td>
    `;
    tbody.appendChild(tr);
  });
}

window.toggleParentApproval = function(id) {
  const pass = mockGatePasses.find(p => p.id === id);
  if (pass) {
    pass.parent_approval = pass.parent_approval === "Approved" ? "Pending" : "Approved";
    recalculatePassStatus(pass);
    renderGatePasses();
  }
};

window.toggleMentorApproval = function(id) {
  const pass = mockGatePasses.find(p => p.id === id);
  if (pass) {
    pass.mentor_approval = pass.mentor_approval === "Approved" ? "Pending" : "Approved";
    recalculatePassStatus(pass);
    renderGatePasses();
  }
};

function recalculatePassStatus(pass) {
  if (pass.parent_approval === "Approved" && pass.mentor_approval === "Approved") {
    pass.final_status = "Issued";
  } else if (pass.parent_approval === "Approved") {
    pass.final_status = "Awaiting Mentor";
  } else {
    pass.final_status = "Awaiting Parent";
  }
}

// ─── FORM SUBMISSIONS ────────────────────────────────────────────────────────
document.getElementById("complaint-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const residentId = document.getElementById("complaint-resident").value;
  const cat = document.getElementById("complaint-category").value;
  const prio = document.getElementById("complaint-priority").value;
  const title = document.getElementById("complaint-title").value;

  const newComp = {
    id: mockComplaints.length + 1,
    student_id: Number(residentId),
    category: cat,
    title: title,
    priority: prio,
    status: "Pending"
  };
  mockComplaints.unshift(newComp);
  e.target.reset();
  alert("Complaint submitted successfully! Registered under Pending status.");
  renderAll();
});

document.getElementById("gatepass-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const resId = document.getElementById("gatepass-resident").value;
  const reason = document.getElementById("gatepass-reason").value;
  const outTime = document.getElementById("gatepass-out").value;
  const inTime = document.getElementById("gatepass-in").value;

  const newPass = {
    id: mockGatePasses.length + 1,
    student_id: Number(resId),
    reason: reason,
    out_time: outTime,
    in_time: inTime,
    parent_approval: "Pending",
    mentor_approval: "Pending",
    final_status: "Awaiting Parent"
  };
  mockGatePasses.unshift(newPass);
  e.target.reset();
  alert("Gate pass request generated! Notifications dispatched to Parent and Mentor.");
  renderAll();
});

document.getElementById("resident-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("res-name").value;
  const email = document.getElementById("res-email").value;
  const room = document.getElementById("res-room").value;

  const newRes = {
    id: mockResidents.length + 1,
    full_name: name,
    email: email,
    room_number: room,
    guardian: "+91 99000 88776 (Guardian)"
  };
  mockResidents.push(newRes);
  e.target.reset();
  alert("Resident successfully added to Hostel Directory!");
  renderAll();
});

// ─── AI AUTO-TRIAGE ON BLUR ──────────────────────────────────────────────────
function setupAIAutoTriage() {
  const descInput = document.getElementById("complaint-desc");
  const titleInput = document.getElementById("complaint-title");

  descInput.addEventListener("blur", async () => {
    const text = (titleInput.value + " " + descInput.value).toLowerCase();
    
    // Quick local NLP fallback (guarantees AI demo works even without python active!)
    if (text.includes("spark") || text.includes("fire") || text.includes("switch") || text.includes("shock") || text.includes("wire")) {
      document.getElementById("complaint-category").value = "Electrical";
      document.getElementById("complaint-priority").value = "Urgent";
      return;
    } else if (text.includes("leak") || text.includes("pipe") || text.includes("water") || text.includes("drain") || text.includes("tap")) {
      document.getElementById("complaint-category").value = "Plumbing";
      document.getElementById("complaint-priority").value = "High";
      return;
    } else if (text.includes("door") || text.includes("lock") || text.includes("window") || text.includes("bed")) {
      document.getElementById("complaint-category").value = "Carpentry";
      document.getElementById("complaint-priority").value = "Medium";
      return;
    }

    // Try live AI microservice if running on port 8001
    try {
      const res = await fetch(`${AI_BASE}/predict-category/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput.value, description: descInput.value })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) document.getElementById("complaint-category").value = data.category;
        if (data.priority) document.getElementById("complaint-priority").value = data.priority;
      }
    } catch(e) {}
  });
}

window.onload = init;