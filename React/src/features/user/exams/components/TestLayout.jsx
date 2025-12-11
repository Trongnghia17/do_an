import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/images/logo.png'
import './TestLayout.css';

export default function TestLayout({
  examData,
  skillData,
  sectionData,
  timeRemaining,
  setTimeRemaining,
  parts = [],
  currentPartTab,
  setCurrentPartTab,
  questionGroups = [],
  answers = {},
  onSubmit,
  children,
  showQuestionNumbers = true,
  fontSize: externalFontSize,
  onFontSizeChange,
  submitting = false
}) {
  const navigate = useNavigate();
  const [internalFontSize, setInternalFontSize] = useState('normal');
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [showCongratulationModal, setShowCongratulationModal] = useState(false);

  // Use external fontSize if provided, otherwise use internal state
  const fontSize = externalFontSize !== undefined ? externalFontSize : internalFontSize;
  const setFontSize = onFontSizeChange || setInternalFontSize;

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setTimeRemaining]);

  // Format thời gian
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Xử lý nộp bài
  const handleSubmit = () => {
    const totalQuestions = questionGroups.reduce((total, group) => {
      return total + (group.questions?.length || 0);
    }, 0);
    
    const answeredCount = Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length;
    const isComplete = answeredCount === totalQuestions;
    setIsTestComplete(isComplete);
    setShowSubmitModal(true);
  };

  // Xác nhận nộp bài
  const confirmSubmit = () => {
    setShowSubmitModal(false);
    setShowCongratulationModal(true);
    if (onSubmit) {
      onSubmit();
    }
  };

  // Hủy nộp bài
  const cancelSubmit = () => {
    setShowSubmitModal(false);
  };

  // Tiếp tục luyện tập
  const handleContinuePractice = () => {
    setShowCongratulationModal(false);
    navigate('/lich-su-lam-bai');
  };

  // Xử lý click câu hỏi
  const handleQuestionClick = (questionNumber) => {
    const group = questionGroups.find(g => 
      g.questions.some(q => q.number === questionNumber)
    );
    if (group) {
      if (group.part !== currentPartTab) {
        setCurrentPartTab(group.part);
      }
      setTimeout(() => {
        const groupElement = document.getElementById(`question-group-${group.id}`);
        if (groupElement) {
          groupElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Chuyển part
  const handlePartChange = (partNumber) => {
    setCurrentPartTab(partNumber);
  };

  // Get all questions in current part
  const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);
  const allQuestionsInPart = currentPartGroups.flatMap(g => g.questions);

  return (
    <div className="test-layout" data-font-size={fontSize}>
      {/* Header */}
      <div className="test-layout__header" style={{ '--font-size': fontSize }}>
        <button className="test-layout__close" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="test-layout__header-info">
          <img src={logo} alt="OWL IELTS" className="test-layout__logo" />
          <div className="test-layout__header-text">
            <div className="test-layout__header-label">
              Làm bài {parts.length > 1 ? `passage ${currentPartTab}` : ''}
            </div>
            <div className="test-layout__header-name">
              {examData?.name || skillData?.name || sectionData?.title || 'Test'}
            </div>
          </div>
        </div>
        <div className="test-layout__header-right">
          {/* Font Size Button */}
          <div className="test-layout__font-size-wrapper">
            <button 
              className={`test-layout__font-size-button ${showFontSizeModal ? 'active' : ''}`}
              onClick={() => setShowFontSizeModal(!showFontSizeModal)}
              title="Cỡ chữ"
            >
              <span className="test-layout__font-size-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.74102 11.0753L3.33268 15.492V14.167C3.33268 13.946 3.24488 13.734 3.0886 13.5777C2.93232 13.4215 2.72036 13.3337 2.49935 13.3337C2.27834 13.3337 2.06637 13.4215 1.91009 13.5777C1.75381 13.734 1.66602 13.946 1.66602 14.167V17.5003C1.66733 17.6092 1.68998 17.7168 1.73268 17.817C1.81724 18.0206 1.97906 18.1824 2.18268 18.267C2.28287 18.3097 2.39045 18.3323 2.49935 18.3337H5.83268C6.0537 18.3337 6.26566 18.2459 6.42194 18.0896C6.57822 17.9333 6.66602 17.7213 6.66602 17.5003C6.66602 17.2793 6.57822 17.0673 6.42194 16.9111C6.26566 16.7548 6.0537 16.667 5.83268 16.667H4.50768L8.92435 12.2587C9.08127 12.1017 9.16943 11.8889 9.16943 11.667C9.16943 11.4451 9.08127 11.2322 8.92435 11.0753C8.76743 10.9184 8.5546 10.8302 8.33268 10.8302C8.11076 10.8302 7.89794 10.9184 7.74102 11.0753ZM4.50768 3.33366H5.83268C6.0537 3.33366 6.26566 3.24586 6.42194 3.08958C6.57822 2.9333 6.66602 2.72134 6.66602 2.50033C6.66602 2.27931 6.57822 2.06735 6.42194 1.91107C6.26566 1.75479 6.0537 1.66699 5.83268 1.66699H2.49935C2.39045 1.66831 2.28287 1.69096 2.18268 1.73366C1.97906 1.81822 1.81724 1.98003 1.73268 2.18366C1.68998 2.28384 1.66733 2.39143 1.66602 2.50033V5.83366C1.66602 6.05467 1.75381 6.26663 1.91009 6.42291C2.06637 6.57919 2.27834 6.66699 2.49935 6.66699C2.72036 6.66699 2.93232 6.57919 3.0886 6.42291C3.24488 6.26663 3.33268 6.05467 3.33268 5.83366V4.50866L7.74102 8.92533C7.81848 9.00343 7.91065 9.06543 8.0122 9.10773C8.11375 9.15004 8.22267 9.17182 8.33268 9.17182C8.44269 9.17182 8.55161 9.15004 8.65316 9.10773C8.75471 9.06543 8.84688 9.00343 8.92435 8.92533C9.00246 8.84786 9.06445 8.75569 9.10676 8.65414C9.14907 8.55259 9.17085 8.44367 9.17085 8.33366C9.17085 8.22365 9.14907 8.11473 9.10676 8.01318C9.06445 7.91163 9.00246 7.81946 8.92435 7.74199L4.50768 3.33366ZM17.4993 13.3337C17.2783 13.3337 17.0664 13.4215 16.9101 13.5777C16.7538 13.734 16.666 13.946 16.666 14.167V15.492L12.2577 11.0753C12.1008 10.9184 11.8879 10.8302 11.666 10.8302C11.4441 10.8302 11.2313 10.9184 11.0743 11.0753C10.9174 11.2322 10.8293 11.4451 10.8293 11.667C10.8293 11.8889 10.9174 12.1017 11.0743 12.2587L15.491 16.667H14.166C13.945 16.667 13.733 16.7548 13.5768 16.9111C13.4205 17.0673 13.3327 17.2793 13.3327 17.5003C13.3327 17.7213 13.4205 17.9333 13.5768 18.0896C13.733 18.2459 13.945 18.3337 14.166 18.3337H17.4993C17.6082 18.3323 17.7158 18.3097 17.816 18.267C18.0196 18.1824 18.1815 18.0206 18.266 17.817C18.3087 17.7168 18.3314 17.6092 18.3327 17.5003V14.167C18.3327 13.946 18.2449 13.734 18.0886 13.5777C17.9323 13.4215 17.7204 13.3337 17.4993 13.3337ZM18.266 2.18366C18.1815 1.98003 18.0196 1.81822 17.816 1.73366C17.7158 1.69096 17.6082 1.66831 17.4993 1.66699H14.166C13.945 1.66699 13.733 1.75479 13.5768 1.91107C13.4205 2.06735 13.3327 2.27931 13.3327 2.50033C13.3327 2.72134 13.4205 2.9333 13.5768 3.08958C13.733 3.24586 13.945 3.33366 14.166 3.33366H15.491L11.0743 7.74199C10.9962 7.81946 10.9342 7.91163 10.8919 8.01318C10.8496 8.11473 10.8279 8.22365 10.8279 8.33366C10.8279 8.44367 10.8496 8.55259 10.8919 8.65414C10.9342 8.75569 10.9962 8.84786 11.0743 8.92533C11.1518 9.00343 11.244 9.06543 11.3455 9.10773C11.4471 9.15004 11.556 9.17182 11.666 9.17182C11.776 9.17182 11.8849 9.15004 11.9865 9.10773C12.088 9.06543 12.1802 9.00343 12.2577 8.92533L16.666 4.50866V5.83366C16.666 6.05467 16.7538 6.26663 16.9101 6.42291C17.0664 6.57919 17.2783 6.66699 17.4993 6.66699C17.7204 6.66699 17.9323 6.57919 18.0886 6.42291C18.2449 6.26663 18.3327 6.05467 18.3327 5.83366V2.50033C18.3314 2.39143 18.3087 2.28384 18.266 2.18366Z" fill="#4F4F4F"/>
                </svg>
              </span>
              <span className="test-layout__font-size-icon-active">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.74102 11.0753L3.33268 15.492V14.167C3.33268 13.946 3.24488 13.734 3.0886 13.5777C2.93232 13.4215 2.72036 13.3337 2.49935 13.3337C2.27834 13.3337 2.06637 13.4215 1.91009 13.5777C1.75381 13.734 1.66602 13.946 1.66602 14.167V17.5003C1.66733 17.6092 1.68998 17.7168 1.73268 17.817C1.81724 18.0206 1.97906 18.1824 2.18268 18.267C2.28287 18.3097 2.39045 18.3323 2.49935 18.3337H5.83268C6.0537 18.3337 6.26566 18.2459 6.42194 18.0896C6.57822 17.9333 6.66602 17.7213 6.66602 17.5003C6.66602 17.2793 6.57822 17.0673 6.42194 16.9111C6.26566 16.7548 6.0537 16.667 5.83268 16.667H4.50768L8.92435 12.2587C9.08127 12.1017 9.16943 11.8889 9.16943 11.667C9.16943 11.4451 9.08127 11.2322 8.92435 11.0753C8.76743 10.9184 8.5546 10.8302 8.33268 10.8302C8.11076 10.8302 7.89794 10.9184 7.74102 11.0753ZM4.50768 3.33366H5.83268C6.0537 3.33366 6.26566 3.24586 6.42194 3.08958C6.57822 2.9333 6.66602 2.72134 6.66602 2.50033C6.66602 2.27931 6.57822 2.06735 6.42194 1.91107C6.26566 1.75479 6.0537 1.66699 5.83268 1.66699H2.49935C2.39045 1.66831 2.28287 1.69096 2.18268 1.73366C1.97906 1.81822 1.81724 1.98003 1.73268 2.18366C1.68998 2.28384 1.66733 2.39143 1.66602 2.50033V5.83366C1.66602 6.05467 1.75381 6.26663 1.91009 6.42291C2.06637 6.57919 2.27834 6.66699 2.49935 6.66699C2.72036 6.66699 2.93232 6.57919 3.0886 6.42291C3.24488 6.26663 3.33268 6.05467 3.33268 5.83366V4.50866L7.74102 8.92533C7.81848 9.00343 7.91065 9.06543 8.0122 9.10773C8.11375 9.15004 8.22267 9.17182 8.33268 9.17182C8.44269 9.17182 8.55161 9.15004 8.65316 9.10773C8.75471 9.06543 8.84688 9.00343 8.92435 8.92533C9.00246 8.84786 9.06445 8.75569 9.10676 8.65414C9.14907 8.55259 9.17085 8.44367 9.17085 8.33366C9.17085 8.22365 9.14907 8.11473 9.10676 8.01318C9.06445 7.91163 9.00246 7.81946 8.92435 7.74199L4.50768 3.33366ZM17.4993 13.3337C17.2783 13.3337 17.0664 13.4215 16.9101 13.5777C16.7538 13.734 16.666 13.946 16.666 14.167V15.492L12.2577 11.0753C12.1008 10.9184 11.8879 10.8302 11.666 10.8302C11.4441 10.8302 11.2313 10.9184 11.0743 11.0753C10.9174 11.2322 10.8293 11.4451 10.8293 11.667C10.8293 11.8889 10.9174 12.1017 11.0743 12.2587L15.491 16.667H14.166C13.945 16.667 13.733 16.7548 13.5768 16.9111C13.4205 17.0673 13.3327 17.2793 13.3327 17.5003C13.3327 17.7213 13.4205 17.9333 13.5768 18.0896C13.733 18.2459 13.945 18.3337 14.166 18.3337H17.4993C17.6082 18.3323 17.7158 18.3097 17.816 18.267C18.0196 18.1824 18.1815 18.0206 18.266 17.817C18.3087 17.7168 18.3314 17.6092 18.3327 17.5003V14.167C18.3327 13.946 18.2449 13.734 18.0886 13.5777C17.9323 13.4215 17.7204 13.3337 17.4993 13.3337ZM18.266 2.18366C18.1815 1.98003 18.0196 1.81822 17.816 1.73366C17.7158 1.69096 17.6082 1.66831 17.4993 1.66699H14.166C13.945 1.66699 13.733 1.75479 13.5768 1.91107C13.4205 2.06735 13.3327 2.27931 13.3327 2.50033C13.3327 2.72134 13.4205 2.9333 13.5768 3.08958C13.733 3.24586 13.945 3.33366 14.166 3.33366H15.491L11.0743 7.74199C10.9962 7.81946 10.9342 7.91163 10.8919 8.01318C10.8496 8.11473 10.8279 8.22365 10.8279 8.33366C10.8279 8.44367 10.8496 8.55259 10.8919 8.65414C10.9342 8.75569 10.9962 8.84786 11.0743 8.92533C11.1518 9.00343 11.244 9.06543 11.3455 9.10773C11.4471 9.15004 11.556 9.17182 11.666 9.17182C11.776 9.17182 11.8849 9.15004 11.9865 9.10773C12.088 9.06543 12.1802 9.00343 12.2577 8.92533L16.666 4.50866V5.83366C16.666 6.05467 16.7538 6.26663 16.9101 6.42291C17.0664 6.57919 17.2783 6.66699 17.4993 6.66699C17.7204 6.66699 17.9323 6.57919 18.0886 6.42291C18.2449 6.26663 18.3327 6.05467 18.3327 5.83366V2.50033C18.3314 2.39143 18.3087 2.28384 18.266 2.18366Z" fill="#045CCE"/>
                </svg>
              </span>
            </button>

            {/* Dropdown Menu */}
            {showFontSizeModal && (
              <div className="test-layout__font-dropdown">
                <h3 className="test-layout__font-dropdown-title">Cỡ chữ</h3>
                <p className="test-layout__font-dropdown-subtitle">Chọn cỡ chữ phù hợp cho việc đọc</p>
                
                <div className="test-layout__font-options">
                  <button
                    className={`test-layout__font-option ${fontSize === 'normal' ? 'active' : ''}`}
                    onClick={() => {
                      setFontSize('normal');
                      setShowFontSizeModal(false);
                    }}
                  >
                    Bình thường
                    {fontSize === 'normal' && (
                      <svg className="test-layout__check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  
                  <button
                    className={`test-layout__font-option ${fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => {
                      setFontSize('large');
                      setShowFontSizeModal(false);
                    }}
                  >
                    Lớn
                    {fontSize === 'large' && (
                      <svg className="test-layout__check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  
                  <button
                    className={`test-layout__font-option ${fontSize === 'extra-large' ? 'active' : ''}`}
                    onClick={() => {
                      setFontSize('extra-large');
                      setShowFontSizeModal(false);
                    }}
                  >
                    Rất lớn
                    {fontSize === 'extra-large' && (
                      <svg className="test-layout__check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                <button 
                  className="test-layout__font-dropdown-close"
                  onClick={() => setShowFontSizeModal(false)}
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
          
          <div className="test-layout__timer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 0C8.35215 0 6.74099 0.488742 5.37058 1.40442C4.00017 2.3201 2.93206 3.62159 2.30133 5.1443C1.6706 6.66702 1.50558 8.34258 1.82712 9.95909C2.14866 11.5756 2.94234 13.0605 4.10777 14.2259C5.27321 15.3913 6.75807 16.185 8.37458 16.5065C9.99109 16.8281 11.6666 16.6631 13.1894 16.0323C14.7121 15.4016 16.0136 14.3335 16.9292 12.9631C17.8449 11.5927 18.3337 9.98151 18.3337 8.33333C18.3337 6.12632 17.456 4.00956 15.8929 2.44628C14.3296 0.883001 12.2128 0 10 0ZM10 15C8.68179 15 7.39286 14.609 6.29654 13.8765C5.20021 13.1439 4.34572 12.1027 3.84114 10.8846C3.33655 9.66638 3.20453 8.32594 3.46176 7.03273C3.719 5.73953 4.35393 4.55164 5.28628 3.61929C6.21863 2.68694 7.40652 2.052 8.69973 1.79477C9.99293 1.53753 11.3334 1.66956 12.5516 2.17414C13.7697 2.67872 14.8109 3.5332 15.5435 4.62953C16.276 5.72586 16.667 7.01479 16.667 8.33333C16.667 10.1014 15.9646 11.7971 14.7144 13.0474C13.4641 14.2976 11.7684 15 10 15Z" fill="#045CCE"/>
              <path d="M10.8333 7.5H9.16667V4.16667C9.16667 3.94565 9.07887 3.73369 8.92259 3.57741C8.76631 3.42113 8.55435 3.33333 8.33334 3.33333C8.11232 3.33333 7.90036 3.42113 7.74408 3.57741C7.5878 3.73369 7.5 3.94565 7.5 4.16667V8.33333C7.5 8.55435 7.5878 8.76631 7.74408 8.92259C7.90036 9.07887 8.11232 9.16667 8.33334 9.16667H10.8333C11.0544 9.16667 11.2663 9.07887 11.4226 8.92259C11.5789 8.76631 11.6667 8.55435 11.6667 8.33333C11.6667 8.11232 11.5789 7.90036 11.4226 7.74408C11.2663 7.5878 11.0544 7.5 10.8333 7.5Z" fill="#045CCE"/>
            </svg>
            <span>{formatTime(timeRemaining)}</span>
          </div>
          <button 
            className="test-layout__submit-button-header" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
          </button>
        </div>
      </div>

      {/* Main Content - children will be rendered here */}
      <div className={`test-layout__content test-layout__content--${fontSize}`}>
        {children}
      </div>
      
      {/* Footer - Part Tabs và Question Numbers */}
      {showQuestionNumbers && (
        <div className="test-layout__footer">
          <div>
            {/* Part Tabs */}
            {parts.length > 1 && (
              <div className="test-layout__part-tabs">
                {parts.map((part) => {
                  const partGroups = questionGroups.filter(g => g.part === part.part);
                  const partQuestions = partGroups.flatMap(g => g.questions || []);
                  const questionCount = partQuestions.length;
                  
                  return (
                    <button
                      key={part.part}
                      className={`test-layout__part-tab ${currentPartTab === part.part ? 'active' : ''}`}
                      onClick={() => handlePartChange(part.part)}
                    >
                      Part {part.part} - 1/{questionCount}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Question Numbers Grid */}
            <div className="test-layout__question-numbers">
              {allQuestionsInPart.map((q, index) => (
                <button
                  key={q.id}
                  className={`test-layout__question-number-item ${
                    answers[q.id] ? 'answered' : ''
                  }`}
                  onClick={() => handleQuestionClick(q.number || index + 1)}
                >
                  {q.number || index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="test-layout__modal-overlay" onClick={cancelSubmit}>
          <div className="test-layout__modal-content test-layout__submit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="test-layout__submit-modal-icon">
              <img 
                src={isTestComplete ? "/src/assets/images/cudaxong.png" : "/src/assets/images/cuchuaxong.png"} 
                alt="Owl" 
                className="test-layout__submit-modal-owl"
              />
            </div>

            <div className="test-layout__submit-modal-body">
              {isTestComplete ? (
                <>
                  <h3 className="test-layout__submit-modal-title">Bạn đã hoàn thành bài thi.</h3>
                  <p className="test-layout__submit-modal-text">Bạn có cần kiểm tra lại không?</p>
                </>
              ) : (
                <>
                  <h3 className="test-layout__submit-modal-title">Bạn vẫn chưa hoàn thành</h3>
                  <p className="test-layout__submit-modal-text">Bạn có chắc muốn nộp bài không?</p>
                </>
              )}
            </div>

            <div className="test-layout__submit-modal-actions">
              {isTestComplete ? (
                <>
                  <button 
                    className="test-layout__submit-modal-button test-layout__submit-modal-button--primary"
                    onClick={confirmSubmit}
                  >
                    Nộp bài
                  </button>
                  <button 
                    className="test-layout__submit-modal-button test-layout__submit-modal-button--secondary"
                    onClick={cancelSubmit}
                  >
                    Kiểm tra lại
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="test-layout__submit-modal-button test-layout__submit-modal-button--primary"
                    onClick={cancelSubmit}
                  >
                    Tiếp tục làm bài
                  </button>
                  <button 
                    className="test-layout__submit-modal-button test-layout__submit-modal-button--secondary"
                    onClick={confirmSubmit}
                  >
                    Nộp bài
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Congratulation Modal */}
      {showCongratulationModal && (
        <div className="test-layout__modal-overlay">
          <div className="test-layout__modal-content test-layout__submit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="test-layout__submit-modal-icon">
              <img 
                src="/src/assets/images/cuchucmung.png" 
                alt="Owl" 
                className="test-layout__submit-modal-owl"
              />
            </div>

            <div className="test-layout__submit-modal-body">
              <h3 className="test-layout__submit-modal-title">Chúc mừng bạn đã hoàn thành</h3>
            </div>

            <div className="test-layout__submit-modal-actions">
              <button 
                className="test-layout__submit-modal-button test-layout__submit-modal-button--primary"
                onClick={handleContinuePractice}
              >
                Tiếp tục luyện tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
