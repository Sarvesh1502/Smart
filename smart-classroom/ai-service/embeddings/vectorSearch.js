const embeddingService = require('./generateEmbeddings');
const natural = require('natural');

class VectorSearchService {
  constructor() {
    this.vectorDatabase = new Map(); // In production, use a proper vector database like Pinecone, Weaviate, or Chroma
    this.indexes = new Map();
    this.searchHistory = [];
    this.maxHistorySize = 1000;
  }

  // Add document to vector database
  async addDocument(id, text, metadata = {}) {
    try {
      console.log(`Adding document to vector database: ${id}`);
      
      // Generate embedding for the document
      const embedding = await embeddingService.generateEmbedding(text);
      
      // Store in vector database
      this.vectorDatabase.set(id, {
        id: id,
        text: text,
        embedding: embedding.vector,
        metadata: metadata,
        addedAt: new Date()
      });
      
      // Update indexes
      this.updateIndexes(id, embedding.vector, metadata);
      
      return {
        success: true,
        id: id,
        embedding: embedding
      };
    } catch (error) {
      console.error('Error adding document to vector database:', error);
      throw error;
    }
  }

  // Add multiple documents
  async addDocuments(documents) {
    try {
      const results = [];
      
      for (const doc of documents) {
        const result = await this.addDocument(doc.id, doc.text, doc.metadata);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error adding documents to vector database:', error);
      throw error;
    }
  }

  // Search for similar documents
  async searchSimilar(query, limit = 10, threshold = 0.7, language = 'en') {
    try {
      console.log(`Searching for similar documents: ${query.substring(0, 50)}...`);
      
      // Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query, language);
      
      // Calculate similarities
      const similarities = [];
      
      for (const [id, doc] of this.vectorDatabase) {
        const similarity = embeddingService.calculateSimilarity(
          queryEmbedding.vector,
          doc.embedding
        );
        
        if (similarity >= threshold) {
          similarities.push({
            id: doc.id,
            text: doc.text,
            similarity: similarity,
            metadata: doc.metadata,
            addedAt: doc.addedAt
          });
        }
      }
      
      // Sort by similarity (descending)
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // Limit results
      const results = similarities.slice(0, limit);
      
      // Add to search history
      this.addToSearchHistory(query, results);
      
      return results;
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  // Search with filters
  async searchWithFilters(query, filters = {}, limit = 10, threshold = 0.7, language = 'en') {
    try {
      // Get all similar documents
      const allResults = await this.searchSimilar(query, limit * 2, threshold, language);
      
      // Apply filters
      let filteredResults = allResults;
      
      if (filters.category) {
        filteredResults = filteredResults.filter(doc => 
          doc.metadata.category === filters.category
        );
      }
      
      if (filters.subject) {
        filteredResults = filteredResults.filter(doc => 
          doc.metadata.subject === filters.subject
        );
      }
      
      if (filters.class) {
        filteredResults = filteredResults.filter(doc => 
          doc.metadata.class === filters.class
        );
      }
      
      if (filters.dateRange) {
        filteredResults = filteredResults.filter(doc => {
          const docDate = new Date(doc.addedAt);
          return docDate >= filters.dateRange.start && docDate <= filters.dateRange.end;
        });
      }
      
      // Limit results
      return filteredResults.slice(0, limit);
    } catch (error) {
      console.error('Filtered vector search error:', error);
      throw error;
    }
  }

  // Hybrid search (vector + keyword)
  async hybridSearch(query, limit = 10, threshold = 0.7, language = 'en') {
    try {
      // Vector search
      const vectorResults = await this.searchSimilar(query, limit, threshold, language);
      
      // Keyword search
      const keywordResults = await this.keywordSearch(query, limit, language);
      
      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(vectorResults, keywordResults);
      
      // Re-rank results
      const rerankedResults = this.rerankResults(query, combinedResults, language);
      
      return rerankedResults.slice(0, limit);
    } catch (error) {
      console.error('Hybrid search error:', error);
      throw error;
    }
  }

  // Keyword search
  async keywordSearch(query, limit = 10, language = 'en') {
    try {
      const results = [];
      const queryTerms = this.extractKeywords(query);
      
      for (const [id, doc] of this.vectorDatabase) {
        const docTerms = this.extractKeywords(doc.text);
        const score = this.calculateKeywordScore(queryTerms, docTerms);
        
        if (score > 0) {
          results.push({
            id: doc.id,
            text: doc.text,
            similarity: score,
            metadata: doc.metadata,
            addedAt: doc.addedAt,
            searchType: 'keyword'
          });
        }
      }
      
      // Sort by score
      results.sort((a, b) => b.similarity - a.similarity);
      
      return results.slice(0, limit);
    } catch (error) {
      console.error('Keyword search error:', error);
      throw error;
    }
  }

  // Extract keywords from text
  extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => natural.PorterStemmer.stem(word));
  }

  // Calculate keyword score
  calculateKeywordScore(queryTerms, docTerms) {
    let score = 0;
    const docTermSet = new Set(docTerms);
    
    for (const term of queryTerms) {
      if (docTermSet.has(term)) {
        score += 1;
      }
    }
    
    return score / queryTerms.length;
  }

  // Combine search results
  combineSearchResults(vectorResults, keywordResults) {
    const combined = new Map();
    
    // Add vector results
    for (const result of vectorResults) {
      combined.set(result.id, {
        ...result,
        vectorScore: result.similarity,
        keywordScore: 0
      });
    }
    
    // Add keyword results
    for (const result of keywordResults) {
      if (combined.has(result.id)) {
        combined.get(result.id).keywordScore = result.similarity;
      } else {
        combined.set(result.id, {
          ...result,
          vectorScore: 0,
          keywordScore: result.similarity
        });
      }
    }
    
    return Array.from(combined.values());
  }

  // Re-rank results
  rerankResults(query, results, language) {
    return results.map(result => {
      // Combine vector and keyword scores
      const combinedScore = (result.vectorScore * 0.7) + (result.keywordScore * 0.3);
      
      return {
        ...result,
        similarity: combinedScore
      };
    }).sort((a, b) => b.similarity - a.similarity);
  }

  // Update indexes
  updateIndexes(id, embedding, metadata) {
    // Update category index
    if (metadata.category) {
      if (!this.indexes.has('category')) {
        this.indexes.set('category', new Map());
      }
      const categoryIndex = this.indexes.get('category');
      if (!categoryIndex.has(metadata.category)) {
        categoryIndex.set(metadata.category, new Set());
      }
      categoryIndex.get(metadata.category).add(id);
    }
    
    // Update subject index
    if (metadata.subject) {
      if (!this.indexes.has('subject')) {
        this.indexes.set('subject', new Map());
      }
      const subjectIndex = this.indexes.get('subject');
      if (!subjectIndex.has(metadata.subject)) {
        subjectIndex.set(metadata.subject, new Set());
      }
      subjectIndex.get(metadata.subject).add(id);
    }
  }

  // Add to search history
  addToSearchHistory(query, results) {
    this.searchHistory.push({
      query: query,
      results: results,
      timestamp: new Date()
    });
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(-this.maxHistorySize);
    }
  }

  // Get search suggestions
  getSearchSuggestions(partialQuery, limit = 5) {
    const suggestions = [];
    const queryLower = partialQuery.toLowerCase();
    
    // Get suggestions from search history
    for (const history of this.searchHistory) {
      if (history.query.toLowerCase().includes(queryLower)) {
        suggestions.push(history.query);
      }
    }
    
    // Get suggestions from document titles/metadata
    for (const [id, doc] of this.vectorDatabase) {
      if (doc.metadata.title && doc.metadata.title.toLowerCase().includes(queryLower)) {
        suggestions.push(doc.metadata.title);
      }
    }
    
    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, limit);
  }

  // Get document by ID
  getDocument(id) {
    return this.vectorDatabase.get(id);
  }

  // Remove document
  removeDocument(id) {
    const doc = this.vectorDatabase.get(id);
    if (doc) {
      this.vectorDatabase.delete(id);
      
      // Remove from indexes
      this.removeFromIndexes(id, doc.metadata);
      
      return true;
    }
    return false;
  }

  // Remove from indexes
  removeFromIndexes(id, metadata) {
    if (metadata.category) {
      const categoryIndex = this.indexes.get('category');
      if (categoryIndex && categoryIndex.has(metadata.category)) {
        categoryIndex.get(metadata.category).delete(id);
      }
    }
    
    if (metadata.subject) {
      const subjectIndex = this.indexes.get('subject');
      if (subjectIndex && subjectIndex.has(metadata.subject)) {
        subjectIndex.get(metadata.subject).delete(id);
      }
    }
  }

  // Get database statistics
  getDatabaseStats() {
    return {
      totalDocuments: this.vectorDatabase.size,
      totalSearches: this.searchHistory.length,
      indexes: {
        categories: this.indexes.get('category')?.size || 0,
        subjects: this.indexes.get('subject')?.size || 0
      }
    };
  }

  // Clear database
  clearDatabase() {
    this.vectorDatabase.clear();
    this.indexes.clear();
    this.searchHistory = [];
  }

  // Export database
  exportDatabase() {
    return {
      documents: Array.from(this.vectorDatabase.values()),
      indexes: Object.fromEntries(
        Array.from(this.indexes.entries()).map(([key, value]) => [
          key,
          Object.fromEntries(
            Array.from(value.entries()).map(([k, v]) => [k, Array.from(v)])
          )
        ])
      ),
      searchHistory: this.searchHistory
    };
  }

  // Import database
  importDatabase(data) {
    this.clearDatabase();
    
    // Import documents
    for (const doc of data.documents) {
      this.vectorDatabase.set(doc.id, doc);
    }
    
    // Import indexes
    for (const [key, value] of Object.entries(data.indexes)) {
      const indexMap = new Map();
      for (const [k, v] of Object.entries(value)) {
        indexMap.set(k, new Set(v));
      }
      this.indexes.set(key, indexMap);
    }
    
    // Import search history
    this.searchHistory = data.searchHistory || [];
  }
}

module.exports = new VectorSearchService();
