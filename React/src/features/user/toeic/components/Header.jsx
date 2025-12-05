import React from 'react';
import { useNavigate } from 'react-router-dom';
import nutx from '@/assets/images/nutx.svg';
import logo from '@/assets/images/logo.png';
import clock from '@/assets/images/clock.svg';
import aa from '@/assets/images/aa.svg';
import zoom from '@/assets/images/zoom.svg';
import file from '@/assets/images/file.svg';
export default function Header({
    examData,
    skillData,
    sectionData,
    currentPartTab,
    timeRemaining,
    showFontSizeMenu,
    setShowFontSizeMenu,
    handleSubmit,
    formatTime,
    hideTimer = false
}) {
    const navigate = useNavigate();

    return (
        <div className="lt-header">
            <div className="lt-header__left">
                <button className="lt-close" onClick={() => navigate(-1)}>
                    <img src={nutx} alt="" />
                </button>
                <img src={logo} alt="OWL IELTS" className="lt-logo" />
                <div className="lt-header__text">
                    <div className="lt-header__label">Part {currentPartTab}</div>
                    <div className="lt-header__name">
                        {examData?.name || skillData?.name || sectionData?.title || 'Listening Test'}
                    </div>
                </div>
            </div>

            <div className="lt-header__center">
                {!hideTimer && (
                    <div className="lt-timer">
                        <img src={clock} alt="" />
                        <p>{formatTime(timeRemaining)}</p>
                    </div>
                )}
            </div>

            <div className='lt-header__right'>
                <div
                    className='lt-header_right-item'
                    style={{ cursor: "pointer" }}
                >
                    <img src={file} alt="file" />
                </div>
                <div
                    className='lt-header_right-item'
                    onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
                    style={{ cursor: "pointer" }}
                >
                    <img src={aa} alt="Kích cỡ" />
                </div>
                <div
                    className='lt-header_right-item'
                    style={{ cursor: "pointer" }}
                >
                    <img src={zoom} alt="zoom" />
                </div>
                <button className="lt-submit" onClick={handleSubmit}>Nộp bài</button>
            </div>
        </div>
    );
}
