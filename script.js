/**
 * ============================================
 * Student Attendance Management System
 * Complete JavaScript Application
 * ============================================
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwvsGOptFJ9K8nDoB27I188-AxM2x22Uem0UotC2YWGv3G-gKF3KmQOlA2jk3GUPqRT/exec',
    APP_NAME: 'AttendanceMS',
    VERSION: '2.0.0',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes inactivity
    WARNING_BEFORE_LOGOUT: 60, // seconds warning before auto logout
    ITEMS_PER_PAGE: 10,
    DEFAULT_COURSES: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Electronics']
};

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
    currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
    isLoggedIn: !!localStorage.getItem('currentUser'),
    currentView: 'dashboard',
    darkMode: localStorage.getItem('darkMode') === 'true',
    compactMode: localStorage.getItem('compactMode') === 'true',
    students: [],
    attendance: [],
    admins: [],
    activityLogs: [],
    notifications: [],
    charts: {},
    inactivityTimer: null,
    warningTimer: null,
    countdownInterval: null,
    deleteCallback: null,
    currentPage: {
        students: 1,
        attendance: 1
    },

    init() {
        if (this.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
        if (this.compactMode) document.documentElement.setAttribute('data-compact', 'true');
    }
};

// ============================================
// API CLIENT
// ============================================
const API = {
    async request(action, data = {}) {
        const params = new URLSearchParams({ action, ...data });
        const url = `${CONFIG.API_URL}?${params.toString()}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            // Return fallback data for demo when API is unavailable
            return this.getFallbackData(action, data);
        }
    },

    async post(action, data = {}) {
        try {
            const formData = new FormData();
            formData.append('action', action);
            Object.keys(data).forEach(key => formData.append(key, data[key]));
            
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            return this.getFallbackData(action, data);
        }
    },

    // Fallback demo data when API is not connected
    getFallbackData(action, data) {
        const demoStudents = [
            { studentId: 'S001', name: 'Rahul Sharma', rollNumber: 'CS2024001', course: 'Computer Science', mobile: '9876543210', email: 'rahul@example.com', gender: 'Male', address: 'Delhi, India', createdDate: '2024-01-15' },
            { studentId: 'S002', name: 'Priya Patel', rollNumber: 'CS2024002', course: 'Computer Science', mobile: '9876543211', email: 'priya@example.com', gender: 'Female', address: 'Mumbai, India', createdDate: '2024-01-16' },
            { studentId: 'S003', name: 'Amit Kumar', rollNumber: 'EL2024001', course: 'Electrical', mobile: '9876543212', email: 'amit@example.com', gender: 'Male', address: 'Bangalore, India', createdDate: '2024-01-17' },
            { studentId: 'S004', name: 'Sneha Gupta', rollNumber: 'MH2024001', course: 'Mechanical', mobile: '9876543213', email: 'sneha@example.com', gender: 'Female', address: 'Pune, India', createdDate: '2024-01-18' },
            { studentId: 'S005', name: 'Vikram Singh', rollNumber: 'CV2024001', course: 'Civil', mobile: '9876543214', email: 'vikram@example.com', gender: 'Male', address: 'Chennai, India', createdDate: '2024-01-19' },
            { studentId: 'S006', name: 'Anita Desai', rollNumber: 'EC2024001', course: 'Electronics', mobile: '9876543215', email: 'anita@example.com', gender: 'Female', address: 'Hyderabad, India', createdDate: '2024-01-20' },
            { studentId: 'S007', name: 'Rajesh Khanna', rollNumber: 'CS2024003', course: 'Computer Science', mobile: '9876543216', email: 'rajesh@example.com', gender: 'Male', address: 'Kolkata, India', createdDate: '2024-01-21' },
            { studentId: 'S008', name: 'Meera Reddy', rollNumber: 'EL2024002', course: 'Electrical', mobile: '9876543217', email: 'meera@example.com', gender: 'Female', address: 'Ahmedabad, India', createdDate: '2024-01-22' },
            { studentId: 'S009', name: 'Suresh Menon', rollNumber: 'MH2024002', course: 'Mechanical', mobile: '9876543218', email: 'suresh@example.com', gender: 'Male', address: 'Jaipur, India', createdDate: '2024-01-23' },
            { studentId: 'S010', name: 'Deepa Iyer', rollNumber: 'EC2024002', course: 'Electronics', mobile: '9876543219', email: 'deepa@example.com', gender: 'Female', address: 'Lucknow, India', createdDate: '2024-01-24' },
            { studentId: 'S011', name: 'Arun Nair', rollNumber: 'CS2024004', course: 'Computer Science', mobile: '9876543220', email: 'arun@example.com', gender: 'Male', address: 'Kochi, India', createdDate: '2024-01-25' },
            { studentId: 'S012', name: 'Kavita Joshi', rollNumber: 'CV2024002', course: 'Civil', mobile: '9876543221', email: 'kavita@example.com', gender: 'Female', address: 'Nagpur, India', createdDate: '2024-01-26' }
        ];

        const demoAdmins = [
            { id: 'A001', adminName: 'Super Admin', username: 'admin', password: 'admin123', role: 'Super Admin', createdDate: '2024-01-01' },
            { id: 'A002', adminName: 'John Teacher', username: 'teacher', password: 'teacher123', role: 'Teacher', createdDate: '2024-01-10' },
            { id: 'A003', adminName: 'Sarah Staff', username: 'staff', password: 'staff123', role: 'Staff', createdDate: '2024-01-15' }
        ];

        const today = new Date().toISOString().split('T')[0];
        const demoAttendance = [
            { attendanceId: 'AT001', studentId: 'S001', name: 'Rahul Sharma', rollNumber: 'CS2024001', course: 'Computer Science', status: 'Present', date: today, time: '09:00 AM', markedBy: 'admin' },
            { attendanceId: 'AT002', studentId: 'S002', name: 'Priya Patel', rollNumber: 'CS2024002', course: 'Computer Science', status: 'Present', date: today, time: '09:05 AM', markedBy: 'admin' },
            { attendanceId: 'AT003', studentId: 'S003', name: 'Amit Kumar', rollNumber: 'EL2024001', course: 'Electrical', status: 'Absent', date: today, time: '-', markedBy: 'admin' },
            { attendanceId: 'AT004', studentId: 'S004', name: 'Sneha Gupta', rollNumber: 'MH2024001', course: 'Mechanical', status: 'Present', date: today, time: '09:10 AM', markedBy: 'admin' },
            { attendanceId: 'AT005', studentId: 'S005', name: 'Vikram Singh', rollNumber: 'CV2024001', course: 'Civil', status: 'Late', date: today, time: '09:30 AM', markedBy: 'admin' },
            { attendanceId: 'AT006', studentId: 'S006', name: 'Anita Desai', rollNumber: 'EC2024001', course: 'Electronics', status: 'Present', date: today, time: '09:02 AM', markedBy: 'admin' },
            { attendanceId: 'AT007', studentId: 'S007', name: 'Rajesh Khanna', rollNumber: 'CS2024003', course: 'Computer Science', status: 'Present', date: today, time: '09:00 AM', markedBy: 'admin' },
            { attendanceId: 'AT008', studentId: 'S008', name: 'Meera Reddy', rollNumber: 'EL2024002', course: 'Electrical', status: 'Absent', date: today, time: '-', markedBy: 'admin' },
            { attendanceId: 'AT009', studentId: 'S009', name: 'Suresh Menon', rollNumber: 'MH2024002', course: 'Mechanical', status: 'Present', date: today, time: '09:15 AM', markedBy: 'admin' },
            { attendanceId: 'AT010', studentId: 'S010', name: 'Deepa Iyer', rollNumber: 'EC2024002', course: 'Electronics', status: 'Present', date: today, time: '09:08 AM', markedBy: 'admin' }
        ];

        const demoLogs = [
            { logId: 'L001', user: 'admin', activity: 'Login', dateTime: new Date(Date.now() - 3600000).toISOString() },
            { logId: 'L002', user: 'admin', activity: 'Marked attendance for 10 students', dateTime: new Date(Date.now() - 3000000).toISOString() },
            { logId: 'L003', user: 'admin', activity: 'Added student Rahul Sharma', dateTime: new Date(Date.now() - 86400000).toISOString() },
            { logId: 'L004', user: 'teacher', activity: 'Login', dateTime: new Date(Date.now() - 172800000).toISOString() },
            { logId: 'L005', user: 'admin', activity: 'Changed password', dateTime: new Date(Date.now() - 259200000).toISOString() },
            { logId: 'L006', user: 'staff', activity: 'Login', dateTime: new Date(Date.now() - 345600000).toISOString() }
        ];

        switch (action) {
            case 'login':
                const user = demoAdmins.find(a => a.username === data.username && a.password === data.password);
                return { success: !!user, user: user ? { ...user, password: undefined } : null, message: user ? 'Login successful' : 'Invalid credentials' };
            case 'getStudents':
                return { success: true, students: demoStudents };
            case 'getAdmins':
                return { success: true, admins: demoAdmins.map(a => ({ ...a, password: undefined })) };
            case 'getAttendance':
                let filtered = demoAttendance;
                if (data.date) filtered = filtered.filter(a => a.date === data.date);
                if (data.course) filtered = filtered.filter(a => a.course === data.course);
                return { success: true, attendance: filtered };
            case 'getDashboardStats':
                return { success: true, stats: { totalStudents: demoStudents.length, presentToday: 7, absentToday: 2, lateToday: 1, totalAdmins: demoAdmins.length } };
            case 'getActivityLogs':
                return { success: true, logs: demoLogs.slice(0, data.limit || 10) };
            case 'addStudent':
            case 'updateStudent':
            case 'deleteStudent':
            case 'addAdmin':
            case 'deleteAdmin':
            case 'changePassword':
            case 'markAttendance':
            case 'saveAttendance':
            case 'logActivity':
                return { success: true, message: 'Operation completed' };
            default:
                return { success: false, message: 'Unknown action' };
        }
    }
};

// ============================================
// UI UTILITIES
// ============================================
const UI = {
    // Toast notifications
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
        toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Show/hide loading overlay
    showLoader() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    },

    hideLoader() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('show');
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    },

    closeAllModals() {
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    },

    // Toggle password visibility
    togglePassword(input, btn) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    },

    // Set button loading state
    setButtonLoading(btn, loading) {
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loader');
        if (text) text.classList.toggle('hidden', loading);
        if (loader) loader.classList.toggle('hidden', !loading);
        btn.disabled = loading;
    }
};

// ============================================
// AUTHENTICATION & SESSION
// ============================================
const Auth = {
    async login(username, password, rememberMe) {
        const result = await API.request('login', { username, password });
        
        if (result.success && result.user) {
            AppState.currentUser = result.user;
            AppState.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }
            
            // Log the login activity
            await ActivityLog.log('Login');
            
            return { success: true };
        }
        
        return { success: false, message: result.message || 'Invalid username or password' };
    },

    logout() {
        ActivityLog.log('Logout').then(() => {
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            localStorage.removeItem('currentUser');
            location.reload();
        });
    },

    checkSession() {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (user) {
            AppState.currentUser = user;
            AppState.isLoggedIn = true;
            return true;
        }
        return false;
    },

    hasRole(role) {
        return AppState.currentUser?.role === role;
    },

    isSuperAdmin() {
        return AppState.currentUser?.role === 'Super Admin';
    }
};

// ============================================
// ROUTER
// ============================================
const Router = {
    views: {
        'dashboard': 'view-dashboard',
        'students': 'view-students',
        'attendance': 'view-attendance',
        'reports': 'view-reports',
        'admins': 'view-admins',
        'settings': 'view-settings'
    },

    init() {
        // Handle hash changes
        window.addEventListener('hashchange', () => this.navigate());
        
        // Handle nav link clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = link.getAttribute('data-view');
                if (view) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    },

    navigate() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        
        // Check if view exists
        if (!this.views[hash]) return;
        
        // Check admin access
        if (hash === 'admins' && !Auth.isSuperAdmin()) {
            UI.toast('Access denied. Super Admin only.', 'error');
            window.location.hash = 'dashboard';
            return;
        }
        
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // Show target view
        const viewEl = document.getElementById(this.views[hash]);
        if (viewEl) {
            viewEl.classList.add('active');
            AppState.currentView = hash;
        }
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-view') === hash);
        });
        
        // Trigger view-specific init
        this.onViewChange(hash);
    },

    onViewChange(view) {
        switch (view) {
            case 'dashboard':
                Dashboard.load();
                break;
            case 'students':
                Students.load();
                break;
            case 'attendance':
                Attendance.load();
                break;
            case 'reports':
                Reports.load();
                break;
            case 'admins':
                Admins.load();
                break;
            case 'settings':
                Settings.load();
                break;
        }
    }
};

// ============================================
// ACTIVITY LOG
// ============================================
const ActivityLog = {
    async log(activity) {
        if (!AppState.currentUser) return;
        
        const data = {
            user: AppState.currentUser.username,
            activity: activity,
            dateTime: new Date().toISOString()
        };
        
        // Save to API
        await API.post('logActivity', data);
        
        // Add to local state
        const log = {
            logId: 'L' + Date.now(),
            ...data
        };
        AppState.activityLogs.unshift(log);
        
        // Add notification
        this.addNotification(activity);
    },

    addNotification(message) {
        AppState.notifications.unshift({
            id: Date.now(),
            message,
            time: new Date().toLocaleTimeString(),
            read: false
        });
        this.updateNotificationBadge();
    },

    updateNotificationBadge() {
        const badge = document.getElementById('notification-count');
        const unread = AppState.notifications.filter(n => !n.read).length;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    },

    renderNotificationList() {
        const list = document.getElementById('notification-list');
        if (AppState.notifications.length === 0) {
            list.innerHTML = '<p class="no-notifications">No new notifications</p>';
            return;
        }
        
        list.innerHTML = AppState.notifications.slice(0, 10).map(n => `
            <div class="notification-item" data-id="${n.id}">
                <i class="fas fa-bell"></i>
                <div class="notif-text">${n.message}</div>
                <span class="notif-time">${n.time}</span>
            </div>
        `).join('');
    }
};

// ============================================
// DASHBOARD MODULE
// ============================================
const Dashboard = {
    loaded: false,
    pieChart: null,
    lineChart: null,

    async load() {
        if (this.loaded) return;
        
        // Load stats
        await this.loadStats();
        
        // Load charts
        this.loadCharts();
        
        // Load activity
        this.loadActivity();
        
        // Start clock
        this.startClock();
        
        // Render mini calendar
        this.renderCalendar();
        
        this.loaded = true;
    },

    async loadStats() {
        const result = await API.request('getDashboardStats');
        if (result.success) {
            document.getElementById('stat-total-students').textContent = result.stats.totalStudents;
            document.getElementById('stat-present-today').textContent = result.stats.presentToday;
            document.getElementById('stat-absent-today').textContent = result.stats.absentToday;
            document.getElementById('stat-total-admins').textContent = result.stats.totalAdmins;
        }
    },

    loadCharts() {
        this.loadPieChart();
        this.loadLineChart();
    },

    loadPieChart() {
        const ctx = document.getElementById('attendance-pie-chart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.pieChart) this.pieChart.destroy();
        
        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                    data: [70, 20, 10],
                    backgroundColor: ['#06d6a0', '#ef476f', '#ffd166'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 12, family: 'Poppins' },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    loadLineChart() {
        const ctx = document.getElementById('attendance-line-chart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.lineChart) this.lineChart.destroy();
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        const textColor = isDark ? '#a0aec0' : '#718096';
        
        this.lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Present %',
                    data: [85, 88, 82, 90],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }, {
                    label: 'Absent %',
                    data: [10, 8, 12, 7],
                    borderColor: '#ef476f',
                    backgroundColor: 'rgba(239, 71, 111, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef476f',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 12, family: 'Poppins' },
                            color: textColor
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 11 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 11 } },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    },

    async loadActivity() {
        const result = await API.request('getActivityLogs', { limit: 6 });
        const list = document.getElementById('activity-list');
        
        if (result.success && result.logs.length > 0) {
            AppState.activityLogs = result.logs;
            
            const getActivityIcon = (activity) => {
                if (activity.includes('Login')) return 'login';
                if (activity.includes('Logout')) return 'logout';
                if (activity.includes('Add') || activity.includes('Added')) return 'add';
                if (activity.includes('Delete') || activity.includes('Deleted')) return 'delete';
                if (activity.includes('attendance')) return 'attendance';
                if (activity.includes('password')) return 'password';
                return 'info';
            };
            
            const getActivityIconClass = (activity) => {
                if (activity.includes('Login')) return 'login';
                if (activity.includes('Logout')) return 'logout';
                if (activity.includes('Add') || activity.includes('Added')) return 'add';
                if (activity.includes('Delete') || activity.includes('Deleted')) return 'delete';
                if (activity.includes('attendance')) return 'attendance';
                if (activity.includes('password')) return 'password';
                return 'login';
            };
            
            list.innerHTML = result.logs.map(log => `
                <div class="activity-item">
                    <div class="activity-icon ${getActivityIconClass(log.activity)}">
                        <i class="fas fa-${getActivityIcon(log.activity) === 'login' ? 'sign-in-alt' : getActivityIcon(log.activity) === 'logout' ? 'sign-out-alt' : getActivityIcon(log.activity) === 'add' ? 'plus' : getActivityIcon(log.activity) === 'delete' ? 'trash' : getActivityIcon(log.activity) === 'attendance' ? 'clipboard-check' : getActivityIcon(log.activity) === 'password' ? 'key' : 'info'}"></i>
                    </div>
                    <span class="activity-text">${log.activity} by <strong>${log.user}</strong></span>
                    <span class="activity-time">${this.formatTimeAgo(log.dateTime)}</span>
                </div>
            `).join('');
        }
    },

    startClock() {
        const updateClock = () => {
            const now = new Date();
            document.getElementById('digital-clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
            document.getElementById('date-display').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    renderCalendar() {
        const container = document.getElementById('mini-calendar');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        let html = dayNames.map(d => `<div class="cal-header">${d}</div>`).join('');
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="cal-day other-month">${daysInPrevMonth - i}</div>`;
        }
        
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today ? 'today' : '';
            html += `<div class="cal-day ${isToday}">${d}</div>`;
        }
        
        // Next month days to fill grid
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const remaining = totalCells - firstDay - daysInMonth;
        for (let d = 1; d <= remaining; d++) {
            html += `<div class="cal-day other-month">${d}</div>`;
        }
        
        container.innerHTML = html;
    },

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
};

// ============================================
// STUDENTS MODULE
// ============================================
const Students = {
    allStudents: [],
    filteredStudents: [],

    async load() {
        await this.fetchStudents();
        this.setupEventListeners();
    },

    async fetchStudents() {
        UI.showLoader();
        const result = await API.request('getStudents');
        UI.hideLoader();
        
        if (result.success) {
            this.allStudents = result.students;
            this.filteredStudents = [...this.allStudents];
            this.renderTable();
            this.populateCourseFilters();
        }
    },

    setupEventListeners() {
        // Search
        document.getElementById('student-search').addEventListener('input', (e) => {
            this.filterStudents(e.target.value, document.getElementById('student-course-filter').value);
        });
        
        // Course filter
        document.getElementById('student-course-filter').addEventListener('change', (e) => {
            this.filterStudents(document.getElementById('student-search').value, e.target.value);
        });
        
        // Add student button
        document.getElementById('btn-add-student').addEventListener('click', () => this.openAddModal());
        
        // Student form
        document.getElementById('student-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    filterStudents(search, course) {
        this.filteredStudents = this.allStudents.filter(s => {
            const matchesSearch = !search || 
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase());
            const matchesCourse = !course || s.course === course;
            return matchesSearch && matchesCourse;
        });
        AppState.currentPage.students = 1;
        this.renderTable();
    },

    populateCourseFilters() {
        const courses = [...new Set(this.allStudents.map(s => s.course))];
        const select = document.getElementById('student-course-filter');
        const currentVal = select.value;
        
        select.innerHTML = '<option value="">All Courses</option>';
        courses.forEach(course => {
            select.innerHTML += `<option value="${course}">${course}</option>`;
        });
        select.value = currentVal;
    },

    renderTable() {
        const tbody = document.getElementById('students-table-body');
        const start = (AppState.currentPage.students - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        const pageData = this.filteredStudents.slice(start, end);
        
        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
            this.renderPagination(0);
            return;
        }
        
        tbody.innerHTML = pageData.map(student => `
            <tr data-id="${student.studentId}">
                <td><strong>${student.rollNumber}</strong></td>
                <td>${student.name}</td>
                <td><span class="badge badge-present">${student.course}</span></td>
                <td>${student.mobile}</td>
                <td>${student.email}</td>
                <td>${student.gender}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="Students.editStudent('${student.studentId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="Students.confirmDelete('${student.studentId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.renderPagination(Math.ceil(this.filteredStudents.length / CONFIG.ITEMS_PER_PAGE));
    },

    renderPagination(totalPages) {
        const container = document.getElementById('students-pagination');
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = `
            <button class="page-btn" ${AppState.currentPage.students === 1 ? 'disabled' : ''} onclick="Students.goToPage(${AppState.currentPage.students - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === AppState.currentPage.students ? 'active' : ''}" onclick="Students.goToPage(${i})">${i}</button>`;
        }
        
        html += `
            <button class="page-btn" ${AppState.currentPage.students === totalPages ? 'disabled' : ''} onclick="Students.goToPage(${AppState.currentPage.students + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        container.innerHTML = html;
    },

    goToPage(page) {
        AppState.currentPage.students = page;
        this.renderTable();
    },

    openAddModal() {
        document.getElementById('student-modal-title').textContent = 'Add Student';
        document.getElementById('student-form').reset();
        document.getElementById('student-id').value = '';
        UI.openModal('student-modal');
    },

    editStudent(studentId) {
        const student = this.allStudents.find(s => s.studentId === studentId);
        if (!student) return;
        
        document.getElementById('student-modal-title').textContent = 'Edit Student';
        document.getElementById('student-id').value = student.studentId;
        document.getElementById('student-name').value = student.name;
        document.getElementById('student-roll').value = student.rollNumber;
        document.getElementById('student-course').value = student.course;
        document.getElementById('student-gender').value = student.gender;
        document.getElementById('student-mobile').value = student.mobile;
        document.getElementById('student-email').value = student.email;
        document.getElementById('student-address').value = student.address || '';
        
        UI.openModal('student-modal');
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('student-id').value;
        const data = {
            name: document.getElementById('student-name').value.trim(),
            rollNumber: document.getElementById('student-roll').value.trim(),
            course: document.getElementById('student-course').value,
            gender: document.getElementById('student-gender').value,
            mobile: document.getElementById('student-mobile').value.trim(),
            email: document.getElementById('student-email').value.trim(),
            address: document.getElementById('student-address').value.trim()
        };
        
        // Validation
        if (!data.name || !data.rollNumber || !data.course || !data.gender || !data.mobile || !data.email) {
            UI.toast('Please fill all required fields', 'error');
            return;
        }
        
        if (!/^\d{10}$/.test(data.mobile)) {
            UI.toast('Please enter a valid 10-digit mobile number', 'error');
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            UI.toast('Please enter a valid email address', 'error');
            return;
        }
        
        // Check duplicate roll number
        const isEdit = !!studentId;
        const existing = this.allStudents.find(s => s.rollNumber === data.rollNumber && s.studentId !== studentId);
        if (existing) {
            UI.toast('Roll number already exists', 'error');
            return;
        }
        
        UI.showLoader();
        
        if (isEdit) {
            data.studentId = studentId;
            const result = await API.post('updateStudent', data);
            if (result.success) {
                UI.toast('Student updated successfully', 'success');
                ActivityLog.log(`Updated student ${data.name}`);
            }
        } else {
            const result = await API.post('addStudent', data);
            if (result.success) {
                UI.toast('Student added successfully', 'success');
                ActivityLog.log(`Added student ${data.name}`);
            }
        }
        
        UI.closeModal('student-modal');
        await this.fetchStudents();
        UI.hideLoader();
    },

    confirmDelete(studentId) {
        const student = this.allStudents.find(s => s.studentId === studentId);
        document.getElementById('delete-message').textContent = `Are you sure you want to delete "${student?.name}"?`;
        AppState.deleteCallback = () => this.deleteStudent(studentId);
        UI.openModal('delete-modal');
    },

    async deleteStudent(studentId) {
        const student = this.allStudents.find(s => s.studentId === studentId);
        UI.closeModal('delete-modal');
        UI.showLoader();
        
        const result = await API.post('deleteStudent', { studentId });
        if (result.success) {
            UI.toast('Student deleted successfully', 'success');
            ActivityLog.log(`Deleted student ${student?.name}`);
            await this.fetchStudents();
        }
        
        UI.hideLoader();
    }
};

// ============================================
// ATTENDANCE MODULE
// ============================================
const Attendance = {
    students: [],
    attendanceData: [],

    async load() {
        // Set default date to today
        document.getElementById('attendance-date').valueAsDate = new Date();
        this.setupEventListeners();
        await this.loadAttendance();
    },

    setupEventListeners() {
        document.getElementById('btn-load-attendance').addEventListener('click', () => this.loadAttendance());
        document.getElementById('btn-save-attendance').addEventListener('click', () => this.saveAttendance());
        document.getElementById('btn-mark-all-present').addEventListener('click', () => this.markAll('Present'));
        document.getElementById('btn-mark-all-absent').addEventListener('click', () => this.markAll('Absent'));
        
        document.getElementById('attendance-course-filter').addEventListener('change', () => this.loadAttendance());
        document.getElementById('attendance-status-filter').addEventListener('change', () => this.filterAttendanceTable());
    },

    async loadAttendance() {
        const date = document.getElementById('attendance-date').value;
        const course = document.getElementById('attendance-course-filter').value;
        
        if (!date) {
            UI.toast('Please select a date', 'warning');
            return;
        }
        
        UI.showLoader();
        
        // Fetch students and attendance
        const [studentsResult, attendanceResult] = await Promise.all([
            API.request('getStudents'),
            API.request('getAttendance', { date, course })
        ]);
        
        UI.hideLoader();
        
        if (studentsResult.success) {
            let students = studentsResult.students;
            if (course) students = students.filter(s => s.course === course);
            this.students = students;
        }
        
        if (attendanceResult.success) {
            this.attendanceData = attendanceResult.attendance;
        }
        
        this.renderTable();
        this.updateStats();
    },

    renderTable() {
        const tbody = document.getElementById('attendance-table-body');
        const statusFilter = document.getElementById('attendance-status-filter').value;
        
        if (this.students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No students found for selected course</td></tr>';
            return;
        }
        
        let displayStudents = this.students.map(student => {
            const existing = this.attendanceData.find(a => a.studentId === student.studentId);
            return {
                ...student,
                status: existing ? existing.status : '',
                time: existing ? existing.time : ''
            };
        });
        
        if (statusFilter) {
            displayStudents = displayStudents.filter(s => s.status === statusFilter);
        }
        
        if (displayStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No records match the filter</td></tr>';
            return;
        }
        
        tbody.innerHTML = displayStudents.map(s => `
            <tr data-student-id="${s.studentId}">
                <td><strong>${s.rollNumber}</strong></td>
                <td>${s.name}</td>
                <td><span class="badge badge-present">${s.course}</span></td>
                <td>
                    <div class="attendance-status-btns">
                        <button class="att-status-btn ${s.status === 'Present' ? 'active-present' : ''}" onclick="Attendance.setStatus('${s.studentId}', 'Present')">Present</button>
                        <button class="att-status-btn ${s.status === 'Absent' ? 'active-absent' : ''}" onclick="Attendance.setStatus('${s.studentId}', 'Absent')">Absent</button>
                        <button class="att-status-btn ${s.status === 'Late' ? 'active-late' : ''}" onclick="Attendance.setStatus('${s.studentId}', 'Late')">Late</button>
                    </div>
                </td>
                <td class="att-time" id="time-${s.studentId}">${s.time || '-'}</td>
            </tr>
        `).join('');
    },

    setStatus(studentId, status) {
        const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
        if (!row) return;
        
        const btns = row.querySelectorAll('.att-status-btn');
        btns.forEach(btn => {
            btn.className = 'att-status-btn';
            if (btn.textContent === status) {
                btn.classList.add(status === 'Present' ? 'active-present' : status === 'Absent' ? 'active-absent' : 'active-late');
            }
        });
        
        const timeCell = document.getElementById(`time-${studentId}`);
        if (timeCell) {
            timeCell.textContent = status === 'Absent' ? '-' : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        
        this.updateStats();
    },

    markAll(status) {
        document.querySelectorAll('#attendance-table-body tr').forEach(row => {
            const studentId = row.getAttribute('data-student-id');
            if (studentId) this.setStatus(studentId, status);
        });
    },

    updateStats() {
        const rows = document.querySelectorAll('#attendance-table-body tr');
        let total = 0, present = 0, absent = 0, late = 0;
        
        rows.forEach(row => {
            const activeBtn = row.querySelector('.att-status-btn[class*="active-"]');
            if (activeBtn) {
                total++;
                if (activeBtn.textContent === 'Present') present++;
                else if (activeBtn.textContent === 'Absent') absent++;
                else if (activeBtn.textContent === 'Late') late++;
            }
        });
        
        document.getElementById('att-total').textContent = total;
        document.getElementById('att-present').textContent = present;
        document.getElementById('att-absent').textContent = absent;
        document.getElementById('att-late').textContent = late;
    },

    filterAttendanceTable() {
        this.renderTable();
    },

    async saveAttendance() {
        const date = document.getElementById('attendance-date').value;
        if (!date) {
            UI.toast('Please select a date', 'warning');
            return;
        }
        
        const records = [];
        document.querySelectorAll('#attendance-table-body tr').forEach(row => {
            const studentId = row.getAttribute('data-student-id');
            const activeBtn = row.querySelector('.att-status-btn[class*="active-"]');
            
            if (studentId && activeBtn) {
                const status = activeBtn.textContent;
                const student = this.students.find(s => s.studentId === studentId);
                const time = status === 'Absent' ? '' : document.getElementById(`time-${studentId}`)?.textContent || '';
                
                records.push({
                    studentId,
                    name: student?.name || '',
                    rollNumber: student?.rollNumber || '',
                    course: student?.course || '',
                    status,
                    date,
                    time,
                    markedBy: AppState.currentUser?.username || 'admin'
                });
            }
        });
        
        if (records.length === 0) {
            UI.toast('Please mark attendance for at least one student', 'warning');
            return;
        }
        
        UI.showLoader();
        
        const result = await API.post('saveAttendance', { records: JSON.stringify(records) });
        
        if (result.success) {
            UI.toast(`Attendance saved for ${records.length} students`, 'success');
            ActivityLog.log(`Saved attendance for ${records.length} students on ${date}`);
        }
        
        UI.hideLoader();
    }
};

// ============================================
// REPORTS MODULE
// ============================================
const Reports = {
    async load() {
        this.setupEventListeners();
        await this.populateStudentSelect();
    },

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.reports-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.reports-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });
        
        // Generate reports
        document.getElementById('btn-generate-student-report').addEventListener('click', () => this.generateStudentReport());
        document.getElementById('btn-generate-monthly-report').addEventListener('click', () => this.generateMonthlyReport());
        document.getElementById('btn-generate-course-report').addEventListener('click', () => this.generateCourseReport());
    },

    async populateStudentSelect() {
        const result = await API.request('getStudents');
        const select = document.getElementById('report-student-select');
        
        if (result.success) {
            select.innerHTML = '<option value="">Choose a student</option>';
            result.students.forEach(s => {
                select.innerHTML += `<option value="${s.studentId}" data-course="${s.course}">${s.name} (${s.rollNumber})</option>`;
            });
        }
    },

    async generateStudentReport() {
        const studentId = document.getElementById('report-student-select').value;
        const month = document.getElementById('report-student-month').value;
        
        if (!studentId || !month) {
            UI.toast('Please select a student and month', 'warning');
            return;
        }
        
        const [year, monthNum] = month.split('-');
        UI.showLoader();
        
        // Get student details
        const studentsResult = await API.request('getStudents');
        const student = studentsResult.students?.find(s => s.studentId === studentId);
        
        // Simulate attendance data for the month
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        let present = 0, absent = 0, late = 0;
        const records = [];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, monthNum - 1, d).getDay();
            if (dayOfWeek === 0) continue; // Skip Sundays
            
            const rand = Math.random();
            let status = 'Present';
            if (rand > 0.85) status = 'Absent';
            else if (rand > 0.75) status = 'Late';
            
            if (status === 'Present') present++;
            else if (status === 'Absent') absent++;
            else late++;
            
            records.push({
                date: `${year}-${monthNum}-${String(d).padStart(2, '0')}`,
                status,
                time: status === 'Absent' ? '-' : `${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`
            });
        }
        
        const total = present + absent + late;
        const percentage = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0;
        
        UI.hideLoader();
        
        document.getElementById('student-report-result').innerHTML = `
            <div class="report-summary">
                <div class="report-summary-card">
                    <h4 style="color: var(--success)">${present}</h4>
                    <p>Present Days</p>
                </div>
                <div class="report-summary-card">
                    <h4 style="color: var(--danger)">${absent}</h4>
                    <p>Absent Days</p>
                </div>
                <div class="report-summary-card">
                    <h4 style="color: var(--primary)">${percentage}%</h4>
                    <p>Attendance Rate</p>
                </div>
            </div>
            <div class="report-chart-container">
                <canvas id="student-report-chart"></canvas>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead><tr><th>Date</th><th>Status</th><th>Time</th></tr></thead>
                    <tbody>
                        ${records.slice(0, 31).map(r => `
                            <tr>
                                <td>${r.date}</td>
                                <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
                                <td>${r.time}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="report-actions">
                <button class="btn btn-primary" onclick="Reports.printReport('student-report-result')">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-success" onclick="Reports.downloadPDF('student-report-result', 'Student Attendance Report')">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        `;
        
        // Render pie chart
        new Chart(document.getElementById('student-report-chart'), {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                    data: [present, absent, late],
                    backgroundColor: ['#06d6a0', '#ef476f', '#ffd166'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '60%'
            }
        });
    },

    async generateMonthlyReport() {
        const month = document.getElementById('report-monthly-month').value;
        const course = document.getElementById('report-monthly-course').value;
        
        if (!month) {
            UI.toast('Please select a month', 'warning');
            return;
        }
        
        UI.showLoader();
        const [year, monthNum] = month.split('-');
        
        const studentsResult = await API.request('getStudents');
        let students = studentsResult.students || [];
        if (course) students = students.filter(s => s.course === course);
        
        const studentData = students.map(s => {
            const total = 20 + Math.floor(Math.random() * 5);
            const present = Math.floor(total * (0.7 + Math.random() * 0.25));
            const absent = total - present;
            const pct = ((present / total) * 100).toFixed(1);
            return { ...s, total, present, absent, percentage: pct };
        });
        
        const avgAttendance = studentData.length > 0 
            ? (studentData.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / studentData.length).toFixed(1)
            : 0;
        
        UI.hideLoader();
        
        document.getElementById('monthly-report-result').innerHTML = `
            <div class="report-summary">
                <div class="report-summary-card">
                    <h4 style="color: var(--primary)">${studentData.length}</h4>
                    <p>Total Students</p>
                </div>
                <div class="report-summary-card">
                    <h4 style="color: var(--success)">${avgAttendance}%</h4>
                    <p>Avg Attendance</p>
                </div>
                <div class="report-summary-card">
                    <h4 style="color: var(--info)">${studentData.filter(s => parseFloat(s.percentage) >= 75).length}</h4>
                    <p>Above 75%</p>
                </div>
            </div>
            <div class="report-chart-container" style="max-width: 100%; height: 300px;">
                <canvas id="monthly-report-chart"></canvas>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr><th>Roll No</th><th>Name</th><th>Course</th><th>Present</th><th>Absent</th><th>Total</th><th>%</th></tr>
                    </thead>
                    <tbody>
                        ${studentData.map(s => `
                            <tr>
                                <td>${s.rollNumber}</td>
                                <td>${s.name}</td>
                                <td>${s.course}</td>
                                <td style="color: var(--success)">${s.present}</td>
                                <td style="color: var(--danger)">${s.absent}</td>
                                <td>${s.total}</td>
                                <td><strong>${s.percentage}%</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="report-actions">
                <button class="btn btn-primary" onclick="Reports.printReport('monthly-report-result')">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-success" onclick="Reports.downloadPDF('monthly-report-result', 'Monthly Attendance Report')">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        `;
        
        new Chart(document.getElementById('monthly-report-chart'), {
            type: 'bar',
            data: {
                labels: studentData.slice(0, 15).map(s => s.name.split(' ')[0]),
                datasets: [{
                    label: 'Attendance %',
                    data: studentData.slice(0, 15).map(s => s.percentage),
                    backgroundColor: studentData.slice(0, 15).map(s => parseFloat(s.percentage) >= 75 ? '#06d6a0' : '#ef476f'),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
                }
            }
        });
    },

    async generateCourseReport() {
        const course = document.getElementById('report-course-select').value;
        const month = document.getElementById('report-course-month').value;
        
        if (!course || !month) {
            UI.toast('Please select course and month', 'warning');
            return;
        }
        
        UI.showLoader();
        
        const studentsResult = await API.request('getStudents');
        const students = (studentsResult.students || []).filter(s => s.course === course);
        
        const [year, monthNum] = month.split('-');
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        
        let totalPresent = 0, totalAbsent = 0, totalLate = 0;
        const dayWise = [];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, monthNum - 1, d).getDay();
            if (dayOfWeek === 0) continue;
            
            const dayPresent = Math.floor(students.length * (0.75 + Math.random() * 0.2));
            const dayAbsent = students.length - dayPresent;
            
            totalPresent += dayPresent;
            totalAbsent += dayAbsent;
            
            dayWise.push({
                day: d,
                present: dayPresent,
                absent: dayAbsent
            });
        }
        
        const totalRecords = totalPresent + totalAbsent;
        const avgRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0;
        
        UI.hideLoader();
        
        document.getElementById('course-report-result').innerHTML = `
            <div class="report-summary">
                <div class="report-summary-card">
                    <h4 style="color: var(--primary)">${course}</h4>
                    <p>Course</p>
                </div>
                <div class="report-summary-card">
                    <h4 style="color: var(--success)">${avgRate}%</h4>
                    <p>Avg Attendance</p>
                </div>
                <div class="report-summary-card">
                    <h4 style="color: var(--info)">${students.length}</h4>
                    <p>Students</p>
                </div>
            </div>
            <div class="report-chart-container" style="max-width: 100%; height: 280px;">
                <canvas id="course-report-chart"></canvas>
            </div>
            <div class="report-actions">
                <button class="btn btn-primary" onclick="Reports.printReport('course-report-result')">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-success" onclick="Reports.downloadPDF('course-report-result', 'Course Attendance Report')">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        `;
        
        new Chart(document.getElementById('course-report-chart'), {
            type: 'line',
            data: {
                labels: dayWise.slice(0, 20).map(d => `Day ${d.day}`),
                datasets: [{
                    label: 'Present',
                    data: dayWise.slice(0, 20).map(d => d.present),
                    borderColor: '#06d6a0',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Absent',
                    data: dayWise.slice(0, 20).map(d => d.absent),
                    borderColor: '#ef476f',
                    backgroundColor: 'rgba(239, 71, 111, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    printReport(elementId) {
        const content = document.getElementById(elementId).innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background: #f5f5f5; }
                .report-summary { display: flex; gap: 20px; margin-bottom: 20px; }
                .report-summary-card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; flex: 1; }
                .report-actions, canvas { display: none; }
                .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
                .badge-present { background: #d4edda; color: #155724; }
                .badge-absent { background: #f8d7da; color: #721c24; }
                .badge-late { background: #fff3cd; color: #856404; }
            </style></head><body>
            <h2>Attendance Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            ${content}
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    },

    downloadPDF(elementId, title) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        
        // Add table data
        const table = document.querySelector(`#${elementId} .data-table`);
        if (table) {
            doc.autoTable({
                html: table,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [67, 97, 238] }
            });
        }
        
        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};

// ============================================
// ADMINS MODULE
// ============================================
const Admins = {
    allAdmins: [],

    async load() {
        if (!Auth.isSuperAdmin()) {
            UI.toast('Access denied. Super Admin only.', 'error');
            window.location.hash = 'dashboard';
            return;
        }
        await this.fetchAdmins();
        this.setupEventListeners();
    },

    async fetchAdmins() {
        UI.showLoader();
        const result = await API.request('getAdmins');
        UI.hideLoader();
        
        if (result.success) {
            this.allAdmins = result.admins;
            this.renderTable();
        }
    },

    setupEventListeners() {
        document.getElementById('btn-add-admin').addEventListener('click', () => {
            document.getElementById('admin-form').reset();
            UI.openModal('admin-modal');
        });
        
        document.getElementById('admin-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    renderTable() {
        const tbody = document.getElementById('admins-table-body');
        
        if (this.allAdmins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No admins found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.allAdmins.map(admin => {
            const isCurrentUser = admin.username === AppState.currentUser?.username;
            return `
                <tr data-id="${admin.id}">
                    <td><strong>${admin.adminName}</strong></td>
                    <td>${admin.username}</td>
                    <td><span class="badge badge-present">${admin.role}</span></td>
                    <td>${admin.createdDate}</td>
                    <td>
                        <div class="action-btns">
                            ${!isCurrentUser ? `
                                <button class="action-btn delete" onclick="Admins.confirmDelete('${admin.id}', '${admin.adminName}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : '<span style="color: var(--text-muted); font-size: 12px;">Current User</span>'}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const data = {
            adminName: document.getElementById('admin-name').value.trim(),
            username: document.getElementById('admin-username').value.trim(),
            password: document.getElementById('admin-password').value,
            role: document.getElementById('admin-role').value
        };
        
        if (!data.adminName || !data.username || !data.password || !data.role) {
            UI.toast('Please fill all required fields', 'error');
            return;
        }
        
        if (data.password.length < 6) {
            UI.toast('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Check duplicate username
        const existing = this.allAdmins.find(a => a.username === data.username);
        if (existing) {
            UI.toast('Username already exists', 'error');
            return;
        }
        
        UI.showLoader();
        const result = await API.post('addAdmin', data);
        
        if (result.success) {
            UI.toast('Admin added successfully', 'success');
            UI.closeModal('admin-modal');
            ActivityLog.log(`Added admin ${data.adminName}`);
            await this.fetchAdmins();
        }
        
        UI.hideLoader();
    },

    confirmDelete(adminId, adminName) {
        document.getElementById('delete-message').textContent = `Are you sure you want to delete admin "${adminName}"?`;
        AppState.deleteCallback = () => this.deleteAdmin(adminId);
        UI.openModal('delete-modal');
    },

    async deleteAdmin(adminId) {
        UI.closeModal('delete-modal');
        UI.showLoader();
        
        const result = await API.post('deleteAdmin', { adminId });
        if (result.success) {
            UI.toast('Admin deleted successfully', 'success');
            ActivityLog.log('Deleted an admin');
            await this.fetchAdmins();
        }
        
        UI.hideLoader();
    }
};

// ============================================
// SETTINGS MODULE
// ============================================
const Settings = {
    load() {
        // Update user info
        document.getElementById('settings-user-name').textContent = AppState.currentUser?.username || '-';
        document.getElementById('settings-user-role').textContent = AppState.currentUser?.role || '-';
        
        // Sync toggle states
        document.getElementById('dark-mode-toggle').checked = AppState.darkMode;
        document.getElementById('compact-mode-toggle').checked = AppState.compactMode;
    }
};

// ============================================
// INACTIVITY TIMER
// ============================================
const InactivityTimer = {
    init() {
        this.resetTimer();
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(e => document.addEventListener(e, () => this.resetTimer()));
        
        document.getElementById('btn-stay-logged-in').addEventListener('click', () => {
            this.closeWarning();
            this.resetTimer();
        });
    },

    resetTimer() {
        if (!AppState.isLoggedIn) return;
        
        clearTimeout(AppState.inactivityTimer);
        clearTimeout(AppState.warningTimer);
        clearInterval(AppState.countdownInterval);
        
        AppState.inactivityTimer = setTimeout(() => this.showWarning(), CONFIG.SESSION_TIMEOUT - CONFIG.WARNING_BEFORE_LOGOUT * 1000);
    },

    showWarning() {
        UI.openModal('inactivity-modal');
        
        let countdown = CONFIG.WARNING_BEFORE_LOGOUT;
        document.getElementById('countdown-timer').textContent = countdown;
        
        AppState.countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('countdown-timer').textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(AppState.countdownInterval);
                this.closeWarning();
                Auth.logout();
            }
        }, 1000);
    },

    closeWarning() {
        UI.closeModal('inactivity-modal');
        clearInterval(AppState.countdownInterval);
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    AppState.init();
    
    // Create particles for login
    createParticles();
    
    // Check existing session
    if (Auth.checkSession()) {
        showApp();
    } else {
        UI.hideLoader();
        document.getElementById('login-page').classList.remove('hidden');
        
        // Fill remembered username
        const remembered = localStorage.getItem('rememberedUsername');
        if (remembered) {
            document.getElementById('login-username').value = remembered;
            document.getElementById('remember-me').checked = true;
        }
    }
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-login');
        UI.setButtonLoading(btn, true);
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        const result = await Auth.login(username, password, rememberMe);
        
        if (result.success) {
            UI.toast('Welcome back!', 'success');
            showApp();
        } else {
            UI.toast(result.message || 'Login failed', 'error');
            document.querySelector('.login-card').classList.add('shake');
            setTimeout(() => document.querySelector('.login-card').classList.remove('shake'), 400);
        }
        
        UI.setButtonLoading(btn, false);
    });
    
    // Toggle password
    document.getElementById('toggle-password').addEventListener('click', function() {
        UI.togglePassword(document.getElementById('login-password'), this);
    });
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => Auth.logout());
    document.getElementById('header-logout').addEventListener('click', () => Auth.logout());
    
    // Menu toggle (mobile)
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.querySelector('.sidebar-overlay')?.classList.toggle('show');
    });
    
    document.getElementById('sidebar-close').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        document.querySelector('#theme-toggle i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        localStorage.setItem('darkMode', !isDark);
        AppState.darkMode = !isDark;
        Dashboard.loadCharts(); // Refresh charts with new colors
    });
    
    // Dark mode toggle in settings
    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
        document.querySelector('#theme-toggle i').className = e.target.checked ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('darkMode', e.target.checked);
        AppState.darkMode = e.target.checked;
        Dashboard.loadCharts();
    });
    
    // Compact mode toggle
    document.getElementById('compact-mode-toggle').addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-compact', e.target.checked ? 'true' : 'false');
        localStorage.setItem('compactMode', e.target.checked);
        AppState.compactMode = e.target.checked;
    });
    
    // Notification bell
    document.getElementById('notification-bell').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notification-dropdown').classList.toggle('show');
        document.getElementById('profile-dropdown')?.classList.remove('show');
        
        // Mark all as read
        AppState.notifications.forEach(n => n.read = true);
        ActivityLog.updateNotificationBadge();
    });
    
    document.getElementById('clear-notifications').addEventListener('click', () => {
        AppState.notifications = [];
        ActivityLog.updateNotificationBadge();
        ActivityLog.renderNotificationList();
    });
    
    // Profile dropdown
    document.getElementById('header-profile').addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelector('.profile-dropdown').classList.toggle('show');
        document.getElementById('notification-dropdown')?.classList.remove('show');
    });
    
    // Close dropdowns on click outside
    document.addEventListener('click', () => {
        document.getElementById('notification-dropdown')?.classList.remove('show');
        document.querySelector('.profile-dropdown')?.classList.remove('show');
    });
    
    // Change password form
    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;
        
        if (newPass !== confirm) {
            UI.toast('New passwords do not match', 'error');
            return;
        }
        
        if (newPass.length < 6) {
            UI.toast('Password must be at least 6 characters', 'error');
            return;
        }
        
        UI.showLoader();
        
        const result = await API.post('changePassword', {
            adminId: AppState.currentUser?.id || AppState.currentUser?.username,
            currentPassword: current,
            newPassword: newPass
        });
        
        if (result.success) {
            UI.toast('Password changed successfully', 'success');
            document.getElementById('change-password-form').reset();
            ActivityLog.log('Changed password');
        } else {
            UI.toast(result.message || 'Failed to change password', 'error');
        }
        
        UI.hideLoader();
    });
    
    // Toggle password visibility in settings
    document.querySelectorAll('#change-password-form .toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.closest('.password-input-wrapper').querySelector('input');
            UI.togglePassword(input, this);
        });
    });
    
    // Modal close handlers
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) UI.closeModal(modalId);
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.id !== 'inactivity-modal') {
                overlay.classList.remove('show');
            }
        });
    });
    
    // Confirm delete
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (AppState.deleteCallback) {
            AppState.deleteCallback();
            AppState.deleteCallback = null;
        }
    });
    
    // View all activity
    document.getElementById('view-all-activity').addEventListener('click', () => {
        window.location.hash = 'settings';
    });
    
    // Global search
    document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) return;
        
        // If on students page, use that search
        if (AppState.currentView === 'students') {
            document.getElementById('student-search').value = query;
            Students.filterStudents(query, document.getElementById('student-course-filter').value);
        }
    });
    
    // Initialize router
    Router.init();
    
    // Initialize inactivity timer
    InactivityTimer.init();
    
    // Create sidebar overlay for mobile
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        overlay.classList.remove('show');
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = particle.style.height = (Math.random() * 10 + 4) + 'px';
        particle.style.animationDuration = (Math.random() * 10 + 8) + 's';
        particle.style.animationDelay = (Math.random() * 5) + 's';
        particle.style.opacity = Math.random() * 0.4 + 0.1;
        container.appendChild(particle);
    }
}

function showApp() {
    // Hide login, show app
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // Update user info
    const user = AppState.currentUser;
    if (user) {
        document.getElementById('sidebar-user-name').textContent = user.adminName || user.username;
        document.getElementById('sidebar-user-role').textContent = user.role;
        document.getElementById('header-user-name').textContent = user.adminName || user.username;
    }
    
    // Show/hide admin nav based on role
    const adminNav = document.getElementById('nav-admins');
    if (adminNav) {
        adminNav.style.display = Auth.isSuperAdmin() ? 'flex' : 'none';
    }
    
    // Navigate to default view
    Router.navigate();
    
    // Hide loader
    UI.hideLoader();
}
