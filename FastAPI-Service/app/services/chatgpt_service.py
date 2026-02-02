from openai import AsyncOpenAI
from typing import List, Dict, Any, Optional
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.services.prompts import prompt_loader


class ChatGPTService:
    """Service để tích hợp với ChatGPT API"""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate completion from ChatGPT
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Override default temperature
            max_tokens: Override default max_tokens
            
        Returns:
            Generated text response
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e)
            logger.error(f"ChatGPT API error: {error_str}")
            logger.error(f"Error type: {type(e).__name__}")
            if hasattr(e, 'response'):
                logger.error(f"Response: {e.response}")
            if hasattr(e, 'body'):
                logger.error(f"Body: {e.body}")
            # Log request details for debugging
            logger.error(f"Model: {self.model}")
            logger.error(f"Max tokens: {max_tokens or self.max_tokens}")
            logger.error(f"Temperature: {temperature or self.temperature}")
            logger.error(f"Messages count: {len(messages)}")
            if messages:
                logger.error(f"First message role: {messages[0].get('role')}")
                logger.error(f"User prompt length: {len(messages[-1].get('content', ''))}")
            raise

    async def generate_exam_questions(
        self,
        exam_type: str,
        skill: str,
        topic: str,
        difficulty: str,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
        part_number: Optional[int] = None,  # For Listening: which part (1-4)
    ):
        """
        Sinh câu hỏi thi tự động
        
        Args:
            exam_type: Loại đề (IELTS, TOEIC, etc.)
            skill: Kỹ năng (Listening, Reading, Writing, Speaking)
            topic: Chủ đề
            difficulty: Độ khó (easy, medium, hard)
            num_questions: Số lượng câu hỏi
            question_types: Loại câu hỏi
            part_number: For Listening only - which part to generate (1, 2, 3, or 4)
            
        Returns:
            List of generated questions
        """
        # Get system and user prompts from prompt loader
        system_prompt = prompt_loader.get_system_prompt("generation", exam_type, skill)
        user_prompt = prompt_loader.get_generation_prompt(
            exam_type=exam_type,
            skill=skill,
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions,
            question_types=question_types,
            part_number=part_number
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(
            f"Generating {num_questions} questions for {exam_type} - {skill} - {topic}"
        )
        
        # For IELTS Reading with many questions, warn about token limits
        if exam_type.upper() == "IELTS" and skill.lower() == "reading" and num_questions > 25:
            logger.warning(f"Large question set ({num_questions} questions) may exceed token limits. Consider splitting into smaller batches.")
        
        # Increase max_tokens for large question sets
        # GPT-3.5-turbo supports up to 4096 output tokens
        max_tokens = self.max_tokens
        if num_questions >= 40:
            max_tokens = 4096  # Maximum for gpt-3.5-turbo
            logger.info(f"Using max tokens {max_tokens} for {num_questions} questions")
        elif num_questions > 25:
            max_tokens = 3500
        elif num_questions > 15:
            max_tokens = 2500
        
        response = await self.generate_completion(messages, max_tokens=max_tokens)
        
        # LOG: Response từ GPT
        logger.info("=" * 80)
        logger.info("📥 GPT RESPONSE (RAW):")
        logger.info("=" * 80)
        logger.info(f"Response length: {len(response)} characters")
        logger.info(f"Response preview (first 500 chars):\n{response[:500]}...")
        logger.info("=" * 80)
        
        # Parse response to structured format
        questions = self._parse_generated_questions(response, skill)
        
        # LOG: Parsed result
        logger.info("📦 PARSED RESULT:")
        if isinstance(questions, dict):
            logger.info(f"Type: dict")
            logger.info(f"Keys: {list(questions.keys())}")
            if "passage" in questions:
                logger.info(f"✅ Has passage: title='{questions['passage'].get('title', 'N/A')}'")
            if "question_groups" in questions:
                logger.info(f"✅ Has {len(questions['question_groups'])} question groups")
                for idx, group in enumerate(questions['question_groups'], 1):
                    logger.info(f"   Group {idx}: {group.get('group_name', 'N/A')} - {len(group.get('questions', []))} questions")
        else:
            logger.info(f"Type: {type(questions)}")
            logger.info(f"Length: {len(questions) if isinstance(questions, list) else 'N/A'}")
        logger.info("=" * 80)
        
        return questions

    async def grade_writing_answer(
        self,
        question: str,
        answer: str,
        exam_type: str = "IELTS",
        criteria: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Chấm bài Writing tự động
        
        Args:
            question: Câu hỏi Writing
            answer: Bài làm của học sinh
            exam_type: Loại đề thi
            criteria: Tiêu chí chấm điểm
            
        Returns:
            Grading result with score and feedback
        """
        # Get system and user prompts from prompt loader
        system_prompt = prompt_loader.get_system_prompt("grading", exam_type, "writing")
        user_prompt = prompt_loader.get_grading_prompt(
            exam_type=exam_type,
            skill="writing",
            question=question,
            answer=answer,
            criteria=criteria
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(f"Grading writing answer for {exam_type}")
        
        response = await self.generate_completion(messages, temperature=0.3)
        
        # Parse grading result
        result = self._parse_grading_result(response)
        
        return result

    async def grade_speaking_answer(
        self,
        question: str,
        transcript: str,
        exam_type: str = "IELTS",
        criteria: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Chấm bài Speaking tự động (từ transcript)
        
        Args:
            question: Câu hỏi Speaking
            transcript: Transcript của câu trả lời
            exam_type: Loại đề thi
            criteria: Tiêu chí chấm điểm
            
        Returns:
            Grading result with score and feedback
        """
        # Get system and user prompts from prompt loader
        system_prompt = prompt_loader.get_system_prompt("grading", exam_type, "speaking")
        user_prompt = prompt_loader.get_grading_prompt(
            exam_type=exam_type,
            skill="speaking",
            question=question,
            answer=transcript,
            criteria=criteria
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(f"Grading speaking answer for {exam_type}")
        
        response = await self.generate_completion(messages, temperature=0.3)
        
        result = self._parse_grading_result(response)
        
        return result

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def transcribe_audio(
        self,
        audio_file_path: str,
        language: str = "en",
    ) -> str:
        """
        Transcribe audio file to text using OpenAI Whisper API
        
        Args:
            audio_file_path: Path to audio file (local file path or URL)
            language: Language code (e.g., 'en' for English)
            
        Returns:
            Transcribed text
        """
        try:
            logger.info(f"Transcribing audio file: {audio_file_path}")
            
            # Open audio file
            with open(audio_file_path, "rb") as audio_file:
                # Use Whisper API for transcription
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="text"
                )
            
            logger.info(f"Transcription successful. Length: {len(transcript)} characters")
            return transcript
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            raise

    async def provide_feedback(
        self,
        question: str,
        user_answer: str,
        correct_answer: str,
        skill: str,
    ) -> str:
        """
        Cung cấp feedback chi tiết cho câu trả lời
        
        Args:
            question: Câu hỏi
            user_answer: Câu trả lời của học sinh
            correct_answer: Đáp án đúng
            skill: Kỹ năng
            
        Returns:
            Detailed feedback
        """
        # Get feedback prompt from prompt loader
        user_prompt = prompt_loader.get_feedback_prompt(
            question=question,
            user_answer=user_answer,
            correct_answer=correct_answer,
            skill=skill
        )

        messages = [
            {
                "role": "system",
                "content": "You are a supportive English teacher providing helpful feedback to students.",
            },
            {"role": "user", "content": user_prompt},
        ]

        feedback = await self.generate_completion(messages)
        
        return feedback

    def _parse_generated_questions(
        self, response: str, skill: str
    ) -> List[Dict[str, Any]]:
        """Parse ChatGPT response into structured questions"""
        import json
        import re
        
        try:
            # Remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```"):
                # Remove ```json or ``` at start and ``` at end
                response = re.sub(r'^```(?:json)?\s*\n?', '', response)
                response = re.sub(r'\n?```\s*$', '', response)
                response = response.strip()
            
            # Check if response is an object (IELTS special formats)
            if response.startswith("{"):
                # Try to parse as object first
                obj_start = response.find("{")
                obj_end = response.rfind("}") + 1
                
                if obj_start != -1 and obj_end > obj_start:
                    json_str = response[obj_start:obj_end]
                    data = json.loads(json_str)
                    
                    # IELTS Reading format: passage + question_groups
                    if "passage" in data and "question_groups" in data:
                        passage_info = data["passage"]
                        question_groups = data["question_groups"]
                        
                        # Return structure với passage và groups
                        return {
                            "passage": passage_info,
                            "question_groups": question_groups
                        }
                    
                    # Fallback: old format passage + questions (không có groups)
                    elif "passage" in data and "questions" in data:
                        passage_info = data["passage"]
                        questions = data["questions"]
                        
                        for q in questions:
                            if "metadata" not in q:
                                q["metadata"] = {}
                            q["metadata"]["passage"] = {
                                "title": passage_info.get("title", ""),
                                "introduction": passage_info.get("introduction", ""),
                                "content": passage_info.get("content", ""),
                                "word_count": passage_info.get("word_count", 0)
                            }
                        
                        return questions
                    
                    # IELTS Listening format: parts with audio scripts and test_title
                    elif "parts" in data and skill.lower() == "listening":
                        # Return the complete structure with parts - DON'T flatten!
                        return {
                            "test_title": data.get("test_title", "LISTENING TEST"),
                            "parts": data["parts"]
                        }
                    
                    # IELTS Writing format: NEW format with question_groups (preferred)
                    elif "question_groups" in data and skill.lower() == "writing":
                        # Return the new format directly - it's already structured correctly
                        return {
                            "question_groups": data["question_groups"]
                        }
                    
                    # IELTS Writing format: OLD format with tasks (backward compatibility)
                    elif "tasks" in data and skill.lower() == "writing":
                        questions = []
                        for task in data["tasks"]:
                            questions.append({
                                "question_number": task.get("task_number"),
                                "question_type": "essay" if task.get("task_number") == 2 else "chart_description",
                                "content": task.get("prompt", ""),
                                "correct_answer": "",  # No correct answer for writing
                                "explanation": task.get("sample_answer", ""),
                                "points": 0,
                                "metadata": {
                                    "time": task.get("time", ""),
                                    "instruction": task.get("instruction", ""),
                                    "word_count": task.get("word_count", 0),
                                     "chart_description": task.get("chart_description", "")
                                }
                            })
                        return questions
                    
                    # IELTS Speaking format: parts with questions
                    elif "parts" in data and skill.lower() == "speaking":
                        questions = []
                        q_num = 1
                        for part in data["parts"]:
                            if part.get("part_number") == 2:
                                # Part 2: Cue card
                                cue_card = part.get("cue_card", {})
                                questions.append({
                                    "question_number": q_num,
                                    "question_type": "cue_card",
                                    "content": cue_card.get("topic", ""),
                                    "correct_answer": "",
                                    "explanation": "",
                                    "points": 0,
                                    "metadata": {
                                        "part": part.get("part_number"),
                                        "title": part.get("title", ""),
                                        "duration": part.get("duration", ""),
                                        "instruction": part.get("instruction", ""),
                                        "points": cue_card.get("points", [])
                                    }
                                })
                                q_num += 1
                            else:
                                # Part 1 and 3: Questions
                                for q_text in part.get("questions", []):
                                    questions.append({
                                        "question_number": q_num,
                                        "question_type": "spoken_question",
                                        "content": q_text,
                                        "correct_answer": "",
                                        "explanation": "",
                                        "points": 0,
                                        "metadata": {
                                            "part": part.get("part_number"),
                                            "title": part.get("title", ""),
                                            "duration": part.get("duration", "")
                                        }
                                    })
                                    q_num += 1
                        return questions
            
            # Try to extract JSON array from response
            start_idx = response.find("[")
            end_idx = response.rfind("]") + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                questions = json.loads(json_str)
                return questions
            else:
                logger.warning("Could not find JSON in response, returning raw format")
                return [{"content": response, "metadata": {"skill": skill}}]
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {str(e)}")
            return [{"content": response, "metadata": {"skill": skill, "parse_error": True}}]

    def _parse_grading_result(self, response: str) -> Dict[str, Any]:
        """Parse grading result from ChatGPT response"""
        import json
        
        try:
            # Try to extract JSON from response
            start_idx = response.find("{")
            end_idx = response.rfind("}") + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                result = json.loads(json_str)
                return result
            else:
                # Fallback: return raw response
                return {
                    "overall_score": 0,
                    "detailed_feedback": response,
                    "parse_error": True,
                }
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse grading result: {str(e)}")
            return {
                "overall_score": 0,
                "detailed_feedback": response,
                "parse_error": True,
            }

    async def generate_audio_from_text(
        self,
        text: str,
        voice: str = "alloy",  # alloy, echo, fable, onyx, nova, shimmer
        output_path: Optional[str] = None
    ) -> bytes:
        """
        Generate audio from text using OpenAI TTS
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            output_path: Optional path to save audio file
            
        Returns:
            Audio data as bytes (MP3 format)
        """
        try:
            logger.info(f"Generating audio with voice '{voice}', text length: {len(text)}")
            
            # Call OpenAI TTS API
            response = await self.client.audio.speech.create(
                model="tts-1",  # or "tts-1-hd" for higher quality
                voice=voice,
                input=text
            )
            
            # Get audio bytes
            audio_data = response.content
            
            # Save to file if path provided
            if output_path:
                with open(output_path, "wb") as f:
                    f.write(audio_data)
                logger.info(f"Audio saved to {output_path}")
            
            return audio_data
            
        except Exception as e:
            logger.error(f"Error generating audio: {str(e)}")
            raise

    async def generate_listening_audio(
        self,
        parts: List[Dict[str, Any]],
        output_dir: str = "uploads/audio"
    ) -> List[Dict[str, Any]]:
        """
        Generate audio files for all parts in a Listening test
        
        Args:
            parts: List of part objects with audio_script
            output_dir: Directory to save audio files
            
        Returns:
            Updated parts with audio_url field
        """
        import os
        
        # Create output directory if not exists
        os.makedirs(output_dir, exist_ok=True)
        
        updated_parts = []
        
        for part_idx, part in enumerate(parts, 1):
            audio_script = part.get("audio_script", "")
            
            if not audio_script:
                logger.warning(f"Part {part_idx} has no audio_script, skipping")
                updated_parts.append(part)
                continue
            
            # Generate filename
            filename = f"listening_part_{part_idx}_{part.get('part_number', part_idx)}.mp3"
            file_path = os.path.join(output_dir, filename)
            
            try:
                # Generate audio
                logger.info(f"Generating audio for Part {part_idx}...")
                await self.generate_audio_from_text(
                    text=audio_script,
                    voice="alloy",  # Professional voice
                    output_path=file_path
                )
                
                # Add audio URL to part
                part_with_audio = {**part}
                part_with_audio["audio_url"] = f"/uploads/audio/{filename}"
                part_with_audio["audio_file"] = filename
                
                updated_parts.append(part_with_audio)
                logger.info(f"✅ Generated audio for Part {part_idx}: {filename}")
                
            except Exception as e:
                logger.error(f"Failed to generate audio for Part {part_idx}: {str(e)}")
                # Keep part without audio
                updated_parts.append(part)
        
        return updated_parts


# Singleton instance
chatgpt_service = ChatGPTService()
