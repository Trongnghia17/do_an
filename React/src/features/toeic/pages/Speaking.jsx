import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getSkillById, getSectionById } from '../api/toeic.api';
import './Toeic.css';
import Header from '../components/Header';
import clock_speaking from '@/assets/images/clock.svg';

export default function SpeakingToeic() {
    const navigate = useNavigate();
    const { skillId, sectionId } = useParams();
    const location = useLocation();
    const examData = location.state?.examData;

    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);

    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(1800);
    const [currentPartTab, setCurrentPartTab] = useState(1);
    const [loading, setLoading] = useState(true);
    const [skillData, setSkillData] = useState(null);
    const [sectionData, setSectionData] = useState(null);
    const [questionGroups, setQuestionGroups] = useState([]);
    const [passages, setPassages] = useState([]);
    const [parts, setParts] = useState([]);

    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [fontSize, setFontSize] = useState("normal");

    useEffect(() => {
        const fetchExamData = async () => {
            try {
                setLoading(true);
                if (sectionId) {
                    const response = await getSectionById(sectionId, { with_questions: true });
                    if (response.data.success) {
                        const section = response.data.data;
                        setSectionData(section);
                        setPassages([{
                            id: section.id,
                            part: 1,
                            title: section.title || 'Writing Passage',
                            subtitle: '',
                            content: section.content || ''
                        }]);
                        setParts([{ id: section.id, part: 1, title: `Part 1` }]);

                        const allGroups = [];
                        let questionNumber = 1;
                        if (section.question_groups) {
                            section.question_groups.forEach(group => {
                                const questions = [];
                                if (group.questions) {
                                    group.questions.forEach((q) => {
                                        questions.push({
                                            id: q.id,
                                            number: questionNumber++,
                                            content: q.content,
                                            correctAnswer: q.answer_content
                                        });
                                    });
                                }
                                allGroups.push({
                                    id: group.id,
                                    part: 1,
                                    type: group.question_type || 'MCQ',
                                    instructions: group.instructions,
                                    groupContent: group.content,
                                    options: Array.isArray(group.options)
                                        ? group.options
                                        : (group.options ? (typeof group.options === 'string' ? JSON.parse(group.options) : ['A', 'B', 'C', 'D']) : ['A', 'B', 'C', 'D']),
                                    questions: questions,
                                    startNumber: questions[0]?.number || 1,
                                    endNumber: questions[questions.length - 1]?.number || 1
                                });
                            });
                        }
                        setQuestionGroups(allGroups);
                    }
                } else if (skillId) {
                    const response = await getSkillById(skillId, { with_sections: true });
                    if (response.data.success) {
                        const skill = response.data.data;
                        setSkillData(skill);

                        const allGroups = [];
                        const allPassages = [];
                        const allParts = [];
                        let questionNumber = 1;

                        if (skill.sections && skill.sections.length > 0) {
                            skill.sections.forEach((section, sectionIndex) => {
                                const partNumber = sectionIndex + 1;
                                const groupStartIndex = allGroups.length;

                                allPassages.push({
                                    id: section.id,
                                    part: partNumber,
                                    title: section.title || `Speaking Part ${partNumber}`,
                                    subtitle: '',
                                    content: section.content || ''
                                });

                                if (section.question_groups) {
                                    section.question_groups.forEach(group => {
                                        const questions = [];
                                        if (group.questions) {
                                            group.questions.forEach((q) => {
                                                questions.push({
                                                    id: q.id,
                                                    number: questionNumber++,
                                                    content: q.content,
                                                    correctAnswer: q.answer_content
                                                });
                                            });
                                        }
                                        allGroups.push({
                                            id: group.id,
                                            part: partNumber,
                                            type: group.question_type || 'MCQ',
                                            instructions: group.instructions,
                                            groupContent: group.content,
                                            options: Array.isArray(group.options)
                                                ? group.options
                                                : (group.options ? (typeof group.options === 'string' ? JSON.parse(group.options) : ['A', 'B', 'C', 'D']) : ['A', 'B', 'C', 'D']),
                                            questions: questions,
                                            startNumber: questions[0]?.number || questionNumber,
                                            endNumber: questions[questions.length - 1]?.number || questionNumber
                                        });
                                    });
                                }

                                const firstQuestionNum = allGroups[groupStartIndex]?.startNumber || questionNumber;
                                const lastQuestionNum = allGroups[allGroups.length - 1]?.endNumber || questionNumber;
                                allParts.push({
                                    id: section.id,
                                    part: partNumber,
                                    title: `Part ${partNumber} (${firstQuestionNum}-${lastQuestionNum})`
                                });
                            });

                            setPassages(allPassages);
                            setParts(allParts);
                        }

                        setQuestionGroups(allGroups);

                        if (skill.time_limit) {
                            setTimeRemaining(skill.time_limit * 60);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching exam data:', error);
                alert('Không thể tải dữ liệu bài thi. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchExamData();
    }, [skillId, sectionId]);

    useEffect(() => {
        const audioUrl =
            sectionData?.audio_url ||
            sectionData?.media?.audio ||
            skillData?.audio_url ||
            skillData?.media?.audio ||
            skillData?.audio ||
            sectionData?.media_url ||
            null;

        if (audioUrl && audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.load();
            const tryPlay = async () => {
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    setIsPlaying(false);
                    console.info('Autoplay blocked or unavailable:', err);
                }
            };
            setTimeout(tryPlay, 300);
        }
    }, [sectionData, skillData]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTime = () => setAudioProgress(audio.currentTime);
        const onLoaded = () => setAudioDuration(audio.duration || 0);
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('loadedmetadata', onLoaded);
        return () => {
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('loadedmetadata', onLoaded);
        };
    }, [audioRef.current]);

    const handleAudioToggle = async () => {
        const audio = audioRef.current;
        if (!audio) return;
        try {
            if (audio.paused) {
                await audio.play();
                setIsPlaying(true);
            } else {
                audio.pause();
                setIsPlaying(false);
            }
        } catch (err) {
            console.error('Audio play error', err);
        }
    };

    const handleAudioSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;
        const pct = Number(e.target.value);
        const time = (audio.duration || audioDuration) * (pct / 100);
        audio.currentTime = time;
        setAudioProgress(time);
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId, answer) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const handleQuestionClick = (questionNumber) => {
        const group = questionGroups.find(g =>
            g.questions.some(q => q.number === questionNumber)
        );

        if (group && group.part !== currentPartTab) {
            setCurrentPartTab(group.part);
            setTimeout(() => {
                const element = document.getElementById(`question-${questionNumber}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 120);
        } else {
            const element = document.getElementById(`question-${questionNumber}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };


    const handleSubmit = () => {
        const result = {
            skillId,
            sectionId,
            answers,
            timeSpent: (skillData?.time_limit * 60 || 1800) - timeRemaining
        };
        console.log('Submit result:', result);
        alert('Nộp bài thành công!');
        navigate('/lich-su-lam-bai');
    };

    // helper: render questions by group type (class names prefixed with lt-)
    const renderQuestionsByType = (group) => {
        const opts = Array.isArray(group.options) ? group.options : (group.options || []);
        const type = (group.type || '').toLowerCase();

        const renderMCQ = (q) => (
            <div key={q.id} id={`question-${q.number}`} className="lt-question">
                <div className="lt-question__number">Câu {q.number}:</div>
                <div className="lt-question__content" dangerouslySetInnerHTML={{ __html: q.content || '' }} />
                <div className="lt-question__options">
                    {opts.map((option, idx) => {
                        const val = typeof option === 'object' ? (option.value ?? option.label ?? String(option)) : String(option);
                        const labelHtml = typeof option === 'object' ? (option.label ?? val) : option;
                        return (
                            <label key={idx} className="lt-option">
                                <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    value={val}
                                    checked={String(answers[q.id] ?? '') === String(val)}
                                    onChange={() => handleAnswerSelect(q.id, val)}
                                />
                                <span dangerouslySetInnerHTML={{ __html: labelHtml }} />
                            </label>
                        );
                    })}
                </div>
            </div>
        );

        const renderTF = (q) => (
            <div key={q.id} id={`question-${q.number}`} className="lt-question">
                <div className="lt-question__number">Câu {q.number}.</div>
                <div className="lt-question__content" dangerouslySetInnerHTML={{ __html: q.content || '' }} />
                <div className="lt-question__options">
                    {(opts.length ? opts : ['True', 'False', 'Not given']).map((o, i) => (
                        <label key={i} className="lt-option">
                            <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={o}
                                checked={String(answers[q.id] ?? '') === String(o)}
                                onChange={() => handleAnswerSelect(q.id, o)}
                            />
                            <span>{o}</span>
                        </label>
                    ))}
                </div>
            </div>
        );

        const renderFill = (q) => (
            <div key={q.id} id={`question-${q.number}`} className="lt-question">
                <div className="lt-question__number">Câu {q.number}.</div>
                <div className="lt-question__content" dangerouslySetInnerHTML={{ __html: q.content || '' }} />
                <input
                    type="text"
                    className="lt-fill-input"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                    placeholder="Nhập đáp án"
                />
            </div>
        );

        const renderMatch = (q) => (
            <div key={q.id} id={`question-${q.number}`} className="lt-question">
                <div className="lt-question__number">Câu {q.number}.</div>
                <div className="lt-question__content" dangerouslySetInnerHTML={{ __html: q.content || '' }} />
                <select
                    value={answers[q.id] ?? ''}
                    onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                    className="lt-match-select"
                >
                    <option value="">Chọn đáp án</option>
                    {opts.map((o, idx) => {
                        const val = typeof o === 'object' ? (o.value ?? o.label ?? String(o)) : String(o);
                        const label = typeof o === 'object' ? (o.label ?? val) : o;
                        return <option key={idx} value={val}>{label}</option>;
                    })}
                </select>
            </div>
        );

        return (
            <div className="lt-group-questions">
                {group.questions.map((q) => {
                    if (type.includes('true') || type.includes('false') || type.includes('not_given')) return renderTF(q);
                    if (type.includes('fill') || type.includes('blank') || type.includes('gap')) return renderFill(q);
                    if (type.includes('match') || type.includes('matching')) return renderMatch(q);
                    return renderMCQ(q);
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="lt-loading">
                <div className="lt-loading__text">Đang tải...</div>
            </div>
        );
    }

    if (!passages || passages.length === 0) {
        return (
            <div className="lt-empty">
                <div className="lt-empty__text">Không tìm thấy dữ liệu bài thi</div>
            </div>
        );
    }

    const currentPassage = passages.find(p => p.part === currentPartTab) || passages[0];
    const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);
    const allQuestions = questionGroups.flatMap(g => g.questions);
    const questionsByPart = questionGroups.reduce((acc, group) => {
        const part = group.part;

        if (!acc[part]) acc[part] = [];
        acc[part].push(...group.questions);

        return acc;
    }, {});


    return (
        <div className="lt-page">
            <Header
                examData={examData}
                skillData={skillData}
                sectionData={sectionData}
                currentPartTab={currentPartTab}
                timeRemaining={timeRemaining}
                showFontSizeMenu={showFontSizeMenu}
                setShowFontSizeMenu={setShowFontSizeMenu}
                handleSubmit={handleSubmit}
                formatTime={formatTime}
                hideTimer={true}
            />

            <div className='lt-grid-main'>
                <div className="lt-grid">
                    <aside className="lt-col lt-col--left">
                    </aside>

                    <main className="lt-col lt-col--center wt-col-center">
                        <div className="lt-audio">
                            <audio ref={audioRef} preload="auto" />
                            <div className="lt-audio__controls">
                                <button className="lt-audio__play" onClick={handleAudioToggle}>
                                    {isPlaying ? 'Pause' : 'Play'}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={audioDuration ? (audioProgress / audioDuration) * 100 : 0}
                                    onChange={handleAudioSeek}
                                />
                                <div className="lt-audio__time">
                                    {Math.floor(audioProgress)} / {Math.floor(audioDuration)} s
                                </div>
                            </div>
                        </div>

                        <div className="lt-passage">
                            <div className="lt-passage__header">
                                <h2 className="lt-passage__title">{currentPassage.title}</h2>
                                {currentPassage.subtitle && <p className="lt-passage__subtitle">{currentPassage.subtitle}</p>}
                            </div>
                            <div className="lt-passage__content" dangerouslySetInnerHTML={{ __html: currentPassage.content }} />
                        </div>

                        <div className='clock_speaking'>
                            <h4>Preparation Time</h4>
                            <div className="lt-timer">
                                <img src={clock_speaking} alt="" />
                                <p>{formatTime(timeRemaining)}</p>
                            </div>
                        </div>
                    </main>

                    <aside className="lt-col lt-col--right">
                    </aside>
                </div>
            </div>

            <aside className="lt-footer">
                <div className='lt-footer-dflex'>
                    <div className="lt-part-tabs">
                        {parts.map((p) => (
                            <button
                                key={p.part}
                                className={`lt-part-tab ${currentPartTab === p.part ? 'active' : ''}`}
                                onClick={() => setCurrentPartTab(p.part)}
                            >
                                Part {p.part}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {showFontSizeMenu && (
                <div className="lt-fontsize-popup">
                    <h3>Cỡ chữ</h3>
                    <p>Chọn cỡ chữ phù hợp cho việc đọc</p>

                    <div
                        className={`lt-fontsize-option ${fontSize === "normal" ? "active" : ""}`}
                        onClick={() => setFontSize("normal")}
                    >
                        Bình thường
                    </div>

                    <div
                        className={`lt-fontsize-option ${fontSize === "large" ? "active" : ""}`}
                        onClick={() => setFontSize("large")}
                    >
                        Lớn
                    </div>

                    <div
                        className={`lt-fontsize-option ${fontSize === "xlarge" ? "active" : ""}`}
                        onClick={() => setFontSize("xlarge")}
                    >
                        Rất lớn
                    </div>

                    <button
                        className="lt-fontsize-close"
                        onClick={() => setShowFontSizeMenu(false)}
                    >
                        Đóng
                    </button>
                </div>
            )}

        </div>
    );
}