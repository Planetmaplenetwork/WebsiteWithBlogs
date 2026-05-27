document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-list');
            icon.classList.toggle('bi-x');
        });
        
        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                icon.classList.add('bi-list');
                icon.classList.remove('bi-x');
            });
        });
    }
    
    // IP Copy functionality for hero section
    const ipButton = document.querySelector('.ip-btn');
    
    if (ipButton) {
        ipButton.addEventListener('click', function() {
            const ipAddress = 'play.planetmaple.org';
            const icon = this.querySelector('i');
            const popup = document.getElementById('copyPopup');
            
            const textArea = document.createElement('textarea');
            textArea.value = ipAddress;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                
                icon.classList.remove('bi-clipboard');
                icon.classList.add('bi-clipboard-check');
                icon.style.transition = 'color 0.3s ease';
                icon.style.color = '#10b981';
                
                if (popup) {
                    popup.classList.add('show');
                    popup.classList.remove('fade-out');
                }
                
                setTimeout(() => {
                    icon.classList.remove('bi-clipboard-check');
                    icon.classList.add('bi-clipboard');
                    icon.style.color = '';
                    
                    if (popup) {
                        popup.classList.add('fade-out');
                        setTimeout(() => {
                            popup.classList.remove('show');
                            popup.classList.remove('fade-out');
                        }, 300);
                    }
                }, 2000);
                
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            
            document.body.removeChild(textArea);
        });
    }
});