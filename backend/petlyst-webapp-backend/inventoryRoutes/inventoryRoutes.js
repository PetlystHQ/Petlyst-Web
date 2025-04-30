const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');

// Get basic inventory info for a clinic
router.get('/:clinicId/inventory', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get basic inventory statistics - using the correct column names from the DB schema
    const itemsQuery = `SELECT COUNT(*) as total_items FROM inventory_items WHERE clinic_id = $1`;
    const categoriesQuery = `SELECT COUNT(*) as total_categories FROM inventory_categories WHERE clinic_id = $1`;
    const lowStockQuery = `
      SELECT COUNT(*) as low_stock_count 
      FROM inventory_items 
      WHERE clinic_id = $1 AND current_quantity <= min_quantity AND is_active = true
    `;

    const itemsResult = await pool.query(itemsQuery, [clinicId]);
    const categoriesResult = await pool.query(categoriesQuery, [clinicId]);
    const lowStockResult = await pool.query(lowStockQuery, [clinicId]);
    
    res.status(200).json({
      success: true,
      inventory: {
        totalItems: parseInt(itemsResult.rows[0].total_items),
        totalCategories: parseInt(categoriesResult.rows[0].total_categories),
        lowStockCount: parseInt(lowStockResult.rows[0].low_stock_count)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory info:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch inventory information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all inventory categories for a clinic
router.get('/:clinicId/inventory/categories', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get all categories for this clinic
    const query = `
      SELECT 
        id,
        name,
        description,
        parent_id,
        is_active
      FROM 
        inventory_categories
      WHERE 
        clinic_id = $1
      ORDER BY 
        name
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch inventory categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new inventory category
router.post('/:clinicId/inventory/categories', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    const { name, description, parent_id } = req.body;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Generate a unique ID for the category
    const categoryId = 'cat-' + Date.now().toString();

    // Create the new category
    const query = `
      INSERT INTO inventory_categories (
        id,
        name,
        description,
        parent_id,
        clinic_id,
        created_at,
        updated_at,
        created_by,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6, true)
      RETURNING *
    `;

    const result = await pool.query(query, [
      categoryId,
      name, 
      description, 
      parent_id, 
      clinicId,
      req.user.userId
    ]);
    
    res.status(201).json({
      success: true,
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating inventory category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create inventory category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update an inventory category
router.put('/:clinicId/inventory/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId, categoryId } = req.params;
    const { name, description, parent_id } = req.body;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Validate that the category exists and belongs to this clinic
    const checkQuery = `
      SELECT id FROM inventory_categories
      WHERE id = $1 AND clinic_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [categoryId, clinicId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Update the category
    const updateQuery = `
      UPDATE inventory_categories
      SET 
        name = COALESCE($1, name),
        description = $2,
        parent_id = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND clinic_id = $5
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      name, 
      description, 
      parent_id, 
      categoryId, 
      clinicId
    ]);
    
    res.status(200).json({
      success: true,
      category: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating inventory category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update inventory category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete an inventory category
router.delete('/:clinicId/inventory/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId, categoryId } = req.params;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Check if category has children
    const childrenQuery = `
      SELECT id FROM inventory_categories
      WHERE parent_id = $1
    `;
    
    const childrenResult = await pool.query(childrenQuery, [categoryId]);
    
    if (childrenResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with subcategories. Remove subcategories first.'
      });
    }

    // Check if category has items
    const itemsQuery = `
      SELECT id FROM inventory_items
      WHERE category_id = $1
    `;
    
    const itemsResult = await pool.query(itemsQuery, [categoryId]);
    
    if (itemsResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with items. Remove items first or move them to another category.'
      });
    }

    // Delete the category
    const deleteQuery = `
      DELETE FROM inventory_categories
      WHERE id = $1 AND clinic_id = $2
      RETURNING *
    `;
    
    const deleteResult = await pool.query(deleteQuery, [categoryId, clinicId]);
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete inventory category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all inventory items for a clinic
router.get('/:clinicId/inventory/items', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get all items with category details
    const query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.sku,
        i.category_id,
        c.name as category_name,
        i.current_quantity as quantity,
        i.unit_type as unit,
        i.purchase_price as unit_price,
        i.expiry_date,
        i.min_quantity as reorder_level,
        i.is_active
      FROM 
        inventory_items i
      LEFT JOIN 
        inventory_categories c ON i.category_id = c.id
      WHERE 
        i.clinic_id = $1
      ORDER BY 
        i.name
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      items: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch inventory items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new inventory item
router.post('/:clinicId/inventory/items', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    const { 
      name, 
      description, 
      sku, 
      category_id, 
      quantity, 
      unit_type, 
      purchase_price, 
      expiry_date, 
      min_quantity
    } = req.body;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Validate required fields
    if (!name || !category_id || !unit_type) {
      return res.status(400).json({
        success: false,
        error: 'Item name, category, and unit type are required'
      });
    }

    // Generate a unique ID for the item
    const itemId = 'item-' + Date.now().toString();

    // Create the new item
    const query = `
      INSERT INTO inventory_items (
        id,
        name,
        description,
        sku,
        category_id,
        clinic_id,
        current_quantity,
        unit_type,
        purchase_price,
        expiry_date,
        min_quantity,
        created_at,
        updated_at,
        created_by,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $12, true)
      RETURNING *
    `;

    const result = await pool.query(query, [
      itemId,
      name, 
      description, 
      sku, 
      category_id, 
      clinicId, 
      quantity || 0, 
      unit_type, 
      purchase_price || 0, 
      expiry_date, 
      min_quantity || 0,
      req.user.userId
    ]);
    
    // If item was created with initial stock, create a transaction record
    if (quantity && quantity > 0) {
      const transactionId = 'trans-' + Date.now().toString();
      const transactionQuery = `
        INSERT INTO inventory_transactions (
          id,
          inventory_item_id,
          transaction_type,
          quantity,
          transaction_date,
          notes,
          performed_by_user_id,
          clinic_id,
          created_at
        )
        VALUES ($1, $2, 'purchase', $3, CURRENT_TIMESTAMP, 'Initial stock entry', $4, $5, CURRENT_TIMESTAMP)
      `;
      
      await pool.query(transactionQuery, [
        transactionId,
        itemId, 
        quantity, 
        req.user.userId,
        clinicId
      ]);
    }
    
    res.status(201).json({
      success: true,
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create inventory item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update an inventory item
router.put('/:clinicId/inventory/items/:itemId', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId, itemId } = req.params;
    const { 
      name, 
      description, 
      sku, 
      category_id, 
      unit_type, 
      purchase_price, 
      expiry_date, 
      min_quantity, 
      is_active 
    } = req.body;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Validate that the item exists and belongs to this clinic
    const checkQuery = `
      SELECT id FROM inventory_items
      WHERE id = $1 AND clinic_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [itemId, clinicId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Update the item (note: quantity should only be updated via transactions)
    const updateQuery = `
      UPDATE inventory_items
      SET 
        name = COALESCE($1, name),
        description = $2,
        sku = $3,
        category_id = $4,
        unit_type = $5,
        purchase_price = COALESCE($6, purchase_price),
        expiry_date = $7,
        min_quantity = COALESCE($8, min_quantity),
        is_active = COALESCE($9, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND clinic_id = $11
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      name, 
      description, 
      sku, 
      category_id, 
      unit_type, 
      purchase_price, 
      expiry_date, 
      min_quantity, 
      is_active,
      itemId, 
      clinicId
    ]);
    
    res.status(200).json({
      success: true,
      item: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update inventory item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete an inventory item
router.delete('/:clinicId/inventory/items/:itemId', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId, itemId } = req.params;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Check if item has transactions (optional: you might want to just prevent deletion if transactions exist)
    const transactionsQuery = `
      SELECT id FROM inventory_transactions
      WHERE inventory_item_id = $1
    `;
    
    const transactionsResult = await pool.query(transactionsQuery, [itemId]);
    
    if (transactionsResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete item with transaction history. Consider deactivating it instead.'
      });
    }

    // Delete the item
    const deleteQuery = `
      DELETE FROM inventory_items
      WHERE id = $1 AND clinic_id = $2
      RETURNING *
    `;
    
    const deleteResult = await pool.query(deleteQuery, [itemId, clinicId]);
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete inventory item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all inventory transactions for a clinic
router.get('/:clinicId/inventory/transactions', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    const { itemId, startDate, endDate } = req.query;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Build the query based on filters
    let query = `
      SELECT 
        t.id,
        t.inventory_item_id as item_id,
        i.name as item_name,
        t.transaction_type,
        t.quantity,
        t.transaction_date,
        t.notes,
        t.performed_by_user_id as created_by,
        u.user_name || ' ' || u.user_surname as created_by_name
      FROM 
        inventory_transactions t
      JOIN 
        inventory_items i ON t.inventory_item_id = i.id
      JOIN 
        users u ON t.performed_by_user_id = u.user_id::VARCHAR
      WHERE 
        t.clinic_id = $1
    `;
    
    const queryParams = [clinicId];
    let paramIndex = 2;
    
    if (itemId) {
      query += ` AND t.inventory_item_id = $${paramIndex}`;
      queryParams.push(itemId);
      paramIndex++;
    }
    
    if (startDate) {
      query += ` AND t.transaction_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND t.transaction_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    query += ` ORDER BY t.transaction_date DESC`;

    const result = await pool.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch inventory transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new inventory transaction
router.post('/:clinicId/inventory/transactions', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    const { 
      item_id, 
      transaction_type, 
      quantity, 
      unit_price,
      transaction_date, 
      notes,
      batch_number,
      expiry_date
    } = req.body;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Validate required fields
    if (!item_id || !transaction_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Item ID, transaction type, and quantity are required'
      });
    }

    // Validate that the item exists and belongs to this clinic
    const itemQuery = `
      SELECT id, current_quantity FROM inventory_items
      WHERE id = $1 AND clinic_id = $2
    `;
    
    const itemResult = await pool.query(itemQuery, [item_id, clinicId]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const currentQuantity = parseFloat(itemResult.rows[0].current_quantity);
    
    // For outgoing transactions, check if there's enough stock
    if (transaction_type === 'usage' || transaction_type === 'damaged' || transaction_type === 'expired' || transaction_type === 'return') {
      if (currentQuantity < quantity) {
        return res.status(400).json({
          success: false,
          error: 'Not enough stock available for this transaction'
        });
      }
    }

    // Calculate the new quantity based on transaction type
    let newQuantity;
    if (transaction_type === 'purchase' || transaction_type === 'adjustment') {
      newQuantity = currentQuantity + parseFloat(quantity);
    } else if (transaction_type === 'usage' || transaction_type === 'damaged' || transaction_type === 'expired' || transaction_type === 'return') {
      newQuantity = currentQuantity - parseFloat(quantity);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type'
      });
    }

    // Calculate total price if unit price is provided
    const totalPrice = unit_price ? parseFloat(unit_price) * parseFloat(quantity) : null;

    // Generate a unique ID for the transaction
    const transactionId = 'trans-' + Date.now().toString();

    // Begin a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create the transaction record
      const transactionQuery = `
        INSERT INTO inventory_transactions (
          id,
          inventory_item_id,
          transaction_type,
          quantity,
          unit_price,
          total_price,
          transaction_date,
          batch_number,
          expiry_date,
          notes,
          performed_by_user_id,
          clinic_id,
          created_at
        )
        VALUES ($1, $2, $3::transaction_type, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const transactionDate = transaction_date || 'CURRENT_TIMESTAMP';
      
      const transactionValues = [
        transactionId,
        item_id,
        transaction_type,
        quantity,
        unit_price,
        totalPrice,
        transactionDate,
        batch_number,
        expiry_date,
        notes,
        req.user.userId.toString(),
        clinicId
      ];
      
      const transactionResult = await client.query(transactionQuery, transactionValues);
      
      // Update the item's quantity
      const updateItemQuery = `
        UPDATE inventory_items
        SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const updateItemResult = await client.query(updateItemQuery, [newQuantity, item_id]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        transaction: transactionResult.rows[0],
        updatedItem: updateItemResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create inventory transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get low stock items for a clinic
router.get('/:clinicId/inventory/low-stock', authenticateToken, async (req, res) => {
  try {
    // Validate user type
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get items where quantity is below reorder level
    const query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.sku,
        i.category_id,
        c.name as category_name,
        i.current_quantity as quantity,
        i.unit_type as unit,
        i.purchase_price as unit_price,
        i.expiry_date,
        i.min_quantity as reorder_level
      FROM 
        inventory_items i
      LEFT JOIN 
        inventory_categories c ON i.category_id = c.id
      WHERE 
        i.clinic_id = $1 AND
        i.is_active = true AND
        i.current_quantity <= i.min_quantity
      ORDER BY 
        (i.current_quantity / NULLIF(i.min_quantity, 0)) ASC
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      items: result.rows
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch low stock items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to check if a veterinarian has access to a clinic
async function checkVeterinarianClinicAccess(veterinarianId, clinicId) {
  try {
    const query = `
      SELECT 1 FROM clinic_veterinarians
      WHERE veterinarian_id = $1 AND clinic_id = $2 AND status = 'approved'
    `;
    
    const result = await pool.query(query, [veterinarianId, clinicId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking clinic access:', error);
    return false;
  }
}

module.exports = router;
