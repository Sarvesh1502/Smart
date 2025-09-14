const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs-extra');
const path = require('path');

class GoogleAuthService {
  constructor() {
    this.oauth2Client = null;
    this.credentials = null;
    this.tokens = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Load credentials from environment or file
      this.credentials = await this.loadCredentials();
      
      if (this.credentials) {
        this.oauth2Client = new OAuth2Client(
          this.credentials.client_id,
          this.credentials.client_secret,
          this.credentials.redirect_uris[0]
        );
        
        // Load existing tokens if available
        await this.loadTokens();
      }
    } catch (error) {
      console.error('Error initializing Google auth:', error);
    }
  }

  async loadCredentials() {
    try {
      // Try to load from environment variables first
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        return {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5003/auth/google/callback']
        };
      }
      
      // Try to load from credentials file
      const credentialsPath = path.join(__dirname, '../../credentials.json');
      if (await fs.pathExists(credentialsPath)) {
        const credentials = await fs.readJson(credentialsPath);
        return credentials.installed || credentials.web;
      }
      
      console.warn('No Google credentials found');
      return null;
    } catch (error) {
      console.error('Error loading credentials:', error);
      return null;
    }
  }

  async loadTokens() {
    try {
      const tokensPath = path.join(__dirname, '../../tokens.json');
      if (await fs.pathExists(tokensPath)) {
        this.tokens = await fs.readJson(tokensPath);
        this.oauth2Client.setCredentials(this.tokens);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading tokens:', error);
      return false;
    }
  }

  async saveTokens(tokens) {
    try {
      this.tokens = tokens;
      this.oauth2Client.setCredentials(tokens);
      
      const tokensPath = path.join(__dirname, '../../tokens.json');
      await fs.writeJson(tokensPath, tokens, { spaces: 2 });
      
      return true;
    } catch (error) {
      console.error('Error saving tokens:', error);
      return false;
    }
  }

  async getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokensFromCode(code) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens from code:', error);
      throw error;
    }
  }

  async refreshTokens() {
    if (!this.oauth2Client || !this.tokens) {
      throw new Error('No tokens available to refresh');
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      await this.saveTokens(credentials);
      return credentials;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw error;
    }
  }

  async isAuthenticated() {
    if (!this.oauth2Client || !this.tokens) {
      return false;
    }

    try {
      // Check if tokens are valid
      if (this.tokens.expiry_date && Date.now() >= this.tokens.expiry_date) {
        // Try to refresh tokens
        await this.refreshTokens();
      }
      
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  async getAuthenticatedClient() {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }

    return this.oauth2Client;
  }

  async revokeTokens() {
    if (!this.oauth2Client || !this.tokens) {
      return false;
    }

    try {
      await this.oauth2Client.revokeToken(this.tokens.access_token);
      
      // Clear tokens
      this.tokens = null;
      this.oauth2Client.setCredentials({});
      
      // Remove tokens file
      const tokensPath = path.join(__dirname, '../../tokens.json');
      if (await fs.pathExists(tokensPath)) {
        await fs.remove(tokensPath);
      }
      
      return true;
    } catch (error) {
      console.error('Error revoking tokens:', error);
      return false;
    }
  }

  async getAuthInfo() {
    return {
      isAuthenticated: await this.isAuthenticated(),
      hasCredentials: !!this.credentials,
      hasTokens: !!this.tokens,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    };
  }

  // Service account authentication (for server-to-server)
  async authenticateWithServiceAccount(serviceAccountKey) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.metadata.readonly'
        ]
      });

      this.oauth2Client = await auth.getClient();
      return true;
    } catch (error) {
      console.error('Service account authentication error:', error);
      return false;
    }
  }

  // Load service account key from file
  async loadServiceAccountKey(keyPath) {
    try {
      if (await fs.pathExists(keyPath)) {
        const key = await fs.readJson(keyPath);
        return await this.authenticateWithServiceAccount(key);
      }
      return false;
    } catch (error) {
      console.error('Error loading service account key:', error);
      return false;
    }
  }

  // Get current user info
  async getUserInfo() {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }
}

module.exports = new GoogleAuthService();
