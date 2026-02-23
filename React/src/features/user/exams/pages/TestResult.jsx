import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestResult } from '../api/exams.api';
import { useAIGrading } from '@/hooks/useAIGrading';
import { aiGradingAPI } from '@/lib/fastapi-client';
import { Modal } from 'antd';
import WritingResultUI from '../components/WritingResultUI';
import SpeakingResultUI from '../components/SpeakingResultUI';
import logo from '@/assets/images/logo.png';
import mascotImage from '@/assets/images/cuchucmung.png';
import './TestResult.css';
import './TestResultReview.css';

// Component Modal hiển thị giải thích chi tiết
const ExplanationModal = ({ visible, onClose, answer }) => {
  if (!answer) return null;

  const isCorrect = answer.is_correct;
  const userAnswer = answer.user_answer || '';
  const correctAnswer = answer.correct_answer || '';
  const questionNumber = answer.question_number;
  const questionContent = answer.question_content || answer.question_text || '';
  
  // Parse metadata to get explanation
  let explanation = '';
  let locateText = '';
  
  if (answer.metadata) {
    try {
      const metadata = typeof answer.metadata === 'string' ? JSON.parse(answer.metadata) : answer.metadata;
      
      // Get feedback from metadata.answers array
      if (metadata.answers && Array.isArray(metadata.answers)) {
        const correctAnswerObj = metadata.answers.find(a => a.is_correct === "1" || a.is_correct === 1 || a.is_correct === true);
        if (correctAnswerObj && correctAnswerObj.feedback) {
          explanation = correctAnswerObj.feedback;
        }
      }
      
      // Fallback to other fields
      explanation = explanation || metadata.explanation || metadata.feedback || answer.feedback || '';
      locateText = metadata.locate || metadata.hint || answer.hint || '';
    } catch (e) {
      console.error('Error parsing metadata:', e);
    }
  }

  const isUnanswered = !userAnswer || userAnswer.trim() === '';

  return (
    <Modal
      title={
        <div style={{ 
          borderBottom: '1px solid #E7E7E7', 
          paddingBottom: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1F2937',
            marginBottom: '8px'
          }}>
            Giải thích chi tiết - Câu {questionNumber}
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6B7280',
            fontWeight: 400
          }}>
            Xem phân tích chi tiết về câu hỏi và đáp án
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      className="explanation-modal"
    >
      <div className="explanation-modal-content">
        {/* Câu hỏi */}
        {questionContent && (
          <div className="explanation-section">
            <div className="explanation-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12M12 8H12.01" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Câu hỏi
            </div>
            <div 
              className="explanation-section-content"
              dangerouslySetInnerHTML={{ __html: questionContent }}
            />
          </div>
        )}

        {/* Đáp án của bạn */}
        <div className="explanation-section">
          <div className="explanation-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={isCorrect ? "#35A815" : isUnanswered ? "#F59E0B" : "#EF4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Đáp án của bạn
          </div>
          <div className="explanation-section-content">
            <span className={`explanation-answer-badge ${isCorrect ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect'}`}>
              {userAnswer || <em>(Chưa trả lời)</em>}
            </span>
            {isCorrect ? (
              <span className="explanation-status-text correct">✓ Chính xác</span>
            ) : isUnanswered ? (
              <span className="explanation-status-text unanswered">⊘ Chưa trả lời</span>
            ) : (
              <span className="explanation-status-text incorrect">✗ Chưa chính xác</span>
            )}
          </div>
        </div>

        {/* Đáp án đúng */}
        {!isCorrect && correctAnswer && (
          <div className="explanation-section">
            <div className="explanation-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#35A815" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Đáp án đúng
            </div>
            <div className="explanation-section-content">
              <span className="explanation-answer-badge correct">
                {correctAnswer}
              </span>
            </div>
          </div>
        )}

        {/* Giải thích */}
        {explanation && (
          <div className="explanation-section">
            <div className="explanation-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Giải thích
            </div>
            <div 
              className="explanation-section-content explanation-text"
              dangerouslySetInnerHTML={{ __html: explanation }}
            />
          </div>
        )}

        {/* Locate hint */}
        {locateText && (
          <div className="explanation-section">
            <div className="explanation-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Vị trí trong bài đọc
            </div>
            <div className="explanation-section-content">
              <div className="explanation-locate-text">
                {locateText}
              </div>
            </div>
          </div>
        )}

        {/* Nếu không có giải thích */}
        {!explanation && !locateText && (
          <div className="explanation-section" style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}>
            <div className="explanation-section-content" style={{ color: '#92400E', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Câu hỏi này chưa có giải thích chi tiết từ hệ thống.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default function TestResult() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'correct', 'incorrect'
  const [aiGradingResult, setAiGradingResult] = useState(null);
  const [showAIGrading, setShowAIGrading] = useState(false);
  const { gradeWriting, gradeSpeaking, loading: aiLoading, error: aiError } = useAIGrading();
  
  // Modal state for explanation
  const [explanationModalVisible, setExplanationModalVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await getTestResult(resultId);
        if (response.data.success) {
          setResult(response.data.data);
          
          // Check if already has AI grading result
          const hasAIGrading = response.data.data.answers?.some(ans => ans.has_ai_grading && ans.ai_feedback);
          if (hasAIGrading) {
            // Load ALL AI grading results (for multi-task support)
            const aiGradedAnswers = response.data.data.answers.filter(ans => ans.has_ai_grading && ans.ai_feedback);
            
            if (aiGradedAnswers.length === 1) {
              // Single task - load directly
              setAiGradingResult(aiGradedAnswers[0].ai_feedback);
            } else if (aiGradedAnswers.length === 2) {
              // Multi-task (Task 1 + Task 2) - reconstruct multi-task format
              const task1Score = parseFloat(aiGradedAnswers[0].ai_feedback.overall_band) || 0;
              const task2Score = parseFloat(aiGradedAnswers[1].ai_feedback.overall_band) || 0;
              
              // IELTS Writing: Task 1 = 1/3, Task 2 = 2/3
              const weightedScore = (task1Score * (1/3)) + (task2Score * (2/3));
              const roundedScore = Math.round(weightedScore * 2) / 2;
              
              const multiTaskResult = {
                isMultiTask: true,
                overall_band: parseFloat(roundedScore.toFixed(1)),
                tasks: aiGradedAnswers.map((ans, idx) => ({
                  taskNumber: idx + 1,
                  result: ans.ai_feedback
                }))
              };
              
              setAiGradingResult(multiTaskResult);
            } else if (aiGradedAnswers.length > 2) {
              // More than 2 tasks - use equal weight
              const sum = aiGradedAnswers.reduce((acc, ans) => {
                const score = parseFloat(ans.ai_feedback.overall_band) || 0;
                return acc + score;
              }, 0);
              const avgScore = sum / aiGradedAnswers.length;
              const roundedScore = Math.round(avgScore * 2) / 2;
              
              const multiTaskResult = {
                isMultiTask: true,
                overall_band: parseFloat(roundedScore.toFixed(1)),
                tasks: aiGradedAnswers.map((ans, idx) => ({
                  taskNumber: idx + 1,
                  result: ans.ai_feedback
                }))
              };
              
              setAiGradingResult(multiTaskResult);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching test result:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="test-result__loading">
        <div>Đang tải kết quả...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="test-result__error">
        <div>Không tìm thấy kết quả bài thi</div>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  const correctAnswers = result.correct_answers || 0;
  const totalQuestions = result.total_questions || 0;
  const incorrectAnswers = result.answered_questions - correctAnswers; // Sửa: chỉ tính câu trả lời sai, không tính câu bỏ qua
  const unansweredCount = totalQuestions - result.answered_questions;

  // Kiểm tra loại skill (reading/listening có đáp án, speaking/writing chờ chấm)
  const skillType = result.skill?.skill_type?.toLowerCase();
  const hasAutoGrading = skillType === 'reading' || skillType === 'listening';

  // Group answers by part and section
  const answersByPart = {};
  if (result.answers && Array.isArray(result.answers)) {
    result.answers.forEach((answer) => {
      const part = answer.part || 'Part 1';
      
      if (!answersByPart[part]) {
        answersByPart[part] = [];
      }
      answersByPart[part].push(answer);
    });
  }

  const filteredAnswers = (answers) => {
    if (activeTab === 'correct') {
      return answers.filter(a => a.is_correct);
    }
    if (activeTab === 'incorrect') {
      return answers.filter(a => !a.is_correct);
    }
    return answers;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAIGrading = async () => {
    if (!result || !result.answers || result.answers.length === 0) {
      alert('Không tìm thấy câu trả lời để chấm điểm');
      return;
    }

    setShowAIGrading(true);

    try {
      console.log('All answers:', result.answers);
      
      const isWriting = skillType === 'writing';
      const isSpeaking = skillType === 'speaking';

      // Lấy tất cả câu trả lời có answer_text hoặc user_answer hoặc answer_audio
      const answersToGrade = result.answers.filter(ans => {
        if (isSpeaking) {
          // For speaking, check if answer_audio exists (URL to audio file)
          return ans.answer_audio && ans.answer_audio.trim() !== '';
        } else {
          // For writing, check if answer_text or user_answer exists
          const answer = ans.answer_text || ans.user_answer || '';
          return answer.trim() !== '';
        }
      });

      if (answersToGrade.length === 0) {
        if (isSpeaking) {
          alert('Bạn chưa ghi âm câu trả lời. Vui lòng làm bài Speaking trước khi sử dụng AI chấm điểm.');
        } else {
          alert('Bạn chưa nhập câu trả lời. Vui lòng làm bài trước khi sử dụng AI chấm điểm.');
        }
        setShowAIGrading(false);
        return;
      }

      console.log(`Grading ${answersToGrade.length} answer(s)...`);

      // Chấm từng câu trả lời
      const gradingResults = [];
      
      for (const answer of answersToGrade) {
        const questionText = answer.question_content || answer.question_text || answer.part || 'Writing/Speaking question';
        
        let userAnswer;
        if (isSpeaking && answer.answer_audio) {
          // For Speaking, transcribe the audio first
          try {
            console.log(`Transcribing audio: ${answer.answer_audio}`);
            const transcriptionResult = await aiGradingAPI.transcribeAudio(answer.answer_audio, 'en');
            userAnswer = transcriptionResult.transcript;
            console.log(`Transcription complete: ${userAnswer.substring(0, 100)}...`);
          } catch (transcribeError) {
            console.error(`Error transcribing audio for question ${answer.question_id}:`, transcribeError);
            message.error(`Không thể chuyển audio thành text cho câu ${answer.question_number}`);
            continue; // Skip this question
          }
        } else {
          userAnswer = answer.answer_text || answer.user_answer || '';
        }

        console.log(`Grading question ${answer.question_id}:`, questionText.substring(0, 50) + '...');
        console.log(`Answer length: ${userAnswer.length} characters`);

        let gradingResult;
        
        if (isWriting) {
          gradingResult = await gradeWriting(
            answer.question_id,
            questionText,
            userAnswer,
            'IELTS'
          );
        } else if (isSpeaking) {
          gradingResult = await gradeSpeaking(
            answer.question_id,
            questionText,
            userAnswer,
            'IELTS'
          );
        }

        if (gradingResult) {
          gradingResults.push({
            question_id: answer.question_id,
            result: gradingResult
          });

          // Lưu AI grading result vào database
          try {
            await aiGradingAPI.saveAIGrading({
              submission_id: result.id,
              question_id: answer.question_id,
              ai_grading_result: gradingResult
            });
            console.log(`Saved AI grading for question ${answer.question_id}`);
          } catch (saveError) {
            console.error(`Failed to save AI grading for question ${answer.question_id}:`, saveError);
          }
        }
      }

      // Lưu kết quả
      if (gradingResults.length > 0) {
        if (isSpeaking) {
          // IELTS Speaking: Tính trung bình các tiêu chí từ tất cả câu trả lời
          if (gradingResults.length === 1) {
            // Chỉ có 1 câu - hiển thị kết quả đó
            console.log('Single speaking answer result:', gradingResults[0].result);
            setAiGradingResult(gradingResults[0].result);
          } else {
            // Nhiều câu - tính trung bình 4 tiêu chí
            const criteriaScores = {
              fluency_coherence: 0,
              lexical_resource: 0,
              grammatical_accuracy: 0,
              pronunciation: 0
            };
            
            // Tính tổng điểm mỗi tiêu chí
            gradingResults.forEach(gr => {
              const scores = gr.result.criteria_scores || {};
              criteriaScores.fluency_coherence += parseFloat(scores.fluency_coherence || 0);
              criteriaScores.lexical_resource += parseFloat(scores.lexical_resource || 0);
              criteriaScores.grammatical_accuracy += parseFloat(scores.grammatical_accuracy || scores.grammatical_range || 0);
              criteriaScores.pronunciation += parseFloat(scores.pronunciation || 0);
            });
            
            // Tính trung bình mỗi tiêu chí
            const numAnswers = gradingResults.length;
            Object.keys(criteriaScores).forEach(key => {
              criteriaScores[key] = criteriaScores[key] / numAnswers;
            });
            
            // Tính overall band (trung bình 4 tiêu chí)
            const overallBand = (
              criteriaScores.fluency_coherence +
              criteriaScores.lexical_resource +
              criteriaScores.grammatical_accuracy +
              criteriaScores.pronunciation
            ) / 4;
            
            // Làm tròn đến 0.5 gần nhất
            const roundedOverallBand = Math.round(overallBand * 2) / 2;
            
            console.log('Speaking - Number of answers:', numAnswers);
            console.log('Speaking - Average criteria scores:', criteriaScores);
            console.log('Speaking - Overall band:', roundedOverallBand);
            
            // Tạo combined result
            const combinedResult = {
              isMultiAnswer: true,
              overall_band: parseFloat(roundedOverallBand.toFixed(1)),
              criteria_scores: {
                fluency_coherence: parseFloat(criteriaScores.fluency_coherence.toFixed(1)),
                lexical_resource: parseFloat(criteriaScores.lexical_resource.toFixed(1)),
                grammatical_accuracy: parseFloat(criteriaScores.grammatical_accuracy.toFixed(1)),
                pronunciation: parseFloat(criteriaScores.pronunciation.toFixed(1))
              },
              // Gộp feedback từ tất cả các câu
              detailed_feedback: `Đánh giá tổng hợp từ ${numAnswers} câu trả lời. Điểm trung bình 4 tiêu chí: Fluency & Coherence ${criteriaScores.fluency_coherence.toFixed(1)}, Lexical Resource ${criteriaScores.lexical_resource.toFixed(1)}, Grammatical Accuracy ${criteriaScores.grammatical_accuracy.toFixed(1)}, Pronunciation ${criteriaScores.pronunciation.toFixed(1)}.`,
              // Lấy strengths/weaknesses từ tất cả câu và gộp lại
              strengths: [...new Set(gradingResults.flatMap(gr => gr.result.strengths || []))],
              weaknesses: [...new Set(gradingResults.flatMap(gr => gr.result.weaknesses || []))],
              suggestions: [...new Set(gradingResults.flatMap(gr => gr.result.suggestions || []))],
              band_justification: `Điểm tổng ${roundedOverallBand} được tính từ trung bình 4 tiêu chí của ${numAnswers} câu trả lời Speaking.`,
              pronunciation_note: gradingResults[0]?.result?.pronunciation_note || "Đánh giá pronunciation qua transcript mang tính chất tham khảo.",
              // Lưu chi tiết từng câu
              individual_answers: gradingResults.map((gr, idx) => ({
                questionNumber: idx + 1,
                question_id: gr.question_id,
                result: gr.result
              }))
            };
            
            console.log('Combined speaking result:', combinedResult);
            setAiGradingResult(combinedResult);
          }
        } else if (isWriting) {
          // IELTS Writing: Logic cũ (Task 1 = 1/3, Task 2 = 2/3)
          if (gradingResults.length === 1) {
            console.log('Single task result:', gradingResults[0].result);
            setAiGradingResult(gradingResults[0].result);
          } else if (gradingResults.length === 2) {
            const task1Score = parseFloat(gradingResults[0].result.overall_band) || 0;
            const task2Score = parseFloat(gradingResults[1].result.overall_band) || 0;
            
            console.log('Task 1 Score:', task1Score, 'from:', gradingResults[0].result);
            console.log('Task 2 Score:', task2Score, 'from:', gradingResults[1].result);
            
            // Task 1 = 1/3, Task 2 = 2/3
            const weightedScore = (task1Score * (1/3)) + (task2Score * (2/3));
            const roundedScore = Math.round(weightedScore * 2) / 2; // Round to nearest 0.5
            
            console.log('Weighted Score:', roundedScore);
            
            const multiTaskResult = {
              isMultiTask: true,
              overall_band: parseFloat(roundedScore.toFixed(1)),
              tasks: gradingResults.map((r, idx) => ({
                taskNumber: idx + 1,
                result: r.result
              }))
            };
            
            console.log('Multi-task result:', multiTaskResult);
            setAiGradingResult(multiTaskResult);
          } else {
            // Fallback: equal weight for other cases
            const sum = gradingResults.reduce((acc, r) => {
              const score = parseFloat(r.result.overall_band) || 0;
              return acc + score;
            }, 0);
            const avgScore = sum / gradingResults.length;
            const roundedScore = Math.round(avgScore * 2) / 2;
            
            const multiTaskResult = {
              isMultiTask: true,
              overall_band: parseFloat(roundedScore.toFixed(1)),
              tasks: gradingResults.map((r, idx) => ({
                taskNumber: idx + 1,
                result: r.result
              }))
            };
            
            setAiGradingResult(multiTaskResult);
          }
        }
      }
    } catch (error) {
      console.error('AI Grading error:', error);
      alert('Có lỗi khi chấm điểm bằng AI. Vui lòng thử lại.');
      setShowAIGrading(false);
    }
  };

  const showExplanationModal = (answer) => {
    setSelectedAnswer(answer);
    setExplanationModalVisible(true);
  };

  const closeExplanationModal = () => {
    setExplanationModalVisible(false);
    setSelectedAnswer(null);
  };

  return (
    <>
      {/* Render UI riêng cho Writing */}
      {skillType === 'writing' ? (
        <WritingResultUI 
          result={result}
          aiGradingResult={aiGradingResult}
          onAIGrading={handleAIGrading}
          aiLoading={aiLoading}
        />
      ) : skillType === 'speaking' ? (
        /* Render UI riêng cho Speaking */
        <SpeakingResultUI 
          result={result}
          aiGradingResult={aiGradingResult}
          onAIGrading={handleAIGrading}
          aiLoading={aiLoading}
        />
      ) : (
        /* UI mặc định cho Reading/Listening */
        <div className="test-result">
          {/* Header giống TestLayout */}
          <div className="test-result__header">
            <button className="test-result__close" onClick={() => navigate(-1)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="test-result__header-info">
              <img src={logo} alt="OWL IELTS" className="test-result__logo" />
              <div className="test-result__header-text">
                <div className="test-result__header-label">Làm bài passage 1</div>
                <div className="test-result__header-name">
                  {result.exam?.name || result.skill?.name || 'IELTS - Reading Test 1'}
                </div>
              </div>
            </div>
          </div>

      <div className="test-result__content">
        {/* Score Section */}
        <div className="test-result__score-section">
          <div className="test-result__mascot-card">
             <div className="test-result__mascot-text">
              Hôi kho bạn nhỉ? Mời bạn ôn luyện tập với OWL nhé !
            </div>
            <div className="test-result__mascot">
              <img src={mascotImage} alt="Congratulations" />
            </div>
           
          </div>
          
          <div className="test-result__score-card">
            <div className="test-result__score-header">
              <h2>Kết quả làm bài</h2>
              <div className="test-result__time">
                Thời gian làm bài 
                <div className="test-result__time-value">  {formatTime(result.time_spent)}</div>
              </div>
            </div>

            <div className="test-result__score-chart">
              <div className="test-result__score-circle">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  {hasAutoGrading && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={`${(correctAnswers / totalQuestions) * 251.2} 251.2`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  )}
                </svg>
                <div className="test-result__score-text">
                  {hasAutoGrading ? (
                    <>
                      <div className="test-result__score-number">{correctAnswers}/{totalQuestions}</div>
                      <div className="test-result__score-label">câu đúng</div>
                    </>
                  ) : result.teacher_score ? (
                    <>
                      <div className="test-result__score-number">{parseFloat(result.teacher_score).toFixed(1)}</div>
                      <div className="test-result__score-label">Điểm IELTS</div>
                    </>
                  ) : (
                    <>
                      <div className="test-result__score-number">{result.answered_questions}/{totalQuestions}</div>
                      <div className="test-result__score-label">câu đã làm</div>
                    </>
                  )}
                </div>
              </div>

              <div className="test-result__score-stats">
                {hasAutoGrading ? (
                  <>
                    <div className="test-result__stat test-result__stat--correct">
                      <div className="test-result__stat-dot"></div>
                      <span>Đúng</span>
                      <strong>{correctAnswers}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--incorrect">
                      <div className="test-result__stat-dot"></div>
                      <span>Sai</span>
                      <strong>{incorrectAnswers}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--unanswered">
                      <div className="test-result__stat-dot"></div>
                      <span>Bỏ qua</span>
                      <strong>{unansweredCount}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="test-result__stat test-result__stat--correct">
                      <div className="test-result__stat-dot"></div>
                      <span>Đã làm</span>
                      <strong>{result.answered_questions}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--unanswered">
                      <div className="test-result__stat-dot"></div>
                      <span>Chưa làm</span>
                      <strong>{unansweredCount}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--pending">
                      <div className="test-result__stat-dot"></div>
                      <span>Trạng thái</span>
                      <strong>Chờ chấm</strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Teacher feedback and grading status */}
            {!hasAutoGrading && (
              <div className="test-result__teacher-section">
                {result.teacher_score ? (
                  <>
                    <div className="test-result__teacher-score">
                      <div className="test-result__teacher-label">Điểm giáo viên chấm</div>
                      <div className="test-result__teacher-value">{parseFloat(result.teacher_score).toFixed(1)}</div>
                    </div>
                    {result.teacher_feedback && (
                      <div className="test-result__teacher-feedback">
                        <div className="test-result__feedback-label">Nhận xét của giáo viên:</div>
                        <div className="test-result__feedback-content">{result.teacher_feedback}</div>
                      </div>
                    )}
                  </>
                ) : aiGradingResult ? (
                  /* AI Grading Result */
                  <div className="test-result__ai-grading">
                    <div className="test-result__ai-header">
                      <h3 style={{ color: '#10B981', marginBottom: '1rem' }}>🤖 Kết Quả Chấm Điểm AI</h3>
                    </div>
                    
                    <div className="test-result__ai-score-box" style={{
                      background: '#045CCE',
                      padding: '2rem',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'center',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                        {aiGradingResult.overall_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '1rem', opacity: 0.9 }}>IELTS Band Score (out of 9.0)</div>
                    </div>

                    {/* Criteria Scores */}
                    {aiGradingResult.criteria_scores && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📊 Chi Tiết Điểm Theo Tiêu Chí</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          {Object.entries(aiGradingResult.criteria_scores).map(([criterion, score]) => (
                            <div key={criterion} style={{
                              background: '#f9fafb',
                              padding: '1rem',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize' }}>
                                  {criterion.replace(/_/g, ' ')}
                                </span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                  {score.toFixed(1)}/9
                                </span>
                              </div>
                              {aiGradingResult.criteria_feedback && aiGradingResult.criteria_feedback[criterion] && (
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                                  {aiGradingResult.criteria_feedback[criterion]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {aiGradingResult.strengths && aiGradingResult.strengths.length > 0 && (
                      <div style={{ marginBottom: '1.5rem', background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ color: '#15803d', marginBottom: '0.75rem', fontSize: '1rem' }}>✅ Điểm Mạnh</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {aiGradingResult.strengths.map((strength, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {aiGradingResult.weaknesses && aiGradingResult.weaknesses.length > 0 && (
                      <div style={{ marginBottom: '1.5rem', background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                        <h4 style={{ color: '#c2410c', marginBottom: '0.75rem', fontSize: '1rem' }}>⚠️ Điểm Cần Cải Thiện</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {aiGradingResult.weaknesses.map((weakness, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {aiGradingResult.suggestions && aiGradingResult.suggestions.length > 0 && (
                      <div style={{ marginBottom: '1.5rem', background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <h4 style={{ color: '#1e40af', marginBottom: '0.75rem', fontSize: '1rem' }}>💡 Gợi Ý Cải Thiện</h4>
                        <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {aiGradingResult.suggestions.map((suggestion, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>{suggestion}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Detailed Feedback */}
                    {aiGradingResult.detailed_feedback && (
                      <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>📖 Nhận Xét Tổng Quan</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-wrap' }}>
                          {aiGradingResult.detailed_feedback}
                        </p>
                      </div>
                    )}

                    {/* Band Justification */}
                    {aiGradingResult.band_justification && (
                      <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                        <h4 style={{ color: '#1e40af', marginBottom: '0.75rem', fontSize: '1rem' }}>🎓 Giải Thích Band Score</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#1e3a8a', whiteSpace: 'pre-wrap' }}>
                          {aiGradingResult.band_justification}
                        </p>
                      </div>
                    )}

                    {/* Pronunciation Note for Speaking */}
                    {aiGradingResult.pronunciation_note && skillType === 'speaking' && (
                      <div style={{ marginTop: '1rem', background: '#fef3c7', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <h4 style={{ color: '#92400e', marginBottom: '0.75rem', fontSize: '0.9rem' }}>🔊 Lưu Ý Về Pronunciation</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#78350f' }}>
                          {aiGradingResult.pronunciation_note}
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        setAiGradingResult(null);
                        setShowAIGrading(false);
                      }}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        width: '100%'
                      }}
                    >
                      Đóng kết quả AI
                    </button>
                  </div>
                ) : (
                  <div className="test-result__pending-notice">
                    <svg className="test-result__pending-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#F59E0B"/>
                    </svg>
                    <h3 className="test-result__pending-title">Đang đợi giáo viên chấm bài</h3>
                    <p className="test-result__pending-description">
                      Bài làm của bạn đã được gửi thành công. Giáo viên sẽ chấm và cung cấp nhận xét sớm nhất có thể.
                    </p>
                    
                    {/* AI Grading Button */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <button 
                        onClick={handleAIGrading}
                        disabled={aiLoading}
                        style={{
                          padding: '1rem 2rem',
                          background: '#045CCE',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: aiLoading ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: '600',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          transition: 'transform 0.2s',
                          opacity: aiLoading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!aiLoading) e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        {aiLoading ? '🤖 Đang chấm điểm bằng AI...' : '🤖 Chấm Điểm Bằng AI Ngay'}
                      </button>
                      <p style={{ 
                        marginTop: '0.75rem', 
                        fontSize: '0.875rem', 
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        Nhận kết quả và feedback chi tiết trong 5-15 giây
                      </p>
                    </div>

                    {aiError && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#991b1b',
                        fontSize: '0.875rem'
                      }}>
                        ❌ {aiError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button className="test-result__review-btn" onClick={() => {
              // Scroll to answers section
              document.querySelector('.test-result__answers-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}>
              Xem danh sách câu trả lời
            </button>
          </div>
        </div>

        {/* Answers Section */}
        <div className="test-result__answers-section">
          <div className="test-result__answers-header">
            <h3>Danh sách câu trả lời</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
              Click vào icon <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none" style={{ verticalAlign: 'middle', display: 'inline' }}>
                <path d="M4.16667 6.66667H5C5.22101 6.66667 5.43297 6.57887 5.58926 6.42259C5.74554 6.26631 5.83333 6.05435 5.83333 5.83333C5.83333 5.61232 5.74554 5.40036 5.58926 5.24408C5.43297 5.0878 5.22101 5 5 5H4.16667C3.94565 5 3.73369 5.0878 3.57741 5.24408C3.42113 5.40036 3.33333 5.61232 3.33333 5.83333C3.33333 6.05435 3.42113 6.26631 3.57741 6.42259C3.73369 6.57887 3.94565 6.66667 4.16667 6.66667ZM7.5 11.6667H4.16667C3.94565 11.6667 3.73369 11.7545 3.57741 11.9107C3.42113 12.067 3.33333 12.279 3.33333 12.5C3.33333 12.721 3.42113 12.933 3.57741 13.0893C3.73369 13.2455 3.94565 13.3333 4.16667 13.3333H7.5C7.72101 13.3333 7.93297 13.2455 8.08926 13.0893C8.24554 12.933 8.33333 12.721 8.33333 12.5C8.33333 12.279 8.24554 12.067 8.08926 11.9107C7.93297 11.7545 7.72101 11.6667 7.5 11.6667ZM7.5 8.33333H4.16667C3.94565 8.33333 3.73369 8.42113 3.57741 8.57741C3.42113 8.73369 3.33333 8.94565 3.33333 9.16667C3.33333 9.38768 3.42113 9.59964 3.57741 9.75592C3.73369 9.9122 3.94565 10 4.16667 10H7.5C7.72101 10 7.93297 9.9122 8.08926 9.75592C8.24554 9.59964 8.33333 9.38768 8.33333 9.16667C8.33333 8.94565 8.24554 8.73369 8.08926 8.57741C7.93297 8.42113 7.72101 8.33333 7.5 8.33333Z" fill="#045CCE"/>
              </svg> bên cạnh mỗi câu để xem giải thích chi tiết
            </p>
          </div>
          {Object.entries(answersByPart).map(([partName, answers]) => (
            <div key={partName} className="test-result__part">
              <h3 className="test-result__part-title">{partName}</h3>
              <div className="test-result__answers-grid">
                {answers.map((answer) => {
                  // Sử dụng question_number từ backend (đã được đánh số theo part)
                  const questionNumber = answer.question_number;
                  const isUnanswered = !answer.user_answer || answer.user_answer.trim() === '';
                  
                  return (
                    <div 
                      key={answer.question_id} 
                      className={`test-result__answer-item ${answer.is_correct ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect'}`}
                    >
                      <div className="test-result__answer-number">{questionNumber}</div>
                      <div className="test-result__answer-content">
                        <div className="test-result__answer-label">
                          <span className={`test-result__user-answer ${answer.is_correct ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect'}`}>
                            {answer.user_answer || '-'}
                          </span>
                          {hasAutoGrading && !isUnanswered && (
                            <> | Đáp án: <span className="test-result__answer-value">{answer.correct_answer || 'N/A'}</span></>
                          )}
                        </div>
                        
                        {/* Button to open explanation modal */}
                        <button 
                          className="test-result__explain-btn"
                          onClick={() => showExplanationModal(answer)}
                          title="Xem giải thích chi tiết"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                            <path d="M4.16667 6.66667H5C5.22101 6.66667 5.43297 6.57887 5.58926 6.42259C5.74554 6.26631 5.83333 6.05435 5.83333 5.83333C5.83333 5.61232 5.74554 5.40036 5.58926 5.24408C5.43297 5.0878 5.22101 5 5 5H4.16667C3.94565 5 3.73369 5.0878 3.57741 5.24408C3.42113 5.40036 3.33333 5.61232 3.33333 5.83333C3.33333 6.05435 3.42113 6.26631 3.57741 6.42259C3.73369 6.57887 3.94565 6.66667 4.16667 6.66667ZM7.5 11.6667H4.16667C3.94565 11.6667 3.73369 11.7545 3.57741 11.9107C3.42113 12.067 3.33333 12.279 3.33333 12.5C3.33333 12.721 3.42113 12.933 3.57741 13.0893C3.73369 13.2455 3.94565 13.3333 4.16667 13.3333H7.5C7.72101 13.3333 7.93297 13.2455 8.08926 13.0893C8.24554 12.933 8.33333 12.721 8.33333 12.5C8.33333 12.279 8.24554 12.067 8.08926 11.9107C7.93297 11.7545 7.72101 11.6667 7.5 11.6667ZM7.5 8.33333H4.16667C3.94565 8.33333 3.73369 8.42113 3.57741 8.57741C3.42113 8.73369 3.33333 8.94565 3.33333 9.16667C3.33333 9.38768 3.42113 9.59964 3.57741 9.75592C3.73369 9.9122 3.94565 10 4.16667 10H7.5C7.72101 10 7.93297 9.9122 8.08926 9.75592C8.24554 9.59964 8.33333 9.38768 8.33333 9.16667C8.33333 8.94565 8.24554 8.73369 8.08926 8.57741C7.93297 8.42113 7.72101 8.33333 7.5 8.33333ZM13.2667 6.15C13.3305 5.99824 13.3479 5.83098 13.3168 5.66932C13.2856 5.50766 13.2073 5.35885 13.0917 5.24167L8.09167 0.241667C8.02278 0.176847 7.94402 0.123401 7.85833 0.0833333C7.83346 0.0798001 7.80821 0.0798001 7.78333 0.0833333L7.55 0H2.5C1.83696 0 1.20107 0.263392 0.732233 0.732233C0.263392 1.20107 0 1.83696 0 2.5V14.1667C0 14.8297 0.263392 15.4656 0.732233 15.9344C1.20107 16.4033 1.83696 16.6667 2.5 16.6667H7.5C7.72101 16.6667 7.93297 16.5789 8.08926 16.4226C8.24554 16.2663 8.33333 16.0543 8.33333 15.8333C8.33333 15.6123 8.24554 15.4004 8.08926 15.2441C7.93297 15.0878 7.72101 15 7.5 15H2.5C2.27899 15 2.06702 14.9122 1.91074 14.7559C1.75446 14.5996 1.66667 14.3877 1.66667 14.1667V2.5C1.66667 2.27899 1.75446 2.06702 1.91074 1.91074C2.06702 1.75446 2.27899 1.66667 2.5 1.66667H6.66667V4.16667C6.66667 4.82971 6.93006 5.46559 7.3989 5.93443C7.86774 6.40327 8.50362 6.66667 9.16667 6.66667H12.5C12.6645 6.66585 12.8251 6.61634 12.9616 6.5244C13.098 6.43245 13.2041 6.30218 13.2667 6.15ZM9.16667 5C8.94565 5 8.73369 4.9122 8.57741 4.75592C8.42113 4.59964 8.33333 4.38768 8.33333 4.16667V2.84167L10.4917 5H9.16667ZM15 8.33333H10.8333C10.6123 8.33333 10.4004 8.42113 10.2441 8.57741C10.0878 8.73369 10 8.94565 10 9.16667V15.8333C10.0004 15.9841 10.0417 16.1319 10.1195 16.261C10.1972 16.3902 10.3086 16.4958 10.4417 16.5667C10.572 16.6336 10.7176 16.665 10.8639 16.6576C11.0102 16.6503 11.152 16.6046 11.275 16.525L12.9167 15.4417L14.5833 16.525C14.7078 16.597 14.8488 16.6356 14.9926 16.6369C15.1364 16.6383 15.2782 16.6024 15.404 16.5328C15.5298 16.4631 15.6355 16.3621 15.7107 16.2396C15.786 16.117 15.8282 15.9771 15.8333 15.8333V9.16667C15.8333 8.94565 15.7455 8.73369 15.5893 8.57741C15.433 8.42113 15.221 8.33333 15 8.33333ZM14.1667 14.2667L13.3833 13.7417C13.2455 13.6485 13.083 13.5987 12.9167 13.5987C12.7503 13.5987 12.5878 13.6485 12.45 13.7417L11.6667 14.2667V10H14.1667V14.2667Z" fill="#045CCE"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}
      
      {/* Explanation Modal */}
      <ExplanationModal
        visible={explanationModalVisible}
        onClose={closeExplanationModal}
        answer={selectedAnswer}
      />
    </>
  );
}
