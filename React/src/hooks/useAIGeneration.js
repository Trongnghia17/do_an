import { useState } from 'react';
import { aiGenerationAPI } from '@/lib/fastapi-client';

/**
 * Hook for AI question generation
 */
export const useAIGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generateExam = async (config) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGenerationAPI.generateExam({
        exam_id: config.examId,
        exam_test_id: config.examTestId,
        skill_type: config.skillType,
        skill_name: config.skillName,
        time_limit: config.timeLimit,
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

  const generateQuestions = async (config) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGenerationAPI.generateQuestions({
        exam_type: config.examType,
        skill: config.skill,
        topic: config.topic,
        difficulty: config.difficulty,
        num_questions: config.numQuestions || config.num_questions,
        question_types: config.questionTypes || config.question_types,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate questions';
      setError(errorMsg);
      console.error('Generate questions error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateExam,
    generateQuestions,
    loading,
    error,
    result,
  };
};
