import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './ExamInstructions.css';
import logo from '@/assets/images/logo.png';
import readingIcon from '@/assets/images/exam-reading.png';
import listeningIcon from '@/assets/images/exam-listening.png';
import writingIcon from '@/assets/images/exam-writing.png';
import speakingIcon from '@/assets/images/exam-speaking.png';
export default function ExamInstructions() {
  const navigate = useNavigate();
  const { skillId, sectionId } = useParams();
  const location = useLocation();
  const examData = location.state?.examData;
  const examType = location.state?.examType;
  const handleBack = () => {
    navigate(-1);
  };
  const SKILL_ICONS = {
    'reading': readingIcon,
    'listening': listeningIcon,
    'writing': writingIcon,
    'speaking': speakingIcon,
  };

  // Thay đổi tên biến trong tham số để tránh nhầm lẫn
  const handleStartExam = (skillId, section_id = null) => {
    const skillType = examData?.skillType?.toLowerCase() || 'reading';
    const type = examType?.toLowerCase() || '';

    if (type === 'toeic') {
      if (skillType === 'writing') {
        if (section_id) {
          navigate(`/toeic-writing/${skillId}/${section_id}`);
        } else {
          navigate(`/toeic-writing/${skillId}`);
        }
      } else if (skillType === 'listening') {
        if (section_id) {
          navigate(`/toeic-listening/${skillId}/${section_id}`);
        } else {
          navigate(`/toeic-listening/${skillId}`);
        }
      } else if (skillType === 'reading') {
        if (section_id) {
          navigate(`/toeic-reading/${skillId}/${section_id}`);
        } else {
          navigate(`/toeic-reading/${skillId}`);
        }
      }else{
        if (section_id) {
          navigate(`/toeic-speaking/${skillId}/${section_id}`);
        } else {
          navigate(`/toeic-speaking/${skillId}`);
        }
      }

    } else {
      if (section_id) {
        navigate(`/exam/section/${skillId}/${section_id}/test/${skillType}`);
      } else {
        navigate(`/exam/full/${skillId}/test/${skillType}`);
      }
    }
  };
  const currentSkillIcon = SKILL_ICONS[examData?.skillType] || readingIcon;
  // Chuyển đổi phút sang giờ:phút
  const formatTime = (minutes) => {
    if (!minutes) return '0 phút';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} phút`;
    } else if (mins === 0) {
      return `${hours} giờ`;
    } else {
      return `${hours} giờ ${mins} phút`;
    }
  };

  if (!examData) {
    return (
      <div className="exam-instructions-page">
        <div className="exam-instructions-page__error">
          <p>Không tìm thấy thông tin bài thi</p>
          <button onClick={() => navigate('/')} className="exam-instructions-page__back-button">
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-instructions-page">
      {/* Header với logo và tên bài */}
      <div className="exam-instructions-page__header">
        <button className="exam-instructions-page__close" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="exam-instructions-page__header-title">
          <img src={logo} alt="OWL IELTS" className="exam-instructions-page__logo" />
          <div className="exam-instructions-page__header-text">
            <div className="exam-instructions-page__header-label">Làm bài passage 1</div>
            <div className="exam-instructions-page__header-name">{examData.name}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="exam-instructions-page__container">
        <div className="exam-instructions-page__content">
          {/* Title với icon */}
          <div className="exam-instructions-page__title-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="exam-instructions-page__icon">
              <img src={currentSkillIcon} alt="OWL IELTS" className="exam-instructions-page__logo" />
            </div>
            <h1 className="exam-instructions-page__title">{examData.name}</h1>
          </div>

          {/* Info badges */}
          <div className="exam-instructions-page__info">
            <div className="exam-instructions-page__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9.40866 12.7415C9.37282 12.7811 9.33943 12.8228 9.30866 12.8665C9.27712 12.913 9.2519 12.9634 9.23366 13.0165C9.20964 13.0637 9.19278 13.1143 9.18366 13.1665C9.17957 13.222 9.17957 13.2777 9.18366 13.3332C9.18085 13.4425 9.20368 13.5509 9.25033 13.6498C9.28776 13.7533 9.34747 13.8472 9.42523 13.9249C9.503 14.0027 9.59692 14.0624 9.70033 14.0998C9.80008 14.1439 9.90794 14.1667 10.017 14.1667C10.1261 14.1667 10.2339 14.1439 10.3337 14.0998C10.4371 14.0624 10.531 14.0027 10.6088 13.9249C10.6865 13.8472 10.7462 13.7533 10.7837 13.6498C10.8207 13.5485 10.8376 13.441 10.8337 13.3332C10.8343 13.2235 10.8133 13.1148 10.7718 13.0132C10.7303 12.9117 10.6692 12.8194 10.592 12.7415C10.5145 12.6634 10.4224 12.6014 10.3208 12.5591C10.2193 12.5168 10.1103 12.495 10.0003 12.495C9.89032 12.495 9.7814 12.5168 9.67985 12.5591C9.5783 12.6014 9.48613 12.6634 9.40866 12.7415ZM10.0003 1.6665C8.35215 1.6665 6.74099 2.15525 5.37058 3.07092C4.00017 3.9866 2.93206 5.28809 2.30133 6.81081C1.6706 8.33353 1.50558 10.0091 1.82712 11.6256C2.14866 13.2421 2.94234 14.727 4.10777 15.8924C5.27321 17.0578 6.75807 17.8515 8.37458 18.173C9.99109 18.4946 11.6666 18.3296 13.1894 17.6988C14.7121 17.0681 16.0136 16 16.9292 14.6296C17.8449 13.2592 18.3337 11.648 18.3337 9.99984C18.3337 8.90549 18.1181 7.82186 17.6993 6.81081C17.2805 5.79976 16.6667 4.8811 15.8929 4.10728C15.1191 3.33346 14.2004 2.71963 13.1894 2.30084C12.1783 1.88205 11.0947 1.6665 10.0003 1.6665ZM10.0003 16.6665C8.68179 16.6665 7.39286 16.2755 6.29653 15.543C5.2002 14.8104 4.34572 13.7692 3.84113 12.5511C3.33655 11.3329 3.20453 9.99244 3.46176 8.69924C3.719 7.40603 4.35393 6.21814 5.28628 5.28579C6.21863 4.35344 7.40652 3.7185 8.69973 3.46127C9.99293 3.20403 11.3334 3.33606 12.5516 3.84064C13.7697 4.34522 14.8109 5.19971 15.5435 6.29604C16.276 7.39236 16.667 8.6813 16.667 9.99984C16.667 11.7679 15.9646 13.4636 14.7144 14.7139C13.4641 15.9641 11.7684 16.6665 10.0003 16.6665ZM10.0003 5.83317C9.56122 5.83289 9.12977 5.94827 8.74942 6.16771C8.36907 6.38714 8.05322 6.70289 7.83366 7.08317C7.77337 7.17802 7.73288 7.28408 7.71464 7.39498C7.6964 7.50588 7.70078 7.61933 7.72752 7.72849C7.75426 7.83766 7.8028 7.94028 7.87023 8.0302C7.93766 8.12012 8.02258 8.19546 8.11989 8.25171C8.21719 8.30795 8.32487 8.34393 8.43644 8.35749C8.54801 8.37104 8.66117 8.36188 8.76911 8.33057C8.87705 8.29925 8.97754 8.24643 9.06454 8.17527C9.15153 8.10411 9.22323 8.01609 9.27533 7.9165C9.34875 7.78933 9.45447 7.68382 9.58178 7.61065C9.7091 7.53748 9.85349 7.49925 10.0003 7.49984C10.2213 7.49984 10.4333 7.58764 10.5896 7.74392C10.7459 7.9002 10.8337 8.11216 10.8337 8.33317C10.8337 8.55418 10.7459 8.76615 10.5896 8.92243C10.4333 9.07871 10.2213 9.1665 10.0003 9.1665C9.77932 9.1665 9.56735 9.2543 9.41107 9.41058C9.25479 9.56686 9.167 9.77882 9.167 9.99984V10.8332C9.167 11.0542 9.25479 11.2661 9.41107 11.4224C9.56735 11.5787 9.77932 11.6665 10.0003 11.6665C10.2213 11.6665 10.4333 11.5787 10.5896 11.4224C10.7459 11.2661 10.8337 11.0542 10.8337 10.8332V10.6832C11.3848 10.4832 11.8481 10.0959 12.1426 9.58889C12.4372 9.08193 12.5441 8.48758 12.4448 7.90975C12.3455 7.33191 12.0463 6.80735 11.5995 6.42777C11.1527 6.04818 10.5866 5.83772 10.0003 5.83317Z" fill="#045CCE" />
              </svg>
              <span>{examData.duration || '40'} câu hỏi</span>
            </div>

            <div className="exam-instructions-page__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.50033 4.16667H17.5003C17.7213 4.16667 17.9333 4.07887 18.0896 3.92259C18.2459 3.76631 18.3337 3.55435 18.3337 3.33333C18.3337 3.11232 18.2459 2.90036 18.0896 2.74408C17.9333 2.5878 17.7213 2.5 17.5003 2.5H2.50033C2.27931 2.5 2.06735 2.5878 1.91107 2.74408C1.75479 2.90036 1.66699 3.11232 1.66699 3.33333C1.66699 3.55435 1.75479 3.76631 1.91107 3.92259C2.06735 4.07887 2.27931 4.16667 2.50033 4.16667ZM12.5003 15.8333H2.50033C2.27931 15.8333 2.06735 15.9211 1.91107 16.0774C1.75479 16.2337 1.66699 16.4457 1.66699 16.6667C1.66699 16.8877 1.75479 17.0996 1.91107 17.2559C2.06735 17.4122 2.27931 17.5 2.50033 17.5H12.5003C12.7213 17.5 12.9333 17.4122 13.0896 17.2559C13.2459 17.0996 13.3337 16.8877 13.3337 16.6667C13.3337 16.4457 13.2459 16.2337 13.0896 16.0774C12.9333 15.9211 12.7213 15.8333 12.5003 15.8333ZM17.5003 9.16667H2.50033C2.27931 9.16667 2.06735 9.25446 1.91107 9.41074C1.75479 9.56702 1.66699 9.77899 1.66699 10C1.66699 10.221 1.75479 10.433 1.91107 10.5893C2.06735 10.7455 2.27931 10.8333 2.50033 10.8333H17.5003C17.7213 10.8333 17.9333 10.7455 18.0896 10.5893C18.2459 10.433 18.3337 10.221 18.3337 10C18.3337 9.77899 18.2459 9.56702 18.0896 9.41074C17.9333 9.25446 17.7213 9.16667 17.5003 9.16667ZM17.5003 5.83333H2.50033C2.27931 5.83333 2.06735 5.92113 1.91107 6.07741C1.75479 6.23369 1.66699 6.44565 1.66699 6.66667C1.66699 6.88768 1.75479 7.09964 1.91107 7.25592C2.06735 7.4122 2.27931 7.5 2.50033 7.5H17.5003C17.7213 7.5 17.9333 7.4122 18.0896 7.25592C18.2459 7.09964 18.3337 6.88768 18.3337 6.66667C18.3337 6.44565 18.2459 6.23369 18.0896 6.07741C17.9333 5.92113 17.7213 5.83333 17.5003 5.83333ZM17.5003 12.5H2.50033C2.27931 12.5 2.06735 12.5878 1.91107 12.7441C1.75479 12.9004 1.66699 13.1123 1.66699 13.3333C1.66699 13.5543 1.75479 13.7663 1.91107 13.9226C2.06735 14.0789 2.27931 14.1667 2.50033 14.1667H17.5003C17.7213 14.1667 17.9333 14.0789 18.0896 13.9226C18.2459 13.7663 18.3337 13.5543 18.3337 13.3333C18.3337 13.1123 18.2459 12.9004 18.0896 12.7441C17.9333 12.5878 17.7213 12.5 17.5003 12.5Z" fill="#045CCE" />
              </svg>
              <span>{examData.questionCount || '3'} đoạn văn</span>
            </div>

            <div className="exam-instructions-page__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M10.8333 7.5H9.16667V4.16667C9.16667 3.94565 9.07887 3.73369 8.92259 3.57741C8.76631 3.42113 8.55435 3.33333 8.33334 3.33333C8.11232 3.33333 7.90036 3.42113 7.74408 3.57741C7.5878 3.73369 7.5 3.94565 7.5 4.16667V8.33333C7.5 8.55435 7.5878 8.76631 7.74408 8.92259C7.90036 9.07887 8.11232 9.16667 8.33334 9.16667H10.8333C11.0544 9.16667 11.2663 9.07887 11.4226 8.92259C11.5789 8.76631 11.6667 8.55435 11.6667 8.33333C11.6667 8.11232 11.5789 7.90036 11.4226 7.74408C11.2663 7.5878 11.0544 7.5 10.8333 7.5ZM8.33334 0C6.68516 0 5.07399 0.488742 3.70358 1.40442C2.33318 2.3201 1.26507 3.62159 0.634341 5.1443C0.0036107 6.66702 -0.161417 8.34258 0.160126 9.95909C0.48167 11.5756 1.27534 13.0605 2.44078 14.2259C3.60622 15.3913 5.09108 16.185 6.70758 16.5065C8.32409 16.8281 9.99965 16.6631 11.5224 16.0323C13.0451 15.4016 14.3466 14.3335 15.2622 12.9631C16.1779 11.5927 16.6667 9.98151 16.6667 8.33333C16.6667 7.23898 16.4511 6.15535 16.0323 5.1443C15.6135 4.13326 14.9997 3.2146 14.2259 2.44078C13.4521 1.66696 12.5334 1.05313 11.5224 0.634337C10.5113 0.215548 9.42769 0 8.33334 0ZM8.33334 15C7.0148 15 5.72586 14.609 4.62954 13.8765C3.53321 13.1439 2.67872 12.1027 2.17414 10.8846C1.66956 9.66638 1.53753 8.32594 1.79477 7.03273C2.052 5.73952 2.68694 4.55164 3.61929 3.61929C4.55164 2.68694 5.73953 2.052 7.03274 1.79477C8.32594 1.53753 9.66639 1.66955 10.8846 2.17414C12.1027 2.67872 13.1439 3.5332 13.8765 4.62953C14.609 5.72586 15 7.01479 15 8.33333C15 10.1014 14.2976 11.7971 13.0474 13.0474C11.7971 14.2976 10.1014 15 8.33334 15Z" fill="#045CCE" />
              </svg>
              <span>{formatTime(examData.timeLimit || 30)}</span>
            </div>
          </div>

          {/* Instructions Sections */}
          <div className="exam-instructions-page__sections">
            <section className="exam-instructions-page__section">
              <h3 className="exam-instructions-page__section-title">Hướng dẫn làm bài</h3>
              <ul className="exam-instructions-page__list">
                <li>Bạn sẽ đọc đoạn văn và trả lời câu hỏi, có thể di chuyển qua lại giữa các câu hỏi và đoạn văn.</li>
                <li>Mỗi câu hỏi có thể có một hoặc nhiều đáp án tùy theo yêu cầu, có thể thay đổi câu trả lời trước khi nộp bài.</li>
                <li>Bạn cần ra tát cả các câu hỏi trong thời gian quy định, hết giờ hệ thống sẽ tự động nộp bài hoặc có thể nộp bài sớm.</li>
              </ul>
            </section>

            <section className="exam-instructions-page__section">
              <h3 className="exam-instructions-page__section-title">Thông tin bài test</h3>
              <ul className="exam-instructions-page__list">
                <li>Bài test này bao gồm {examData.duration || '40'} câu hỏi thuộc {examData.questionCount || '3'} đoạn văn, thời gian làm bài là {formatTime(examData.timeLimit || 60)}.</li>
                <li>Các dạng câu hỏi có trong bài test: {examData.questionTypes || 'True / False / Not given, Short Answer, Matching Heading, Yes / No / Not Given, Flowchart Answer, Single Answer'}</li>
              </ul>
            </section>

            <section className="exam-instructions-page__section">
              <h3 className="exam-instructions-page__section-title">Lưu ý thiết bị</h3>
              <ul className="exam-instructions-page__list">
                <li>Vui lòng sử dụng desktop hay laptop để đúng tính năng highlight & note.</li>
                <li>Trên iPad và iPhone sẽ hạn chế 2 tính năng trên.</li>
              </ul>
            </section>
          </div>

          {/* Start Button */}
          <div className="exam-instructions-page__footer">
            <button
              className="exam-instructions-page__start-button"
              onClick={() => handleStartExam(skillId, sectionId)}
            >
              Bắt đầu
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14.9333 9.68381C14.8937 9.58152 14.8342 9.48807 14.7583 9.40881L10.5917 5.24215C10.514 5.16445 10.4217 5.10281 10.3202 5.06076C10.2187 5.01871 10.1099 4.99707 10 4.99707C9.77808 4.99707 9.56525 5.08523 9.40833 5.24215C9.33063 5.31985 9.269 5.41209 9.22695 5.51361C9.1849 5.61512 9.16326 5.72393 9.16326 5.83381C9.16326 6.05573 9.25141 6.26856 9.40833 6.42548L12.1583 9.16715H5.83333C5.61232 9.16715 5.40036 9.25494 5.24408 9.41122C5.0878 9.56751 5 9.77947 5 10.0005C5 10.2215 5.0878 10.4335 5.24408 10.5897C5.40036 10.746 5.61232 10.8338 5.83333 10.8338H12.1583L9.40833 13.5755C9.33023 13.653 9.26823 13.7451 9.22592 13.8467C9.18362 13.9482 9.16183 14.0571 9.16183 14.1671C9.16183 14.2772 9.18362 14.3861 9.22592 14.4876C9.26823 14.5892 9.33023 14.6813 9.40833 14.7588C9.4858 14.8369 9.57797 14.8989 9.67952 14.9412C9.78107 14.9835 9.88999 15.0053 10 15.0053C10.11 15.0053 10.2189 14.9835 10.3205 14.9412C10.422 14.8989 10.5142 14.8369 10.5917 14.7588L14.7583 10.5921C14.8342 10.5129 14.8937 10.4194 14.9333 10.3171C15.0167 10.1143 15.0167 9.8867 14.9333 9.68381Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
