from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.chatgpt_service import chatgpt_service
from app.models.exam_models import Exam, ExamTest, ExamSkill, ExamSection, ExamQuestionGroup, ExamQuestion
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User
from loguru import logger

router = APIRouter()


# ============================================
# CHỨC NĂNG: TẠO ĐỀ THI BẰNG AI
# ============================================

class ExamGenerationRequest(BaseModel):
    """Request for generating exam skill (đề thi = skill)"""
    exam_id: int  # ID của bộ đề (Exam) đã có sẵn
    exam_test_id: int  # ID của đề thi (ExamTest) đã có sẵn
    skill_type: str  # reading, writing, listening, speaking
    skill_name: str  # Reading, Writing, Listening, Speaking
    time_limit: int  # Thời gian làm bài (phút)
    sections: List[Dict[str, Any]]  # List of sections với questions


class ExamGenerationResponse(BaseModel):
    """Response for exam generation"""
    status: str
    message: str
    task_id: str
    exam_id: Optional[int] = None


@router.post("/generate-exam", response_model=ExamGenerationResponse)
async def generate_complete_exam(
    request: ExamGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sinh đề thi (ExamSkill) tự động với AI
    
    Endpoint này tạo một skill mới (Reading/Writing/...) trong ExamTest có sẵn
    với sections, question groups và questions.
    Lưu toàn bộ vào DB ngay lập tức.
    """
    try:
        # Kiểm tra exam và exam_test có tồn tại không
        exam_result = await db.execute(select(Exam).where(Exam.id == request.exam_id))
        exam = exam_result.scalar_one_or_none()
        
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam with id {request.exam_id} not found"
            )
        
        test_result = await db.execute(select(ExamTest).where(ExamTest.id == request.exam_test_id))
        exam_test = test_result.scalar_one_or_none()
        
        if not exam_test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ExamTest with id {request.exam_test_id} not found"
            )
        
        logger.info(f"Creating skill '{request.skill_name}' for test '{exam_test.name}'")
        
        # Create exam skill (đây chính là "đề thi")
        exam_skill = ExamSkill(
            exam_test_id=exam_test.id,
            skill_type=request.skill_type.lower(),
            name=request.skill_name,
            time_limit=request.time_limit,
            is_active=False,  # Sẽ activate sau khi tạo xong
            is_online=True
        )
        db.add(exam_skill)
        await db.commit()
        await db.refresh(exam_skill)
        logger.info(f"Created skill with ID: {exam_skill.id}")
        
        # Tạo sections, question groups và questions
        total_questions = 0
        import json
        
        for section_idx, section_config in enumerate(request.sections, 1):
            logger.info(f"Processing section {section_idx}: {section_config.get('name', 'Section ' + str(section_idx))}")
            
            # Create section trong skill
            section = ExamSection(
                exam_skill_id=exam_skill.id,
                name=section_config.get("name", f"Section {section_idx}"),
                content=section_config.get("content", "")
            )
            db.add(section)
            await db.commit()
            await db.refresh(section)
            logger.info(f"Created section: {section.name} (ID: {section.id})")
            
            # Check format: Listening (parts) or Reading/Writing (question_groups) or old (questions)
            parts_data = section_config.get("parts", [])  # Listening format
            question_groups_data = section_config.get("question_groups", [])  # Reading/Writing format
            questions_data = section_config.get("questions", [])  # Old format
            
            # Check if passage data is provided separately (Reading)
            passage_data = section_config.get("passage")
            
            # Check if test_title provided (Listening)
            test_title = section_config.get("test_title")
            
            # If no data provided, generate via AI
            if not parts_data and not question_groups_data and not questions_data:
                logger.info(f"No pre-generated questions, calling AI to generate...")
                ai_result = await chatgpt_service.generate_exam_questions(
                    exam_type=exam.type,
                    skill=request.skill_name,
                    topic=section_config.get("topic", "General"),
                    difficulty=section_config.get("difficulty", "medium"),
                    num_questions=section_config.get("num_questions", 10),
                    question_types=section_config.get("question_types"),
                )
                
                # Check if AI returned Listening format (parts + test_title)
                if isinstance(ai_result, dict) and "parts" in ai_result:
                    parts_data = ai_result["parts"]
                    test_title = ai_result.get("test_title", "LISTENING TEST")
                    # Update section content with test title
                    section.content = test_title
                    await db.commit()
                    logger.info(f"AI generated Listening test with {len(parts_data)} parts")
                # Check if AI returned Reading/Writing format (question_groups)
                elif isinstance(ai_result, dict) and "question_groups" in ai_result:
                    question_groups_data = ai_result["question_groups"]
                    # Update section content with passage if available
                    if "passage" in ai_result:
                        passage = ai_result["passage"]
                        # Store as JSON object for better formatting in frontend
                        section.content = json.dumps(passage, ensure_ascii=False)
                        await db.commit()
                    logger.info(f"AI generated {len(question_groups_data)} question groups")
                else:
                    # Old format: just questions list
                    questions_data = ai_result if isinstance(ai_result, list) else []
                    logger.info(f"AI generated {len(questions_data)} questions")
            else:
                logger.info(f"Using pre-generated data: {len(parts_data)} parts, {len(question_groups_data)} groups, {len(questions_data)} questions")
                
                # If test_title provided (Listening), update section content
                if test_title:
                    section.content = test_title
                    await db.commit()
                    logger.info("Updated section content with test title")
                # If passage data is provided separately (Reading), update section content
                elif passage_data and isinstance(passage_data, dict):
                    # Store as JSON object for better formatting in frontend
                    section.content = json.dumps(passage_data, ensure_ascii=False)
                    await db.commit()
                    logger.info("Updated section content with provided passage")
                elif not section.content or section.content.strip() == "":
                    # If content is empty and no passage provided, log warning
                    logger.warning(f"Section '{section.name}' has empty content and no passage provided")
            
            # Process LISTENING format: Each part = 1 section
            if parts_data:
                logger.info(f"Processing Listening format with {len(parts_data)} parts")
                
                # DELETE the current section (was created for whole test)
                await db.delete(section)
                await db.commit()
                logger.info(f"Deleted temporary section, will create one section per part")
                
                # Create ONE SECTION per PART
                for part_idx, part in enumerate(parts_data, 1):
                    part_question_groups = part.get("question_groups", [])
                    
                    logger.info(f"Creating section for Part {part_idx}: {part.get('title', 'N/A')} - {len(part_question_groups)} question groups")
                    
                    # Create new section for this part
                    part_section = ExamSection(
                        exam_skill_id=exam_skill.id,
                        name=f"{part.get('title', f'Part {part_idx}')} - {part.get('subtitle', '')}",
                        content=part.get('context', ''),  # Store context as content
                        audio=part.get('audio_url', '')  # Store audio path with /uploads/audio/
                    )
                    db.add(part_section)
                    await db.commit()
                    await db.refresh(part_section)
                    logger.info(f"Created section for Part {part_idx}: {part_section.name} (ID: {part_section.id})")
                    logger.info(f"Audio URL: {part.get('audio_url', 'No audio')}")
                    
                    # Now create question groups for THIS part's section
                    for group_data in part_question_groups:
                        group_questions = group_data.get("questions", [])
                        
                        # Create question group name
                        group_name = group_data.get('section_title', group_data.get('group_instruction', 'Questions'))
                        
                        # Only store group-specific data (instruction and section_title)
                        # Don't duplicate context/audio_script (already in ExamSection)
                        group = ExamQuestionGroup(
                            exam_section_id=part_section.id,  # Use part_section.id instead of section.id
                            name=group_name[:255],  # Limit length
                            question_type=group_questions[0].get("question_type", "multiple_choice") if group_questions else "multiple_choice",
                            content=json.dumps({
                                "group_instruction": group_data.get("group_instruction"),
                                "section_title": group_data.get("section_title")
                            }, ensure_ascii=False)
                        )
                        db.add(group)
                        await db.commit()
                        await db.refresh(group)
                        logger.info(f"Created question group: {group.name} (ID: {group.id})")
                        
                        # Save questions in this group
                        for q in group_questions:
                            options_json = None
                            
                            # Listening questions may have answers array
                            if q.get("answers"):
                                options_json = json.dumps(q.get("answers"), ensure_ascii=False)
                            
                            question = ExamQuestion(
                                question_group_id=group.id,
                                question_text=q.get("content", ""),
                                question_type=q.get("question_type", "short_answer"),
                                options=options_json,
                                correct_answer=q.get("correct_answer", ""),
                                explanation=q.get("explanation", ""),
                                points=q.get("points", 1)
                            )
                            db.add(question)
                            total_questions += 1
                        
                        await db.commit()
                        logger.info(f"Saved {len(group_questions)} questions to group")
            
            # Process READING/WRITING format: question_groups (new format - preferred)
            elif question_groups_data:
                for group_data in question_groups_data:
                    group_questions = group_data.get("questions", [])
                    
                    # Create question group
                    group = ExamQuestionGroup(
                        exam_section_id=section.id,
                        name=group_data.get("group_name", f"Questions {total_questions + 1}-{total_questions + len(group_questions)}"),
                        question_type=group_data.get("question_type", "multiple_choice"),
                        content=group_data.get("instruction", "")
                    )
                    db.add(group)
                    await db.commit()
                    await db.refresh(group)
                    logger.info(f"Created question group: {group.name} (ID: {group.id})")
                    
                    # Save questions in this group
                    for q in group_questions:
                        options_json = None
                        
                        # Check for new format: answers array (multiple_choice with is_correct, feedback)
                        if q.get("answers"):
                            options_json = json.dumps(q.get("answers"))
                        # Fallback: old format with simple options array
                        elif q.get("options"):
                            options_json = json.dumps(q.get("options"))
                        
                        # Xử lý metadata cho Writing Task 1 (chart_data, time_minutes, word_count)
                        metadata_fields = {}
                        if q.get("chart_data"):
                            metadata_fields["chart_data"] = q.get("chart_data")
                        if q.get("time_minutes"):
                            metadata_fields["time_minutes"] = q.get("time_minutes")
                        if q.get("word_count"):
                            metadata_fields["word_count"] = q.get("word_count")
                        
                        # Nếu có metadata, lưu vào options (dùng options để lưu vì Text field rộng)
                        # Nếu đã có options (multiple choice), merge vào
                        if metadata_fields:
                            if options_json:
                                # Đã có options (multiple choice), thêm metadata
                                existing_data = json.loads(options_json) if options_json else []
                                combined = {
                                    "options": existing_data,
                                    "metadata": metadata_fields
                                }
                                options_json = json.dumps(combined, ensure_ascii=False)
                            else:
                                # Không có options, lưu metadata trực tiếp
                                options_json = json.dumps({"metadata": metadata_fields}, ensure_ascii=False)
                        
                        question = ExamQuestion(
                            question_group_id=group.id,
                            question_text=q.get("content", q.get("question_text", "")),
                            question_type=q.get("question_type", group.question_type),
                            options=options_json,
                            correct_answer=q.get("correct_answer", ""),
                            explanation=q.get("explanation", ""),
                            points=q.get("points", 1)
                        )
                        db.add(question)
                        total_questions += 1
                    
                    await db.commit()
                    logger.info(f"Saved {len(group_questions)} questions to group {group.name}")
            
            # Fallback: Process old format (flat questions list)
            elif questions_data:
                question_type = questions_data[0].get("question_type", "multiple_choice") if questions_data else "multiple_choice"
                
                group = ExamQuestionGroup(
                    exam_section_id=section.id,
                    name=f"Questions {total_questions + 1}-{total_questions + len(questions_data)}",
                    question_type=question_type,
                    content=section_config.get("passage_content", "")
                )
                db.add(group)
                await db.commit()
                await db.refresh(group)
                logger.info(f"Created question group: {group.name} (ID: {group.id})")
                
                # Save questions
                for q in questions_data:
                    options_json = None
                    
                    # Check for new format: answers array (multiple_choice with is_correct, feedback)
                    if q.get("answers"):
                        options_json = json.dumps(q.get("answers"))
                    # Fallback: old format with simple options array
                    elif q.get("options"):
                        options_json = json.dumps(q.get("options"))
                    
                    question = ExamQuestion(
                        question_group_id=group.id,
                        question_text=q.get("content", q.get("question_text", "")),
                        question_type=q.get("question_type", "multiple_choice"),
                        options=options_json,
                        correct_answer=q.get("correct_answer", ""),
                        explanation=q.get("explanation", ""),
                        points=q.get("points", 1)
                    )
                    db.add(question)
                    total_questions += 1
                
                await db.commit()
                logger.info(f"Saved {len(questions_data)} questions to database")
        
        # Activate skill after creation completes
        exam_skill.is_active = True
        await db.commit()
        
        logger.info(f"Skill '{exam_skill.name}' created successfully with {total_questions} questions")
        
        return ExamGenerationResponse(
            status="success",
            message=f"Skill '{request.skill_name}' created successfully with {total_questions} questions",
            task_id=f"skill_{exam_skill.id}",
            exam_id=exam_skill.id  # Trả về skill_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating exam skill: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create exam skill: {str(e)}"
        )


# Background function không còn cần thiết - đã chuyển sang sync
# Giữ lại để tham khảo nếu cần
"""
async def generate_exam_background_OLD(
    task_id: str,
    exam_id: int,
    exam_test_id: int,
    sections: List[Dict[str, Any]],
):
    # Background task for generating complete exam test with skills, sections, and questions
    # Import here to avoid circular dependency
    from app.database import async_session_maker
    
    async with async_session_maker() as db:
        try:
            logger.info(f"Background test generation started: {task_id}")
            logger.info(f"Generating for Exam ID: {exam_id}, Test ID: {exam_test_id}")
            
            for idx, section_config in enumerate(sections, 1):
                logger.info(f"Processing section {idx}: {section_config.get('skill')} - {section_config.get('topic')}")
                
                # Create skill (Reading, Writing, Listening, Speaking)
                skill_name = section_config.get("skill", "Reading")
                skill_type = skill_name.lower()
                
                skill = ExamSkill(
                    exam_test_id=exam_test_id,
                    skill_type=skill_type,
                    name=skill_name,
                    time_limit=section_config.get("time_limit", 60),
                    is_active=True,
                    is_online=True
                )
                db.add(skill)
                await db.commit()
                await db.refresh(skill)
                logger.info(f"Created skill: {skill.name} (ID: {skill.id})")
                
                # Create section trong skill
                section = ExamSection(
                    exam_skill_id=skill.id,
                    name=f"Section 1 - {section_config.get('topic', 'General')}",
                    content=section_config.get("section_content", "")
                )
                db.add(section)
                await db.commit()
                await db.refresh(section)
                logger.info(f"Created section: {section.name} (ID: {section.id})")
                
                # Use pre-generated questions if available
                questions = section_config.get("questions", [])
                
                # If no pre-generated questions, generate via AI
                if not questions:
                    logger.info(f"No pre-generated questions, calling AI to generate...")
                    questions = await chatgpt_service.generate_exam_questions(
                        exam_type=section_config.get("exam_type", "IELTS"),
                        skill=section_config.get("skill", "Reading"),
                        topic=section_config.get("topic", "General"),
                        difficulty=section_config.get("difficulty", "medium"),
                        num_questions=section_config.get("num_questions", 10),
                        question_types=section_config.get("question_types"),
                    )
                    logger.info(f"AI generated {len(questions)} questions")
                else:
                    logger.info(f"Using {len(questions)} pre-generated questions")
                
                # Determine question type for the group
                question_type = "multiple_choice"  # default
                if questions and len(questions) > 0:
                    question_type = questions[0].get("question_type", "multiple_choice")
                
                # Create question group trong section
                group = ExamQuestionGroup(
                    exam_section_id=section.id,
                    name=f"Questions 1-{len(questions)}",
                    question_type=question_type,
                    content=section_config.get("passage_content", "")  # Passage/dialogue content nếu có
                )
                db.add(group)
                await db.commit()
                await db.refresh(group)
                logger.info(f"Created question group: {group.name} (ID: {group.id})")
                
                # Save questions to database
                import json
                for q_idx, q in enumerate(questions, 1):
                    # Convert options to JSON string if exists
                    options_json = None
                    
                    # Check for new format: answers array (multiple_choice with is_correct, feedback)
                    if q.get("answers"):
                        options_json = json.dumps(q.get("answers"))
                    # Fallback: old format with simple options array
                    elif q.get("options"):
                        options_json = json.dumps(q.get("options"))
                    
                    question = ExamQuestion(
                        question_group_id=group.id,
                        question_text=q.get("content", q.get("question_text", "")),
                        question_type=q.get("question_type", "multiple_choice"),
                        options=options_json,
                        correct_answer=q.get("correct_answer", ""),
                        explanation=q.get("explanation", ""),
                        points=q.get("points", 1)
                    )
                    db.add(question)
                
                await db.commit()
                logger.info(f"Saved {len(questions)} questions to database")
            
            # Activate exam test after generation completes
            test_result = await db.execute(select(ExamTest).where(ExamTest.id == exam_test_id))
            exam_test = test_result.scalar_one()
            exam_test.is_active = True
            await db.commit()
            
            logger.info(f"Test generation completed successfully: {task_id}")
            logger.info(f"Generated test '{exam_test.name}' with {len(sections)} skills")
            
        except Exception as e:
            logger.error(f"Error in background test generation: {str(e)}")
            logger.exception(e)  # Log full traceback
"""


# ============================================
# ENDPOINT: CHỈ SINH CÂU HỎI (KHÔNG LƯU DB)
# ============================================

class QuestionGenerationRequest(BaseModel):
    """Request for generating questions only (no DB save)"""
    exam_type: str  # IELTS, TOEIC, etc.
    skill: str  # Reading, Writing, Listening, Speaking
    topic: str  # Environment, Technology, etc.
    difficulty: str  # easy, medium, hard
    num_questions: int  # Number of questions to generate
    question_types: Optional[List[str]] = None  # Optional: specific question types
    part_number: Optional[int] = None  # For Listening: which part to generate (1, 2, 3, or 4)


class QuestionGenerationResponse(BaseModel):
    """Response for question generation"""
    status: str
    message: str
    data: Dict[str, Any]  # Contains passage and question_groups


@router.post("/generate-questions", response_model=QuestionGenerationResponse)
async def generate_questions_only(
    request: QuestionGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Sinh câu hỏi bằng AI (không lưu vào DB)
    
    Endpoint này chỉ gọi ChatGPT để sinh câu hỏi và trả về JSON
    để frontend hiển thị preview hoặc chỉnh sửa trước khi lưu.
    
    Returns:
        {
            "status": "success",
            "message": "Generated 13 questions",
            "data": {
                "passage": {...},
                "question_groups": [...]
            }
        }
    """
    try:
        logger.info(f"Generating questions: {request.exam_type} {request.skill} - {request.topic}")
        if request.part_number:
            logger.info(f"Generating Part {request.part_number} only")
        
        # Call ChatGPT service
        result = await chatgpt_service.generate_exam_questions(
            exam_type=request.exam_type,
            skill=request.skill,
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            question_types=request.question_types,
            part_number=request.part_number  # Pass part_number to service
        )
        
        # Log để debug
        logger.info(f"Result type: {type(result)}")
        if isinstance(result, dict):
            logger.info(f"Result keys: {result.keys()}")
            logger.info(f"Has passage: {'passage' in result}")
            logger.info(f"Has question_groups: {'question_groups' in result}")
            logger.info(f"Has parts: {'parts' in result}")
            logger.info(f"Has test_title: {'test_title' in result}")
            if "passage" in result:
                passage = result["passage"]
                logger.info(f"Passage title: {passage.get('title', 'N/A')}")
                logger.info(f"Passage content length: {len(passage.get('content', ''))}")
        
        # LISTENING FORMAT: parts with test_title
        if isinstance(result, dict) and "parts" in result and "test_title" in result:
            # Count total questions from all parts
            total_qs = 0
            for part in result["parts"]:
                if "question_groups" in part:
                    for group in part["question_groups"]:
                        total_qs += len(group.get("questions", []))
            
            logger.info(f"✅ Listening format detected: {len(result['parts'])} parts, {total_qs} questions")
            
            # Generate audio files for each part
            try:
                logger.info("🎤 Generating audio files for Listening parts...")
                parts_with_audio = await chatgpt_service.generate_listening_audio(
                    parts=result["parts"],
                    output_dir="uploads/audio"
                )
                result["parts"] = parts_with_audio
                logger.info(f"✅ Generated {len(parts_with_audio)} audio files")
            except Exception as e:
                logger.error(f"⚠️ Failed to generate audio files: {str(e)}")
                # Continue without audio files
            
            return QuestionGenerationResponse(
                status="success",
                message=f"Generated {total_qs} questions across {len(result['parts'])} parts with audio",
                data=result  # Return with audio_url in each part
            )
        
        # READING/WRITING FORMAT: question_groups (with or without passage)
        elif isinstance(result, dict) and "question_groups" in result:
            total_qs = sum(len(g.get("questions", [])) for g in result["question_groups"])
            
            # Always return full structure with passage and question_groups
            # If passage is missing, add empty passage object
            if "passage" not in result:
                result["passage"] = {
                    "title": "",
                    "introduction": "",
                    "content": "",
                    "topic": "",
                    "word_count": 0
                }
                message = f"Generated {total_qs} questions (no passage)"
            else:
                message = f"Generated {total_qs} questions with passage"
            
            logger.info(f"✅ Reading/Writing format detected: {total_qs} questions")
            
            return QuestionGenerationResponse(
                status="success",
                message=message,
                data=result
            )
        
        # Old format (just questions list) - wrap it
        elif isinstance(result, list):
            logger.info(f"⚠️ Old format detected: {len(result)} questions")
            return QuestionGenerationResponse(
                status="success",
                message=f"Generated {len(result)} questions",
                data={
                    "questions": result
                }
            )
        
        else:
            logger.error(f"❌ Unexpected result format: {result}")
            raise ValueError("Unexpected response format from ChatGPT service")
        
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )
