const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const userRoutes = require('./userRoutes/userRoutes');
const veterinarianRoutes = require('./veterinarianRoutes/veterinaryRoutes');
const clinicRoutes = require('./clinicRoutes/clinicRoutes');
const adminRoutes = require('./adminRoutes/adminRoutes');
const petRoutes = require('./petRoutes/petRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/veterinarian', veterinarianRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pets', petRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Petlyst API' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        availableRoutes: [
            '/api/users',
            '/api/veterinarian',
            '/api/clinics',
            '/api/admin',
            '/api/pets'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- /api/users');
    console.log('- /api/veterinarian');
    console.log('- /api/clinics');
    console.log('- /api/admin');
    console.log('- /api/pets');
});