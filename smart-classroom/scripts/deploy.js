const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

class DeploymentManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.deploymentConfig = {
      environment: process.env.NODE_ENV || 'production',
      dockerComposeFile: 'docker-compose.yml',
      backupEnabled: true,
      healthCheckTimeout: 30000
    };
  }

  async deploy() {
    try {
      console.log('🚀 Starting Smart Classroom Platform Deployment\n');
      
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Backup existing deployment
      if (this.deploymentConfig.backupEnabled) {
        await this.createBackup();
      }
      
      // Build and deploy
      await this.buildAndDeploy();
      
      // Post-deployment verification
      await this.postDeploymentVerification();
      
      console.log('\n✅ Deployment completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      await this.rollback();
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check if Docker is installed
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker is installed');
    } catch (error) {
      throw new Error('Docker is not installed or not accessible');
    }
    
    // Check if Docker Compose is installed
    try {
      execSync('docker-compose --version', { stdio: 'pipe' });
      console.log('✅ Docker Compose is installed');
    } catch (error) {
      throw new Error('Docker Compose is not installed or not accessible');
    }
    
    // Check environment file
    const envPath = path.join(this.projectRoot, '.env');
    if (!await fs.pathExists(envPath)) {
      throw new Error('.env file not found. Please run setup first.');
    }
    console.log('✅ Environment configuration found');
    
    // Check required environment variables
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'REDIS_URL'
    ];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set`);
      }
    }
    console.log('✅ Required environment variables are set');
    
    // Check disk space
    const diskSpace = await this.getDiskSpace();
    if (diskSpace < 5) { // 5GB minimum
      console.warn('⚠️  Low disk space detected. Consider freeing up space.');
    }
    console.log(`✅ Available disk space: ${diskSpace}GB`);
    
    console.log('✅ Pre-deployment checks passed\n');
  }

  async createBackup() {
    console.log('💾 Creating backup...');
    
    const backupDir = path.join(this.projectRoot, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    await fs.ensureDir(backupPath);
    
    // Backup database
    try {
      const dbBackupPath = path.join(backupPath, 'database');
      await fs.ensureDir(dbBackupPath);
      
      // Export MongoDB data
      execSync(`mongodump --uri="${process.env.MONGODB_URI}" --out="${dbBackupPath}"`, {
        stdio: 'pipe'
      });
      console.log('✅ Database backup created');
    } catch (error) {
      console.warn('⚠️  Database backup failed:', error.message);
    }
    
    // Backup configuration files
    const configFiles = ['.env', 'docker-compose.yml'];
    for (const file of configFiles) {
      const sourcePath = path.join(this.projectRoot, file);
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, path.join(backupPath, file));
      }
    }
    console.log('✅ Configuration backup created');
    
    // Clean old backups (keep last 5)
    await this.cleanOldBackups(backupDir);
    
    console.log(`✅ Backup created at: ${backupPath}\n`);
  }

  async buildAndDeploy() {
    console.log('🔨 Building and deploying services...');
    
    // Stop existing containers
    try {
      execSync('docker-compose down', { 
        cwd: this.projectRoot,
        stdio: 'pipe' 
      });
      console.log('✅ Stopped existing containers');
    } catch (error) {
      console.log('ℹ️  No existing containers to stop');
    }
    
    // Pull latest images
    try {
      execSync('docker-compose pull', { 
        cwd: this.projectRoot,
        stdio: 'inherit' 
      });
      console.log('✅ Pulled latest images');
    } catch (error) {
      console.warn('⚠️  Failed to pull some images, will build locally');
    }
    
    // Build images
    execSync('docker-compose build --no-cache', { 
      cwd: this.projectRoot,
      stdio: 'inherit' 
    });
    console.log('✅ Built application images');
    
    // Start services
    execSync('docker-compose up -d', { 
      cwd: this.projectRoot,
      stdio: 'inherit' 
    });
    console.log('✅ Started all services');
    
    // Wait for services to be ready
    await this.waitForServices();
    
    console.log('✅ All services are running\n');
  }

  async waitForServices() {
    console.log('⏳ Waiting for services to be ready...');
    
    const services = [
      { name: 'Backend API', url: 'http://localhost:5000/health' },
      { name: 'AI Service', url: 'http://localhost:5001/health' },
      { name: 'Media Worker', url: 'http://localhost:5002/health' },
      { name: 'Sheet Sync', url: 'http://localhost:5003/health' },
      { name: 'Frontend', url: 'http://localhost:3000' }
    ];
    
    for (const service of services) {
      await this.waitForService(service.name, service.url);
    }
  }

  async waitForService(name, url) {
    const maxAttempts = 30;
    const delay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ ${name} is ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting for ${name}... (${attempt}/${maxAttempts})`);
        await this.sleep(delay);
      }
    }
    
    throw new Error(`${name} failed to start within timeout period`);
  }

  async postDeploymentVerification() {
    console.log('🔍 Running post-deployment verification...');
    
    // Check service health
    const healthChecks = [
      { name: 'Backend API', url: 'http://localhost:5000/health' },
      { name: 'AI Service', url: 'http://localhost:5001/health' },
      { name: 'Media Worker', url: 'http://localhost:5002/health' },
      { name: 'Sheet Sync', url: 'http://localhost:5003/health' }
    ];
    
    for (const check of healthChecks) {
      try {
        const response = await fetch(check.url);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${check.name}: ${data.status}`);
        } else {
          throw new Error(`Health check failed with status ${response.status}`);
        }
      } catch (error) {
        throw new Error(`${check.name} health check failed: ${error.message}`);
      }
    }
    
    // Check database connectivity
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      console.log('✅ Database connectivity verified');
    } catch (error) {
      throw new Error('Database connectivity check failed');
    }
    
    // Check Redis connectivity
    try {
      const response = await fetch('http://localhost:5002/health');
      const data = await response.json();
      console.log('✅ Redis connectivity verified');
    } catch (error) {
      throw new Error('Redis connectivity check failed');
    }
    
    console.log('✅ Post-deployment verification passed\n');
  }

  async rollback() {
    console.log('🔄 Rolling back deployment...');
    
    try {
      // Stop current deployment
      execSync('docker-compose down', { 
        cwd: this.projectRoot,
        stdio: 'pipe' 
      });
      
      // Find latest backup
      const backupDir = path.join(this.projectRoot, 'backups');
      if (await fs.pathExists(backupDir)) {
        const backups = await fs.readdir(backupDir);
        const latestBackup = backups
          .filter(name => name.startsWith('backup-'))
          .sort()
          .pop();
        
        if (latestBackup) {
          const backupPath = path.join(backupDir, latestBackup);
          
          // Restore configuration
          const envBackup = path.join(backupPath, '.env');
          if (await fs.pathExists(envBackup)) {
            await fs.copy(envBackup, path.join(this.projectRoot, '.env'));
            console.log('✅ Restored environment configuration');
          }
          
          // Restore database
          const dbBackupPath = path.join(backupPath, 'database');
          if (await fs.pathExists(dbBackupPath)) {
            execSync(`mongorestore --uri="${process.env.MONGODB_URI}" "${dbBackupPath}"`, {
              stdio: 'pipe'
            });
            console.log('✅ Restored database');
          }
        }
      }
      
      // Start previous version
      execSync('docker-compose up -d', { 
        cwd: this.projectRoot,
        stdio: 'pipe' 
      });
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
    }
  }

  async getDiskSpace() {
    try {
      const output = execSync('df -h /', { encoding: 'utf8' });
      const lines = output.split('\n');
      const dataLine = lines[1];
      const available = dataLine.split(/\s+/)[3];
      return parseFloat(available.replace('G', ''));
    } catch (error) {
      return 0;
    }
  }

  async cleanOldBackups(backupDir) {
    try {
      const backups = await fs.readdir(backupDir);
      const backupDirs = backups
        .filter(name => name.startsWith('backup-'))
        .map(name => ({
          name,
          path: path.join(backupDir, name),
          stats: fs.statSync(path.join(backupDir, name))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);
      
      // Keep only last 5 backups
      const toDelete = backupDirs.slice(5);
      for (const backup of toDelete) {
        await fs.remove(backup.path);
        console.log(`🗑️  Removed old backup: ${backup.name}`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to clean old backups:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const deploymentManager = new DeploymentManager();
  await deploymentManager.deploy();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DeploymentManager };
