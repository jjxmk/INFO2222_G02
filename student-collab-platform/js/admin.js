// Admin management system
const ADMIN_CREDENTIALS = {
    email: 'admin@studentcollab.com',
    password: 'admin123' // In a real application, this should be hashed and stored securely
};

// User management
let users = JSON.parse(localStorage.getItem('users')) || [];

// Function to add a new user (admin only)
function addUser(name, email, password) {
    // Check if user already exists
    if (users.some(user => user.email === email)) {
        return { success: false, message: 'User already exists' };
    }

    // Add new user
    users.push({
        name,
        email,
        password, // In a real application, this should be hashed
        isActive: true,
        createdAt: new Date().toISOString()
    });

    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'User added successfully' };
}

// Function to validate user credentials
function validateUser(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
        return { success: false, message: 'Account is deactivated' };
    }

    return { 
        success: true, 
        user: {
            name: user.name,
            email: user.email
        }
    };
}

// Function to deactivate a user (admin only)
function deactivateUser(email) {
    const user = users.find(u => u.email === email);
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    user.isActive = false;
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'User deactivated successfully' };
}

// Function to activate a user (admin only)
function activateUser(email) {
    const user = users.find(u => u.email === email);
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    user.isActive = true;
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'User activated successfully' };
}

// Function to get all users (admin only)
function getAllUsers() {
    return users.map(user => ({
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt
    }));
}

// Function to check if current user is admin
function isAdmin() {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    return currentUser && currentUser.email === ADMIN_CREDENTIALS.email;
}

// Export functions for use in other files
window.adminSystem = {
    addUser,
    validateUser,
    deactivateUser,
    activateUser,
    getAllUsers,
    isAdmin,
    ADMIN_CREDENTIALS
}; 