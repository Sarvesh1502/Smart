const { HfInference } = require('@huggingface/inference');
const natural = require('natural');

class EmbeddingService {
  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.model = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
    this.embeddingCache = new Map();
    this.maxCacheSize = 1000;
  }

  // Generate embedding for a single text
  async generateEmbedding(text, language = 'en') {
    try {
      console.log(`Generating embedding for: ${text.substring(0, 50)}... (${language})`);
      
      // Check cache first
      const cacheKey = `${text}_${language}`;
      if (this.embeddingCache.has(cacheKey)) {
        return this.embeddingCache.get(cacheKey);
      }
      
      // Preprocess text
      const processedText = this.preprocessText(text, language);
      
      // Generate embedding using Hugging Face
      const embedding = await this.hf.featureExtraction({
        model: this.model,
        inputs: processedText
      });
      
      // Normalize embedding
      const normalizedEmbedding = this.normalizeEmbedding(embedding);
      
      const result = {
        vector: normalizedEmbedding,
        model: this.model,
        language: language,
        text: processedText,
        generatedAt: new Date()
      };
      
      // Cache the result
      this.cacheEmbedding(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  // Generate embeddings for multiple texts
  async generateBatchEmbeddings(texts, language = 'en') {
    try {
      console.log(`Generating batch embeddings for ${texts.length} texts (${language})`);
      
      const results = [];
      const batchSize = 10; // Process in batches to avoid rate limits
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(text => this.generateEmbedding(text, language))
        );
        results.push(...batchResults);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await this.delay(1000);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw error;
    }
  }

  // Preprocess text for embedding generation
  preprocessText(text, language) {
    // Clean and normalize text
    let processed = text.trim().toLowerCase();
    
    // Remove HTML tags
    processed = processed.replace(/<[^>]*>/g, '');
    
    // Remove special characters but keep basic punctuation
    processed = processed.replace(/[^\w\s.,!?;:'"()-]/g, ' ');
    
    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ').trim();
    
    // Handle multilingual text
    if (language !== 'en') {
      processed = this.handleMultilingualText(processed, language);
    }
    
    // Limit length (most embedding models have token limits)
    if (processed.length > 512) {
      processed = processed.substring(0, 512);
    }
    
    return processed;
  }

  // Handle multilingual text
  handleMultilingualText(text, language) {
    // For now, return text as-is
    // In a more advanced implementation, you could:
    // - Translate to English for better embedding quality
    // - Use language-specific preprocessing
    // - Handle script conversion (e.g., Devanagari to Latin)
    
    return text;
  }

  // Normalize embedding vector
  normalizeEmbedding(embedding) {
    // Convert to array if it's not already
    const vector = Array.isArray(embedding) ? embedding : Array.from(embedding);
    
    // Calculate magnitude
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    // Normalize to unit vector
    return vector.map(val => val / magnitude);
  }

  // Cache embedding
  cacheEmbedding(key, embedding) {
    // Implement LRU cache
    if (this.embeddingCache.size >= this.maxCacheSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }
    
    this.embeddingCache.set(key, embedding);
  }

  // Calculate cosine similarity between two embeddings
  calculateSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Find most similar embeddings
  findMostSimilar(queryEmbedding, candidateEmbeddings, topK = 5) {
    const similarities = candidateEmbeddings.map((candidate, index) => ({
      index: index,
      similarity: this.calculateSimilarity(queryEmbedding, candidate.vector),
      text: candidate.text,
      metadata: candidate.metadata || {}
    }));
    
    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, topK);
  }

  // Generate embedding for document chunks
  async generateDocumentEmbeddings(document, chunkSize = 500, overlap = 50) {
    try {
      const chunks = this.chunkDocument(document, chunkSize, overlap);
      const embeddings = await this.generateBatchEmbeddings(chunks);
      
      return embeddings.map((embedding, index) => ({
        ...embedding,
        chunkIndex: index,
        chunkText: chunks[index],
        startPosition: index * (chunkSize - overlap),
        endPosition: Math.min((index + 1) * chunkSize - index * overlap, document.length)
      }));
    } catch (error) {
      console.error('Document embedding generation error:', error);
      throw error;
    }
  }

  // Chunk document into smaller pieces
  chunkDocument(document, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    
    while (start < document.length) {
      const end = Math.min(start + chunkSize, document.length);
      const chunk = document.substring(start, end);
      chunks.push(chunk);
      start = end - overlap;
    }
    
    return chunks;
  }

  // Generate embedding for structured data
  async generateStructuredEmbeddings(data, fields) {
    try {
      const texts = [];
      
      for (const item of data) {
        let combinedText = '';
        for (const field of fields) {
          if (item[field]) {
            combinedText += `${field}: ${item[field]} `;
          }
        }
        texts.push(combinedText.trim());
      }
      
      const embeddings = await this.generateBatchEmbeddings(texts);
      
      return embeddings.map((embedding, index) => ({
        ...embedding,
        originalData: data[index],
        combinedText: texts[index]
      }));
    } catch (error) {
      console.error('Structured embedding generation error:', error);
      throw error;
    }
  }

  // Update embedding cache
  updateCache(newEmbeddings) {
    for (const [key, embedding] of newEmbeddings) {
      this.cacheEmbedding(key, embedding);
    }
  }

  // Clear embedding cache
  clearCache() {
    this.embeddingCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate()
    };
  }

  // Calculate cache hit rate (simplified)
  calculateHitRate() {
    // This would require tracking hits/misses
    // For now, return a placeholder
    return 0.85;
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get embedding model info
  getModelInfo() {
    return {
      model: this.model,
      dimension: 384, // Typical dimension for this model
      maxTokens: 512,
      supportedLanguages: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'pa', 'or', 'as']
    };
  }
}

module.exports = new EmbeddingService();
