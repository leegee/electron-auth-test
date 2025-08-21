document.getElementById('set').onclick = async () => {
    await window.secureAPI.setPassword('MyApp', 'user@example.com', 'super-secret');
    alert('Secret set!');
};

document.getElementById('get').onclick = async () => {
    const secret = await window.secureAPI.getPassword('MyApp', 'user@example.com');
    alert('Retrieved secret: ' + secret);
};
