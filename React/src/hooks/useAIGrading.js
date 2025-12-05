import { useState } from 'react';
import { aiGradingAPI } from '@/lib/fastapi-client';

/**
 * Hook for AI grading functionality
 */
export const useAIGrading = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const gradeWriting = async (questionId, questionText, answer, examType = 'IELTS', userId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGradingAPI.gradeWriting({
        question_id: questionId,
        question_text: questionText,
        answer: answer,
        exam_type: examType,
        user_id: userId,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to grade writing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const gradeSpeaking = async (questionId, questionText, transcript, examType = 'IELTS', userId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGradingAPI.gradeSpeaking({
        question_id: questionId,
        question_text: questionText,
        transcript: transcript,
        exam_type: examType,
        user_id: userId,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to grade speaking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async (questionText, userAnswer, correctAnswer, skill) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGradingAPI.getFeedback({
        question_text: questionText,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        skill: skill,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get feedback');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const gradeBatch = async (submissionId, answers) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiGradingAPI.gradeBatch({
        submission_id: submissionId,
        answers: answers,
      });
      
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to grade batch');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    gradeWriting,
    gradeSpeaking,
    getFeedback,
    gradeBatch,
    loading,
    error,
    result,
  };
};
