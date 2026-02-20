const API_BASE = window.location.origin + '/api';
const user = JSON.parse(localStorage.getItem('user'));

if (!user || !user.token) {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function authHeader() {
    if (user && user.token) {
        return { 'Authorization': 'Bearer ' + user.token, 'Content-Type': 'application/json' };
    }
    console.warn('authHeader: No user or token found');
    return { 'Content-Type': 'application/json' };
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Initial Setup
const navUser = document.getElementById('navUser');
const navRole = document.getElementById('navRole');
const navAvatar = document.getElementById('navAvatar');

const getUserRole = () => user.role.replace('ROLE_', '');

if (navUser) navUser.textContent = user.fullName;
if (navRole) navRole.textContent = getUserRole();
if (navAvatar) navAvatar.textContent = user.fullName.charAt(0).toUpperCase();

if (getUserRole() === 'ADMIN') {
    const adminNav = document.getElementById('adminSetupNav');
    if (adminNav) adminNav.style.display = 'flex';
}

// Global search state
// Global search state
let allProjects = [];
let stageChartInstance = null;
let domainChartInstance = null;
let facultyChartInstance = null;

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

    const projDomain = document.getElementById('projDomain');
    if (projDomain) {
        projDomain.addEventListener('change', (e) => applyTemplate(e.target.value));
    }

    const uploadDocForm = document.getElementById('uploadDocForm');
    if (uploadDocForm) {
        uploadDocForm.addEventListener('submit', uploadDocument);
    }

    const requestFacultyForm = document.getElementById('requestFacultyForm');
    if (requestFacultyForm) {
        requestFacultyForm.addEventListener('submit', sendFacultyRequest);
    }

    // New: Create Faculty Form
    const createFacultyForm = document.getElementById('createFacultyForm');
    if (createFacultyForm) {
        createFacultyForm.addEventListener('submit', createFaculty);
    }

    // Assign Faculty listeners
    const assignFacultyForm = document.getElementById('assignFacultyForm');
    if (assignFacultyForm) {
        assignFacultyForm.addEventListener('submit', confirmAssignFaculty);
    }

    // Invite Member listener
    const inviteMemberForm = document.getElementById('inviteMemberForm');
    if (inviteMemberForm) {
        inviteMemberForm.addEventListener('submit', sendInvitation);
    }

    // Search input listener
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }

    const rateProjectForm = document.getElementById('rateProjectForm');
    if (rateProjectForm) {
        rateProjectForm.addEventListener('submit', submitRating);
    }
});

// Redundant authHeader removed

// Navigation Logic
function updateSidebarNav(targetView) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === targetView) {
            item.classList.add('active');
        }
    });
}

async function renderDashboard() {
    updateSidebarNav('dashboard-view');
    const container = document.getElementById('viewContainer');
    try {
        const res = await fetch(`${API_BASE}/analytics`, { headers: authHeader() });
        const stats = await res.json();

        const projRes = await fetch(`${API_BASE}/projects`, { headers: authHeader() });
        const projects = await projRes.ok ? await projRes.json() : [];

        // Fetch pending invitations (for students)
        let invHtml = '';
        console.log('--- renderDashboard: Checking Role ---');
        console.log('Raw user.role:', user ? user.role : 'NULL');
        console.log('getUserRole():', getUserRole());

        if (getUserRole() === 'STUDENT') {
            console.log('Fetching pending invitations...');
            const invRes = await fetch(`${API_BASE}/invitations/pending`, { headers: authHeader() });
            console.log('invRes Status:', invRes.status);

            if (invRes.ok) {
                const invitations = await invRes.json();
                console.log('Pending invitations found:', invitations.length);
                console.log('Invitation data:', invitations);

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



        const exportBtn = (getUserRole() === 'ADMIN' || getUserRole() === 'FACULTY')
            ? `<button class="btn-sm" onclick="exportProjects()" style="margin-top: 2rem; background: var(--secondary); color: white;">Download Project Report (CSV)</button>`
            : '';

        // Upcoming Deadlines
        let deadlineHtml = '';
        const deadlines = projects.filter(p => p.stageDeadline && p.stage !== 'COMPLETED')
            .sort((a, b) => new Date(a.stageDeadline) - new Date(b.stageDeadline))
            .slice(0, 3);

        if (deadlines.length > 0) {
            deadlineHtml = `
                <div class="stat-card" style="margin-bottom: 2rem; border-left: 4px solid var(--danger);">
                    <h3 style="color: var(--danger);">Upcoming Deadlines</h3>
                    <div style="margin-top: 1rem;">
                        ${deadlines.map(d => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <span>${d.title} (${d.stage})</span>
                                <span style="font-weight: bold;">${new Date(d.stageDeadline).toLocaleDateString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Welcome, ${user.fullName}</h2>
                <div style="font-size: 0.9rem; color: var(--text-secondary)">${new Date().toDateString()}</div>
            </div>
            ${invHtml}
            ${deadlineHtml}
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
    } catch (err) {
        console.error('--- renderDashboard Error ---', err);
        container.innerHTML = `<h2>Dashboard</h2><p style="color:var(--danger)">Failed to load data. Please try again.</p>`;
    }
}

async function acceptInvitation(id) {
    try {
        const res = await fetch(`${API_BASE}/invitations/${id}/accept`, { method: 'POST', headers: authHeader() });
        if (res.ok) {
            renderDashboard();
            showSuccessModal('Joined', 'You have joined the project!');
        } else {
            showErrorModal('Error', 'Failed to join');
        }
    } catch (e) { console.error(e); }
}

async function rejectInvitation(id) {
    try {
        const res = await fetch(`${API_BASE}/invitations/${id}/reject`, { method: 'POST', headers: authHeader() });
        if (res.ok) renderDashboard();
    } catch (e) { console.error(e); }
}

function openInviteModal(pid) {
    console.log('--- openInviteModal triggered ---');
    console.log('Project ID:', pid);
    const input = document.getElementById('inviteProjectId');
    if (!input) {
        console.error('CRITICAL: inviteProjectId input not found in DOM!');
        return;
    }
    input.value = pid;
    console.log('Set inviteProjectId value to:', input.value);

    const modal = document.getElementById('inviteMemberModal');
    if (!modal) {
        console.error('CRITICAL: inviteMemberModal not found in DOM!');
        return;
    }
    openModal('inviteMemberModal');
    console.log('Called openModal for inviteMemberModal');
}

async function sendInvitation(e) {
    e.preventDefault();
    console.log('--- sendInvitation triggered ---');
    const pid = document.getElementById('inviteProjectId').value;
    const email = document.getElementById('inviteEmail').value;
    console.log('Payload:', { pid, email });

    if (!pid || !email) {
        console.error('Missing project ID or email');
        return;
    }

    try {
        console.log('Sending invitation request...');
        const res = await fetch(`${API_BASE}/projects/${pid}/invite`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ username: email })
        });

        console.log('Response Status:', res.status);
        if (res.ok) {
            console.log('Invitation sent successfully!');
            closeModal('inviteMemberModal');
            showSuccessModal('Invited', 'Invitation sent successfully!');
        } else {
            const data = await res.json();
            console.error('Invitation failed:', data);
            showErrorModal('Error', data.message || 'Failed to send invite');
        }
    } catch (err) {
        console.error('Network or Runtime error in sendInvitation:', err);
        showErrorModal('Error', 'Failed to send invitation');
    }
}

let activeTab = 'active';

async function renderProjects() {
    updateSidebarNav('projects-view');
    const container = document.getElementById('viewContainer');
    try {
        const res = await fetch(`${API_BASE}/projects`, { headers: authHeader() });
        allProjects = await res.json();
        displayFilteredProjects(allProjects);
    } catch (err) {
        console.error('Render Projects Error:', err);
        container.innerHTML = `<p style="color:var(--danger)">Failed to load projects. Check console for details.</p>`;
    }
}

function displayFilteredProjects(projects) {
    const container = document.getElementById('viewContainer');
    const isFaculty = getUserRole() === 'FACULTY';
    const isStudent = getUserRole() === 'STUDENT';
    const isAdmin = getUserRole() === 'ADMIN';

    let pending = [], active = [], history = [];

    if (isFaculty) {
        pending = projects.filter(p => !p.isFacultyAccepted);
        active = projects.filter(p => p.isFacultyAccepted && p.stage !== 'COMPLETED');
        history = projects.filter(p => p.stage === 'COMPLETED');
    } else if (isStudent) {
        pending = []; // No pending tab for students in old structure
        active = projects.filter(p => p.stage !== 'COMPLETED');
        history = projects.filter(p => p.stage === 'COMPLETED');
    } else {
        active = projects;
    }

    let contentHtml = `
        <div class="projects-header">
            <h2>${isAdmin ? 'System Projects' : (isFaculty ? 'Faculty Projects' : 'My Projects')}</h2>
            ${isStudent ? `<button class="btn-primary" style="width: auto" onclick="openModal('projectModal')">+ New Project</button>` : ''}
        </div>
    `;

    if (isFaculty || isStudent) {
        contentHtml += `
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
                ${isFaculty ? `
                <button class="tab-btn ${activeTab === 'pending' ? 'active' : ''}" onclick="switchTab('pending')">
                    Requests (${pending.length})
                </button>` : ''}
                <button class="tab-btn ${activeTab === 'active' ? 'active' : ''}" onclick="switchTab('active')">
                    Active (${active.length})
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
        else if (isStudent && activeTab === 'pending') { activeTab = 'active'; displayProjects = active; }

        contentHtml += generateProjectTable(displayProjects, isFaculty);
    } else {
        contentHtml += generateProjectTable(projects, false);
    }

    container.innerHTML = contentHtml;
}

function switchTab(tab) {
    activeTab = tab;
    displayFilteredProjects(allProjects);
}

function handleSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        displayFilteredProjects(allProjects);
        return;
    }
    const filtered = allProjects.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.student.fullName.toLowerCase().includes(q) ||
        (p.faculty && p.faculty.fullName.toLowerCase().includes(q))
    );
    displayFilteredProjects(filtered);
}

function generateProjectTable(projects, isFacultyOption) {
    const isStudent = getUserRole() === 'STUDENT';
    const isAdmin = getUserRole() === 'ADMIN';
    // Use the passed argument if strictly needed, or fallback to role check. 
    // The argument 'isFaculty' seemed to be used to toggle 'Accept/Reject' buttons which only appear in Pending tab.
    // Let's keep the argument name but use a local variable for clarity if needed, or just rely on the argument.
    // The original code used 'isFaculty' argument.
    const isFaculty = isFacultyOption;
    if (projects.length === 0) {
        return '<div class="table-container" style="text-align:center; padding: 2rem;">No projects found</div>';
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
                                <button class="btn-sm" onclick="viewProjectDetails(${p.id})">View</button>
                                ${isStudent && p.stage !== 'COMPLETED' ? `
                                    <button class="btn-sm" onclick="openUploadModal(${p.id})">Upload</button>
                                    ${!p.faculty ? `<button class="btn-sm" onclick="openRequestFacultyModal(${p.id})">Request</button>` : ''}
                                    ${p.faculty && p.isFacultyAccepted && p.status !== 'SUBMITTED' ? `<button class="btn-sm" style="background: var(--accent); color: white;" onclick="submitForReview(${p.id})">Submit</button>` : ''}
                                ` : ''}
                                ${isFaculty && activeTab === 'pending' ? `
                                    <button class="btn-sm" style="background: var(--success); color: white;" onclick="acceptFaculty(${p.id})">Accept</button>
                                    <button class="btn-sm" style="background: var(--danger); color: white;" onclick="rejectFacultyRequest(${p.id})">Reject</button>
                                ` : ''}
                                ${isAdmin ? `<button class="btn-sm" style="background: var(--warning); color: black;" onclick="openDeadlineModal(${p.id})">Deadline</button>` : ''}
                                ${isAdmin ? `<button class="btn-sm" style="background: var(--danger); color: white; margin-left: 0.5rem;" onclick="deleteProject(${p.id})">Delete</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function renderAnalytics() {
    updateSidebarNav('analytics-view');
    const container = document.getElementById('viewContainer');
    try {
        const res = await fetch(`${API_BASE}/analytics`, { headers: authHeader() });
        const stats = await res.json();

        container.innerHTML = `
            <div class="analytics-header" style="margin-bottom: 2rem;">
                <h2>Analytics Dashboard</h2>
                <p style="color: var(--text-secondary)">Visual overview of project lifecycle status</p>
            </div>

            <div class="grid-cols-4" style="margin-bottom: 2rem;">
                <div class="stat-card"><h3>Total</h3><div class="value">${stats.totalProjects}</div></div>
                <div class="stat-card"><h3>Active</h3><div class="value" style="color: var(--accent)">${stats.activeProjects}</div></div>
                <div class="stat-card"><h3>Done</h3><div class="value" style="color: var(--success)">${stats.completedProjects}</div></div>
                ${getUserRole() === 'ADMIN' ? `<div class="stat-card"><h3>Users</h3><div class="value" style="color: var(--warning)">${stats.totalUsers || 0}</div></div>` : ''}
            </div>
            
            <div class="analytics-chart-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div class="stat-card" style="padding: 1.5rem; min-height: 300px;">
                    <h4 style="margin-bottom: 1rem; text-align: center;">Project Stages</h4>
                    <div style="position: relative; height: 250px; width: 100%;">
                        <canvas id="stageChart"></canvas>
                    </div>
                </div>
                <div class="stat-card" style="padding: 1.5rem; min-height: 300px;">
                    <h4 style="margin-bottom: 1rem; text-align: center;">By Domain</h4>
                    <div style="position: relative; height: 250px; width: 100%;">
                        <canvas id="domainChart"></canvas>
                    </div>
                </div>
                ${getUserRole() === 'ADMIN' ? `
                    <div class="stat-card" style="grid-column: span 2; padding: 1.5rem; min-height: 300px;">
                        <h4 style="margin-bottom: 1rem; text-align: center;">Faculty Load</h4>
                        <div style="position: relative; height: 250px; width: 100%;">
                            <canvas id="facultyLoadChart"></canvas>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        renderCharts(stats);
    } catch (err) {
        container.innerHTML = `<p>Error loading analytics data.</p>`;
    }
}

function renderCharts(stats) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Stage Chart
    const stageCtx = document.getElementById('stageChart');
    if (stageCtx) {
        if (stageChartInstance) stageChartInstance.destroy();
        stageChartInstance = new Chart(stageCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(stats.projectsByStage || {}),
                datasets: [{
                    label: 'Projects',
                    data: Object.values(stats.projectsByStage || {}),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Domain Chart
    const domainCtx = document.getElementById('domainChart');
    if (domainCtx) {
        if (domainChartInstance) domainChartInstance.destroy();
        domainChartInstance = new Chart(domainCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(stats.projectsByDomain || {}),
                datasets: [{
                    data: Object.values(stats.projectsByDomain || {}),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 15 } } },
                cutout: '65%'
            }
        });
    }

    // Faculty Load Chart (Horizontal)
    const facultyCtx = document.getElementById('facultyLoadChart');
    if (facultyCtx && stats.facultyLoad) {
        if (facultyChartInstance) facultyChartInstance.destroy();
        facultyChartInstance = new Chart(facultyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(stats.facultyLoad),
                datasets: [{
                    label: 'Active Projects',
                    data: Object.values(stats.facultyLoad),
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: gridColor } },
                    y: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

async function renderAdminSetup() {
    updateSidebarNav('admin-view');
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2>Admin Setup & Management</h2>
            <button class="btn-primary" style="width: auto" onclick="openModal('createFacultyModal')">Create New Faculty</button>
        </div>

        <section class="stat-card" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border);">
                <h3 style="margin: 0;">Faculty Accounts</h3>
            </div>
            <div id="facultyTableContainer" class="table-container">
                <p style="padding: 2rem; text-align: center;">Loading faculty list...</p>
            </div>
        </section>
    `;

    try {
        const res = await fetch(`${API_BASE}/admin/faculty`, { headers: authHeader() });
        const faculty = await res.json();

        const tableContainer = document.getElementById('facultyTableContainer');
        if (faculty.length === 0) {
            tableContainer.innerHTML = '<p style="padding: 2rem; text-align: center;">No faculty accounts found.</p>';
        } else {
            tableContainer.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Capacity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${faculty.map(f => `
                            <tr>
                                <td><strong>${f.fullName}</strong></td>
                                <td>${f.email}</td>
                                <td>${f.department || 'N/A'}</td>
                                <td>${f.maxProjects}</td>
                                <td>
                                    <button class="btn-sm" onclick="openCapacityModal(${f.id}, ${f.maxProjects})">Edit Limit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (err) {
        document.getElementById('facultyTableContainer').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--danger)">Failed to load faculty list.</p>';
    }
}

function openCapacityModal(fid, current) {
    document.getElementById('updateCapacityFacId').value = fid;
    document.getElementById('newCapacityInput').value = current;
    openModal('updateCapacityModal');
}

// Add event listener for capacity form
document.addEventListener('DOMContentLoaded', () => {
    const capForm = document.getElementById('updateCapacityForm');
    if (capForm) {
        capForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fid = document.getElementById('updateCapacityFacId').value;
            const cap = document.getElementById('newCapacityInput').value;
            try {
                const res = await fetch(`${API_BASE}/admin/faculty/${fid}/capacity`, {
                    method: 'POST',
                    headers: authHeader(),
                    body: JSON.stringify({ capacity: parseInt(cap) })
                });
                if (res.ok) {
                    closeModal('updateCapacityModal');
                    showSuccessModal('Updated', 'Faculty limit updated!');
                    renderAdminSetup();
                }
            } catch (err) { alert('Failed to update capacity'); }
        });
    }
});

async function createFaculty(e) {
    e.preventDefault();
    const fullName = document.getElementById('facFullName').value;
    const email = document.getElementById('facEmail').value;
    const password = document.getElementById('facPassword').value;
    const department = document.getElementById('facDept').value;
    const specialization = document.getElementById('facSpec').value;
    const maxProjects = document.getElementById('facCapacity').value;

    try {
        const res = await fetch(`${API_BASE}/admin/create-faculty`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ fullName, email, password, department, specialization, maxProjects })
        });

        if (res.ok) {
            closeModal('createFacultyModal');
            showSuccessModal('Success', 'Faculty account created!');
            renderAdminSetup();
        } else {
            const data = await res.json();
            showErrorModal('Error', data.message || 'Failed to create faculty');
        }
    } catch (err) {
        showErrorModal('Error', 'Server error');
    }
}

async function viewProjectDetails(id) {
    const container = document.getElementById('viewContainer');
    try {
        const [p, docs] = await Promise.all([
            fetch(`${API_BASE}/projects/${id}`, { headers: authHeader() }).then(res => res.json()),
            fetch(`${API_BASE}/projects/${id}/documents`, { headers: authHeader() }).then(res => res.json())
        ]);

        let ratingHtml = '';
        if (p.stage === 'COMPLETED') {
            try {
                const rRes = await fetch(`${API_BASE}/projects/${id}/rating`, { headers: authHeader() });
                if (rRes.ok) {
                    const r = await rRes.json();
                    ratingHtml = `
                        <div class="stat-card" style="margin-bottom: 2rem; border-left: 4px solid var(--success);">
                            <h4>Project Rating</h4>
                            <div style="font-size: 1.5rem; color: var(--success); margin: 0.5rem 0;">
                                ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)
                            </div>
                            <p style="font-style: italic; color: var(--text-secondary)">"${r.feedback}"</p>
                            <small>- Rated by ${r.faculty.fullName}</small>
                        </div>
                    `;
                }
            } catch (e) { console.log('Rating fetch failed or not found'); }
        }

        container.innerHTML = `
            <div>
                <button class="btn-sm" onclick="renderProjects()" style="margin-bottom: 1rem;">← Back</button>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <h2>${p.title}</h2>
                    <span class="status-badge status-${p.stage}">${p.stage}</span>
                </div>
                ${ratingHtml}
                
                <div class="grid-cols-3" style="margin-bottom: 2rem;">
                    <div class="stat-card"><strong>Domain</strong><div style="margin-top:0.5rem">${p.domain}</div></div>
                    <div class="stat-card"><strong>Status</strong><div style="margin-top:0.5rem">${p.status}</div></div>
                    <div class="stat-card"><strong>Deadline</strong><div style="margin-top:0.5rem">${p.stageDeadline ? new Date(p.stageDeadline).toDateString() : 'N/A'}</div></div>
                    <div class="stat-card"><strong>Repository</strong><div style="margin-top:0.5rem">${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" style="color:var(--accent)">View Code</a>` : 'N/A'}</div></div>
                </div>

                <div class="stat-card" style="margin-bottom: 2rem;">
                    <h4>Activity Timeline</h4>
                    <div id="activityTimeline" class="timeline" style="margin-top: 1rem; max-height: 200px; overflow-y: auto;">Loading...</div>
                </div>

                <div class="stat-card" style="margin-bottom: 2rem;">
                    <h4>Documents</h4>
                    <div class="table-container" style="margin-top: 1rem;">
                        <table>
                            <thead><tr><th>File</th><th>Ver</th><th>Date</th></tr></thead>
                            <tbody>
                                ${docs.length === 0 ? '<tr><td colspan="3">No files</td></tr>' : docs.map(d => `
                                    <tr>
                                        <td><a href="#" onclick="downloadDocument(${d.id}, '${d.filename}'); return false;">${d.filename}</a></td>
                                        <td>v${d.version}</td>
                                        <td>${new Date(d.uploadedAt).toLocaleDateString()}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="stat-card" style="margin-bottom: 2rem;">
                    <h4>Team Members</h4>
                    <div style="margin-top: 1rem;">
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 0.5rem;">👑 ${p.student.fullName} (Owner)</li>
                            ${p.teamMembers ? p.teamMembers.map(m => `<li style="margin-bottom: 0.5rem;">👤 ${m.fullName}</li>`).join('') : ''}
                        </ul>
                    </div>
                </div>

                <!-- Chat Section -->
                <div class="stat-card" style="margin-bottom: 2rem; display: flex; flex-direction: column; height: 400px;">
                    <h4>Project Chat</h4>
                    <div id="chatBox" style="flex: 1; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: var(--bg-main);">
                        Loading chat...
                    </div>
                    <form id="chatForm" style="display: flex; gap: 0.5rem;">
                        <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1;" autocomplete="off">
                        <button type="submit" class="btn-primary" style="width: auto;">Send</button>
                    </form>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 2rem;">
                    ${getUserRole() === 'FACULTY' && p.status === 'SUBMITTED' ? `
                        <button class="btn-primary" style="width: auto" onclick="approveStage(${p.id})">Approve Stage</button>
                        <button class="btn-sm" style="background: var(--danger); color: white;" onclick="rejectStage(${p.id})">Reject Stage</button>
                    ` : ''}
                    
                    ${getUserRole() === 'FACULTY' && p.stage === 'COMPLETED' && !ratingHtml ? `
                        <button class="btn-primary" style="width: auto; background: var(--success)" onclick="openRateModal(${p.id})">Rate Project</button>
                    ` : ''}
                    
                    ${getUserRole() === 'STUDENT' && p.student.id === user.id && p.stage === 'IDEA' ? `
                        <button class="btn-sm" style="background: var(--accent); color: white;" onclick="openInviteModal(${p.id})">Invite Teammate</button>
                    ` : ''}
                    
                    <button class="btn-sm" style="background: var(--secondary); color: white;" onclick="downloadPdfReport(${p.id})">PDF Report</button>
                </div>
            </div>
        `;

        loadActivities(p.id);
        initChat(p.id); // Initialize chat
    } catch (err) { container.innerHTML = '<p>Error loading project details.</p>'; }
}

let chatInterval = null;

async function initChat(pid) {
    if (chatInterval) clearInterval(chatInterval);

    const chatForm = document.getElementById('chatForm');
    chatForm.onsubmit = (e) => sendChatMessage(e, pid);

    await loadChatMessages(pid);
    chatInterval = setInterval(() => loadChatMessages(pid), 3000); // Poll every 3s
}

async function loadChatMessages(pid) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return; // View changed

    try {
        const res = await fetch(`${API_BASE}/projects/${pid}/chat`, { headers: authHeader() });
        if (res.ok) {
            const messages = await res.json();
            const wasScrolledToBottom = chatBox.scrollHeight - chatBox.scrollTop === chatBox.clientHeight;

            chatBox.innerHTML = messages.map(m => {
                const isMe = m.senderId === user.id;
                return `
                    <div style="display: flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 0.5rem;">
                        <div style="max-width: 70%; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.9rem; 
                                    background: ${isMe ? 'var(--accent)' : 'var(--bg-card)'}; 
                                    color: ${isMe ? '#fff' : 'var(--text-main)'}; 
                                    border: ${isMe ? 'none' : '1px solid var(--border)'}">
                            <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.2rem; display: flex; justify-content: space-between; gap: 1rem;">
                                <strong>${isMe ? 'You' : m.sender}</strong>
                                <span>${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div>${m.content}</div>
                        </div>
                    </div>
                `;
            }).join('');

            if (messages.length === 0) chatBox.innerHTML = '<p style="text-align:center; color: var(--text-secondary); margin-top: 2rem;">No messages yet. Start the conversation!</p>';

            if (wasScrolledToBottom || messages.length === 0) chatBox.scrollTop = chatBox.scrollHeight;
        }
    } catch (e) { console.error('Chat load error', e); }
}

async function sendChatMessage(e, pid) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API_BASE}/projects/${pid}/chat`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            input.value = '';
            loadChatMessages(pid); // Immediate refresh
        }
    } catch (e) { console.error('Send message error', e); }
}
async function loadActivities(pid) {
    const timeline = document.getElementById('activityTimeline');
    try {
        const res = await fetch(`${API_BASE}/activities/${pid}`, { headers: authHeader() });
        const data = await res.json();
        if (data.length === 0) {
            timeline.innerHTML = '<p style="color:var(--text-secondary)">No activities yet.</p>';
        } else {
            timeline.innerHTML = data.map(a => `
                <div style="margin-bottom: 0.75rem; padding-left: 1rem; border-left: 2px solid var(--accent);">
                    <div style="font-size: 0.8rem; color: var(--text-secondary)">${new Date(a.createdAt).toLocaleString()}</div>
                    <div>${a.message}</div>
                </div>
            `).join('');
        }
    } catch (err) { timeline.innerHTML = 'Error loading timeline.'; }
}

function logout() { localStorage.removeItem('user'); window.location.href = 'index.html'; }
function toggleNotifications() {
    const el = document.getElementById('notifDropdown');
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
    if (el.style.display === 'block') fetchNotifications();
}

async function fetchNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: authHeader() });
    const data = await res.json();
    const list = document.getElementById('notifList');
    list.innerHTML = data.map(n => `
        <div style="padding: 0.8rem; border-bottom: 1px solid var(--border); cursor: pointer; ${n.isRead ? '' : 'background: rgba(59,130,246,0.05)'}" 
             onclick="openNotificationModal('${n.message.replace(/'/g, "\\'")}', '${n.createdAt}', ${n.id})">
            <div style="font-size: 0.85rem">${n.message}</div>
            <small style="color: var(--text-secondary)">${new Date(n.createdAt).toLocaleDateString()}</small>
        </div>`).join('');
}

async function checkNotifications() {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: authHeader() });
    const count = await res.json();
    const badge = document.getElementById('notifBadge');
    if (count > 0) { badge.innerText = count; badge.style.display = 'block'; }
    else { badge.style.display = 'none'; }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

async function createProject(e) {
    e.preventDefault();
    const body = {
        title: document.getElementById('projTitle').value,
        domain: document.getElementById('projDomain').value,
        description: document.getElementById('projDesc').value,
        stack: document.getElementById('projStack').value,
        githubUrl: document.getElementById('projGithub').value
    };
    const res = await fetch(`${API_BASE}/projects`, { method: 'POST', headers: authHeader(), body: JSON.stringify(body) });
    if (res.ok) { closeModal('projectModal'); renderProjects(); showSuccessModal('Created', 'Project added!'); }
}

async function applyTemplate(domain) {
    const res = await fetch(`${API_BASE}/templates/${domain}`, { headers: authHeader() });
    if (res.ok) {
        const t = await res.json();
        if (t.suggestedStack) document.getElementById('projStack').value = t.suggestedStack;
    }
}

function openUploadModal(id) { document.getElementById('uploadProjectId').value = id; openModal('uploadModal'); }
async function uploadDocument(e) {
    e.preventDefault();
    const id = document.getElementById('uploadProjectId').value;
    const file = document.getElementById('docFile').files[0];
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/projects/${id}/upload`, { headers: { 'Authorization': 'Bearer ' + user.token }, method: 'POST', body: formData });
    if (res.ok) { closeModal('uploadModal'); showSuccessModal('Uploaded', 'File saved!'); }
}

async function approveStage(pid) {
    const rem = await showInputModal('Approve', 'Remarks:');
    if (rem) {
        await fetch(`${API_BASE}/projects/${pid}/approve`, { method: 'POST', headers: authHeader(), body: JSON.stringify({ remarks: rem }) });
        renderProjects();
    }
}

async function rejectStage(pid) {
    const rem = await showInputModal('Reject', 'Reason:');
    if (rem) {
        await fetch(`${API_BASE}/projects/${pid}/reject`, { method: 'POST', headers: authHeader(), body: JSON.stringify({ remarks: rem }) });
        renderProjects();
    }
}

async function submitForReview(pid) {
    if (await showConfirmModal('Submit', 'Submit for review?')) {
        await fetch(`${API_BASE}/projects/${pid}/submit`, { method: 'POST', headers: authHeader() });
        renderProjects();
    }
}

async function acceptFaculty(pid) {
    await fetch(`${API_BASE}/projects/${pid}/accept-faculty`, { method: 'POST', headers: authHeader() });
    renderProjects();
}

async function openRequestFacultyModal(pid) {
    document.getElementById('requestProjectId').value = pid;
    const res = await fetch(`${API_BASE}/users/faculty`, { headers: authHeader() });
    const faculty = await res.json();

    // Filter faculty: Only show those with available capacity
    const available = faculty.filter(f => f.currentProjects < f.maxProjects);

    if (available.length === 0) {
        document.getElementById('facultySelect').innerHTML = '<option value="">No faculty available (All at capacity)</option>';
    } else {
        document.getElementById('facultySelect').innerHTML = available.map(f =>
            `<option value="${f.id}">${f.fullName} (${f.currentProjects}/${f.maxProjects} Active Projects)</option>`
        ).join('');
    }
    openModal('requestFacultyModal');
}

async function sendFacultyRequest(e) {
    e.preventDefault();
    const pid = document.getElementById('requestProjectId').value;
    const fid = document.getElementById('facultySelect').value;

    if (!fid) {
        showErrorModal('Error', 'Please select a faculty member.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/projects/${pid}/request-faculty/${fid}`, { method: 'POST', headers: authHeader() });

        if (res.ok) {
            closeModal('requestFacultyModal');
            showSuccessModal('Request Sent', 'Faculty request sent successfully!');
            renderProjects();
            checkNotifications(); // Update notifications
        } else {
            const data = await res.json();
            showErrorModal('Request Failed', data.message || 'Failed to send request');
        }
    } catch (err) {
        showErrorModal('Error', 'Failed to send request. Server might be down.');
    }
}

async function assignFaculty(pid) {
    document.getElementById('assignProjectId').value = pid;
    const res = await fetch(`${API_BASE}/users/faculty`, { headers: authHeader() });
    const faculty = await res.json();
    // Admin can override capacity, but let's show info
    document.getElementById('assignFacultySelect').innerHTML = faculty.map(f =>
        `<option value="${f.id}">${f.fullName} (${f.currentProjects}/${f.maxProjects})</option>`
    ).join('');
    openModal('assignFacultyModal');
}

async function confirmAssignFaculty(e) {
    e.preventDefault();
    const pid = document.getElementById('assignProjectId').value;
    const fid = document.getElementById('assignFacultySelect').value;

    try {
        const res = await fetch(`${API_BASE}/projects/${pid}/assign-faculty/${fid}`, {
            method: 'POST',
            headers: authHeader()
        });

        if (res.ok) {
            closeModal('assignFacultyModal');
            showSuccessModal('Assigned', 'Faculty assigned successfully!');
            renderProjects();
        } else {
            const data = await res.json();
            showErrorModal('Error', data.message || 'Failed to assign faculty');
        }
    } catch (err) {
        showErrorModal('Error', 'Failed to assign faculty');
    }
}

// Notification Modal Logic
async function openNotificationModal(msg, dateStr, id) {
    document.getElementById('notifMessage').innerText = msg;
    document.getElementById('notifDate').innerText = new Date(dateStr).toLocaleString();
    openModal('notificationModal');

    // Mark as read immediately when viewed
    try {
        await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST', headers: authHeader() });
        checkNotifications(); // Update count
        fetchNotifications(); // Refresh list to show as read

        // Refresh dashboard if it's an invitation
        if (msg.toLowerCase().includes('invited')) {
            renderDashboard();
        }
    } catch (e) { console.error('Failed to mark read', e); }
}

function showSuccessModal(title, msg) {
    document.getElementById('successTitle').innerText = title;
    document.getElementById('successMessage').innerText = msg;
    openModal('successModal');
}

function showErrorModal(title, msg) {
    document.getElementById('errorTitle').innerText = title;
    document.getElementById('errorMessage').innerText = msg;
    openModal('errorModal');
}

let confirmResolve = null, inputResolve = null;
function showConfirmModal(t, m) { return new Promise(r => { document.getElementById('confirmTitle').innerText = t; document.getElementById('confirmMessage').innerText = m; confirmResolve = r; openModal('confirmModal'); }); }
function showInputModal(t, m) { return new Promise(r => { document.getElementById('inputTitle').innerText = t; document.getElementById('inputMessage').innerText = m; document.getElementById('inputField').value = ''; inputResolve = r; openModal('inputModal'); }); }

// Downloads
async function downloadDocument(docId, filename) {
    try {
        const res = await fetch(`${API_BASE}/projects/documents/${docId}/download`, { headers: { 'Authorization': 'Bearer ' + user.token } });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
        }
    } catch (err) { alert('Download failed'); }
}

async function downloadPdfReport(pid) {
    try {
        const res = await fetch(`${API_BASE}/export/projects/${pid}/pdf`, { headers: authHeader() });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Project_Report_${pid}.pdf`;
            a.click();
        } else {
            const errorText = await res.text();
            alert('Failed to generate PDF report: ' + errorText);
        }
    } catch (err) { alert('Download error: ' + err.message); }
}

async function exportProjects() {
    try {
        const res = await fetch(`${API_BASE}/export/projects`, { headers: authHeader() });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'projects_export.csv';
            a.click();
        }
    } catch (err) { alert('Export failed'); }
}

// Admin Deadline
function openDeadlineModal(pid) {
    document.getElementById('deadlineProjectId').value = pid;
    openModal('deadlineModal');
}

async function setProjectDeadline(e) {
    e.preventDefault();
    const pid = document.getElementById('deadlineProjectId').value;
    const deadline = document.getElementById('deadlineInput').value;

    try {
        const res = await fetch(`${API_BASE}/admin/projects/${pid}/deadline`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ deadline })
        });
        if (res.ok) {
            closeModal('deadlineModal');
            showSuccessModal('Updated', 'Deadline set!');
            renderProjects();
        } else {
            const errText = await res.text();
            alert(`Failed to set deadline: ${res.status} ${errText}`);
            console.error('Deadline error', res.status, errText);
        }
    } catch (err) {
        alert('Failed to set deadline: ' + err.message);
        console.error('Deadline fetch error', err);
    }
}

function openRateModal(pid) {
    document.getElementById('rateProjectId').value = pid;
    openModal('rateProjectModal');
}

async function submitRating(e) {
    e.preventDefault();
    const pid = document.getElementById('rateProjectId').value;
    const rating = document.getElementById('rateScore').value;
    const feedback = document.getElementById('rateFeedback').value;

    try {
        const res = await fetch(`${API_BASE}/projects/${pid}/rate`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ rating: parseInt(rating), feedback })
        });

        if (res.ok) {
            closeModal('rateProjectModal');
            showSuccessModal('Project Rated', 'Thank you for your feedback!');
            viewProjectDetails(pid); // Refresh project view
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to submit rating');
        }
    } catch (err) {
        alert('Server error while submitting rating');
    }
}

// Global exports

async function deleteProject(pid) {
    if (await showConfirmModal('Delete Project', 'Are you sure you want to delete this project? This action cannot be undone.')) {
        try {
            const res = await fetch(`${API_BASE}/projects/${pid}`, {
                method: 'DELETE',
                headers: authHeader()
            });
            if (res.ok) {
                showSuccessModal('Deleted', 'Project deleted successfully');
                renderProjects();
            } else {
                const errText = await res.text();
                alert(`Failed to delete project: ${res.status} ${errText}`);
                console.error('Delete error', res.status, errText);
            }
        } catch (err) {
            alert('Error deleting project: ' + err.message);
            console.error('Delete fetch error', err);
        }
    }
}

window.renderDashboard = renderDashboard; window.renderProjects = renderProjects; window.renderAnalytics = renderAnalytics; window.renderAdminSetup = renderAdminSetup;
window.logout = logout; window.toggleTheme = toggleTheme; window.toggleNotifications = toggleNotifications;
window.openModal = openModal; window.closeModal = closeModal;
window.viewProjectDetails = viewProjectDetails; window.createFaculty = createFaculty;
window.openUploadModal = openUploadModal; window.openRequestFacultyModal = openRequestFacultyModal;
window.submitForReview = submitForReview; window.acceptFaculty = acceptFaculty;
window.approveStage = approveStage; window.rejectStage = rejectStage;
window.downloadDocument = downloadDocument; window.downloadPdfReport = downloadPdfReport;
window.exportProjects = exportProjects; window.openDeadlineModal = openDeadlineModal;
window.setProjectDeadline = setProjectDeadline; window.openCapacityModal = openCapacityModal;
window.deleteProject = deleteProject;
window.updateFileName = (i) => { if (i.files.length) document.getElementById('fileUploadLabel').innerText = i.files[0].name; };
window.openInviteModal = openInviteModal; window.acceptInvitation = acceptInvitation; window.rejectInvitation = rejectInvitation;
window.openRateModal = openRateModal;
