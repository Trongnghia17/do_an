import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestResult } from '../api/exams.api';
import { useAIGrading } from '@/hooks/useAIGrading';
import { aiGradingAPI } from '@/lib/fastapi-client';
import WritingResultUI from '../components/WritingResultUI';
import SpeakingResultUI from '../components/SpeakingResultUI';
import logo from '@/assets/images/logo.png';
import mascotImage from '@/assets/images/cuchucmung.png';
import './TestResult.css';

export default function TestResult() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'correct', 'incorrect'
  const [aiGradingResult, setAiGradingResult] = useState(null);
  const [showAIGrading, setShowAIGrading] = useState(false);
  const { gradeWriting, gradeSpeaking, loading: aiLoading, error: aiError } = useAIGrading();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await getTestResult(resultId);
        if (response.data.success) {
          setResult(response.data.data);
          
          // Check if already has AI grading result
          const hasAIGrading = response.data.data.answers?.some(ans => ans.has_ai_grading && ans.ai_feedback);
          if (hasAIGrading) {
            // Load existing AI grading result
            const firstAIGraded = response.data.data.answers.find(ans => ans.has_ai_grading && ans.ai_feedback);
            if (firstAIGraded) {
              setAiGradingResult(firstAIGraded.ai_feedback);
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              Giải thích chi tiết
            </button>
          </div>
        </div>

        {/* Answers Section */}
        <div className="test-result__answers-section">
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
    </>
  );
}
