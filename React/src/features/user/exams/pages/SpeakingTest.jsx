import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import TestLayout from '../components/TestLayout';
import { getSkillById, getSectionById } from '../api/exams.api';
import fastapiService from '@/services/fastapi.service';
import './SpeakingTest.css';

const SpeakingTest = () => {
  const { skillId, sectionId } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes default
  const [currentPartTab, setCurrentPartTab] = useState(1);
  const [loading, setLoading] = useState(true);
  const [skillData, setSkillData] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [parts, setParts] = useState([]);
  const [fontSize, setFontSize] = useState('normal');
  const [recordings, setRecordings] = useState({});
  const [isRecording, setIsRecording] = useState({});
  const mediaRecorderRef = useRef({});
  const audioChunksRef = useRef({});

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        let data;

        if (sectionId) {
          const response = await getSectionById(sectionId, { with_questions: true });
          data = response.data?.data || response.data;
          setSectionData(data);
        } else {
          const response = await getSkillById(skillId, { with_sections: true });
          data = response.data?.data || response.data;
          setSkillData(data);
        }

        // Process sections and questions
        if (data?.sections) {
          const allQuestionGroups = [];

          data.sections.forEach((section, index) => {
            // Check for question_groups first (new format)
            if (section.question_groups && section.question_groups.length > 0) {
              section.question_groups.forEach(group => {
                if (group.questions && group.questions.length > 0) {
                  allQuestionGroups.push({
                    id: `group-${group.id}`,
                    part: index + 1,
                    section_id: section.id,
                    group_name: group.name,
                    title: section.title,
                    content: group.content || section.content,
                    instruction: group.content, // Group instruction
                    question_type: group.question_type,
                    questions: group.questions
                  });
                }
              });
            }
            // Fallback to direct questions (old format)
            else if (section.questions && section.questions.length > 0) {
              allQuestionGroups.push({
                id: `section-${section.id}`,
                part: index + 1,
                section_id: section.id,
                title: section.title,
                content: section.content,
                questions: section.questions
              });
            }
          });

          setQuestionGroups(allQuestionGroups);

          const uniqueParts = [...new Set(allQuestionGroups.map(g => g.part))]
            .sort((a, b) => a - b)
            .map(partNum => ({
              part: partNum,
              name: `Part ${partNum}`
            }));
          setParts(uniqueParts);
          setCurrentPartTab(uniqueParts[0]?.part || 1);
        } else if (data?.questions) {
          // Direct questions from section
          const questionGroup = {
            id: `section-${data.id}`,
            part: 1,
            section_id: data.id,
            title: data.title,
            content: data.content,
            questions: data.questions
          };
          setQuestionGroups([questionGroup]);
          setParts([{ part: 1, name: 'Part 1' }]);
          setCurrentPartTab(1);
        }

        if (data?.time_limit) {
          setTimeRemaining(data.time_limit * 60);
        }
      } catch (error) {
        console.error('Error fetching exam data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [skillId, sectionId]);

  const startRecording = async (questionId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current[questionId] = mediaRecorder;
      audioChunksRef.current[questionId] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current[questionId].push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current[questionId], { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordings(prev => ({
          ...prev,
          [questionId]: audioUrl
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(prev => ({ ...prev, [questionId]: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = (questionId) => {
    if (mediaRecorderRef.current[questionId]) {
      mediaRecorderRef.current[questionId].stop();
      setIsRecording(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Chuẩn bị dữ liệu submit
      // Với Speaking, answers sẽ chứa đường dẫn file audio hoặc blob data
      const answersArray = Object.entries(recordings).map(([questionId, audioData]) => ({
        question_id: parseInt(questionId),
        answer_audio: audioData // URL hoặc base64 của audio đã upload
      }));

      // Nếu có text answers thì thêm vào
      Object.entries(answers).forEach(([questionId, answerText]) => {
        const existingAnswer = answersArray.find(a => a.question_id === parseInt(questionId));
        if (existingAnswer) {
          existingAnswer.answer_text = answerText;
        } else {
          answersArray.push({
            question_id: parseInt(questionId),
            answer_text: answerText
          });
        }
      });

      const submitData = {
        exam_skill_id: parseInt(skillId),
        exam_section_id: sectionId ? parseInt(sectionId) : null,
        answers: answersArray,
        time_spent: (skillData?.time_limit * 60 || 900) - timeRemaining
      };

      console.log('Submitting data:', submitData);

      // Gửi lên server
      const response = await fastapiService.submission.submitExam(submitData);
      
      console.log('Submit response:', response.data);
      
      message.success('Nộp bài thành công!');
      
      // Chuyển đến trang kết quả
      navigate(`/exams/result/${response.data.id}`);
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      message.error('Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);

  if (loading) {
    return <div className="speaking-test__loading">Loading...</div>;
  }

  if (!skillData && !sectionData) {
    return (
      <div className="speaking-test__loading">
        <p>Không tìm thấy dữ liệu bài thi</p>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  return (
    <TestLayout
      examData={skillData || sectionData}
      skillData={skillData}
      sectionData={sectionData}
      timeRemaining={timeRemaining}
      setTimeRemaining={setTimeRemaining}
      parts={parts}
      currentPartTab={currentPartTab}
      setCurrentPartTab={setCurrentPartTab}
      questionGroups={questionGroups}
      answers={answers}
      onSubmit={handleSubmit}
      showQuestionNumbers={true}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      submitting={submitting}
    >
      <div className="main_v2">
        <div className={`speaking-test__content ${fontSize !== 'normal' ? `speaking-test__content--${fontSize}` : ''}`}>
          {/* Part Header */}
          <div className="speaking-test__part-header">
            <h2 className="speaking-test__part-title">
              Speaking Part {currentPartTab}
            </h2>
          </div>

          {/* Group Content - Instruction */}
          {currentPartGroups.length > 0 && (currentPartGroups[0].instruction || currentPartGroups[0].content) && (
            <div className="speaking-test__instruction">
              <p className="speaking-test__instruction-text">
                {currentPartGroups[0].instruction || currentPartGroups[0].content}
              </p>
            </div>
          )}

          {/* Questions */}
          <div className="speaking-test__questions">
            {currentPartGroups.length === 0 && (
              <div className="speaking-test__no-data">
                Không có câu hỏi nào cho Part {currentPartTab}
              </div>
            )}
            {currentPartGroups.map((group, groupIndex) => (
              <div key={group.id} className="speaking-test__question-group">
                {group.questions?.map((question, qIndex) => (
                  <div key={question.id} className="speaking-test__question-item">
                    <div className="speaking-test__question-content">
                      <strong className="speaking-test__question-label">
                        Question {qIndex + 1}
                      </strong>
                      {question.content && (
                        <div className="speaking-test__question-text">
                          {question.content.split('\n').map((line, i) => (
                            <span key={i}>
                              {line}
                              {i < question.content.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recording Controls */}
                    <div className="speaking-test__recording-controls">
                      

                      {/* Action Buttons */}
                      <div className="speaking-test__action-buttons">
                        <button
                          className={`speaking-test__action-btn speaking-test__record-btn ${isRecording[question.id] ? 'recording' : ''}`}
                          onClick={() => isRecording[question.id] ? stopRecording(question.id) : startRecording(question.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M10.0002 12.5007C10.8842 12.5007 11.7321 12.1495 12.3572 11.5243C12.9823 10.8992 13.3335 10.0514 13.3335 9.16732V4.16732C13.3335 3.28326 12.9823 2.43542 12.3572 1.8103C11.7321 1.18517 10.8842 0.833984 10.0002 0.833984C9.11611 0.833984 8.26826 1.18517 7.64314 1.8103C7.01802 2.43542 6.66683 3.28326 6.66683 4.16732V9.16732C6.66683 10.0514 7.01802 10.8992 7.64314 11.5243C8.26826 12.1495 9.11611 12.5007 10.0002 12.5007ZM8.3335 4.16732C8.3335 3.72529 8.50909 3.30137 8.82165 2.98881C9.13421 2.67625 9.55814 2.50065 10.0002 2.50065C10.4422 2.50065 10.8661 2.67625 11.1787 2.98881C11.4912 3.30137 11.6668 3.72529 11.6668 4.16732V9.16732C11.6668 9.60935 11.4912 10.0333 11.1787 10.3458C10.8661 10.6584 10.4422 10.834 10.0002 10.834C9.55814 10.834 9.13421 10.6584 8.82165 10.3458C8.50909 10.0333 8.3335 9.60935 8.3335 9.16732V4.16732ZM16.6668 9.16732C16.6668 8.9463 16.579 8.73434 16.4228 8.57806C16.2665 8.42178 16.0545 8.33398 15.8335 8.33398C15.6125 8.33398 15.4005 8.42178 15.2442 8.57806C15.088 8.73434 15.0002 8.9463 15.0002 9.16732C15.0002 10.4934 14.4734 11.7652 13.5357 12.7029C12.598 13.6405 11.3262 14.1673 10.0002 14.1673C8.67408 14.1673 7.40231 13.6405 6.46463 12.7029C5.52695 11.7652 5.00016 10.4934 5.00016 9.16732C5.00016 8.9463 4.91237 8.73434 4.75608 8.57806C4.5998 8.42178 4.38784 8.33398 4.16683 8.33398C3.94582 8.33398 3.73385 8.42178 3.57757 8.57806C3.42129 8.73434 3.3335 8.9463 3.3335 9.16732C3.33497 10.7901 3.92826 12.3566 5.00216 13.5731C6.07606 14.7897 7.55681 15.5728 9.16683 15.7757V17.5007H7.50016C7.27915 17.5007 7.06719 17.5884 6.91091 17.7447C6.75463 17.901 6.66683 18.113 6.66683 18.334C6.66683 18.555 6.75463 18.767 6.91091 18.9232C7.06719 19.0795 7.27915 19.1673 7.50016 19.1673H12.5002C12.7212 19.1673 12.9331 19.0795 13.0894 18.9232C13.2457 18.767 13.3335 18.555 13.3335 18.334C13.3335 18.113 13.2457 17.901 13.0894 17.7447C12.9331 17.5884 12.7212 17.5007 12.5002 17.5007H10.8335V15.7757C12.4435 15.5728 13.9243 14.7897 14.9982 13.5731C16.0721 12.3566 16.6654 10.7901 16.6668 9.16732Z" fill="#045CCE"/>
</svg>
                          Thu âm
                        </button>

                        <button
                          className="speaking-test__action-btn speaking-test__upload-btn"
                          onClick={() => console.log('Upload file for question:', question.id)}
                        >
                         <svg xmlns="http://www.w3.org/2000/svg" width="17" height="14" viewBox="0 0 17 14" fill="none">
  <path d="M13.6904 3.50559C13.1812 2.3356 12.3024 1.36482 11.1888 0.742032C10.0751 0.11924 8.78791 -0.121214 7.5245 0.0575172C6.26109 0.236248 5.09113 0.824304 4.19391 1.73157C3.29668 2.63884 2.72169 3.81527 2.55703 5.08059C1.76252 5.27086 1.06555 5.74629 0.598477 6.41658C0.131407 7.08688 -0.0732339 7.90537 0.0234157 8.71661C0.120065 9.52785 0.511275 10.2753 1.12275 10.8171C1.73423 11.3589 2.52339 11.6573 3.34036 11.6556C3.56138 11.6556 3.77334 11.5678 3.92962 11.4115C4.0859 11.2552 4.1737 11.0433 4.1737 10.8223C4.1737 10.6012 4.0859 10.3893 3.92962 10.233C3.77334 10.0767 3.56138 9.98893 3.34036 9.98893C2.89834 9.98893 2.47441 9.81333 2.16185 9.50077C1.84929 9.18821 1.6737 8.76429 1.6737 8.32226C1.6737 7.88023 1.84929 7.45631 2.16185 7.14375C2.47441 6.83119 2.89834 6.65559 3.34036 6.65559C3.56138 6.65559 3.77334 6.5678 3.92962 6.41152C4.0859 6.25524 4.1737 6.04327 4.1737 5.82226C4.17582 4.83666 4.52727 3.88372 5.16559 3.13275C5.80391 2.38177 6.68777 1.88139 7.66015 1.72049C8.63254 1.55959 9.63047 1.7486 10.4767 2.25393C11.3229 2.75927 11.9625 3.54821 12.282 4.48059C12.3297 4.62379 12.4153 4.75137 12.5298 4.8497C12.6442 4.94804 12.7833 5.01344 12.932 5.03893C13.4871 5.14382 13.9903 5.4336 14.3596 5.86104C14.7288 6.28848 14.9425 6.82839 14.9657 7.39279C14.9889 7.9572 14.8203 8.51282 14.4873 8.96912C14.1543 9.42542 13.6766 9.75551 13.132 9.90559C12.9176 9.96085 12.734 10.099 12.6215 10.2897C12.5089 10.4803 12.4768 10.7079 12.532 10.9223C12.5873 11.1366 12.7254 11.3203 12.9161 11.4328C13.1068 11.5453 13.3343 11.5775 13.5487 11.5223C14.4257 11.2905 15.2031 10.7789 15.7629 10.0651C16.3226 9.35138 16.6342 8.47443 16.6502 7.56748C16.6663 6.66053 16.3859 5.77313 15.8517 5.04003C15.3175 4.30692 14.5586 3.76818 13.6904 3.50559ZM8.93203 5.23059C8.85278 5.15473 8.75932 5.09525 8.65703 5.05559C8.45414 4.97224 8.22658 4.97224 8.0237 5.05559C7.9214 5.09525 7.82795 5.15473 7.7487 5.23059L5.2487 7.73059C5.09178 7.88751 5.00362 8.10034 5.00362 8.32226C5.00362 8.54418 5.09178 8.75701 5.2487 8.91393C5.40562 9.07085 5.61844 9.159 5.84036 9.159C6.06228 9.159 6.27511 9.07085 6.43203 8.91393L7.50703 7.83059V12.4889C7.50703 12.7099 7.59483 12.9219 7.75111 13.0782C7.90739 13.2345 8.11935 13.3223 8.34036 13.3223C8.56138 13.3223 8.77334 13.2345 8.92962 13.0782C9.0859 12.9219 9.1737 12.7099 9.1737 12.4889V7.83059L10.2487 8.91393C10.3262 8.99203 10.4183 9.05403 10.5199 9.09634C10.6214 9.13864 10.7304 9.16043 10.8404 9.16043C10.9504 9.16043 11.0593 9.13864 11.1608 9.09634C11.2624 9.05403 11.3546 8.99203 11.432 8.91393C11.5101 8.83646 11.5721 8.74429 11.6144 8.64274C11.6567 8.54119 11.6785 8.43227 11.6785 8.32226C11.6785 8.21225 11.6567 8.10333 11.6144 8.00178C11.5721 7.90023 11.5101 7.80806 11.432 7.73059L8.93203 5.23059Z" fill="#045CCE"/>
</svg>
                          Tải lên file ghi âm
                        </button>
                      </div>
                      {/* Recording Audio */}
                      {recordings[question.id] && (
                        <div className="speaking-test__audio-wrapper">
                          <audio controls src={recordings[question.id]} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TestLayout>
  );
};

export default SpeakingTest;
