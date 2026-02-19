const API_BASE = 'http://localhost:8080/api';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = 'index.html';
}

// Initial Setup
document.getElementById('navUser').textContent = user.fullName;
document.getElementById('navRole').textContent = user.role;
document.getElementById('navAvatar').textContent = user.fullName.charAt(0).toUpperCase();

// Theme Logic
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.setAttribute('name', theme === 'light' ? 'moon-outline' : 'sunny-outline');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderDashboard();
    checkNotifications();

    // Custom Modal Listeners
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (confirmResolve) { confirmResolve(true); confirmResolve = null; }
            closeModal('confirmModal');
        });
    }

    const inputBtn = document.getElementById('inputBtn');
    if (inputBtn) {
        inputBtn.addEventListener('click', () => {
            const val = document.getElementById('inputField').value;
            if (inputResolve) { inputResolve(val); inputResolve = null; }
            closeModal('inputModal');
        });
    }

    // Create Project Form
    const createProjectForm = document.getElementById('createProjectForm');
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', createProject);
    }

    const uploadDocForm = document.getElementById('uploadDocForm');
    if (uploadDocForm) {
        uploadDocForm.addEventListener('submit', uploadDocument);
    }

    const requestFacultyForm = document.getElementById('requestFacultyForm');
    if (requestFacultyForm) {
        requestFacultyForm.addEventListener('submit', sendFacultyRequest);
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

    // Fetch pending invitations (for students)
    let invHtml = '';
    if (user.role === 'STUDENT') {
        const invRes = await fetch(`${API_BASE}/projects/invitations/pending`, { headers: authHeader() });
        if (invRes.ok) {
            const invitations = await invRes.json();
            if (invitations.length > 0) {
                invHtml = `
                    <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--accent); margin-bottom: 2rem;">
                        <h3 style="color: var(--accent); margin-bottom: 1rem;">Pending Team Invitations</h3>
                        <div style="display: grid; gap: 1rem;">
                            ${invitations.map(inv => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px;">
                                    <div>
                                        <strong>${inv.project.title}</strong><br>
                                        <small>Invited by: ${inv.inviter.fullName}</small>
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn-sm" style="background: var(--success); color: white;" onclick="acceptInvitation(${inv.id})">Accept</button>
                                        <button class="btn-sm" style="background: var(--danger); color: white;" onclick="rejectInvitation(${inv.id})">Reject</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
    }

    const exportBtn = (user.role === 'ADMIN' || user.role === 'FACULTY')
        ? `<button class="btn-sm" onclick="exportProjects()" style="margin-top: 2rem; background: var(--secondary); color: white;">Download Project Report (CSV)</button>`
        : '';

    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem">Dashboard Overview</h2>
        ${invHtml}
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
        ${exportBtn}
    `;
}

let activeTab = 'pending';

async function renderProjects() {
    const container = document.getElementById('viewContainer');
    const res = await fetch(`${API_BASE}/projects`, { headers: authHeader() });
    let projects = await res.json();

    let contentHtml = '';

    if (user.role === 'FACULTY' || user.role === 'STUDENT') {
        const isFaculty = user.role === 'FACULTY';

        let pending = [], active = [], history = [];

        if (isFaculty) {
            pending = projects.filter(p => !p.isFacultyAccepted);
            active = projects.filter(p => p.isFacultyAccepted && p.stage !== 'COMPLETED');
            history = projects.filter(p => p.stage === 'COMPLETED');
        } else {
            // Student Logic
            active = projects.filter(p => p.stage !== 'COMPLETED');
            history = projects.filter(p => p.stage === 'COMPLETED');
        }

        // Tab Navigation
        contentHtml += `
            <div class="projects-header">
                <h2>${isFaculty ? 'Faculty Dashboard' : 'My Projects'}</h2>
                ${!isFaculty ? `<button class="btn-primary" style="width: auto" onclick="openModal('projectModal')">+ New Project</button>` : ''}
            </div>
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
                ${isFaculty ? `
                <button class="tab-btn ${activeTab === 'pending' ? 'active' : ''}" onclick="switchTab('pending')">
                    Pending Requests (${pending.length})
                </button>` : ''}
                
                <button class="tab-btn ${activeTab === 'active' ? 'active' : ''}" onclick="switchTab('active')">
                    Active Projects (${active.length})
                </button>
                <button class="tab-btn ${activeTab === 'history' ? 'active' : ''}" onclick="switchTab('history')">
                    History (${history.length})
                </button>
            </div>
        `;

        let displayProjects = [];
        if (activeTab === 'pending' && isFaculty) displayProjects = pending;
        else if (activeTab === 'active') displayProjects = active;
        else if (activeTab === 'history') displayProjects = history;
        // Default fallbacks
        else if (!isFaculty && activeTab === 'pending') { activeTab = 'active'; displayProjects = active; }

        contentHtml += generateProjectTable(displayProjects, isFaculty);

    } else {
        // Admin View
        contentHtml += `
            <div class="projects-header">
                <h2>Projects</h2>
            </div>
            ${generateProjectTable(projects, false)}
        `;
    }

    container.innerHTML = contentHtml;
}

function switchTab(tab) {
    activeTab = tab;
    renderProjects();
}

function generateProjectTable(projects, isFaculty) {
    if (projects.length === 0) {
        return '<div class="table-container" style="text-align:center; padding: 2rem;">No projects found in this category</div>';
    }

    return `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Domain</th>
                        <th>Student</th>
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
                            <td><span class="status-badge status-${p.stage}">${p.stage}</span></td>
                            <td><span class="status-badge ${p.status === 'SUBMITTED' ? 'status-SUBMISSION' : ''}">${p.status}</span></td>
                            <td>
                                <button class="btn-sm" onclick="viewProjectDetails(${p.id})">View Details</button>
                                
                                ${user.role === 'STUDENT' && p.stage !== 'COMPLETED' ? `
                                    <button class="btn-sm" onclick="openUploadModal(${p.id})">Upload</button>
                                    ${!p.faculty ? `<button class="btn-sm" onclick="openRequestFacultyModal(${p.id})">Request Faculty</button>` : ''}
                                    ${p.faculty && p.isFacultyAccepted && p.status !== 'SUBMITTED' ? `<button class="btn-sm" style="background: var(--accent); color: white;" onclick="submitForReview(${p.id})">Submit for Review</button>` : ''}
                                ` : ''}

                                ${user.role === 'ADMIN' && !p.faculty ? `<button class="btn-sm" onclick="assignFaculty(${p.id})">Assign Faculty</button>` : ''}

                                ${isFaculty && activeTab === 'pending' ? `
                                    <button class="btn-sm" style="background: var(--success); color: white;" onclick="acceptFaculty(${p.id})">Accept</button>
                                    <button class="btn-sm" style="background: var(--danger); color: white;" onclick="rejectFacultyRequest(${p.id})">Reject</button>
                                ` : ''}

                                ${isFaculty && activeTab === 'active' && p.status === 'SUBMITTED' ? `
                                    <button class="btn-sm" onclick="viewProjectDetails(${p.id})">Review</button>
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

    // Fetch user-specific projects for accurate local stats
    let stats = {};

    if (user.role === 'ADMIN') {
        const res = await fetch(`${API_BASE}/analytics`, { headers: authHeader() });
        stats = await res.json();
    } else {
        const res = await fetch(`${API_BASE}/projects`, { headers: authHeader() });
        const projects = await res.json();

        stats.totalProjects = projects.length;
        stats.completedProjects = projects.filter(p => p.stage === 'COMPLETED').length;
        stats.activeProjects = stats.totalProjects - stats.completedProjects;

        if (user.role === 'FACULTY') {
            stats.pendingRequests = projects.filter(p => !p.isFacultyAccepted).length;
        }

        // Calculate distribution for charts locally if not admin (or rely on backend if endpoint supports it)
        stats.projectsByStage = {};
        const stages = ['IDEA', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'SUBMISSION', 'COMPLETED'];
        stages.forEach(stage => {
            stats.projectsByStage[stage] = projects.filter(p => p.stage === stage).length;
        });

        // Domain calc for local
        stats.projectsByDomain = {};
        projects.forEach(p => {
            const d = p.domain || 'Unknown';
            stats.projectsByDomain[d] = (stats.projectsByDomain[d] || 0) + 1;
        });
    }

    let extraCard = '';
    if (user.role === 'FACULTY') {
        extraCard = `
            <div class="stat-card">
                <h3>Pending Requests</h3>
                <div class="value" style="color: var(--warning)">${stats.pendingRequests || 0}</div>
            </div>
        `;
    }

    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem">Analytics Dashboard (${user.role === 'ADMIN' ? 'Global' : 'Personal'})</h2>
        <div class="grid-cols-3" style="margin-bottom: 2rem;">
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
            ${extraCard}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div class="stat-card">
                <h3 style="margin-bottom: 1rem;">Project Status Distribution</h3>
                <canvas id="stageChart"></canvas>
            </div>
            <div class="stat-card">
                <h3 style="margin-bottom: 1rem;">Domain Distribution</h3>
                <canvas id="domainChart"></canvas>
            </div>
        </div>
    `;

    renderCharts(stats);
}

function renderCharts(stats) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // Stage Chart (Bar)
    const stageCtx = document.getElementById('stageChart').getContext('2d');
    const stages = Object.keys(stats.projectsByStage);
    const stageData = Object.values(stats.projectsByStage);

    new Chart(stageCtx, {
        type: 'bar',
        data: {
            labels: stages,
            datasets: [{
                label: 'Projects',
                data: stageData,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Domain Chart (Pie)
    const domainCtx = document.getElementById('domainChart').getContext('2d');
    const domains = Object.keys(stats.projectsByDomain || {});
    const domainData = Object.values(stats.projectsByDomain || {});

    new Chart(domainCtx, {
        type: 'doughnut',
        data: {
            labels: domains,
            datasets: [{
                data: domainData,
                backgroundColor: [
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(139, 92, 246, 0.6)'
                ],
                borderColor: isDark ? '#1e293b' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor }
                }
            }
        }
    });
}

function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    // Reject promises if cancelled via close button
    if (id === 'confirmModal' && confirmResolve) {
        confirmResolve(false);
        confirmResolve = null;
    }
    if (id === 'inputModal' && inputResolve) {
        inputResolve(null);
        inputResolve = null;
    }
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
        showErrorModal('Error', 'Failed to create project');
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
        showSuccessModal('Success', 'File Uploaded!');
    } else {
        showErrorModal('Error', 'Upload failed');
    }
}

async function approveStage(id) {
    const remarks = await showInputModal('Approve Stage', "Enter remarks for approval:");
    if (!remarks) return;

    await fetch(`${API_BASE}/projects/${id}/approve`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ remarks })
    });
    renderProjects();
}

async function rejectStage(id) {
    const remarks = await showInputModal('Reject Stage', "Enter reason for rejection:");
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
        <div style="padding: 0.5rem; border-bottom: 1px solid #333; cursor: pointer; ${n.isRead ? '' : 'background: rgba(59,130,246,0.1)'}" onclick="openNotificationModal('${n.message.replace(/'/g, "\\'")}', '${n.created_at}', ${n.id})">
            <div style="font-size: 0.875rem;">${shortMsg}</div>
            <small style="color:#aaa">${new Date(n.createdAt).toLocaleDateString()}</small>
        </div>
     `;
    }).join('');
}

function openNotificationModal(msg, date, id) {
    document.getElementById('notificationDetail').textContent = msg;
    openModal('notificationModal');
    if (id) markRead(id);
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
    const approvals = await fetch(`${API_BASE}/projects/${id}/approvals`, { headers: authHeader() }).then(res => res.json());

    const container = document.getElementById('viewContainer');
    container.innerHTML = `
        <div>
            <button class="btn-sm" onclick="renderProjects()" style="margin-bottom: 1rem;">← Back to Projects</button>
            <h2 style="margin-bottom: 1rem;">${p.title}</h2>
            <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div><strong>Domain:</strong> ${p.domain}</div>
                    <div><strong>Stage:</strong> <span class="status-badge status-${p.stage}">${p.stage}</span></div>
                    <div><strong>Deadline:</strong> ${p.stageDeadline ? new Date(p.stageDeadline).toDateString() : 'N/A'}</div>
                    <div><strong>Status:</strong> ${p.status}</div>
                    <div><strong>Student:</strong> ${p.student.fullName}</div>
                    <div><strong>Faculty:</strong> ${p.faculty ? p.faculty.fullName : 'Not Assigned'}</div>
                </div>
                <div style="margin-top: 1rem;"><strong>Description:</strong><br>${p.description}</div>
            </div>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Documents</h3>
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
                                <td><a href="#" onclick="downloadDocument(${d.id}, '${d.filename}'); return false;" style="color: var(--accent); text-decoration: underline;">${d.filename}</a></td>
                                <td>v${d.version}</td>
                                <td>${new Date(d.uploadedAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; margin-bottom: 1rem;">
                <h3>Team Members</h3>
                ${user.id === p.student.id ? `<button class="btn-sm" onclick="openInviteMemberModal(${p.id})">+ Invite Member</button>` : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${p.student.fullName} <span class="status-badge" style="background: var(--accent); color: white;">Lead</span></td>
                            <td>${p.student.role}</td>
                            <td>${p.student.email}</td>
                        </tr>
                        ${p.teamMembers ? p.teamMembers.map(m => `
                            <tr>
                                <td>${m.fullName}</td>
                                <td>${m.role}</td>
                                <td>${m.email}</td>
                            </tr>
                        `).join('') : ''}
                    </tbody>
                </table>
            </div>

            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Stage History & Remarks</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Stage</th>
                            <th>Status</th>
                            <th>Approver</th>
                            <th>Remarks</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${approvals.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No history available</td></tr>' : approvals.map(a => `
                            <tr>
                                <td><span class="status-badge status-${a.stage}">${a.stage}</span></td>
                                <td><span class="status-badge" style="background: ${a.status === 'REJECTED' ? 'var(--danger)' : 'var(--success)'}; color: white;">${a.status}</span></td>
                                <td>${a.approver.fullName}</td>
                                <td>${a.remarks || '-'}</td>
                                <td>${new Date(a.timestamp).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>


            <div style="margin-top: 2rem;">
                <h3>Project Chat</h3>
                <div id="chatContainer" style="background: var(--bg-card); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); max-height: 400px; overflow-y: auto; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    Loading chat...
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text);">
                    <button class="btn-primary" style="width: auto;" onclick="postComment(${p.id})">Send</button>
                </div>
            </div>

            <div style="margin-top: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${user.role === 'STUDENT' && p.stage !== 'COMPLETED' ? `
                    <button class="btn-sm" onclick="openUploadModal(${p.id})">Upload Document</button>
                    ${!p.faculty ? `<button class="btn-sm" onclick="openRequestFacultyModal(${p.id})">Request Faculty</button>` : ''}
                    ${p.faculty && !p.isFacultyAccepted ? `<span style="color: var(--warning);">Waiting for faculty acceptance</span>` : ''}
                    ${p.faculty && p.isFacultyAccepted && p.status !== 'SUBMITTED' ? `<button class="btn-primary" style="width: auto;" onclick="submitForReview(${p.id})">Submit for Review</button>` : ''}
                ` : ''}
                
                ${user.role === 'FACULTY' && p.status === 'SUBMITTED' && p.faculty && p.faculty.id === user.id ? `
                    ${p.stage === 'SUBMISSION' ? `
                        <button class="btn-primary" style="width: auto;" onclick="openRatingModal(${p.id})">Approve & Rate Project</button>
                    ` : `
                        <button class="btn-sm" onclick="approveStage(${p.id})">Approve Stage</button>
                    `}
                    <button class="btn-sm" onclick="rejectStage(${p.id})">Reject Stage</button>
                ` : ''}
                
                ${user.role === 'FACULTY' && p.faculty && p.faculty.id === user.id && !p.isFacultyAccepted ? `
                    <button class="btn-primary" style="width: auto; background: var(--success);" onclick="acceptFaculty(${p.id})">Accept Invitation</button>
                ` : ''}
            </div>

            ${p.stage === 'COMPLETED' ? `
                <div style="margin-top: 1.5rem; background: rgba(52, 211, 153, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid var(--success);">
                    <h3 style="color: var(--success); margin-bottom: 0.5rem;">Final Rating</h3>
                    <div id="ratingDisplay">Loading rating...</div>
                </div>
            ` : ''}
        </div>
    `;

    loadComments(p.id);

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
    const scoreVal = await showInputModal('Rate Project', 'Enter Rating (1-5):');
    if (!scoreVal) return;

    const score = parseInt(scoreVal);
    if (isNaN(score) || score < 1 || score > 5) {
        showErrorModal('Invalid Input', 'Please enter a valid rating between 1 and 5');
        return;
    }
    const feedback = await showInputModal('Feedback', 'Enter Final Remarks/Feedback:');
    if (!feedback) return;

    const res = await fetch(`${API_BASE}/projects/${projectId}/rate`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: score, feedback })
    });

    if (res.ok) {
        showSuccessModal('Success', 'Project approved and rated successfully!');
        renderProjects();
    } else {
        showErrorModal('Error', 'Failed to rate project');
    }
}

// Faculty Request Logic
async function openRequestFacultyModal(projectId) {
    document.getElementById('requestProjectId').value = projectId;
    const select = document.getElementById('facultySelect');
    select.innerHTML = '<option>Loading...</option>';
    openModal('requestFacultyModal');

    const res = await fetch(`${API_BASE}/auth/users/faculty`, { headers: authHeader() });
    const faculty = await res.json();

    select.innerHTML = faculty.map(f => `<option value="${f.id}">${f.fullName} (${f.department || 'General'})</option>`).join('');
}

function showSuccessModal(title, message) {
    document.getElementById('successTitle').textContent = title || 'Success!';
    document.getElementById('successMessage').textContent = message;
    openModal('successModal');
}

async function sendFacultyRequest(e) {
    e.preventDefault();
    const projectId = document.getElementById('requestProjectId').value;
    const facultyId = document.getElementById('facultySelect').value;

    const res = await fetch(`${API_BASE}/projects/${projectId}/request-faculty/${facultyId}`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        closeModal('requestFacultyModal');
        showSuccessModal('Request Sent', 'Request sent successfully!');
        renderProjects();
    } else {
        showErrorModal('Error', 'Failed to send request');
    }
}

async function acceptFaculty(id) {
    if (!await showConfirmModal('Accept Project', "Accept this project?")) return;

    const res = await fetch(`${API_BASE}/projects/${id}/accept-faculty`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        showSuccessModal('Success', 'Project Accepted!');
        renderProjects();
    } else {
        const msg = await res.text();
        showErrorModal('Error', msg);
    }
}

let submitProjectId = null;

function submitForReview(id) {
    submitProjectId = id;
    openModal('submitProjectModal');
}

async function confirmSubmission() {
    if (!submitProjectId) return;

    const res = await fetch(`${API_BASE}/projects/${submitProjectId}/submit`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        closeModal('submitProjectModal');
        showSuccessModal('Success', 'Project submitted for review!');
        renderProjects();
    } else {
        const msg = await res.text();
        showErrorModal('Error', 'Failed to submit: ' + msg);
        closeModal('submitProjectModal');
    }
}

// File Input Styling
function updateFileName(input) {
    const label = document.getElementById('fileUploadLabel');
    if (input.files && input.files.length > 0) {
        label.innerHTML = `<ion-icon name="document-text-outline" style="color:var(--success)"></ion-icon><span>${input.files[0].name}</span>`;
        input.parentElement.style.borderColor = 'var(--success)';
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
    const selection = await showInputModal('Assign Faculty', `Select faculty by number:\n${facultyList}`);

    if (!selection) return;

    const index = parseInt(selection) - 1;
    if (index < 0 || index >= faculty.length) {
        showErrorModal('Invalid Selection', 'Invalid faculty number selected');
        return;
    }

    const selectedFaculty = faculty[index];

    // Assign faculty to project
    const assignRes = await fetch(`${API_BASE}/projects/${projectId}/assign-faculty/${selectedFaculty.id}`, {
        method: 'POST',
        headers: authHeader()
    });

    if (assignRes.ok) {
        showSuccessModal('Success', 'Faculty assigned successfully');
        renderProjects();
    } else {
        showErrorModal('Error', 'Failed to assign faculty');
    }
}

async function rejectFacultyRequest(id) {
    if (!await showConfirmModal('Reject Request', "Reject this project request?")) return;

    const res = await fetch(`${API_BASE}/projects/${id}/reject-faculty`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        showSuccessModal('Request Rejected', 'The project request has been rejected.');
        renderProjects();
    } else {
        const msg = await res.text();
        showErrorModal('Error', msg);
    }
}

async function downloadDocument(id, filename) {
    try {
        const res = await fetch(`${API_BASE}/projects/documents/${id}/download`, {
            headers: authHeader()
        });

        if (!res.ok) throw new Error('Download failed');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (err) {
        showErrorModal('Download Error', 'Failed to download document');
    }
}

async function openInviteMemberModal(projectId) {
    const key = await showInputModal('Invite Team Member', "Enter Student Username or Email:");
    if (!key) return;

    const res = await fetch(`${API_BASE}/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: key })
    });

    if (res.ok) {
        showSuccessModal('Success', 'Invitation sent successfully!');
    } else {
        const msg = await res.text();
        showErrorModal('Error', msg);
    }
}

async function acceptInvitation(id) {
    const res = await fetch(`${API_BASE}/projects/invitations/${id}/accept`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        showSuccessModal('Joined', 'You have joined the team!');
        renderDashboard();
    } else {
        showErrorModal('Error', 'Failed to accept invitation');
    }
}

async function rejectInvitation(id) {
    if (!await showConfirmModal('Reject', "Reject this invitation?")) return;

    const res = await fetch(`${API_BASE}/projects/invitations/${id}/reject`, {
        method: 'POST',
        headers: authHeader()
    });

    if (res.ok) {
        renderDashboard();
    } else {
        showErrorModal('Error', 'Failed to reject invitation');
    }
}

async function exportProjects() {
    const res = await fetch(`${API_BASE}/export/projects`, {
        headers: authHeader()
    });
    if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `projects_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } else {
        showErrorModal('Error', 'Failed to export projects');
    }
}

async function loadComments(projectId) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/comments`, { headers: authHeader() });
    if (!res.ok) return;
    const comments = await res.json();
    const container = document.getElementById('chatContainer');
    if (comments.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 1rem;">No messages yet.</div>';
        return;
    }
    container.innerHTML = comments.map(c => `
        <div style="padding: 0.8rem; border-radius: 8px; background: ${c.user.id === user.id ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}; align-self: ${c.user.id === user.id ? 'flex-end' : 'flex-start'}; max-width: 80%; color: ${c.user.id === user.id ? 'white' : 'var(--text)'};">
            <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.2rem; opacity: 0.8;">${c.user.fullName}</div>
            <div>${c.content}</div>
            <div style="font-size: 0.65rem; text-align: right; margin-top: 0.2rem; opacity: 0.6;">${new Date(c.createdAt).toLocaleTimeString()}</div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

async function postComment(projectId) {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content) return;

    const res = await fetch(`${API_BASE}/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    if (res.ok) {
        input.value = '';
        loadComments(projectId);
    } else {
        showErrorModal('Error', 'Failed to post comment');
    }
}

// Modal State
let confirmResolve = null;
let inputResolve = null;

function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        document.getElementById('confirmTitle').innerText = title;
        document.getElementById('confirmMessage').innerText = message;
        confirmResolve = resolve;
        openModal('confirmModal');
    });
}

function showInputModal(title, message) {
    return new Promise((resolve) => {
        document.getElementById('inputTitle').innerText = title;
        document.getElementById('inputMessage').innerText = message;
        document.getElementById('inputField').value = '';
        inputResolve = resolve;
        openModal('inputModal');
    });
}

function showErrorModal(title, message) {
    document.getElementById('errorTitle').innerText = title || 'Error';
    document.getElementById('errorMessage').innerText = message;
    openModal('errorModal');
}

// Make functions global for HTML onclick attributes
window.renderDashboard = renderDashboard;
window.switchTab = switchTab;
window.rejectFacultyRequest = rejectFacultyRequest;
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
window.openRequestFacultyModal = openRequestFacultyModal;
window.acceptFaculty = acceptFaculty;
window.confirmSubmission = confirmSubmission;
window.updateFileName = updateFileName;
window.openNotificationModal = openNotificationModal;
window.openRatingModal = openRatingModal;
window.downloadDocument = downloadDocument;

window.showSuccessModal = showSuccessModal;
window.showErrorModal = showErrorModal;
window.showConfirmModal = showConfirmModal;
window.showConfirmModal = showConfirmModal;
window.showInputModal = showInputModal;
window.toggleTheme = toggleTheme;
window.renderCharts = renderCharts;
window.openInviteMemberModal = openInviteMemberModal;
window.acceptInvitation = acceptInvitation;
window.rejectInvitation = rejectInvitation;
window.exportProjects = exportProjects;
window.postComment = postComment;
window.loadComments = loadComments;
