const express = require('express');
const path = require('path');
const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to make currentPage available to all views
app.use((req, res, next) => {
    res.locals.currentPage = req.path.split('/')[1] || 'home';
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Nexus - Professional Network' });
});

app.get('/auth/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Sign In - Nexus',
        hideNavbar: true,
        hideFooter: true 
    });
});

app.get('/auth/register', (req, res) => {
    res.render('auth/register', { 
        title: 'Create Account - Nexus',
        hideNavbar: true,
        hideFooter: true 
    });
});

app.get('/feed', (req, res) => {
    res.render('feed', { 
        title: 'feed- Nexus',
        currentPage: 'home'
    });
});

app.get('/jobs', (req, res) => {
    res.render('jobs', { 
        title: 'Jobs - Nexus',
        currentPage: 'jobs'
    });
});

app.get('/profile', (req, res) => {
    res.render('profile', { 
        title: 'Alex Johnson - Nexus',
        currentPage: 'profile'
    });
});

app.get('/notifications', (req, res) => {
    res.render('notifications', { 
        title: 'Notifications - Nexus',
        currentPage: 'notifications'
    });
});
app.get('/network', (req, res) => {
    res.render('network', { 
        title: 'Network - Nexus',
        currentPage: 'network'
    });
});

// Messages route
app.get('/messages', (req, res) => {
    res.render('messages', { 
        title: 'Messages - Nexus',
        currentPage: 'messages'
    });
});
app.get('/compagny', (req, res) => {
    res.render('compagny', { 
        title: 'Company Dashboard - Nexus',
        currentPage: 'compagny'
    });
});
app.get('/company/posts', (req, res) => {
    res.render('compagny-posts', { 
        title: 'Company Posts - Nexus',
        currentPage: 'posts'
    });
});
app.get('/company/jobs', (req, res) => {
    res.render('compagny-jobs', { 
        title: 'Company Jobs - Nexus',
        currentPage: 'jobs'
    });
});
app.get('/job/applications', (req, res) => {
    res.render('job-applicants', { 
        title: 'Company Jobs - Nexus',
        currentPage: 'jobs'
    });
});
app.get('/company/profile', (req, res) => {
    res.render('profile-compagny', { 
        title: 'Company Profile - Nexus',
        currentPage: 'profile'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});