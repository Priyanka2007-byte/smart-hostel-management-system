// Default residents with unique mentors across CSE, ECE, IT, Civil, and Mechanical
const DEFAULT_RESIDENTS = [
  { id: 1, full_name: "Priyanka Barik", room: "B-204", email: "priyanka.barik@hostel.edu", parent: "Mr. B. Barik (Father)", phone: "+91 98610 22345", mentor: "Prof. R. K. Mohapatra", cabin: "CSE Dept (Cabin 302)" },
  { id: 2, full_name: "Satya ranjan sahoo", room: "B-209", email: "satya2008@gmail.com", parent: "Mrs. M. Sahoo (Mother)", phone: "+91 94370 12890", mentor: "Dr. Sneha Mishra", cabin: "ECE Dept (Cabin 108)" },
  { id: 3, full_name: "SONA SWAIN", room: "G-105", email: "swain_sona@gmail.com", parent: "Mr. K. Swain (Father)", phone: "+91 99371 44552", mentor: "Dr. S. K. Rout", cabin: "IT Dept (Cabin 205)" },
  { id: 4, full_name: "Rahul Verma", room: "A-102", email: "rahul.v@example.com", parent: "Mr. D. Verma (Guardian)", phone: "+91 98111 77665", mentor: "Dr. P. Sen", cabin: "Mech Dept (Cabin 401)" },
  { id: 5, full_name: "Prabhat Maharana", room: "G-407", email: "prabhat.m@hostel.edu", parent: "Mr. R. Maharana (Father)", phone: "+91 98532 99881", mentor: "Prof. Ashok Tripathy", cabin: "Civil Dept (Cabin 114)" }
];

const DEFAULT_COMPLAINTS = [
  { id: 1, student_id: 1, category: "Electrical", title: "Ceiling fan sparked and stopped", priority: "Urgent", sla: "24h", status: "In Progress" },
  { id: 2, student_id: 2, category: "Plumbing", title: "Washroom tap continuous leakage", priority: "High", sla: "24h", status: "Pending" },
  { id: 3, student_id: 3, category: "Carpentry", title: "Cupboard door hinge loose", priority: "Medium", sla: "48h", status: "Resolved" },
  { id: 4, student_id: 4, category: "Cleanliness", title: "Corridor litter accumulation", priority: "Low", sla: "72h", status: "Resolved" }
];

const DEFAULT_GATEPASSES = [
  { id: 1, student_id: 1, reason: "Going home for festive weekend", out_time: "2026-10-23T16:00", in_time: "2026-10-26T08:30", parent_approval: "Approved", mentor_approval: "Approved", final_status: "Gate Pass Issued" },
  { id: 2, student_id: 2, reason: "Medical checkup at City Clinic", out_time: "2026-10-24T10:00", in_time: "2026-10-24T18:00", parent_approval: "Approved", mentor_approval: "Pending", final_status: "Awaiting Mentor" },
  { id: 3, student_id: 5, reason: "Family event / brother divorce discussion", out_time: "2026-10-24T10:00", in_time: "2026-10-30T06:00", parent_approval: "Pending", mentor_approval: "Pending", final_status: "Awaiting Parent" }
];

// Persistent state with localStorage so your changes stay saved
let residents = JSON.parse(localStorage.getItem("sh_residents")) || DEFAULT_RESIDENTS;
let complaints = JSON.parse(localStorage.getItem("sh_complaints")) || DEFAULT_COMPLAINTS;
let gatePasses = JSON.parse(localStorage.getItem("sh_gatepasses")) || DEFAULT_GATEPASSES;

function saveState() {
  localStorage.setItem("sh_residents", JSON.stringify(residents));
  localStorage.setItem("sh_complaints", JSON.stringify(complaints));
  localStorage.setItem("sh_gatepasses", JSON.stringify(gatePasses));
}

let categoryChartInstance = null;
let gatePassChartInstance = null;

// Safe Resident lookup with full fallbacks
function getResident(id) {
  const found = residents.find(r => r.id === Number(id));
  if (found) return found;
  return {
    id: id,
    full_name: "Student #" + id,
    room: "Block A",
    parent: "Parent / Guardian",
    phone: "+91 98000 00000",
    mentor: "Prof. R. K. Mohapatra",
    cabin: "CSE Dept (Cabin 302)"
  };
}

function safeFormatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || "N/A";
    return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  } catch(e) {
    return dateStr || "N/A";
  }
}

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
window.onload = () => {
  setupNavigation();
  setupDynamicFormSelects();
  renderAll();
  initCharts();
  setupAIAutoTriage();
};

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = "tab-" + btn.dataset.tab;
      document.getElementById(target)?.classList.add("active");
      renderAll();
    });
  });
}

// When resident is selected in Gatepass form, auto-fill that resident's specific Parent & Mentor!
function setupDynamicFormSelects() {
  const gateResidentSelect = document.getElementById("gatepass-resident");
  const parentInfoBox = document.getElementById("gatepass-parent-info");
  const mentorInfoBox = document.getElementById("gatepass-mentor-info");

  gateResidentSelect?.addEventListener("change", () => {
    const resId = gateResidentSelect.value;
    if (!resId) {
      if (parentInfoBox) parentInfoBox.value = "Select a student to load parent";
      if (mentorInfoBox) mentorInfoBox.value = "Select a student to load mentor";
      return;
    }
    const student = getResident(resId);
    if (parentInfoBox) parentInfoBox.value = `${student.parent} (${student.phone})`;
    if (mentorInfoBox) mentorInfoBox.value = `${student.mentor} - ${student.cabin}`;
  });
}

function renderAll() {
  updateDashboardStats();
  renderComplaints();
  renderGatePasses();
  renderParentApprovalDesk();
  renderMentorApprovalDesk();
  renderMasterMapping();
  renderResidents();
  updateCharts();
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
function updateDashboardStats() {
  const elResidents = document.getElementById("dash-residents");
  const elUrgent = document.getElementById("dash-urgent");
  const elInprog = document.getElementById("dash-inprogress");
  const elResolved = document.getElementById("dash-resolved");

  if (elResidents) elResidents.innerText = residents.length;
  if (elUrgent) elUrgent.innerText = complaints.filter(c => c.status === "Pending").length;
  if (elInprog) elInprog.innerText = complaints.filter(c => c.status === "In Progress").length;
  if (elResolved) elResolved.innerText = complaints.filter(c => c.status === "Resolved").length;

  const tbody = document.getElementById("dash-complaints-table");
  if (!tbody) return;
  tbody.innerHTML = "";
  complaints.slice(0, 5).forEach(c => {
    const r = getResident(c.student_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${c.id}</td>
      <td><strong>${r.full_name}</strong></td>
      <td>${r.room}</td>
      <td>${c.category}</td>
      <td>${c.title}</td>
      <td><span class="badge badge-${(c.priority || 'medium').toLowerCase()}">${c.priority}</span></td>
      <td><span class="badge ${c.status === 'Resolved' ? 'badge-approved' : c.status === 'In Progress' ? 'badge-inprogress' : 'badge-pending'}">${c.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── CHARTS (Chart.js) ───────────────────────────────────────────────────────
function initCharts() {
  const catCanvas = document.getElementById("categoryChart");
  const gateCanvas = document.getElementById("gatePassChart");
  if (!catCanvas || !gateCanvas || typeof Chart === "undefined") return;

  categoryChartInstance = new Chart(catCanvas, {
    type: "bar",
    data: getCategoryChartData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#263352" }, ticks: { color: "#94a3b8", stepSize: 1 } },
        x: { grid: { display: false }, ticks: { color: "#cbd5e1" } }
      }
    }
  });

  gatePassChartInstance = new Chart(gateCanvas, {
    type: "doughnut",
    data: getGatePassChartData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { color: "#cbd5e1" } } }
    }
  });
}

function getCategoryChartData() {
  const counts = { Electrical: 0, Plumbing: 0, Carpentry: 0, Cleanliness: 0 };
  complaints.forEach(c => { if (counts[c.category] !== undefined) counts[c.category]++; });
  return {
    labels: Object.keys(counts),
    datasets: [{
      label: "Complaints",
      data: Object.values(counts),
      backgroundColor: ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa"],
      borderRadius: 6
    }]
  };
}

function getGatePassChartData() {
  let approved = 0, awaiting = 0;
  gatePasses.forEach(g => {
    if (g.final_status === "Gate Pass Issued") approved++;
    else awaiting++;
  });
  return {
    labels: ["Clearance Issued", "Awaiting Approval"],
    datasets: [{
      data: [approved, awaiting],
      backgroundColor: ["#10b981", "#f59e0b"]
    }]
  };
}

function updateCharts() {
  if (categoryChartInstance && gatePassChartInstance) {
    categoryChartInstance.data = getCategoryChartData();
    categoryChartInstance.update();
    gatePassChartInstance.data = getGatePassChartData();
    gatePassChartInstance.update();
  }
}

// ─── 1. PARENT APPROVAL DESK (Dynamic per student) ───────────────────────────
function renderParentApprovalDesk() {
  const tbody = document.getElementById("parent-approval-table");
  if (!tbody) return;
  tbody.innerHTML = "";

  gatePasses.forEach(gp => {
    const student = getResident(gp.student_id);
    const isApproved = gp.parent_approval === "Approved";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${student.full_name}</strong></td>
      <td><span class="badge badge-low">${student.room}</span></td>
      <td><strong>${student.parent}</strong></td>
      <td><code>${student.phone}</code></td>
      <td><strong>${gp.reason}</strong><br><small style="color:var(--text-muted)">${safeFormatDate(gp.out_time)} → ${safeFormatDate(gp.in_time)}</small></td>
      <td>
        <span class="badge ${isApproved ? 'badge-approved' : 'badge-pending'}">
          ${isApproved ? '✅ Verified (OTP)' : '⏳ Awaiting SMS Reply'}
        </span>
      </td>
      <td>
        <button class="badge ${isApproved ? 'badge-pending' : 'badge-approved'} badge-action" onclick="toggleParentApproval(${gp.id})">
          ${isApproved ? 'Revoke Consent' : 'Approve via SMS/OTP'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── 2. FACULTY MENTOR REVIEW DESK (Shows Specific Mentor for Each Student) ──
function renderMentorApprovalDesk() {
  const tbody = document.getElementById("mentor-approval-table");
  if (!tbody) return;
  tbody.innerHTML = "";

  // A. Gate Pass Reviews
  gatePasses.forEach(gp => {
    const student = getResident(gp.student_id);
    const isCleared = gp.mentor_approval === "Approved";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${student.mentor}</strong></td>
      <td><span class="badge badge-low">${student.cabin}</span></td>
      <td><strong>${student.full_name}</strong> (${student.room})</td>
      <td>Leave: "${gp.reason}"</td>
      <td><span class="badge badge-low">Gate Pass</span></td>
      <td>
        <span class="badge ${isCleared ? 'badge-approved' : 'badge-pending'}">
          ${isCleared ? '✅ Mentor Cleared' : '⏳ Pending Review'}
        </span>
      </td>
      <td>
        <button class="badge ${isCleared ? 'badge-pending' : 'badge-approved'} badge-action" onclick="toggleMentorApproval(${gp.id})">
          ${isCleared ? 'Hold Pass' : 'Endorse & Approve'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // B. Mentor Grievance Monitoring
  complaints.filter(c => c.priority === "Urgent" || c.priority === "High").forEach(c => {
    const student = getResident(c.student_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${student.mentor}</strong></td>
      <td><span class="badge badge-low">${student.cabin}</span></td>
      <td><strong>${student.full_name}</strong> (${student.room})</td>
      <td>Grievance: "${c.title}"</td>
      <td><span class="badge badge-${c.priority.toLowerCase()}">${c.priority} Grievance</span></td>
      <td><span class="badge ${c.status === 'Resolved' ? 'badge-approved' : 'badge-inprogress'}">${c.status}</span></td>
      <td>
        <button class="badge badge-low badge-action" onclick="alert('Notification sent to Hostel Warden on behalf of ${student.mentor}!')">
          Escalate to Warden
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── 3. MASTER MAPPING DIRECTORY ─────────────────────────────────────────────
function renderMasterMapping() {
  const tbody = document.getElementById("hierarchy-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  residents.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.full_name}</strong></td>
      <td><span class="badge badge-low">${r.room}</span></td>
      <td>${r.parent}</td>
      <td><code>${r.phone}</code></td>
      <td><strong>${r.mentor}</strong></td>
      <td><span class="badge badge-inprogress">${r.cabin}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── 4. COMPLAINTS TAB ───────────────────────────────────────────────────────
function renderComplaints() {
  const tbody = document.getElementById("complaints-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  complaints.forEach(c => {
    const r = getResident(c.student_id);
    const statusClass = c.status === "Resolved" ? "badge-approved" : c.status === "In Progress" ? "badge-inprogress" : "badge-pending";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${c.id}</td>
      <td><strong>${r.full_name}</strong></td>
      <td>${r.room}</td>
      <td>${c.category}</td>
      <td>${c.title}</td>
      <td><span class="badge badge-${(c.priority || 'medium').toLowerCase()}">${c.priority}</span></td>
      <td><strong>${c.sla || '48h'}</strong></td>
      <td><span class="badge ${statusClass}">${c.status}</span></td>
      <td>
        <select class="action-select" onchange="changeComplaintStatus(${c.id}, this.value)">
          <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
          <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
          <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>✅ Resolved / Done</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.changeComplaintStatus = (id, newStatus) => {
  const target = complaints.find(c => c.id === id);
  if (target) {
    target.status = newStatus;
    saveState();
    renderAll();
  }
};

// ─── 5. GATE PASSES TAB ──────────────────────────────────────────────────────
function renderGatePasses() {
  const tbody = document.getElementById("gatepass-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  gatePasses.forEach(gp => {
    const r = getResident(gp.student_id);
    const parentClass = gp.parent_approval === "Approved" ? "badge-approved" : "badge-pending";
    const mentorClass = gp.mentor_approval === "Approved" ? "badge-approved" : "badge-pending";
    const finalClass = gp.final_status === "Gate Pass Issued" ? "badge-approved" : "badge-pending";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#GP-${gp.id}</td>
      <td><strong>${r.full_name}</strong> (${r.room})</td>
      <td>${gp.reason}</td>
      <td>${safeFormatDate(gp.out_time)}</td>
      <td>${safeFormatDate(gp.in_time)}</td>
      <td>
        <button class="badge ${parentClass} badge-action" onclick="toggleParentApproval(${gp.id})">
          ${gp.parent_approval === 'Approved' ? '✅ Parent Verified' : '⏳ Awaiting Parent SMS'}
        </button>
      </td>
      <td>
        <button class="badge ${mentorClass} badge-action" onclick="toggleMentorApproval(${gp.id})">
          ${gp.mentor_approval === 'Approved' ? '✅ Mentor Cleared' : '⏳ Mentor Review'}
        </button>
      </td>
      <td><span class="badge ${finalClass}"><strong>${gp.final_status}</strong></span></td>
    `;
    tbody.appendChild(tr);
  });
}

window.toggleParentApproval = (id) => {
  const p = gatePasses.find(g => g.id === id);
  if (p) {
    p.parent_approval = p.parent_approval === "Approved" ? "Pending" : "Approved";
    syncPassClearance(p);
    saveState();
    renderAll();
  }
};

window.toggleMentorApproval = (id) => {
  const p = gatePasses.find(g => g.id === id);
  if (p) {
    p.mentor_approval = p.mentor_approval === "Approved" ? "Pending" : "Approved";
    syncPassClearance(p);
    saveState();
    renderAll();
  }
};

function syncPassClearance(p) {
  if (p.parent_approval === "Approved" && p.mentor_approval === "Approved") {
    p.final_status = "Gate Pass Issued";
  } else if (p.parent_approval === "Approved") {
    p.final_status = "Awaiting Mentor";
  } else {
    p.final_status = "Awaiting Parent";
  }
}

// ─── 6. RESIDENT DIRECTORY TAB ───────────────────────────────────────────────
function renderResidents() {
  const selectComp = document.getElementById("complaint-resident");
  const selectGate = document.getElementById("gatepass-resident");
  const tbody = document.getElementById("residents-table-body");

  if (selectComp) selectComp.innerHTML = '<option value="">-- Choose Resident --</option>';
  if (selectGate) selectGate.innerHTML = '<option value="">-- Choose Resident --</option>';
  if (tbody) tbody.innerHTML = "";

  residents.forEach(r => {
    if (selectComp) selectComp.innerHTML += `<option value="${r.id}">${r.full_name} (${r.room})</option>`;
    if (selectGate) selectGate.innerHTML += `<option value="${r.id}">${r.full_name} (${r.room})</option>`;
    if (tbody) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${r.id}</td>
        <td><strong>${r.full_name}</strong></td>
        <td><span class="badge badge-low">${r.room}</span></td>
        <td>${r.email}</td>
        <td>${r.parent} (${r.phone})</td>
        <td><strong>${r.mentor}</strong><br><small style="color:var(--text-muted)">${r.cabin}</small></td>
      `;
      tbody.appendChild(tr);
    }
  });
}

// ─── FORM SUBMISSIONS ────────────────────────────────────────────────────────
document.getElementById("complaint-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const resId = document.getElementById("complaint-resident").value;
  const cat = document.getElementById("complaint-category").value;
  const prio = document.getElementById("complaint-priority").value;
  const title = document.getElementById("complaint-title").value;

  complaints.unshift({
    id: complaints.length + 1,
    student_id: Number(resId),
    category: cat,
    title: title,
    priority: prio,
    sla: prio === "Urgent" ? "24h" : prio === "High" ? "24h" : "48h",
    status: "Pending"
  });
  saveState();
  e.target.reset();
  alert("Complaint successfully lodged under Pending status!");
  renderAll();
});

document.getElementById("gatepass-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const resId = document.getElementById("gatepass-resident").value;
  const reason = document.getElementById("gatepass-reason").value;
  const outTime = document.getElementById("gatepass-out").value;
  const inTime = document.getElementById("gatepass-in").value;

  const newPass = {
    id: gatePasses.length + 1,
    student_id: Number(resId),
    reason: reason,
    out_time: outTime,
    in_time: inTime,
    parent_approval: "Pending",
    mentor_approval: "Pending",
    final_status: "Awaiting Parent"
  };

  gatePasses.unshift(newPass);
  saveState();
  e.target.reset();
  
  // Reset auto-info labels
  const pBox = document.getElementById("gatepass-parent-info");
  const mBox = document.getElementById("gatepass-mentor-info");
  if (pBox) pBox.value = "Select a student to load parent";
  if (mBox) mBox.value = "Select a student to load mentor";

  alert("Gate pass created! Automatically routed to registered Parent and assigned Mentor.");
  renderAll();
});

document.getElementById("resident-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("res-name").value;
  const email = document.getElementById("res-email").value;
  const room = document.getElementById("res-room").value;
  const parentName = document.getElementById("res-parent-name").value;
  const parentPhone = document.getElementById("res-parent-phone").value;
  const mentorData = document.getElementById("res-mentor-select").value.split("|");

  const newRes = {
    id: residents.length + 1,
    full_name: name,
    email: email,
    room: room,
    parent: parentName,
    phone: parentPhone,
    mentor: mentorData[0],
    cabin: mentorData[1]
  };

  residents.push(newRes);
  saveState();
  e.target.reset();
  alert("Resident enrolled with designated Mentor and Guardian!");
  renderAll();
});

// ─── AI AUTO-CLASSIFY ON BLUR ────────────────────────────────────────────────
function setupAIAutoTriage() {
  const desc = document.getElementById("complaint-desc");
  const title = document.getElementById("complaint-title");
  if (!desc || !title) return;

  desc.addEventListener("blur", () => {
    const text = (title.value + " " + desc.value).toLowerCase();
    if (text.includes("spark") || text.includes("fire") || text.includes("shock") || text.includes("switch") || text.includes("wire")) {
      document.getElementById("complaint-category").value = "Electrical";
      document.getElementById("complaint-priority").value = "Urgent";
    } else if (text.includes("leak") || text.includes("water") || text.includes("tap") || text.includes("pipe") || text.includes("drain")) {
      document.getElementById("complaint-category").value = "Plumbing";
      document.getElementById("complaint-priority").value = "High";
    } else if (text.includes("door") || text.includes("window") || text.includes("bed") || text.includes("hinge") || text.includes("cupboard")) {
      document.getElementById("complaint-category").value = "Carpentry";
      document.getElementById("complaint-priority").value = "Medium";
    }
  });
}