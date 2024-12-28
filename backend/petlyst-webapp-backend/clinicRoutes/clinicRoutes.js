// ... existing code ...

// Add a new clinic (requires verified status)
router.post('/add', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { name, address, phone_number, location, description } = req.body;
    const operator_id = req.user.userId;

    // Validate required field
    if (!name) {
      return res.status(400).json({ message: 'Clinic name is required' });
    }

    // Insert clinic into database with pending verification status
    const query = `
      INSERT INTO clinics (
        name, 
        address, 
        phone_number, 
        location, 
        description, 
        operator_id,
        verification_status
      ) 
      VALUES (
        $1, 
        $2, 
        $3, 
        $4, 
        $5, 
        $6, 
        'pending'::clinic_status_enum
      ) 
      RETURNING *
    `;

    const values = [
      name, 
      address || null, 
      phone_number || null, 
      location || null, 
      description || null, 
      operator_id
    ];

    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await pool.query(query, values);
    console.log('Query result:', result.rows[0]);

    res.status(201).json({
      message: "Clinic added successfully",
      clinic: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
