const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const userRoutes = require('./userRoutes/userRoutes');
const veterinarianRoutes = require('./veterinarianRoutes/veterinaryRoutes');
const clinicRoutes = require('./clinicRoutes/clinicRoutes');
const adminRoutes = require('./adminRoutes/adminRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/veterinarian', veterinarianRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Test successful!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});