const API_URL = 'http://localhost:8080/api/auth';

// Handle OAuth2 Redirect Token
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        const userData = {
            accessToken: token,
            id: urlParams.get('id'),
            email: urlParams.get('email'),
            role: urlParams.get('role'),
            fullName: urlParams.get('name')
        };

        localStorage.setItem('user', JSON.stringify(userData));
        // Clean URL and redirect to dashboard
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.href = 'dashboard.html';
    }
});

function openAuthModal(tab) {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    switchTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('authModal');
    if (event.target == modal) {
        closeAuthModal();
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const title = document.getElementById('modalTitle');
    const subtitle = document.getElementById('modalSubtitle');

    if (tab === 'login') {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Log in to your workspace';
    } else {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        title.textContent = 'Join PLMS';
        subtitle.textContent = 'Start your academic journey today';
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('authMessage');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        message.textContent = 'Logging in...';
        message.style.color = 'var(--accent)';

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = 'dashboard.html';
        } else {
            message.textContent = data.message || 'Login failed. Please check your credentials.';
            message.style.color = 'var(--danger)';
        }
    } catch (error) {
        message.textContent = 'Unable to connect to server. Please ensure the backend is running.';
        message.style.color = 'var(--danger)';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('authMessage');
    const email = document.getElementById('regEmail').value;
    const fullName = document.getElementById('regFullName').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        message.textContent = 'Passwords do not match!';
        message.style.color = 'var(--danger)';
        return;
    }

    try {
        message.textContent = 'Registering...';
        message.style.color = 'var(--accent)';

        const response = await fetch(`${API_URL}/register/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, fullName, password, confirmPassword })
        });

        const data = await response.json();

        if (response.ok) {
            message.textContent = 'Registration successful! You can now login as a student.';
            message.style.color = 'var(--success)';
            setTimeout(() => switchTab('login'), 2000);
        } else {
            message.textContent = data.message || 'Registration failed';
            message.style.color = 'var(--danger)';
        }
    } catch (error) {
        message.textContent = 'Server error. Please try again later.';
        message.style.color = 'var(--danger)';
    }
});
