// Initialize Game Interface
document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const startBtn = document.getElementById('start-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const startScreen = document.getElementById('start-screen');

    // Add click handlers
    startBtn.addEventListener('click', () => {
        console.log('Starting Game...');
        // Add visual feedback (e.g., transition animation)
        startBtn.classList.add('active');
        
        // Simulating game start for now
        setTimeout(() => {
            alert('Game logic will start here in the next step!');
            startBtn.classList.remove('active');
        }, 500);
    });

    settingsBtn.addEventListener('click', () => {
        console.log('Opening Settings...');
        alert('Settings menu coming soon!');
    });

    // Handle screen resizing (optional, for maintaining mobile look)
    const handleResize = () => {
        const container = document.getElementById('game-container');
        if (window.innerWidth <= 480) {
            container.style.height = '100vh';
            container.style.borderRadius = '0';
            container.style.border = 'none';
        } else {
            container.style.height = '800px';
            container.style.borderRadius = '40px';
            container.style.border = '8px solid #222';
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
});
