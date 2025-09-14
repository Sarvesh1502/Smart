const sheetsClient = require('../googleAPI/sheetsClient');
const fs = require('fs-extra');
const path = require('path');

class PushToSheet {
  constructor() {
    this.pushHistory = new Map();
  }

  // Push data to Google Sheet
  async pushData(sheetId, range, sourceData) {
    try {
      console.log(`Pushing data to sheet ${sheetId}, range ${range}`);
      
      // Transform data to sheet format
      const sheetData = this.transformDataToSheet(sourceData);
      
      // Clear existing data if needed
      if (range.includes('A:Z') || range.includes('1:')) {
        await sheetsClient.clearSheetData(sheetId, range);
      }
      
      // Push data to sheet
      const result = await sheetsClient.updateSheetData(sheetId, range, sheetData);
      
      // Record push history
      this.recordPushHistory(sheetId, range, 'push', sourceData.length);
      
      return {
        success: true,
        recordsCount: sourceData.length,
        result: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error pushing data to sheet:', error);
      throw error;
    }
  }

  // Transform data to sheet format
  transformDataToSheet(sourceData) {
    if (!sourceData || sourceData.length === 0) {
      return [];
    }

    // Get all unique keys from all records
    const allKeys = new Set();
    sourceData.forEach(record => {
      Object.keys(record).forEach(key => {
        if (!key.startsWith('_')) { // Exclude internal fields
          allKeys.add(key);
        }
      });
    });

    const headers = Array.from(allKeys);
    const rows = [headers]; // First row is headers

    // Convert each record to a row
    sourceData.forEach(record => {
      const row = headers.map(header => {
        const value = record[header];
        return this.formatCellValue(value);
      });
      rows.push(row);
    });

    return rows;
  }

  // Format cell value for sheet
  formatCellValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value.toString();
  }

  // Record push history
  recordPushHistory(sheetId, range, operation, recordCount) {
    const key = `${sheetId}_${range}`;
    const history = this.pushHistory.get(key) || [];
    
    history.push({
      operation: operation,
      recordCount: recordCount,
      timestamp: new Date(),
      status: 'success'
    });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.pushHistory.set(key, history);
  }

  // Append data to sheet
  async appendData(sheetId, range, sourceData) {
    try {
      console.log(`Appending data to sheet ${sheetId}, range ${range}`);
      
      // Transform data to sheet format
      const sheetData = this.transformDataToSheet(sourceData);
      
      // Remove headers for append operation
      const dataRows = sheetData.slice(1);
      
      // Append data to sheet
      const result = await sheetsClient.appendSheetData(sheetId, range, dataRows);
      
      // Record push history
      this.recordPushHistory(sheetId, range, 'append', sourceData.length);
      
      return {
        success: true,
        recordsCount: sourceData.length,
        result: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error appending data to sheet:', error);
      throw error;
    }
  }

  // Update specific rows
  async updateSpecificRows(sheetId, range, updates) {
    try {
      console.log(`Updating specific rows in sheet ${sheetId}`);
      
      const batchUpdates = updates.map(update => ({
        range: `${range}!${update.row}:${update.row}`,
        values: [update.values]
      }));
      
      const result = await sheetsClient.batchUpdate(sheetId, batchUpdates);
      
      this.recordPushHistory(sheetId, range, 'update_rows', updates.length);
      
      return {
        success: true,
        recordsCount: updates.length,
        result: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error updating specific rows:', error);
      throw error;
    }
  }

  // Push with formatting
  async pushDataWithFormatting(sheetId, range, sourceData, formatting) {
    try {
      // First push the data
      const pushResult = await this.pushData(sheetId, range, sourceData);
      
      // Apply formatting if specified
      if (formatting && formatting.requests) {
        await sheetsClient.formatCells(sheetId, formatting.requests);
      }
      
      return {
        ...pushResult,
        formatting: formatting
      };
    } catch (error) {
      console.error('Error pushing data with formatting:', error);
      throw error;
    }
  }

  // Push with data validation
  async pushDataWithValidation(sheetId, range, sourceData, validationRules) {
    try {
      // Validate data before pushing
      const validationResults = this.validateData(sourceData, validationRules);
      
      if (validationResults.invalidRecords.length > 0) {
        throw new Error(`Validation failed: ${validationResults.invalidRecords.length} invalid records`);
      }
      
      // Push validated data
      const pushResult = await this.pushData(sheetId, range, sourceData);
      
      // Add data validation to sheet if specified
      if (validationRules.sheetValidation) {
        await this.addSheetValidation(sheetId, range, validationRules.sheetValidation);
      }
      
      return {
        ...pushResult,
        validation: validationResults
      };
    } catch (error) {
      console.error('Error pushing data with validation:', error);
      throw error;
    }
  }

  // Validate data
  validateData(sourceData, validationRules) {
    const validRecords = [];
    const invalidRecords = [];
    
    sourceData.forEach((record, index) => {
      const isValid = validationRules.every(rule => {
        return this.validateRecord(record, rule);
      });
      
      if (isValid) {
        validRecords.push(record);
      } else {
        invalidRecords.push({
          index: index,
          record: record,
          errors: this.getValidationErrors(record, validationRules)
        });
      }
    });
    
    return {
      validRecords: validRecords,
      invalidRecords: invalidRecords,
      totalRecords: sourceData.length,
      validCount: validRecords.length,
      invalidCount: invalidRecords.length
    };
  }

  // Validate record against rule
  validateRecord(record, rule) {
    const { field, type, required, min, max, pattern, values } = rule;
    const value = record[field];

    // Check required
    if (required && (value === null || value === undefined || value === '')) {
      return false;
    }

    // Check type
    if (value !== null && value !== undefined) {
      switch (type) {
        case 'string':
          if (typeof value !== 'string') return false;
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) return false;
          break;
        case 'boolean':
          if (typeof value !== 'boolean') return false;
          break;
        case 'date':
          if (!(value instanceof Date) || isNaN(value.getTime())) return false;
          break;
      }
    }

    // Check min/max for numbers
    if (type === 'number' && value !== null && value !== undefined) {
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
    }

    // Check pattern for strings
    if (type === 'string' && pattern && value) {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) return false;
    }

    // Check allowed values
    if (values && value !== null && value !== undefined) {
      if (!values.includes(value)) return false;
    }

    return true;
  }

  // Get validation errors
  getValidationErrors(record, validationRules) {
    const errors = [];
    
    validationRules.forEach(rule => {
      if (!this.validateRecord(record, rule)) {
        errors.push({
          field: rule.field,
          rule: rule,
          message: this.getValidationErrorMessage(record, rule)
        });
      }
    });
    
    return errors;
  }

  // Get validation error message
  getValidationErrorMessage(record, rule) {
    const { field, type, required, min, max, pattern, values } = rule;
    const value = record[field];

    if (required && (value === null || value === undefined || value === '')) {
      return `Field '${field}' is required`;
    }

    if (type === 'number' && value !== null && value !== undefined) {
      if (min !== undefined && value < min) {
        return `Field '${field}' must be at least ${min}`;
      }
      if (max !== undefined && value > max) {
        return `Field '${field}' must be at most ${max}`;
      }
    }

    if (type === 'string' && pattern && value) {
      return `Field '${field}' does not match required pattern`;
    }

    if (values && value !== null && value !== undefined) {
      return `Field '${field}' must be one of: ${values.join(', ')}`;
    }

    return `Field '${field}' is invalid`;
  }

  // Add sheet validation
  async addSheetValidation(sheetId, range, validationConfig) {
    try {
      const requests = validationConfig.map(config => ({
        setDataValidation: {
          range: {
            sheetId: 0, // Assuming first sheet
            startRowIndex: config.startRowIndex || 1,
            endRowIndex: config.endRowIndex || 1000,
            startColumnIndex: config.startColumnIndex || 0,
            endColumnIndex: config.endColumnIndex || 26
          },
          rule: {
            condition: {
              type: config.type || 'ONE_OF_LIST',
              values: config.values ? config.values.map(v => ({ userEnteredValue: v })) : []
            },
            showCustomUi: config.showCustomUi || true,
            strict: config.strict || true
          }
        }
      }));

      await sheetsClient.formatCells(sheetId, requests);
    } catch (error) {
      console.error('Error adding sheet validation:', error);
      throw error;
    }
  }

  // Push with conditional formatting
  async pushDataWithConditionalFormatting(sheetId, range, sourceData, conditionalFormatting) {
    try {
      // Push the data first
      const pushResult = await this.pushData(sheetId, range, sourceData);
      
      // Apply conditional formatting
      if (conditionalFormatting && conditionalFormatting.requests) {
        await sheetsClient.formatCells(sheetId, conditionalFormatting.requests);
      }
      
      return {
        ...pushResult,
        conditionalFormatting: conditionalFormatting
      };
    } catch (error) {
      console.error('Error pushing data with conditional formatting:', error);
      throw error;
    }
  }

  // Get push history
  getPushHistory(sheetId, range) {
    const key = `${sheetId}_${range}`;
    return this.pushHistory.get(key) || [];
  }

  // Get all push history
  getAllPushHistory() {
    const allHistory = {};
    for (const [key, history] of this.pushHistory) {
      allHistory[key] = history;
    }
    return allHistory;
  }

  // Clear push history
  clearPushHistory(sheetId, range) {
    const key = `${sheetId}_${range}`;
    this.pushHistory.delete(key);
  }
}

module.exports = new PushToSheet();
