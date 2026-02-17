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
    const projects = await res.json();

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
                    ${projects.map(p => `
                        <tr>
                            <td>${p.title}</td>
                            <td>${p.domain}</td>
                            <td>${p.student.fullName}</td>
                            <td>${p.faculty ? p.faculty.fullName : '<span style="color: var(--warning)">Not Assigned</span>'}</td>
                            <td><span class="status-badge status-${p.stage}">${p.stage}</span></td>
                            <td>${p.status}</td>
                            <td>
                                <button class="btn-sm" onclick="viewProject(${p.id})">View</button>
                                ${user.role === 'STUDENT' ? `<button class="btn-sm" onclick="openUploadModal(${p.id})">Upload</button>` : ''}
                                ${user.role === 'ADMIN' && !p.faculty ? `<button class="btn-sm" onclick="assignFaculty(${p.id})">Assign Faculty</button>` : ''}
                                ${user.role === 'FACULTY' && p.faculty && p.faculty.id === user.id ? `
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

function viewProject(id) {
    // For now, just show an alert or simple modal with details
    // In a real app, this would route to a detail view
    fetch(`${API_BASE}/projects/${id}`, { headers: authHeader() })
        .then(res => res.json())
        .then(p => {
            alert(`
                Title: ${p.title}
                Domain: ${p.domain}
                Description: ${p.description}
                Stage: ${p.stage}
                Status: ${p.status}
                Faculty: ${p.faculty ? p.faculty.fullName : 'Not Assigned'}
            `);
        });
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
window.viewProject = viewProject;
window.openModal = openModal;
window.closeModal = closeModal;
window.createProject = createProject;
window.openUploadModal = openUploadModal;
window.approveStage = approveStage;
window.rejectStage = rejectStage;
window.assignFaculty = assignFaculty;

