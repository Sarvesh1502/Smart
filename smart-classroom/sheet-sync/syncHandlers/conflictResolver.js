class ConflictResolver {
  constructor() {
    this.resolutionStrategies = {
      'local': this.resolveWithLocal,
      'remote': this.resolveWithRemote,
      'merge': this.resolveWithMerge,
      'timestamp': this.resolveWithTimestamp,
      'manual': this.resolveWithManual
    };
  }

  // Main conflict resolution method
  async resolveConflicts(localData, remoteData, strategy = 'local') {
    try {
      console.log(`Resolving conflicts using strategy: ${strategy}`);
      
      const conflicts = this.detectConflicts(localData, remoteData);
      
      if (conflicts.length === 0) {
        return {
          resolvedData: localData,
          conflicts: [],
          strategy: strategy
        };
      }

      const resolver = this.resolutionStrategies[strategy];
      if (!resolver) {
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
      }

      const resolvedData = await resolver.call(this, localData, remoteData, conflicts);
      
      return {
        resolvedData: resolvedData,
        conflicts: conflicts,
        strategy: strategy,
        resolvedAt: new Date()
      };
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      throw error;
    }
  }

  // Detect conflicts between local and remote data
  detectConflicts(localData, remoteData) {
    const conflicts = [];
    
    // Create maps for easier lookup
    const localMap = new Map();
    const remoteMap = new Map();
    
    localData.forEach(item => {
      const key = this.getRecordKey(item);
      if (key) {
        localMap.set(key, item);
      }
    });
    
    remoteData.forEach(item => {
      const key = this.getRecordKey(item);
      if (key) {
        remoteMap.set(key, item);
      }
    });
    
    // Find conflicts
    for (const [key, localRecord] of localMap) {
      const remoteRecord = remoteMap.get(key);
      
      if (remoteRecord) {
        const differences = this.findDifferences(localRecord, remoteRecord);
        if (differences.length > 0) {
          conflicts.push({
            key: key,
            localRecord: localRecord,
            remoteRecord: remoteRecord,
            differences: differences,
            conflictType: this.determineConflictType(differences)
          });
        }
      }
    }
    
    return conflicts;
  }

  // Get unique key for a record
  getRecordKey(record) {
    // Try different possible key fields
    const keyFields = ['id', '_id', 'studentId', 'rollNumber', 'email'];
    
    for (const field of keyFields) {
      if (record[field]) {
        return `${field}:${record[field]}`;
      }
    }
    
    // If no key field found, create a hash of the record
    return this.createRecordHash(record);
  }

  // Create hash for record
  createRecordHash(record) {
    const str = JSON.stringify(record, Object.keys(record).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash:${Math.abs(hash)}`;
  }

  // Find differences between two records
  findDifferences(localRecord, remoteRecord) {
    const differences = [];
    const allKeys = new Set([...Object.keys(localRecord), ...Object.keys(remoteRecord)]);
    
    for (const key of allKeys) {
      const localValue = localRecord[key];
      const remoteValue = remoteRecord[key];
      
      // Skip internal fields
      if (key.startsWith('_')) {
        continue;
      }
      
      if (this.valuesAreDifferent(localValue, remoteValue)) {
        differences.push({
          field: key,
          localValue: localValue,
          remoteValue: remoteValue,
          changeType: this.getChangeType(localValue, remoteValue)
        });
      }
    }
    
    return differences;
  }

  // Check if two values are different
  valuesAreDifferent(localValue, remoteValue) {
    // Handle null/undefined
    if (localValue === null || localValue === undefined) {
      return remoteValue !== null && remoteValue !== undefined;
    }
    if (remoteValue === null || remoteValue === undefined) {
      return localValue !== null && localValue !== undefined;
    }
    
    // Handle dates
    if (localValue instanceof Date && remoteValue instanceof Date) {
      return localValue.getTime() !== remoteValue.getTime();
    }
    
    // Handle objects
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return JSON.stringify(localValue) !== JSON.stringify(remoteValue);
    }
    
    // Handle primitives
    return localValue !== remoteValue;
  }

  // Get change type
  getChangeType(localValue, remoteValue) {
    if (localValue === null || localValue === undefined) {
      return 'added';
    }
    if (remoteValue === null || remoteValue === undefined) {
      return 'removed';
    }
    return 'modified';
  }

  // Determine conflict type
  determineConflictType(differences) {
    const changeTypes = differences.map(diff => diff.changeType);
    
    if (changeTypes.includes('added') && changeTypes.includes('removed')) {
      return 'structural';
    }
    
    if (changeTypes.every(type => type === 'modified')) {
      return 'data';
    }
    
    return 'mixed';
  }

  // Resolve conflicts using local data
  resolveWithLocal(localData, remoteData, conflicts) {
    console.log(`Resolving ${conflicts.length} conflicts using local data`);
    return localData;
  }

  // Resolve conflicts using remote data
  resolveWithRemote(localData, remoteData, conflicts) {
    console.log(`Resolving ${conflicts.length} conflicts using remote data`);
    return remoteData;
  }

  // Resolve conflicts by merging
  resolveWithMerge(localData, remoteData, conflicts) {
    console.log(`Resolving ${conflicts.length} conflicts by merging`);
    
    const mergedData = [...localData];
    const localMap = new Map();
    
    // Create map of local data
    localData.forEach(item => {
      const key = this.getRecordKey(item);
      if (key) {
        localMap.set(key, item);
      }
    });
    
    // Merge remote data
    remoteData.forEach(remoteItem => {
      const key = this.getRecordKey(remoteItem);
      const localItem = localMap.get(key);
      
      if (localItem) {
        // Merge the records
        const mergedItem = this.mergeRecords(localItem, remoteItem);
        const index = mergedData.findIndex(item => this.getRecordKey(item) === key);
        if (index !== -1) {
          mergedData[index] = mergedItem;
        }
      } else {
        // Add new record from remote
        mergedData.push(remoteItem);
      }
    });
    
    return mergedData;
  }

  // Merge two records
  mergeRecords(localRecord, remoteRecord) {
    const merged = { ...localRecord };
    
    // Add fields from remote that don't exist in local
    for (const [key, value] of Object.entries(remoteRecord)) {
      if (!(key in merged) || merged[key] === null || merged[key] === undefined) {
        merged[key] = value;
      }
    }
    
    // Add merge metadata
    merged._mergedAt = new Date();
    merged._mergeSource = 'conflict_resolution';
    
    return merged;
  }

  // Resolve conflicts using timestamp
  resolveWithTimestamp(localData, remoteData, conflicts) {
    console.log(`Resolving ${conflicts.length} conflicts using timestamp`);
    
    const resolvedData = [...localData];
    
    conflicts.forEach(conflict => {
      const localTimestamp = this.getRecordTimestamp(conflict.localRecord);
      const remoteTimestamp = this.getRecordTimestamp(conflict.remoteRecord);
      
      const index = resolvedData.findIndex(item => 
        this.getRecordKey(item) === conflict.key
      );
      
      if (index !== -1) {
        // Use the record with the more recent timestamp
        if (remoteTimestamp > localTimestamp) {
          resolvedData[index] = conflict.remoteRecord;
        }
      }
    });
    
    return resolvedData;
  }

  // Get record timestamp
  getRecordTimestamp(record) {
    const timestampFields = ['_lastUpdated', 'updatedAt', 'modifiedAt', 'timestamp'];
    
    for (const field of timestampFields) {
      if (record[field]) {
        const date = new Date(record[field]);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }
    
    // Default to current time if no timestamp found
    return Date.now();
  }

  // Resolve conflicts manually (requires user intervention)
  resolveWithManual(localData, remoteData, conflicts) {
    console.log(`Manual resolution required for ${conflicts.length} conflicts`);
    
    // In a real implementation, this would:
    // 1. Store conflicts for manual review
    // 2. Notify administrators
    // 3. Provide a UI for conflict resolution
    
    // For now, return local data with conflict metadata
    return localData.map(record => {
      const key = this.getRecordKey(record);
      const conflict = conflicts.find(c => c.key === key);
      
      if (conflict) {
        return {
          ...record,
          _hasConflict: true,
          _conflictId: conflict.key,
          _conflictType: conflict.conflictType,
          _conflictFields: conflict.differences.map(d => d.field)
        };
      }
      
      return record;
    });
  }

  // Get conflict summary
  getConflictSummary(conflicts) {
    const summary = {
      totalConflicts: conflicts.length,
      conflictTypes: {},
      fieldConflicts: {},
      severity: 'low'
    };
    
    conflicts.forEach(conflict => {
      // Count by conflict type
      summary.conflictTypes[conflict.conflictType] = 
        (summary.conflictTypes[conflict.conflictType] || 0) + 1;
      
      // Count by field
      conflict.differences.forEach(diff => {
        summary.fieldConflicts[diff.field] = 
          (summary.fieldConflicts[diff.field] || 0) + 1;
      });
    });
    
    // Determine severity
    if (conflicts.length > 50) {
      summary.severity = 'high';
    } else if (conflicts.length > 10) {
      summary.severity = 'medium';
    }
    
    return summary;
  }

  // Validate resolved data
  validateResolvedData(resolvedData, originalLocal, originalRemote) {
    const validation = {
      isValid: true,
      issues: []
    };
    
    // Check for data loss
    const originalCount = originalLocal.length + originalRemote.length;
    const resolvedCount = resolvedData.length;
    
    if (resolvedCount < originalLocal.length) {
      validation.issues.push('Data loss detected: fewer records in resolved data');
      validation.isValid = false;
    }
    
    // Check for duplicate keys
    const keys = new Set();
    resolvedData.forEach(record => {
      const key = this.getRecordKey(record);
      if (keys.has(key)) {
        validation.issues.push(`Duplicate key detected: ${key}`);
        validation.isValid = false;
      }
      keys.add(key);
    });
    
    return validation;
  }
}

module.exports = new ConflictResolver();
