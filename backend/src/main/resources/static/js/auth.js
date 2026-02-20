const API_URL = 'http://localhost:8080/api/auth';

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    } else {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
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
