const API_BASE = 'http://localhost:8080/api';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = 'index.html';
}

// Initial Setup
document.getElementById('navUser').textContent = user.fullName;
document.getElementById('navRole').textContent = user.role;
document.getElementById('navAvatar').textContent = user.fullName.charAt(0).toUpperCase();

document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    checkNotifications();

    // Create Project Form
    const createProjectForm = document.getElementById('createProjectForm');
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', createProject);
    }

    const uploadDocForm = document.getElementById('uploadDocForm');
    if (uploadDocForm) {
        uploadDocForm.addEventListener('submit', uploadDocument);
    }
});

function authHeader() {
    return {
        'Authorization': 'Bearer ' + user.token,
        'Content-Type': 'application/json'
    };
}

async function renderDashboard() {
    const container = document.getElementById('viewContainer');
    // Fetch stats
    const res = await fetch(`${API_BASE}/analytics`, { headers: authHeader() });
    const stats = await res.json();

    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem">Dashboard Overview</h2>
        <div class="grid-cols-3">
            <div class="stat-card">
                <h3>Total Projects</h3>
                <div class="value">${stats.totalProjects}</div>
            </div>
            <div class="stat-card">
                <h3>Active Projects</h3>
                <div class="value" style="color: var(--accent)">${stats.activeProjects}</div>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <div class="value" style="color: var(--success)">${stats.completedProjects}</div>
            </div>
        </div>
        <!-- Add charts later via Chart.js if needed -->
    `;
}

async function renderProjects() {
    const container = document.getElementById('viewContainer');
    const res = await fetch(`${API_BASE}/projects`, { headers: authHeader() });
    let projects = await res.json();

    // Faculty only sees SUBMITTED projects assigned to them
    if (user.role === 'FACULTY') {
        projects = projects.filter(p => p.status === 'SUBMITTED' && p.faculty && p.faculty.id === user.id);
    }

    let btnHtml = '';
    if (user.role === 'STUDENT') {
        btnHtml = `<button class="btn-primary" style="width: auto" onclick="openModal('projectModal')">+ New Project</button>`;
    }

    container.innerHTML = `
        <div class="projects-header">
            <h2>Projects</h2>
            ${btnHtml}
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Domain</th>
                        <th>Student</th>
                        <th>Faculty</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No projects found</td></tr>' : projects.map(p => `
                        <tr>
                            <td>${p.title}</td>
                            <td>${p.domain}</td>
                            <td>${p.student.fullName}</td>
                            <td>${p.faculty ? p.faculty.fullName : '<span style="color: var(--warning)">Not Assigned</span>'}</td>
                            <td><span class="status-badge status-${p.stage}">${p.stage}</span></td>
                            <td><span class="status-badge ${p.status === 'SUBMITTED' ? 'status-SUBMISSION' : ''}">${p.status}</span></td>
                            <td>
                                <button class="btn-sm" onclick="viewProjectDetails(${p.id})">View Details</button>
                                ${user.role === 'STUDENT' && p.status !== 'SUBMITTED' ? `
                                    <button class="btn-sm" onclick="openUploadModal(${p.id})">Upload</button>
                                    <button class="btn-sm" style="background: var(--accent); color: white;" onclick="submitForReview(${p.id})">Submit for Review</button>
                                ` : ''}
                                ${user.role === 'ADMIN' && !p.faculty ? `<button class="btn-sm" onclick="assignFaculty(${p.id})">Assign Faculty</button>` : ''}
                                ${user.role === 'FACULTY' && p.status === 'SUBMITTED' ? `
                                    <button class="btn-sm" onclick="approveStage(${p.id})">Approve</button>
                                    <button class="btn-sm" onclick="rejectStage(${p.id})">Reject</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function renderAnalytics() {
    const container = document.getElementById('viewContainer');
    const res = await fetch(`${API_BASE}/analytics`, { headers: authHeader() });
    const stats = await res.json();

    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem">Analytics Dashboard</h2>
        <div class="grid-cols-3">
            <div class="stat-card">
                <h3>Total Projects</h3>
                <div class="value">${stats.totalProjects}</div>
            </div>
            <div class="stat-card">
                <h3>Active Projects</h3>
                <div class="value" style="color: var(--accent)">${stats.activeProjects}</div>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <div class="value" style="color: var(--success)">${stats.completedProjects}</div>
            </div>
        </div>
        <div style="margin-top: 2rem; background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
            <h3 style="margin-bottom: 1rem">Project Distribution by Stage</h3>
            <div style="display: grid; gap: 0.5rem;">
                <div>IDEA: ${stats.projectsByStage?.IDEA || 0}</div>
                <div>DESIGN: ${stats.projectsByStage?.DESIGN || 0}</div>
                <div>DEVELOPMENT: ${stats.projectsByStage?.DEVELOPMENT || 0}</div>
                <div>TESTING: ${stats.projectsByStage?.TESTING || 0}</div>
                <div>SUBMISSION: ${stats.projectsByStage?.SUBMISSION || 0}</div>
                <div>COMPLETED: ${stats.projectsByStage?.COMPLETED || 0}</div>
            </div>
        </div>
    `;
}

function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function createProject(e) {
    e.preventDefault();
    const title = document.getElementById('projTitle').value;
    const domain = document.getElementById('projDomain').value;
    const description = document.getElementById('projDesc').value;

    const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ title, domain, description })
    });

    if (res.ok) {
        closeModal('projectModal');
        renderProjects();
    } else {
        alert('Failed to create project');
    }
}

function openUploadModal(id) {
    document.getElementById('uploadProjectId').value = id;
    openModal('uploadModal');
}

async function uploadDocument(e) {
    e.preventDefault();
    const id = document.getElementById('uploadProjectId').value;
    const file = document.getElementById('docFile').files[0];
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/projects/${id}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + user.token
        },
        body: formData
    });

    if (res.ok) {
        closeModal('uploadModal');
        alert('File Uploaded!');
    } else {
        alert('Upload failed');
    }
}

async function approveStage(id) {
    const remarks = prompt("Enter remarks for approval:");
    if (!remarks) return;

    await fetch(`${API_BASE}/projects/${id}/approve`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ remarks })
    });
    renderProjects();
}

async function rejectStage(id) {
    const remarks = prompt("Enter reason for rejection:");
    if (!remarks) return;

    await fetch(`${API_BASE}/projects/${id}/reject`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ remarks })
    });
    renderProjects();
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Notifications
function toggleNotifications() {
    const el = document.getElementById('notifDropdown');
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
    if (el.style.display === 'block') {
        fetchNotifications();
    }
}

async function fetchNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: authHeader() });
    const data = await res.json();

    const list = document.getElementById('notifList');
    list.innerHTML = data.map(n => {
        // Shorten notification message
        let shortMsg = n.message;
        if (shortMsg.length > 60) {
            shortMsg = shortMsg.substring(0, 60) + '...';
        }
        return `
        <div style="padding: 0.5rem; border-bottom: 1px solid #333; cursor: pointer; ${n.isRead ? '' : 'background: rgba(59,130,246,0.1)'}" onclick="markRead(${n.id})">
            <div style="font-size: 0.875rem;">${shortMsg}</div>
            <small style="color:#aaa">${new Date(n.createdAt).toLocaleDateString()}</small>
        </div>
     `;
    }).join('');
}

async function checkNotifications() {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: authHeader() });
    const count = await res.json();
    const badge = document.getElementById('notifBadge');
    if (count > 0) {
        badge.innerText = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}
async function markRead(id) {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST', headers: authHeader() });
    fetchNotifications();
    checkNotifications();
}

async function viewProjectDetails(id) {
    const p = await fetch(`${API_BASE}/projects/${id}`, { headers: authHeader() }).then(res => res.json());
    const docs = await fetch(`${API_BASE}/projects/${id}/documents`, { headers: authHeader() }).then(res => res.json());

    const container = document.getElementById('viewContainer');
    container.innerHTML = `
        <div>
            <button class="btn-sm" onclick="renderProjects()" style="margin-bottom: 1rem;">← Back to Projects</button>
            <h2>${p.title}</h2>
            <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div><strong>Domain:</strong> ${p.domain}</div>
                    <div><strong>Stage:</strong> <span class="status-badge status-${p.stage}">${p.stage}</span></div>
                    <div><strong>Status:</strong> ${p.status}</div>
                    <div><strong>Student:</strong> ${p.student.fullName}</div>
                    <div><strong>Faculty:</strong> ${p.faculty ? p.faculty.fullName : 'Not Assigned'}</div>
                </div>
                <div style="margin-top: 1rem;"><strong>Description:</strong><br>${p.description}</div>
            </div>
            
            <h3>Documents</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Filename</th>
                            <th>Version</th>
                            <th>Uploaded At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${docs.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 2rem;">No documents uploaded</td></tr>' : docs.map(d => `
                            <tr>
                                <td>${d.filename}</td>
                                <td>v${d.version}</td>
                                <td>${new Date(d.uploadedAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${user.role === 'STUDENT' && p.status !== 'SUBMITTED' ? `
                <div style="margin-top: 1.5rem;">
                    <button class="btn-sm" onclick="openUploadModal(${p.id})">Upload Document</button>
                    <button class="btn-primary" style="width: auto;" onclick="submitForReview(${p.id})">Submit for Review</button>
                </div>
            ` : ''}
            
            ${user.role === 'FACULTY' && p.status === 'SUBMITTED' ? `
                <div style="margin-top: 1.5rem;">
                    ${p.stage === 'SUBMISSION' ? `
                        <button class="btn-primary" style="width: auto;" onclick="openRatingModal(${p.id})">Approve & Rate Project</button>
                    ` : `
                        <button class="btn-sm" onclick="approveStage(${p.id})">Approve Stage</button>
                    `}
                    <button class="btn-sm" onclick="rejectStage(${p.id})">Reject Stage</button>
                </div>
            ` : ''}
            
            ${p.stage === 'COMPLETED' ? `
                <div style="margin-top: 1.5rem; background: rgba(52, 211, 153, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid var(--success);">
                    <h3 style="color: var(--success); margin-bottom: 0.5rem;">Final Rating</h3>
                    <div id="ratingDisplay">Loading rating...</div>
                </div>
            ` : ''}
        </div>
    `;

    if (p.stage === 'COMPLETED') {
        fetch(`${API_BASE}/projects/${id}/rating`, { headers: authHeader() })
            .then(res => res.json())
            .then(r => {
                document.getElementById('ratingDisplay').innerHTML = `
                    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">${'⭐'.repeat(r.rating)} (${r.rating}/5)</div>
                    <div><strong>Feedback:</strong> ${r.feedback}</div>
                `;
            }).catch(() => {
                document.getElementById('ratingDisplay').innerHTML = 'Rating information not available.';
            });
    }
}

async function openRatingModal(projectId) {
    const score = prompt('Enter Rating (1-5):');
    if (!score || score < 1 || score > 5) {
        alert('Please enter a valid rating between 1 and 5');
        return;
    }
    const feedback = prompt('Enter Final Remarks/Feedback:');
    if (!feedback) return;

    const res = await fetch(`${API_BASE}/projects/${projectId}/rate`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: parseInt(score), feedback })
    });

    if (res.ok) {
        alert('Project approved and rated successfully!');
        renderProjects();
    } else {
        alert('Failed to rate project');
    }
}

async function submitForReview(id) {
    if (!confirm('Submit this project for faculty review?')) return;

    const res = await fetch(`${API_BASE}/projects/${id}/submit`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        alert('Project submitted for review!');
        renderProjects();
    } else {
        alert('Failed to submit project');
    }
}

async function assignFaculty(projectId) {
    // Fetch all faculty users
    const res = await fetch(`${API_BASE}/users/faculty`, { headers: authHeader() });
    if (!res.ok) {
        alert('Failed to fetch faculty list');
        return;
    }
    const faculty = await res.json();

    if (faculty.length === 0) {
        alert('No faculty members available');
        return;
    }

    // Create a simple selection prompt
    const facultyList = faculty.map((f, i) => `${i + 1}. ${f.fullName} (${f.email})`).join('\n');
    const selection = prompt(`Select faculty by number:\n${facultyList}`);

    if (!selection) return;

    const index = parseInt(selection) - 1;
    if (index < 0 || index >= faculty.length) {
        alert('Invalid selection');
        return;
    }

    const selectedFaculty = faculty[index];

    // Assign faculty to project
    const assignRes = await fetch(`${API_BASE}/projects/${projectId}/assign-faculty/${selectedFaculty.id}`, {
        method: 'POST',
        headers: authHeader()
    });

    if (assignRes.ok) {
        alert('Faculty assigned successfully');
        renderProjects();
    } else {
        alert('Failed to assign faculty');
    }
}

// Make functions global for HTML onclick attributes
window.renderDashboard = renderDashboard;
window.renderProjects = renderProjects;
window.renderAnalytics = renderAnalytics;
window.logout = logout;
window.toggleNotifications = toggleNotifications;
window.viewProjectDetails = viewProjectDetails;
window.submitForReview = submitForReview;
window.openModal = openModal;
window.closeModal = closeModal;
window.createProject = createProject;
window.openUploadModal = openUploadModal;
window.approveStage = approveStage;
window.rejectStage = rejectStage;
window.assignFaculty = assignFaculty;
window.openRatingModal = openRatingModal;

