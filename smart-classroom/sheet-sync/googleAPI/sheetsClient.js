const { google } = require('googleapis');
const authService = require('./auth');

class SheetsClient {
  constructor() {
    this.sheets = null;
    this.drive = null;
    this.initializeClients();
  }

  async initializeClients() {
    try {
      const auth = await authService.getAuthenticatedClient();
      this.sheets = google.sheets({ version: 'v4', auth });
      this.drive = google.drive({ version: 'v3', auth });
    } catch (error) {
      console.error('Error initializing Google API clients:', error);
    }
  }

  // Get sheet data
  async getSheetData(sheetId, range = 'A:Z') {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range
      });

      return {
        values: response.data.values || [],
        range: response.data.range,
        majorDimension: response.data.majorDimension
      };
    } catch (error) {
      console.error('Error getting sheet data:', error);
      throw error;
    }
  }

  // Update sheet data
  async updateSheetData(sheetId, range, values) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      return {
        updatedRows: response.data.updatedRows,
        updatedColumns: response.data.updatedColumns,
        updatedCells: response.data.updatedCells,
        range: response.data.updatedRange
      };
    } catch (error) {
      console.error('Error updating sheet data:', error);
      throw error;
    }
  }

  // Append data to sheet
  async appendSheetData(sheetId, range, values) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });

      return {
        updatedRows: response.data.updates.updatedRows,
        updatedColumns: response.data.updates.updatedColumns,
        updatedCells: response.data.updates.updatedCells,
        range: response.data.updates.updatedRange
      };
    } catch (error) {
      console.error('Error appending sheet data:', error);
      throw error;
    }
  }

  // Clear sheet data
  async clearSheetData(sheetId, range) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: range
      });

      return {
        clearedRange: response.data.clearedRange
      };
    } catch (error) {
      console.error('Error clearing sheet data:', error);
      throw error;
    }
  }

  // Batch update multiple ranges
  async batchUpdate(sheetId, updates) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          valueInputOption: 'RAW',
          data: updates.map(update => ({
            range: update.range,
            values: update.values
          }))
        }
      });

      return response.data.responses;
    } catch (error) {
      console.error('Error batch updating sheet:', error);
      throw error;
    }
  }

  // Get sheet metadata
  async getSheetMetadata(sheetId) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId
      });

      const spreadsheet = response.data;
      
      return {
        id: spreadsheet.spreadsheetId,
        title: spreadsheet.properties.title,
        locale: spreadsheet.properties.locale,
        timeZone: spreadsheet.properties.timeZone,
        sheets: spreadsheet.sheets.map(sheet => ({
          id: sheet.properties.sheetId,
          title: sheet.properties.title,
          sheetType: sheet.properties.sheetType,
          gridProperties: sheet.properties.gridProperties,
          hidden: sheet.properties.hidden,
          tabColor: sheet.properties.tabColor
        }))
      };
    } catch (error) {
      console.error('Error getting sheet metadata:', error);
      throw error;
    }
  }

  // Create new sheet
  async createSheet(title, sheetNames = ['Sheet1']) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: title
          },
          sheets: sheetNames.map(name => ({
            properties: {
              title: name
            }
          }))
        }
      });

      return {
        id: response.data.spreadsheetId,
        url: response.data.spreadsheetUrl,
        title: response.data.properties.title
      };
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw error;
    }
  }

  // Add new sheet to existing spreadsheet
  async addSheet(spreadsheetId, sheetTitle) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetTitle
              }
            }
          }]
        }
      });

      return response.data.replies[0].addSheet;
    } catch (error) {
      console.error('Error adding sheet:', error);
      throw error;
    }
  }

  // Delete sheet
  async deleteSheet(spreadsheetId, sheetId) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            deleteSheet: {
              sheetId: sheetId
            }
          }]
        }
      });

      return response.data.replies[0];
    } catch (error) {
      console.error('Error deleting sheet:', error);
      throw error;
    }
  }

  // Get sheet permissions
  async getSheetPermissions(sheetId) {
    try {
      if (!this.drive) {
        await this.initializeClients();
      }

      const response = await this.drive.permissions.list({
        fileId: sheetId,
        fields: 'permissions(id,type,role,emailAddress,displayName)'
      });

      return response.data.permissions;
    } catch (error) {
      console.error('Error getting sheet permissions:', error);
      throw error;
    }
  }

  // Share sheet with user
  async shareSheet(sheetId, email, role = 'reader') {
    try {
      if (!this.drive) {
        await this.initializeClients();
      }

      const response = await this.drive.permissions.create({
        fileId: sheetId,
        resource: {
          type: 'user',
          role: role,
          emailAddress: email
        },
        sendNotificationEmail: true
      });

      return response.data;
    } catch (error) {
      console.error('Error sharing sheet:', error);
      throw error;
    }
  }

  // Format sheet cells
  async formatCells(spreadsheetId, requests) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: requests
        }
      });

      return response.data.replies;
    } catch (error) {
      console.error('Error formatting cells:', error);
      throw error;
    }
  }

  // Add data validation
  async addDataValidation(spreadsheetId, sheetId, range, validation) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            setDataValidation: {
              range: {
                sheetId: sheetId,
                startRowIndex: range.startRowIndex,
                endRowIndex: range.endRowIndex,
                startColumnIndex: range.startColumnIndex,
                endColumnIndex: range.endColumnIndex
              },
              rule: validation
            }
          }]
        }
      });

      return response.data.replies[0];
    } catch (error) {
      console.error('Error adding data validation:', error);
      throw error;
    }
  }

  // Get sheet charts
  async getCharts(spreadsheetId, sheetId) {
    try {
      if (!this.sheets) {
        await this.initializeClients();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        includeGridData: false
      });

      const sheet = response.data.sheets.find(s => s.properties.sheetId === sheetId);
      return sheet ? sheet.charts : [];
    } catch (error) {
      console.error('Error getting charts:', error);
      throw error;
    }
  }

  // Export sheet as CSV
  async exportAsCSV(sheetId, sheetName = 'Sheet1') {
    try {
      if (!this.drive) {
        await this.initializeClients();
      }

      const response = await this.drive.files.export({
        fileId: sheetId,
        mimeType: 'text/csv'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting sheet as CSV:', error);
      throw error;
    }
  }

  // Get sheet revision history
  async getRevisionHistory(sheetId) {
    try {
      if (!this.drive) {
        await this.initializeClients();
      }

      const response = await this.drive.revisions.list({
        fileId: sheetId
      });

      return response.data.revisions;
    } catch (error) {
      console.error('Error getting revision history:', error);
      throw error;
    }
  }
}

module.exports = new SheetsClient();
