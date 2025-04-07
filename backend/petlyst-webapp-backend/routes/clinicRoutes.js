// Send direct message to clinic
router.post('/:clinicId/send-message', async (req, res) => {
    const { clinicId } = req.params;
    const { message, senderId } = req.body;
    
    try {
        const client = await pool.connect();
        
        // Check if clinic allows direct messages
        const clinicResult = await client.query(
            `SELECT allow_direct_messages 
             FROM clinics 
             WHERE clinic_id = $1`,
            [clinicId]
        );
        
        if (clinicResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Clinic not found' 
            });
        }
        
        if (!clinicResult.rows[0].allow_direct_messages) {
            return res.status(403).json({ 
                success: false, 
                message: 'This clinic does not accept direct messages' 
            });
        }
        
        // Get clinic operator's user_id
        const operatorResult = await client.query(
            `SELECT user_id 
             FROM clinics 
             WHERE clinic_id = $1`,
            [clinicId]
        );
        
        if (operatorResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Clinic operator not found' 
            });
        }
        
        const operatorId = operatorResult.rows[0].user_id;
        
        // Insert message into database
        const messageResult = await client.query(
            `INSERT INTO messages (
                sender_id, 
                receiver_id, 
                message_content, 
                message_type,
                created_at
            ) VALUES ($1, $2, $3, 'direct_message', NOW())
            RETURNING message_id`,
            [senderId, operatorId, message]
        );
        
        client.release();
        
        res.json({
            success: true,
            message: 'Message sent successfully',
            messageId: messageResult.rows[0].message_id
        });
        
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending message' 
        });
    }
}); 