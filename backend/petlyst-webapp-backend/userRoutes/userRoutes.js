const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Password validation function
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]?)[A-Za-z\d@$!%*?&]{8,}$/;
    
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Postman -> POST http://localhost:3000/api/users/register
// Register endpoint
router.post('/register', async (req, res) => {
    try {
        console.log('Received registration request with body:', req.body);
        
        const { name, surname, email, password, user_type } = req.body;

        // Detailed validation logging
        console.log('Extracted fields:', { name, surname, email, password: '***', user_type });

        // Check required fields
        if (!name || !surname || !email || !password || !user_type) {
            console.log('Missing fields:', {
                name: !name,
                surname: !surname,
                email: !email,
                password: !password,
                user_type: !user_type
            });
            return res.status(400).json({ 
                message: 'All fields are required',
                missingFields: {
                    name: !name,
                    surname: !surname,
                    email: !email,
                    password: !password,
                    user_type: !user_type
                }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Invalid email format',
                error: 'INVALID_EMAIL'
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                message: 'Password does not meet security requirements',
                error: 'INVALID_PASSWORD',
                passwordErrors: passwordValidation.errors
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists',
                error: 'USER_EXISTS'
            });
        }

        // Create new user
        const newUser = await User.createUser(name, surname, email, password, user_type);
        res.status(201).json({ 
            message: 'User registered successfully', 
            user: newUser 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Encountered Error while Registering User',
            error: error.message 
        });
    }
});


// Postman -> POST http://localhost:3000/api/users/login
// Enhanced Login Endpoint with Admin Verification
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt for:', { email: req.body.email });
        
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and Password are Required',
                missingFields: {
                    email: !email,
                    password: !password
                }
            });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        // Validate password
        const isValidPassword = await User.validatePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        // Check if user is admin (for admin login)
        const isAdminRoute = req.path.includes('/admin') || req.headers['x-admin-request'];
        if (isAdminRoute && user.user_type !== 'admin') {
            console.log('Non-admin user attempted to access admin route:', email);
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.',
                error: 'UNAUTHORIZED_ACCESS'
            });
        }

        // Generate JWT token with user information
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                userType: user.user_type,
                name: user.name,
                surname: user.surname
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send success response with user details
        res.json({
            message: 'Login Successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                userType: user.user_type
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            message: 'Error during Login Process',
            error: error.message
        });
    }
});

module.exports = router; 