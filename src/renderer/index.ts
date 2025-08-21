const setButton = document.getElementById('set');
setButton?.addEventListener('click', async () => {
    await window.secureAPI.setPassword('MyApp', 'user@example.com', 'super-secret');
    alert('Secret set!');
});

const getButton = document.getElementById('get');
getButton?.addEventListener('click', async () => {
    const secret = await window.secureAPI.getPassword('MyApp', 'user@example.com');
    alert('Retrieved secret: ' + secret);
});

const loginButton = document.getElementById('login');
loginButton?.addEventListener('click', () => {
    window.electronAPI.loginGitHub();
});

window.electronAPI.onOAuthSuccess(() => {
    alert("Login successful!");
});
