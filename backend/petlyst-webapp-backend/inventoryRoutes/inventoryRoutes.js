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
    console.log('Fetching inventory info for clinic ID:', clinicId);

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

    const parsedClinicId = parseInt(clinicId);
    const itemsResult = await pool.query(itemsQuery, [parsedClinicId]);
    const categoriesResult = await pool.query(categoriesQuery, [parsedClinicId]);
    const lowStockResult = await pool.query(lowStockQuery, [parsedClinicId]);
    
    console.log('Inventory stats retrieved:', {
      totalItems: parseInt(itemsResult.rows[0].total_items),
      totalCategories: parseInt(categoriesResult.rows[0].total_categories),
      lowStockCount: parseInt(lowStockResult.rows[0].low_stock_count)
    });
    
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
    console.log('Fetching inventory categories for clinic ID:', clinicId);

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

    const parsedClinicId = parseInt(clinicId);
    const result = await pool.query(query, [parsedClinicId]);
    
    console.log(`Retrieved ${result.rows.length} categories for clinic ID:`, clinicId);
    
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
      
      console.log('Creating new category with ID:', categoryId);
      console.log('Clinic ID:', clinicId, 'Type:', typeof clinicId);
      console.log('User ID:', req.user.userId, 'Type:', typeof req.user.userId);
  
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
  
      // Burada clinic_id ve req.user.userId'yi kesin olarak integer olarak göndermeliyiz
      const result = await pool.query(query, [
        categoryId,
        name, 
        description, 
        parent_id, 
        parseInt(clinicId), 
        parseInt(req.user.userId)
      ]);
      
      console.log('Category created successfully:', result.rows[0]);
      
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
    
    console.log('Updating category ID:', categoryId, 'for clinic ID:', clinicId);
    console.log('Update data:', { name, description, parent_id });

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
    
    const parsedClinicId = parseInt(clinicId);
    const checkResult = await pool.query(checkQuery, [categoryId, parsedClinicId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // If parent_id is provided, validate that it exists
    if (parent_id) {
      const parentCheckQuery = `
        SELECT id FROM inventory_categories
        WHERE id = $1 AND clinic_id = $2
      `;
      
      const parentCheckResult = await pool.query(parentCheckQuery, [parent_id, parsedClinicId]);
      
      if (parentCheckResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Parent category not found'
        });
      }
      
      // Check for circular reference
      if (parent_id === categoryId) {
        return res.status(400).json({
          success: false,
          error: 'Category cannot be its own parent'
        });
      }
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
      parsedClinicId
    ]);
    
    console.log('Category updated successfully:', updateResult.rows[0]);
    
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
    console.log('Deleting category ID:', categoryId, 'from clinic ID:', clinicId);

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
    
    const parsedClinicId = parseInt(clinicId);
    const deleteResult = await pool.query(deleteQuery, [categoryId, parsedClinicId]);
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    console.log('Category deleted successfully:', categoryId);
    
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
    const { category_id, search } = req.query;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Build query based on filters
    let query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.sku,
        i.category_id,
        c.name as category_name,
        i.current_quantity as quantity,
        i.unit_type as unit,
        i.purchase_price,
        i.sale_price,
        i.expiry_date,
        i.batch_number,
        i.location,
        i.min_quantity,
        i.is_active
      FROM 
        inventory_items i
      LEFT JOIN 
        inventory_categories c ON i.category_id = c.id
      WHERE 
        i.clinic_id = $1
    `;
    
    const queryParams = [parseInt(clinicId)];
    let paramCount = 2;
    
    // Add category filter if provided
    if (category_id) {
      query += ` AND i.category_id = $${paramCount}`;
      queryParams.push(category_id);
      paramCount++;
    }
    
    // Add search filter if provided
    if (search) {
      query += ` AND (i.name ILIKE $${paramCount} OR i.sku ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    
    // Sort by name
    query += ` ORDER BY i.name`;
    
    const result = await pool.query(query, queryParams);
    
    // Convert numeric values to integers
    const items = result.rows.map(item => ({
      ...item,
      quantity: parseInt(item.quantity),
      purchase_price: parseInt(item.purchase_price),
      sale_price: parseInt(item.sale_price),
      min_quantity: parseInt(item.min_quantity)
    }));
    
    res.status(200).json({
      success: true,
      items: items
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
        unit_type, 
        current_quantity, 
        purchase_price,
        sale_price,
        location, 
        expiry_date, 
        batch_number,
        min_quantity
      } = req.body;

      console.log('Received request to create item:', {
        name, category_id, current_quantity, min_quantity
      });

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

      // Validate that category exists
      const categoryCheckQuery = `
        SELECT id FROM inventory_categories
        WHERE id = $1 AND clinic_id = $2
      `;
      
      const parsedClinicId = parseInt(clinicId);
      const categoryResult = await pool.query(categoryCheckQuery, [category_id, parsedClinicId]);
      
      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Selected category does not exist or does not belong to this clinic'
        });
      }
      
      // Generate a unique ID for the item
      const itemId = 'item-' + Date.now().toString();
      
      console.log('Creating new inventory item with ID:', itemId);
      
      // Convert numeric values to integers
      const parsedCurrentQuantity = current_quantity ? parseInt(current_quantity) : 0;
      const parsedMinQuantity = min_quantity ? parseInt(min_quantity) : 0;
      const parsedPurchasePrice = purchase_price ? parseInt(purchase_price) : 0;
      const parsedSalePrice = sale_price ? parseInt(sale_price) : 0;
  
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
          sale_price,
          location,
          expiry_date,
          batch_number,
          min_quantity,
          created_at,
          updated_at,
          created_by,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $15, true)
        RETURNING *
      `;
  
      const result = await pool.query(query, [
        itemId,
        name, 
        description, 
        sku, 
        category_id, 
        parsedClinicId,
        parsedCurrentQuantity, 
        unit_type, 
        parsedPurchasePrice,
        parsedSalePrice,
        location,
        expiry_date,
        batch_number,
        parsedMinQuantity,
        parseInt(req.user.userId)
      ]);
      
      console.log('Inventory item created successfully:', result.rows[0]);
      
      // If item was created with initial stock, create a transaction record
      if (parsedCurrentQuantity > 0) {
        const transactionId = 'trans-' + Date.now().toString();
        console.log('Creating initial stock transaction with ID:', transactionId);
        
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
        
        // İşlem tablomuzda performed_by_user_id ve clinic_id VARCHAR(36) tipinde
        await pool.query(transactionQuery, [
          transactionId,
          itemId, 
          parsedCurrentQuantity, 
          req.user.userId.toString(), // String olarak gönderiyoruz
          clinicId.toString() // String olarak gönderiyoruz
        ]);
        
        console.log('Initial stock transaction created for item:', itemId);
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
      current_quantity,
      min_quantity, 
      purchase_price, 
      sale_price,
      location,
      expiry_date, 
      batch_number,
      is_active 
    } = req.body;
    
    console.log('Updating item ID:', itemId, 'for clinic ID:', clinicId);
    console.log('Update data:', { 
      name, 
      description, 
      sku, 
      category_id,
      current_quantity, 
      min_quantity
    });

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
      SELECT id, current_quantity FROM inventory_items
      WHERE id = $1 AND clinic_id = $2
    `;
    
    const parsedClinicId = parseInt(clinicId);
    const checkResult = await pool.query(checkQuery, [itemId, parsedClinicId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    // If changing category, validate that new category exists
    if (category_id) {
      const categoryCheckQuery = `
        SELECT id FROM inventory_categories
        WHERE id = $1 AND clinic_id = $2
      `;
      
      const categoryResult = await pool.query(categoryCheckQuery, [category_id, parsedClinicId]);
      
      if (categoryResult.rows.length === 0) {
        console.error(`Category not found: ${category_id} for clinic: ${parsedClinicId}`);
        return res.status(400).json({
          success: false,
          error: 'Selected category does not exist or does not belong to this clinic'
        });
      }
      
      console.log(`Category validation passed for: ${category_id}`);
    }
    
    const oldQuantity = parseInt(checkResult.rows[0].current_quantity);
    
    // Convert string values to integers for numeric fields
    const parsedCurrentQuantity = current_quantity !== undefined ? parseInt(current_quantity) : undefined;
    const parsedMinQuantity = min_quantity !== undefined ? parseInt(min_quantity) : undefined;
    const parsedPurchasePrice = purchase_price !== undefined ? parseInt(purchase_price) : undefined;
    const parsedSalePrice = sale_price !== undefined ? parseInt(sale_price) : undefined;

    // First, fetch the current item data to preserve non-updated fields
    const currentItemQuery = `SELECT * FROM inventory_items WHERE id = $1 AND clinic_id = $2`;
    const currentItemResult = await pool.query(currentItemQuery, [itemId, parsedClinicId]);
    const currentItem = currentItemResult.rows[0];
    
    // Use current values for fields not included in the request
    const updateFields = {
      name: name !== undefined ? name : currentItem.name,
      description: description !== undefined ? description : currentItem.description,
      sku: sku !== undefined ? sku : currentItem.sku,
      category_id: category_id !== undefined ? category_id : currentItem.category_id,
      unit_type: unit_type !== undefined ? unit_type : currentItem.unit_type,
      current_quantity: parsedCurrentQuantity !== undefined ? parsedCurrentQuantity : currentItem.current_quantity,
      min_quantity: parsedMinQuantity !== undefined ? parsedMinQuantity : currentItem.min_quantity,
      purchase_price: parsedPurchasePrice !== undefined ? parsedPurchasePrice : currentItem.purchase_price,
      sale_price: parsedSalePrice !== undefined ? parsedSalePrice : currentItem.sale_price,
      location: location !== undefined ? location : currentItem.location,
      expiry_date: expiry_date !== undefined ? expiry_date : currentItem.expiry_date,
      batch_number: batch_number !== undefined ? batch_number : currentItem.batch_number,
      is_active: is_active !== undefined ? is_active : currentItem.is_active
    };

    // Update the item with all form fields from frontend
    const updateQuery = `
      UPDATE inventory_items
      SET 
        name = $1,
        description = $2,
        sku = $3,
        category_id = $4,
        unit_type = $5,
        current_quantity = $6,
        min_quantity = $7,
        purchase_price = $8,
        sale_price = $9,
        location = $10,
        expiry_date = $11,
        batch_number = $12,
        is_active = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND clinic_id = $15
      RETURNING *
    `;

    console.log('Executing update with parameters:', {
      name: updateFields.name, 
      description: updateFields.description,
      // Log other fields for debugging
      current_quantity: updateFields.current_quantity,
      expiry_date: updateFields.expiry_date,
      batch_number: updateFields.batch_number
    });

    const updateResult = await pool.query(updateQuery, [
      updateFields.name, 
      updateFields.description, 
      updateFields.sku, 
      updateFields.category_id, 
      updateFields.unit_type,
      updateFields.current_quantity,
      updateFields.min_quantity, 
      updateFields.purchase_price,
      updateFields.sale_price,
      updateFields.location,
      updateFields.expiry_date, 
      updateFields.batch_number,
      updateFields.is_active,
      itemId, 
      parsedClinicId
    ]);
    
    console.log('Item updated successfully. Old quantity:', oldQuantity, 'New quantity:', updateFields.current_quantity);
    
    // If quantity was changed, create a transaction record
    if (parsedCurrentQuantity !== undefined && parsedCurrentQuantity !== oldQuantity) {
      const transactionId = 'trans-' + Date.now().toString();
      const quantityDiff = parsedCurrentQuantity - oldQuantity;
      const transactionType = quantityDiff > 0 ? 'adjustment' : 'adjustment';
      
      console.log('Creating adjustment transaction with ID:', transactionId, 'Quantity change:', quantityDiff);
      
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
        VALUES ($1, $2, $3::transaction_type, $4, CURRENT_TIMESTAMP, 'Quantity adjusted via item edit', $5, $6, CURRENT_TIMESTAMP)
      `;
      
      // Veritabanı şemasına göre performed_by_user_id ve clinic_id string olarak gönderilmeli
      await pool.query(transactionQuery, [
        transactionId,
        itemId, 
        transactionType,
        Math.abs(quantityDiff), 
        req.user.userId.toString(), // String olarak gönder
        clinicId.toString() // String olarak gönder
      ]);
      
      console.log('Adjustment transaction created for quantity change');
    }
    
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
    console.log('Deactivating item ID:', itemId, 'from clinic ID:', clinicId);

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Instead of checking for transactions and deleting the item,
    // we'll just update is_active to false
    const updateQuery = `
      UPDATE inventory_items
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND clinic_id = $2
      RETURNING *
    `;
    
    const parsedClinicId = parseInt(clinicId);
    const updateResult = await pool.query(updateQuery, [itemId, parsedClinicId]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    console.log('Item deactivated successfully:', itemId);
    
    res.status(200).json({
      success: true,
      message: 'Item deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating inventory item:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to deactivate inventory item',
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
    const { item_id, transaction_type, start_date, end_date } = req.query;

    // Verify veterinarian has access to this clinic
    const hasAccess = await checkVeterinarianClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Build query based on filters
    let query = `
      SELECT 
        t.id,
        t.inventory_item_id,
        i.name as item_name,
        t.transaction_type,
        t.quantity,
        t.unit_price,
        t.total_price,
        t.transaction_date,
        t.batch_number,
        t.expiry_date,
        t.notes,
        t.created_at
      FROM 
        inventory_transactions t
      JOIN 
        inventory_items i ON t.inventory_item_id = i.id
      WHERE 
        t.clinic_id = $1
    `;
    
    const queryParams = [clinicId.toString()]; // Burada string olarak gönderilmeli
    let paramCount = 2;
    
    // Add item filter if provided
    if (item_id) {
      query += ` AND t.inventory_item_id = $${paramCount}`;
      queryParams.push(item_id);
      paramCount++;
    }
    
    // Add transaction type filter if provided
    if (transaction_type) {
      query += ` AND t.transaction_type = $${paramCount}::transaction_type`;
      queryParams.push(transaction_type);
      paramCount++;
    }
    
    // Add date range filters if provided
    if (start_date) {
      query += ` AND t.transaction_date >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND t.transaction_date <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }
    
    // Sort by most recent first
    query += ` ORDER BY t.transaction_date DESC`;
    
    const result = await pool.query(query, queryParams);
    
    // Convert numeric values to integers
    const transactions = result.rows.map(transaction => ({
      ...transaction,
      quantity: parseInt(transaction.quantity),
      unit_price: transaction.unit_price ? parseInt(transaction.unit_price) : null,
      total_price: transaction.total_price ? parseInt(transaction.total_price) : null
    }));
    
    res.status(200).json({
      success: true,
      transactions: transactions
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
    console.log('Fetching low stock items for clinic ID:', clinicId);

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

    const parsedClinicId = parseInt(clinicId);
    const result = await pool.query(query, [parsedClinicId]);
    
    console.log(`Retrieved ${result.rows.length} low stock items for clinic ID:`, clinicId);
    
    // Convert numeric values to integers
    const items = result.rows.map(item => ({
      ...item,
      quantity: parseInt(item.quantity),
      unit_price: parseInt(item.unit_price),
      reorder_level: parseInt(item.reorder_level)
    }));
    
    res.status(200).json({
      success: true,
      items: items
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

    console.log('Received transaction request:', { 
      item_id, transaction_type, quantity, transaction_date 
    });

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
    
    const itemResult = await pool.query(itemQuery, [item_id, parseInt(clinicId)]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const currentQuantity = parseInt(itemResult.rows[0].current_quantity);
    const parsedQuantity = parseInt(quantity);
    const parsedUnitPrice = unit_price ? parseInt(unit_price) : null;
    
    // For outgoing transactions, check if there's enough stock
    if (transaction_type === 'usage' || transaction_type === 'damaged' || transaction_type === 'expired' || transaction_type === 'return') {
      if (currentQuantity < parsedQuantity) {
        return res.status(400).json({
          success: false,
          error: 'Not enough stock available for this transaction'
        });
      }
    }

    // Calculate the new quantity based on transaction type
    let newQuantity;
    if (transaction_type === 'purchase' || transaction_type === 'adjustment') {
      newQuantity = currentQuantity + parsedQuantity;
    } else if (transaction_type === 'usage' || transaction_type === 'damaged' || transaction_type === 'expired' || transaction_type === 'return') {
      newQuantity = currentQuantity - parsedQuantity;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type'
      });
    }

    // Calculate total price if unit price is provided
    const totalPrice = parsedUnitPrice ? parsedUnitPrice * parsedQuantity : null;

    // Generate a unique ID for the transaction
    const transactionId = 'trans-' + Date.now().toString();
    
    console.log('Creating new inventory transaction with ID:', transactionId);
    console.log('Item ID:', item_id);
    console.log('Transaction type:', transaction_type);
    console.log('Quantity:', parsedQuantity);
    console.log('New quantity will be:', newQuantity);

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
        VALUES ($1, $2, $3::transaction_type, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP), $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      // Veritabanı şemasına göre performed_by_user_id ve clinic_id string olarak gönderilmeli
      const transactionValues = [
        transactionId,
        item_id,
        transaction_type,
        parsedQuantity,
        parsedUnitPrice,
        totalPrice,
        transaction_date, // Direkt olarak gönderiyoruz, NULL ise COALESCE SQL'de işlenir
        batch_number,
        expiry_date,
        notes,
        req.user.userId.toString(), // String olarak gönder
        clinicId.toString()  // String olarak gönder
      ];
      
      console.log('Transaction query values:', transactionValues);
      
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
      
      console.log('Transaction completed successfully, item quantity updated to:', newQuantity);
      
      res.status(201).json({
        success: true,
        transaction: transactionResult.rows[0],
        updatedItem: updateItemResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error, rolling back:', error);
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

// Helper function to check if a veterinarian has access to a clinic
async function checkVeterinarianClinicAccess(veterinarianId, clinicId) {
  try {
    const query = `
      SELECT 1 FROM clinic_veterinarians
      WHERE veterinarian_id = $1 AND clinic_id = $2 AND status = 'approved'
    `;
    
    const result = await pool.query(query, [parseInt(veterinarianId), parseInt(clinicId)]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking clinic access:', error);
    return false;
  }
}

module.exports = router;
