const API_URL = 'http://localhost:8080/api/auth';

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn:nth-child(${tab === 'login' ? 1 : 2})`).classList.add('active');

    if (tab === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    } else {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('authMessage');
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = 'dashboard.html';
        } else {
            message.textContent = data.message || 'Login failed';
            message.style.color = 'var(--danger)';
        }
    } catch (error) {
        message.textContent = 'Server error';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('authMessage');
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const fullName = document.getElementById('regFullName').value;
    const department = document.getElementById('regDept').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, fullName, department, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            message.textContent = 'Registration successful! Please login.';
            message.style.color = 'var(--success)';
            switchTab('login');
        } else {
            message.textContent = data.message;
            message.style.color = 'var(--danger)';
        }
    } catch (error) {
        message.textContent = 'Server error';
    }
});
