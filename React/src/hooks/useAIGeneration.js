import { useState } from 'react';
import { aiGenerationAPI } from '@/lib/fastapi-client';

/**
 * Hook for AI question generation
 */
export const useAIGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generateQuestions = async (config) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGenerationAPI.generateQuestions({
        exam_type: config.examType,
        skill: config.skill,
        topic: config.topic,
        difficulty: config.difficulty,
        num_questions: config.numQuestions || 5,
        question_types: config.questionTypes,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate questions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (config) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGenerationAPI.generateContent({
        content_type: config.contentType,
        skill: config.skill,
        topic: config.topic,
        difficulty: config.difficulty,
        word_count: config.wordCount,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate content');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateExam = async (config) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGenerationAPI.generateExam({
        exam_type: config.examType,
        exam_name: config.examName,
        sections: config.sections,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate exam');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateQuestions,
    generateContent,
    generateExam,
    loading,
    error,
    result,
  };
};
