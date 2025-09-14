const sheetsClient = require('../googleAPI/sheetsClient');
const fs = require('fs-extra');
const path = require('path');

class PullFromSheet {
  constructor() {
    this.syncHistory = new Map();
  }

  // Pull data from Google Sheet
  async pullData(sheetId, range, targetCollection) {
    try {
      console.log(`Pulling data from sheet ${sheetId}, range ${range}`);
      
      // Get data from sheet
      const sheetData = await sheetsClient.getSheetData(sheetId, range);
      
      // Transform data
      const transformedData = this.transformSheetData(sheetData, targetCollection);
      
      // Save to local storage (in production, this would save to database)
      await this.saveToLocalStorage(sheetId, range, transformedData);
      
      // Record sync history
      this.recordSyncHistory(sheetId, range, 'pull', transformedData.length);
      
      return {
        success: true,
        recordsCount: transformedData.length,
        data: transformedData,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error pulling data from sheet:', error);
      throw error;
    }
  }

  // Transform sheet data to structured format
  transformSheetData(sheetData, targetCollection) {
    const { values } = sheetData;
    
    if (!values || values.length === 0) {
      return [];
    }

    // First row is headers
    const headers = values[0];
    const dataRows = values.slice(1);

    // Transform rows to objects
    const transformedData = dataRows.map((row, index) => {
      const record = {
        _id: `${targetCollection}_${Date.now()}_${index}`,
        _source: 'google_sheets',
        _rowIndex: index + 2, // +2 because of 1-based indexing and header row
        _lastUpdated: new Date()
      };

      // Map each column to a field
      headers.forEach((header, colIndex) => {
        if (header && row[colIndex] !== undefined) {
          const fieldName = this.sanitizeFieldName(header);
          record[fieldName] = this.parseCellValue(row[colIndex]);
        }
      });

      return record;
    });

    return transformedData;
  }

  // Sanitize field names
  sanitizeFieldName(header) {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  // Parse cell value
  parseCellValue(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Try to parse as number
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try to parse as date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime())) {
      return dateValue;
    }

    // Return as string
    return value.toString();
  }

  // Save to local storage
  async saveToLocalStorage(sheetId, range, data) {
    try {
      const storageDir = path.join(__dirname, '../../storage');
      await fs.ensureDir(storageDir);

      const filename = `${sheetId}_${range.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      const filepath = path.join(storageDir, filename);

      await fs.writeJson(filepath, {
        sheetId: sheetId,
        range: range,
        data: data,
        lastUpdated: new Date(),
        recordCount: data.length
      }, { spaces: 2 });

      console.log(`Data saved to ${filepath}`);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw error;
    }
  }

  // Record sync history
  recordSyncHistory(sheetId, range, operation, recordCount) {
    const key = `${sheetId}_${range}`;
    const history = this.syncHistory.get(key) || [];
    
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

    this.syncHistory.set(key, history);
  }

  // Get sync history
  getSyncHistory(sheetId, range) {
    const key = `${sheetId}_${range}`;
    return this.syncHistory.get(key) || [];
  }

  // Pull with filters
  async pullDataWithFilters(sheetId, range, filters, targetCollection) {
    try {
      // Get all data first
      const allData = await this.pullData(sheetId, range, targetCollection);
      
      // Apply filters
      let filteredData = allData.data;
      
      if (filters.where) {
        filteredData = this.applyWhereFilter(filteredData, filters.where);
      }
      
      if (filters.limit) {
        filteredData = filteredData.slice(0, filters.limit);
      }
      
      if (filters.offset) {
        filteredData = filteredData.slice(filters.offset);
      }
      
      if (filters.orderBy) {
        filteredData = this.applyOrderBy(filteredData, filters.orderBy);
      }

      return {
        success: true,
        recordsCount: filteredData.length,
        data: filteredData,
        filters: filters,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error pulling data with filters:', error);
      throw error;
    }
  }

  // Apply WHERE filter
  applyWhereFilter(data, whereConditions) {
    return data.filter(record => {
      return whereConditions.every(condition => {
        const { field, operator, value } = condition;
        const recordValue = record[field];

        switch (operator) {
          case '=':
            return recordValue === value;
          case '!=':
            return recordValue !== value;
          case '>':
            return recordValue > value;
          case '>=':
            return recordValue >= value;
          case '<':
            return recordValue < value;
          case '<=':
            return recordValue <= value;
          case 'contains':
            return recordValue && recordValue.toString().toLowerCase().includes(value.toLowerCase());
          case 'startsWith':
            return recordValue && recordValue.toString().toLowerCase().startsWith(value.toLowerCase());
          case 'endsWith':
            return recordValue && recordValue.toString().toLowerCase().endsWith(value.toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  // Apply ORDER BY
  applyOrderBy(data, orderBy) {
    return data.sort((a, b) => {
      for (const order of orderBy) {
        const { field, direction = 'ASC' } = order;
        const aValue = a[field];
        const bValue = b[field];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        if (comparison !== 0) {
          return direction === 'DESC' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  // Pull specific columns only
  async pullSpecificColumns(sheetId, range, columns, targetCollection) {
    try {
      const sheetData = await sheetsClient.getSheetData(sheetId, range);
      const { values } = sheetData;
      
      if (!values || values.length === 0) {
        return { success: true, recordsCount: 0, data: [] };
      }

      const headers = values[0];
      const columnIndices = columns.map(col => headers.indexOf(col)).filter(index => index !== -1);
      
      if (columnIndices.length === 0) {
        throw new Error('No matching columns found');
      }

      const filteredValues = values.map(row => 
        columnIndices.map(index => row[index])
      );

      const transformedData = this.transformSheetData(
        { values: filteredValues },
        targetCollection
      );

      await this.saveToLocalStorage(sheetId, range, transformedData);
      this.recordSyncHistory(sheetId, range, 'pull_columns', transformedData.length);

      return {
        success: true,
        recordsCount: transformedData.length,
        data: transformedData,
        columns: columns,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error pulling specific columns:', error);
      throw error;
    }
  }

  // Pull with data validation
  async pullWithValidation(sheetId, range, validationRules, targetCollection) {
    try {
      const result = await this.pullData(sheetId, range, targetCollection);
      
      // Apply validation rules
      const validatedData = result.data.filter(record => {
        return validationRules.every(rule => {
          return this.validateRecord(record, rule);
        });
      });

      const invalidRecords = result.data.filter(record => {
        return !validationRules.every(rule => {
          return this.validateRecord(record, rule);
        });
      });

      return {
        success: true,
        recordsCount: validatedData.length,
        data: validatedData,
        invalidRecords: invalidRecords,
        validationRules: validationRules,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error pulling with validation:', error);
      throw error;
    }
  }

  // Validate record against rule
  validateRecord(record, rule) {
    const { field, type, required, min, max, pattern } = rule;
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

    return true;
  }

  // Get all sync history
  getAllSyncHistory() {
    const allHistory = {};
    for (const [key, history] of this.syncHistory) {
      allHistory[key] = history;
    }
    return allHistory;
  }

  // Clear sync history
  clearSyncHistory(sheetId, range) {
    const key = `${sheetId}_${range}`;
    this.syncHistory.delete(key);
  }
}

module.exports = new PullFromSheet();
