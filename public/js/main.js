// Global functions
document.addEventListener('DOMContentLoaded', function() {
    // Notification tab switching
    const notificationTabs = document.querySelectorAll('.notification-tab');
    if (notificationTabs.length > 0) {
        notificationTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                notificationTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Navigation tab switching
    const navTabs = document.querySelectorAll('.nav-tab');
    if (navTabs.length > 0) {
        navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                navTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Connect buttons
    const connectButtons = document.querySelectorAll('.btn-connect');
    connectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentText = this.textContent;
            if (currentText === 'Connect') {
                this.textContent = 'Pending';
                this.style.background = '#f0f7ff';
                this.style.color = '#1a73e8';
                this.style.border = '1px solid #1a73e8';
            } else if (currentText === 'Pending') {
                this.textContent = 'Connected';
                this.style.background = '#34a853';
                this.style.color = 'white';
                this.style.border = 'none';
            }
        });
    });

    // Like functionality
    const likeButtons = document.querySelectorAll('.post-action:first-child');
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('bi-hand-thumbs-up')) {
                icon.classList.remove('bi-hand-thumbs-up');
                icon.classList.add('bi-hand-thumbs-up-fill');
                this.style.color = '#1a73e8';
            } else {
                icon.classList.remove('bi-hand-thumbs-up-fill');
                icon.classList.add('bi-hand-thumbs-up');
                this.style.color = '';
            }
        });
    });

    // Apply job buttons
    const applyButtons = document.querySelectorAll('.btn-apply');
    applyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const originalText = this.textContent;
            this.textContent = 'Applied ✓';
            this.style.background = '#34a853';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.disabled = false;
            }, 3000);
        });
    });

    // Mark notification as read
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('unread');
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});