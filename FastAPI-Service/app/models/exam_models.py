"""
SQLAlchemy models for Exam system
Maps to Laravel database structure
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ExamType(str, enum.Enum):
    """Exam type enum"""
    ONLINE = "online"
    IELTS = "ielts"
    TOEIC = "toeic"


class SkillType(str, enum.Enum):
    """Skill type enum"""
    READING = "reading"
    WRITING = "writing"
    SPEAKING = "speaking"
    LISTENING = "listening"


class Exam(Base):
    """Exams table - Bộ đề thi (IELTS, TOEIC, Online)"""
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)  # IELTS Academic, TOEIC Practice
    type = Column(SQLEnum(ExamType), default=ExamType.ONLINE, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    exam_tests = relationship("ExamTest", back_populates="exam", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Exam {self.id}: {self.name} ({self.type})>"


class ExamTest(Base):
    """Exam Tests table - Đề thi trong bộ (Test 1, Test 2, Mock Test)"""
    __tablename__ = "exam_tests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # Test 1, Test 2
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="exam_tests")
    exam_skills = relationship("ExamSkill", back_populates="exam_test", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ExamTest {self.id}: {self.name}>"


class ExamSkill(Base):
    """Exam Skills table - Kỹ năng trong đề thi (Reading, Writing, Speaking, Listening)"""
    __tablename__ = "exam_skills"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exam_test_id = Column(Integer, ForeignKey("exam_tests.id", ondelete="CASCADE"), nullable=False)
    skill_type = Column(SQLEnum(SkillType), nullable=False)
    name = Column(String(255), nullable=False)  # Reading, Writing
    description = Column(Text, nullable=True)
    time_limit = Column(Integer, nullable=True)  # Thời gian làm bài (phút)
    image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    exam_test = relationship("ExamTest", back_populates="exam_skills")
    exam_sections = relationship("ExamSection", back_populates="exam_skill", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ExamSkill {self.id}: {self.name} ({self.skill_type})>"


class ExamSection(Base):
    """Exam Sections table - Phần trong kỹ năng (Section 1, Section 2)"""
    __tablename__ = "exam_sections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exam_skill_id = Column(Integer, ForeignKey("exam_skills.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # Section 1, Part A
    description = Column(Text, nullable=True)
    ui_layer = Column(String(255), nullable=True)  # UI layer cho section
    order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    exam_skill = relationship("ExamSkill", back_populates="exam_sections")
    question_groups = relationship("ExamQuestionGroup", back_populates="exam_section", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ExamSection {self.id}: {self.name}>"


class ExamQuestionGroup(Base):
    """Exam Question Groups table - Nhóm câu hỏi"""
    __tablename__ = "exam_question_groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exam_section_id = Column(Integer, ForeignKey("exam_sections.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # Question 1-5, Passage 1
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)  # Nội dung đoạn văn/hội thoại
    image = Column(String(255), nullable=True)
    audio = Column(String(255), nullable=True)
    video = Column(String(255), nullable=True)
    order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    exam_section = relationship("ExamSection", back_populates="question_groups")
    questions = relationship("ExamQuestion", back_populates="question_group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ExamQuestionGroup {self.id}: {self.name}>"


class ExamQuestion(Base):
    """Exam Questions table - Câu hỏi"""
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_group_id = Column(Integer, ForeignKey("exam_question_groups.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # multiple_choice, fill_blank, essay, etc.
    options = Column(Text, nullable=True)  # JSON string of options
    correct_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    audio = Column(String(255), nullable=True)
    order = Column(Integer, default=0, nullable=False)
    points = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    question_group = relationship("ExamQuestionGroup", back_populates="questions")

    def __repr__(self):
        return f"<ExamQuestion {self.id}: {self.question_type}>"
