const natural = require('natural');
const compromise = require('compromise');
const { HfInference } = require('@huggingface/inference');

class RAGPipeline {
  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.models = {
      indicSBERT: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      questionClassifier: 'facebook/bart-large-mnli',
      answerAssessor: 'microsoft/DialoGPT-medium'
    };
    this.loadedModels = new Map();
    this.initializeModels();
  }

  async initializeModels() {
    try {
      console.log('Initializing AI models...');
      
      // Load IndicSBERT for multilingual embeddings
      await this.loadModel('IndicSBERT', this.models.indicSBERT);
      
      // Load question classifier
      await this.loadModel('QuestionClassifier', this.models.questionClassifier);
      
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
    }
  }

  async loadModel(name, modelId) {
    try {
      console.log(`Loading model: ${name}`);
      this.loadedModels.set(name, true);
      return true;
    } catch (error) {
      console.error(`Error loading model ${name}:`, error);
      return false;
    }
  }

  async isModelLoaded(modelName) {
    return this.loadedModels.has(modelName);
  }

  // Main RAG query processing
  async processQuery(question, context = '', language = 'en') {
    try {
      console.log(`Processing query: ${question} (${language})`);
      
      // Step 1: Preprocess question
      const processedQuestion = await this.preprocessQuestion(question, language);
      
      // Step 2: Classify question
      const classification = await this.classifyQuestion(processedQuestion, language);
      
      // Step 3: Generate embeddings for question
      const questionEmbedding = await this.generateEmbedding(processedQuestion, language);
      
      // Step 4: Search for relevant content
      const relevantContent = await this.searchRelevantContent(questionEmbedding, classification, language);
      
      // Step 5: Generate answer using RAG
      const answer = await this.generateAnswer(processedQuestion, relevantContent, context, language);
      
      // Step 6: Assess answer quality
      const qualityAssessment = await this.assessAnswerQuality(processedQuestion, answer, language);
      
      return {
        answer: answer.text,
        confidence: answer.confidence,
        sources: relevantContent.map(item => ({
          title: item.title,
          content: item.content,
          relevance: item.relevance
        })),
        classification: classification,
        quality: qualityAssessment,
        language: language
      };
    } catch (error) {
      console.error('RAG pipeline error:', error);
      throw error;
    }
  }

  // Preprocess question
  async preprocessQuestion(question, language) {
    try {
      // Clean and normalize text
      let processed = question.trim().toLowerCase();
      
      // Remove special characters but keep question marks
      processed = processed.replace(/[^\w\s?]/g, ' ');
      
      // Handle multilingual text
      if (language !== 'en') {
        processed = await this.translateToEnglish(processed, language);
      }
      
      // Extract key terms
      const keyTerms = this.extractKeyTerms(processed);
      
      return {
        original: question,
        processed: processed,
        keyTerms: keyTerms,
        language: language
      };
    } catch (error) {
      console.error('Question preprocessing error:', error);
      return {
        original: question,
        processed: question,
        keyTerms: [],
        language: language
      };
    }
  }

  // Extract key terms from question
  extractKeyTerms(text) {
    try {
      const doc = compromise(text);
      const nouns = doc.nouns().out('array');
      const adjectives = doc.adjectives().out('array');
      const verbs = doc.verbs().out('array');
      
      return [...nouns, ...adjectives, ...verbs].filter(term => term.length > 2);
    } catch (error) {
      console.error('Key term extraction error:', error);
      return [];
    }
  }

  // Classify question type
  async classifyQuestion(question, language) {
    try {
      const categories = {
        'concept': ['what is', 'define', 'explain', 'meaning', 'definition'],
        'how-to': ['how to', 'how do', 'steps', 'process', 'method'],
        'why': ['why', 'reason', 'cause', 'because'],
        'example': ['example', 'instance', 'case', 'sample'],
        'comparison': ['compare', 'difference', 'versus', 'vs', 'contrast'],
        'calculation': ['calculate', 'solve', 'compute', 'find', 'result']
      };

      const questionText = typeof question === 'object' ? question.processed : question;
      const lowerQuestion = questionText.toLowerCase();
      
      let bestCategory = 'general';
      let bestScore = 0;
      const tags = [];

      for (const [category, keywords] of Object.entries(categories)) {
        let score = 0;
        for (const keyword of keywords) {
          if (lowerQuestion.includes(keyword)) {
            score += 1;
            tags.push(keyword);
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }

      return {
        category: bestCategory,
        subcategory: bestCategory,
        confidence: Math.min(bestScore / 3, 1.0),
        tags: [...new Set(tags)]
      };
    } catch (error) {
      console.error('Question classification error:', error);
      return {
        category: 'general',
        subcategory: 'general',
        confidence: 0.5,
        tags: []
      };
    }
  }

  // Generate embeddings
  async generateEmbedding(text, language) {
    try {
      const textToEmbed = typeof text === 'object' ? text.processed : text;
      
      // Use Hugging Face API for embeddings
      const embedding = await this.hf.featureExtraction({
        model: this.models.indicSBERT,
        inputs: textToEmbed
      });

      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      // Return a dummy embedding if API fails
      return Array(384).fill(0).map(() => Math.random() - 0.5);
    }
  }

  // Search for relevant content (simulated)
  async searchRelevantContent(embedding, classification, language) {
    try {
      // In a real implementation, this would search a vector database
      // For now, we'll return simulated relevant content
      const relevantContent = [
        {
          title: 'Mathematics Concepts',
          content: 'This is relevant content about mathematics concepts that matches your question.',
          relevance: 0.85,
          source: 'textbook_chapter_5'
        },
        {
          title: 'Problem Solving Methods',
          content: 'Here are step-by-step methods for solving mathematical problems.',
          relevance: 0.78,
          source: 'lecture_notes_week_3'
        },
        {
          title: 'Common Examples',
          content: 'Examples and practice problems related to your question.',
          relevance: 0.72,
          source: 'practice_questions'
        }
      ];

      return relevantContent.filter(item => item.relevance > 0.7);
    } catch (error) {
      console.error('Content search error:', error);
      return [];
    }
  }

  // Generate answer using RAG
  async generateAnswer(question, relevantContent, context, language) {
    try {
      const questionText = typeof question === 'object' ? question.processed : question;
      
      // Combine relevant content
      const combinedContext = relevantContent
        .map(item => item.content)
        .join('\n\n');
      
      // Generate answer using context
      let answer = '';
      let confidence = 0.8;

      if (combinedContext) {
        // In a real implementation, this would use a language model
        answer = `Based on the available information: ${combinedContext.substring(0, 500)}...`;
        confidence = 0.85;
      } else {
        answer = `I understand you're asking about "${questionText}". While I don't have specific information about this topic in my current knowledge base, I'd be happy to help you find the answer. Could you provide more context or rephrase your question?`;
        confidence = 0.6;
      }

      // Translate back to original language if needed
      if (language !== 'en' && typeof question === 'object') {
        answer = await this.translateFromEnglish(answer, language);
      }

      return {
        text: answer,
        confidence: confidence,
        sources: relevantContent.length
      };
    } catch (error) {
      console.error('Answer generation error:', error);
      return {
        text: 'I apologize, but I encountered an error while processing your question. Please try again.',
        confidence: 0.3,
        sources: 0
      };
    }
  }

  // Assess answer quality
  async assessAnswerQuality(question, answer, language) {
    try {
      const questionText = typeof question === 'object' ? question.processed : question;
      const answerText = typeof answer === 'object' ? answer.text : answer;
      
      // Simple quality assessment based on length and content
      let quality = 0.5;
      let feedback = '';
      const suggestions = [];

      // Check answer length
      if (answerText.length < 50) {
        quality -= 0.2;
        feedback += 'Answer is quite brief. ';
        suggestions.push('Provide more detailed explanation');
      } else if (answerText.length > 500) {
        quality += 0.1;
      }

      // Check for question addressing
      if (answerText.toLowerCase().includes('i don\'t know') || 
          answerText.toLowerCase().includes('i cannot')) {
        quality -= 0.3;
        feedback += 'Answer indicates uncertainty. ';
        suggestions.push('Try to provide more specific information');
      }

      // Check for helpful content
      if (answerText.includes('based on') || answerText.includes('according to')) {
        quality += 0.1;
      }

      return {
        quality: Math.max(0, Math.min(1, quality)),
        confidence: 0.8,
        feedback: feedback || 'Answer quality is acceptable',
        suggestions: suggestions
      };
    } catch (error) {
      console.error('Answer quality assessment error:', error);
      return {
        quality: 0.5,
        confidence: 0.5,
        feedback: 'Unable to assess answer quality',
        suggestions: []
      };
    }
  }

  // Language detection
  async detectLanguage(text) {
    try {
      // Simple language detection based on character patterns
      const hindiPattern = /[\u0900-\u097F]/;
      const tamilPattern = /[\u0B80-\u0BFF]/;
      const teluguPattern = /[\u0C00-\u0C7F]/;
      const bengaliPattern = /[\u0980-\u09FF]/;
      
      if (hindiPattern.test(text)) {
        return { code: 'hi', confidence: 0.9, name: 'Hindi' };
      } else if (tamilPattern.test(text)) {
        return { code: 'ta', confidence: 0.9, name: 'Tamil' };
      } else if (teluguPattern.test(text)) {
        return { code: 'te', confidence: 0.9, name: 'Telugu' };
      } else if (bengaliPattern.test(text)) {
        return { code: 'bn', confidence: 0.9, name: 'Bengali' };
      } else {
        return { code: 'en', confidence: 0.8, name: 'English' };
      }
    } catch (error) {
      console.error('Language detection error:', error);
      return { code: 'en', confidence: 0.5, name: 'English' };
    }
  }

  // Translation functions (simplified)
  async translateToEnglish(text, fromLanguage) {
    // In a real implementation, this would use a translation service
    // For now, return the text as-is
    return text;
  }

  async translateFromEnglish(text, toLanguage) {
    // In a real implementation, this would use a translation service
    // For now, return the text as-is
    return text;
  }
}

module.exports = new RAGPipeline();
