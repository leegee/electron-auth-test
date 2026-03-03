console.debug('index.ts loaded, electronAPI:', window.electronAPI);

function updateStatus(text: string) {
    const status = document.getElementById('status');
    if (status) status.textContent = text;
}


const setButton = document.getElementById('set');
if (setButton) {
    setButton.addEventListener('click', async () => {
        await window.electronAPI.setPassword('MyApp', 'user@example.com', 'super-secret');
        updateStatus("Secret set!");
    });
}

const getButton = document.getElementById('get');
if (getButton) {
    getButton.addEventListener('click', async () => {
        const secret = await window.electronAPI.getPassword('MyApp', 'user@example.com');
        updateStatus("Retrieved secret: " + secret);
    });
}

const loginButton = document.getElementById('login');
loginButton?.addEventListener('click', () => {
    window.electronAPI.loginGitHub();
});

window.electronAPI.onOAuthSuccess(() => {
    updateStatus("Login successful!");
    // Hide the login button once logged in
    if (loginButton){
        loginButton.setAttribute('disabled', 'true');
        loginButton.style.display = 'none';
    }
});

