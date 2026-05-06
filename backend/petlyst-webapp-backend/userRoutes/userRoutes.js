const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const authenticateToken = require('../middleware/authenticateToken');

// Password validation function
const validatePassword = (password) => {
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
        logger.info('Received registration request with body:', req.body);
        
        const { name, surname, email, password, user_type } = req.body;

        // Detailed validation logging
        logger.info('Extracted fields:', { name, surname, email, password: '***', user_type });

        // Check required fields
        if (!name || !surname || !email || !password || !user_type) {
            logger.info('Missing fields:', {
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
        
        // Create user type specific profile
        try {
            await createUserTypeProfile(newUser.id, user_type);
            
            // For veterinarians, directly set status to not_verified
            if (user_type === 'veterinarian') {
                // Direct SQL update to ensure status is not_verified
                const updateQuery = {
                    text: `UPDATE "veterinarians" 
                           SET veterinarian_verification_status = 'not_verified' 
                           WHERE veterinarian_id = $1`,
                    values: [newUser.id]
                };
                await pool.query(updateQuery);
                logger.info('Veterinarian status set to not_verified');
            }
        } catch (profileError) {
            logger.error(`Error creating ${user_type} profile:`, profileError);
            // Continue despite profile creation error
        }
        
        res.status(201).json({ 
            message: 'User registered successfully', 
            user: newUser 
        });

    } catch (error) {
        logger.error('Registration error:', error);
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
        logger.info('Login attempt for:', { email: req.body.email });
        
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
            logger.info('Non-admin user attempted to access admin route:', email);
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
        logger.error('Login Error:', error);
        res.status(500).json({
            message: 'Error during Login Process',
            error: error.message
        });
    }
});

// Configure nodemailer for GoDaddy email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true,
  logger: true
});

// Verify transporter connection
transporter.verify(function(error, _success) {
  if (error) {
    logger.error('SMTP connection error:', error);
    logger.error('SMTP settings:', {
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      user: process.env.EMAIL_USER
    });
  } else {
    logger.info('SMTP server is ready to send emails');
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const userQuery = 'SELECT user_id, user_email FROM users WHERE user_email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate verification code
    const verificationCode = crypto.randomInt(1000, 9999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store the code in database
    const insertQuery = `
      INSERT INTO password_reset_tokens (user_id, user_email, reset_code, reset_token_expires_at)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(insertQuery, [userResult.rows[0].user_id, email, verificationCode, expiresAt]);

    // Clean up old tokens for this user
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_email = $1 AND reset_token_id NOT IN (SELECT reset_token_id FROM password_reset_tokens WHERE user_email = $1 ORDER BY reset_token_created_at DESC LIMIT 1)',
      [email]
    );

    // Send email
    const mailOptions = {
      from: {
        name: 'Petlyst Support',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset Code - Petlyst',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
          <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" alt="Petlyst Logo" style="width: 180px; height: auto;">
            </div>
            
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 30px;">
              Password Reset Code
            </h1>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
              You've requested to reset your password. Here's your verification code:
            </p>
            
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <h2 style="color: white; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 700;">
                ${verificationCode}
              </h2>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 20px;">
              This code will expire in <strong>15 minutes</strong>.
            </p>
            
            <div style="border-top: 1px solid #e2e8f0; margin: 30px 0; padding-top: 30px;">
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
                If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Petlyst. All rights reserved. Yes, we're Super Official
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully to:', email);
      
      res.json({
        success: true,
        message: 'Verification code has been sent to your email'
      });
    } catch (emailError) {
      logger.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code email',
        error: emailError.message
      });
    }

  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
});

// Verify reset code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Check if reset token exists and is valid
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE user_email = $1 
      AND reset_code = $2 
      AND reset_token_expires_at > CURRENT_TIMESTAMP 
      AND reset_token_is_used = FALSE 
      ORDER BY reset_token_created_at DESC 
      LIMIT 1
    `;
    const tokenResult = await pool.query(tokenQuery, [email, code]);

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    res.json({
      success: true,
      message: 'Verification code is valid'
    });

  } catch (error) {
    logger.error('Code verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
});

// Verify code and reset password
router.post('/verify-reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        error: 'INVALID_PASSWORD',
        passwordErrors: passwordValidation.errors
      });
    }

    // Check if reset token exists and is valid
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE user_email = $1 
      AND reset_code = $2 
      AND reset_token_expires_at > CURRENT_TIMESTAMP 
      AND reset_token_is_used = FALSE 
      ORDER BY reset_token_created_at DESC 
      LIMIT 1
    `;
    const tokenResult = await pool.query(tokenQuery, [email, code]);

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const updateQuery = 'UPDATE users SET user_password = $1 WHERE user_email = $2';
    await pool.query(updateQuery, [hashedPassword, email]);

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET reset_token_is_used = TRUE WHERE reset_token_id = $1',
      [tokenResult.rows[0].reset_token_id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    logger.error('Password reset verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Add cleanup function
async function cleanupExpiredTokens() {
  try {
    const query = `
      DELETE FROM password_reset_tokens 
      WHERE reset_token_expires_at < CURRENT_TIMESTAMP 
      OR reset_token_is_used = TRUE
    `;
    await pool.query(query);
    logger.info('Expired or used password reset tokens cleaned up');
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Update Theme Preference - Experimental
router.post('/update-theme', authenticateToken, async (req, res) => {
    try {
      const { theme } = req.body;
      const userId = req.user.userId;
  
      const query = `
        UPDATE "users" 
        SET theme_preference = $1 
        WHERE user_id = $2 
        RETURNING theme_preference
      `;
  
      const result = await pool.query(query, [theme, userId]);
  
      res.json({ theme: result.rows[0].theme_preference });
    } catch (error) {
      logger.error('Error updating theme preference:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Theme Preference - Experimental
router.get('/theme-preference', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
  
      const query = `
        SELECT theme_preference 
        FROM "users" 
        WHERE user_id = $1
      `;
  
      const result = await pool.query(query, [userId]);
      res.json({ theme: result.rows[0].theme_preference });
    } catch (error) {
      logger.error('Error fetching theme preference:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Function to create user type specific profile
async function createUserTypeProfile(userId, userType) {
    try {
        logger.info(`Creating ${userType} profile for user ID: ${userId}`);
        
        let result = null;
        
        if (userType === 'pet_owner') {
            // Insert into pet_owners table (doğru tablo adı)
            const petOwnerQuery = {
                text: `INSERT INTO "pet_owners" (pet_owner_id) 
                      VALUES ($1) 
                      RETURNING pet_owner_id`,
                values: [userId]
            };
            result = await pool.query(petOwnerQuery);
            logger.info('Pet owner profile created:', result.rows[0]);
            
        } else if (userType === 'veterinarian') {
            // Insert into veterinarians table with explicit not_verified status
            logger.info('Creating veterinarian profile with status: not_verified');
            const veterinarianQuery = {
                text: `INSERT INTO "veterinarians" (veterinarian_id, veterinarian_verification_status) 
                      VALUES ($1, 'not_verified') 
                      RETURNING veterinarian_id, veterinarian_verification_status`,
                values: [userId]
            };
            result = await pool.query(veterinarianQuery);
            logger.info('Veterinarian profile created with status:', result.rows[0]);
            
            // Double-check the status and force update if needed
            if (result.rows[0]?.veterinarian_verification_status !== 'not_verified') {
                logger.info('Status not set correctly, forcing update to not_verified');
                const updateQuery = {
                    text: `UPDATE "veterinarians" 
                           SET veterinarian_verification_status = 'not_verified' 
                           WHERE veterinarian_id = $1 
                           RETURNING veterinarian_id, veterinarian_verification_status`,
                    values: [userId]
                };
                result = await pool.query(updateQuery);
                logger.info('Updated veterinarian status:', result.rows[0]);
            }
        }
        
        return result?.rows[0] || null;
    } catch (error) {
        logger.error(`Error creating ${userType} profile:`, error);
        throw error;
    }
}

// API endpoint to create user type profile manually (for testing)
router.post('/create-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userType = req.user.userType;
        
        // Check if user exists
        const userQuery = {
            text: 'SELECT user_id, user_type FROM "users" WHERE user_id = $1',
            values: [userId]
        };
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if profile already exists
        if (userType === 'pet_owner') {
            const checkQuery = {
                text: 'SELECT pet_owner_id FROM "pet_owners" WHERE pet_owner_id = $1',
                values: [userId]
            };
            const checkResult = await pool.query(checkQuery);
            
            if (checkResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Pet owner profile already exists'
                });
            }
        } else if (userType === 'veterinarian') {
            const checkQuery = {
                text: 'SELECT veterinarian_id FROM "veterinarians" WHERE veterinarian_id = $1',
                values: [userId]
            };
            const checkResult = await pool.query(checkQuery);
            
            if (checkResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Veterinarian profile already exists'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }
        
        // Create profile
        const profile = await createUserTypeProfile(userId, userType);
        
        res.status(201).json({
            success: true,
            message: `${userType} profile created successfully`,
            profile
        });
        
    } catch (error) {
        logger.error('Error creating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create profile',
            error: error.message
        });
    }
});

// API endpoint to update all veterinarians with 'pending' status to 'not_verified'
router.post('/update-veterinarian-status', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        // Update all veterinarians with 'pending' status to 'not_verified'
        const updateQuery = {
            text: `UPDATE "veterinarians" 
                   SET veterinarian_verification_status = 'not_verified' 
                   WHERE veterinarian_verification_status = 'pending' 
                   RETURNING veterinarian_id, veterinarian_verification_status`
        };
        
        const result = await pool.query(updateQuery);
        
        res.status(200).json({
            success: true,
            message: `Updated ${result.rows.length} veterinarians from 'pending' to 'not_verified'`,
            updated: result.rows
        });
        
    } catch (error) {
        logger.error('Error updating veterinarian status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update veterinarian status',
            error: error.message
        });
    }
});

module.exports = router; 