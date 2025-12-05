import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamsDetail } from '../api/exams.api'; 
import SelectExamModeModal from '../components/SelectExamModeModal'; 
import sumde from '@/assets/images/sumde.svg';
import tichxanh from '@/assets/images/tichxanh.svg';
import nextxanh from '@/assets/images/nextxanh.svg';
import reading from '@/assets/images/exam-reading.png';
import listening from '@/assets/images/exam-listening.png';
import writing from '@/assets/images/exam-writing.png';
import speaking from '@/assets/images/exam-speaking.png';
import './ExamPackageDetail.css';

// Biểu tượng cho từng kỹ năng
const SkillIcons = {
    'reading': (
        <img src={reading} alt="Reading Icon" />
    ), 
    'listening': (
        <img src={listening} alt="Reading Icon" />
    ), 
    'speaking': (
       <img src={speaking} alt="Reading Icon" />
    ), 
    'writing': (
       <img src={writing} alt="Reading Icon" />
    ), 
};


export default function ExamDetailView() {
    const { examType, examId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [examData, setExamData] = useState(null);
    const [error, setError] = useState(null);
    
    // State cho Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const bgColors = ["#FAF9FE", "#FEFFFA", "#F5FFFC", "#FCFBF9"];

    useEffect(() => {
        if (!examId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Giả định API getExamsDetail trả về thông tin chi tiết gói đề
                const response = await getExamsDetail(examId);

                if (response.data.success) {
                    setExamData(response.data.data);
                } else {
                    setError('Không thể tải chi tiết bộ đề.');
                }
            } catch (err) {
                console.error("Lỗi khi tải chi tiết bộ đề:", err);
                setError('Đã xảy ra lỗi khi kết nối máy chủ.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId]);


    // Cập nhật Hàm xử lý khi người dùng ấn "Thi ngay"
    const handleStartSkillTest = (skill) => {
        setSelectedSkill(skill); // Lưu thông tin skill
        setIsModalOpen(true);    // Mở Modal
    };

    // Hàm này sẽ được gọi từ bên trong Modal sau khi người dùng chọn chế độ thi
    const handleStartExam = (skillId, sectionId = null) => {
        setIsModalOpen(false); // Đóng Modal

        // Logic điều hướng đã được cập nhật từ các yêu cầu trước:
        // IELTS/TOEIC Listening có logic riêng: /toeic-listening/{skillId}/{sectionId?}
        const skillType = selectedSkill.skill_type;
        let path = '';

        if (skillType === 'listening' && (examData.exam_type === 'toeic' || examData.exam_type === 'ielts')) {
            // Dùng logic route đã thảo luận: /toeic-listening/{skillId} hoặc /toeic-listening/{skillId}/{sectionId}
            path = `/${examData.exam_type}-listening/${skillId}`;
            if (sectionId) {
                path += `/${sectionId}`;
            }
        } else {
            // Dùng route mặc định cũ (có thể cần điều chỉnh sau)
            path = `/lam-bai-thi/${skillId}?mode=${sectionId ? 'practice' : 'test'}`;
        }
        
        navigate(path);
    };

    // 💡 PHỤC HỒI HÀM RENDER HEADER (Phần bị thiếu)
    const renderHeader = () => {
        if (!examData) return null;

        // Giả định examData chứa: name, total_tests (tổng số đề), total_attempts (lượt làm bài)
        const totalTests = examData.tests.length; // Lấy tổng số Test (Test 1, Test 2,...)
        const totalAttempts = examData.total_attempts || 0; 
        
        // 
        return (
            <div className="exam-package-header">
                <div className="exam-detail__breadcrumb">
                    <span onClick={() => navigate('/')}>Trang chủ</span> 
                    <span> &gt; </span>
                    <span className='active' onClick={() => navigate(`/bo-de/${examType}`)}>Bộ đề {examType}</span> 
                </div>
                <h1 className="exam-package-header__title">
                    {examData.name} 
                </h1>
                <div className="exam-package-header__info">
                    <div className="info-item">
                        <img src={sumde} alt="Tổng số đề" />
                        <span>Tổng: {totalTests} đề</span>
                    </div>
                    <div className="info-item info-item2">
                        <img src={tichxanh} alt="Lượt làm bài" />
                        <span>Lượt làm bài: {totalAttempts}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="exam-detail__loading">Đang tải chi tiết bộ đề...</div>;
    }

    if (error) {
        return <div className="exam-detail__error">Lỗi: {error}</div>;
    }

    if (!examData || examData.tests.length === 0) {
        return <div className="exam-detail__empty">Không tìm thấy bài test nào cho bộ đề này.</div>;
    }

    return (
        <div className="exam-detail-view">
            {renderHeader()} 
            <div className="exam-detail__tests-list">
                {examData.tests.map((test, index) => (
                    <div key={test.id} className="exam-test-section">
                        <h2 className="exam-test-section__title" style={{ backgroundColor: bgColors[index % bgColors.length] }}>{test.name}</h2>
                        <div className="exam-test-section__skills-grid">
                            {test.skills.map((skill) => (
                                <div key={skill.id} className="skill-card">
                                    <div className="skill-card__icon">
                                        {SkillIcons[skill.skill_type] || SkillIcons['reading']}
                                    </div>
                                    <h3 className="skill-card__title">
                                        {/* Giả định examData.exam_type có sẵn (IELTS/TOEIC/...) */}
                                        {examData.exam_type?.toUpperCase()} {skill.name}
                                    </h3>
                                    <button
                                        className="skill-card__button"
                                        onClick={() => handleStartSkillTest(skill)}
                                    >
                                        Thi ngay <span className="skill-card__arrow"><img src={nextxanh} alt="" /></span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {selectedSkill && ( 
                <SelectExamModeModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    skill={selectedSkill}   
                    examType={examData.exam_type}     
                    onStartExam={handleStartExam} 
                />
            )}
        </div>
    );
}

