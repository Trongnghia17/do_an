from openai import AsyncOpenAI
from typing import List, Dict, Any, Optional
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


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
            logger.error(f"ChatGPT API error: {str(e)}")
            raise

    async def generate_exam_questions(
        self,
        exam_type: str,
        skill: str,
        topic: str,
        difficulty: str,
        num_questions: int = 5,
        question_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Sinh câu hỏi thi tự động
        
        Args:
            exam_type: Loại đề (IELTS, TOEIC, etc.)
            skill: Kỹ năng (Listening, Reading, Writing, Speaking)
            topic: Chủ đề
            difficulty: Độ khó (easy, medium, hard)
            num_questions: Số lượng câu hỏi
            question_types: Loại câu hỏi
            
        Returns:
            List of generated questions
        """
        prompt = self._build_question_generation_prompt(
            exam_type, skill, topic, difficulty, num_questions, question_types
        )

        messages = [
            {
                "role": "system",
                "content": "You are an expert English teacher and exam creator specializing in creating high-quality exam questions for IELTS, TOEIC, and other English proficiency tests.",
            },
            {"role": "user", "content": prompt},
        ]

        logger.info(
            f"Generating {num_questions} questions for {exam_type} - {skill} - {topic}"
        )
        
        response = await self.generate_completion(messages)
        
        # Parse response to structured format
        questions = self._parse_generated_questions(response, skill)
        
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
        prompt = self._build_writing_grading_prompt(
            question, answer, exam_type, criteria
        )

        messages = [
            {
                "role": "system",
                "content": f"You are an experienced {exam_type} examiner specializing in grading Writing tasks. Provide detailed, constructive feedback.",
            },
            {"role": "user", "content": prompt},
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
        prompt = self._build_speaking_grading_prompt(
            question, transcript, exam_type, criteria
        )

        messages = [
            {
                "role": "system",
                "content": f"You are an experienced {exam_type} examiner specializing in grading Speaking tasks. Evaluate fluency, vocabulary, grammar, and pronunciation.",
            },
            {"role": "user", "content": prompt},
        ]

        logger.info(f"Grading speaking answer for {exam_type}")
        
        response = await self.generate_completion(messages, temperature=0.3)
        
        result = self._parse_grading_result(response)
        
        return result

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
        prompt = f"""
Question: {question}

Student's Answer: {user_answer}

Correct Answer: {correct_answer}

Skill: {skill}

Please provide detailed, constructive feedback explaining:
1. Why the answer is correct or incorrect
2. What the student did well
3. Areas for improvement
4. Tips for similar questions in the future

Keep the feedback encouraging and educational.
"""

        messages = [
            {
                "role": "system",
                "content": "You are a supportive English teacher providing helpful feedback to students.",
            },
            {"role": "user", "content": prompt},
        ]

        feedback = await self.generate_completion(messages)
        
        return feedback

    def _build_question_generation_prompt(
        self,
        exam_type: str,
        skill: str,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_types: Optional[List[str]],
    ) -> str:
        """Build prompt for question generation"""
        
        types_str = ", ".join(question_types) if question_types else "appropriate types"
        
        prompt = f"""
Generate {num_questions} high-quality {exam_type} {skill} questions on the topic: {topic}

Requirements:
- Difficulty level: {difficulty}
- Question types: {types_str}
- Follow {exam_type} exam format and standards
- Include clear instructions
- For multiple choice: provide 4 options with one correct answer
- For fill-in-the-blank: provide the correct answer
- For essay/speaking: provide clear task description and evaluation criteria

Format your response as a JSON array with the following structure for each question:
[
  {{
    "question_number": 1,
    "question_type": "multiple_choice|fill_blank|essay|short_answer",
    "content": "Question text",
    "options": ["A", "B", "C", "D"],  // for multiple choice only
    "correct_answer": "B",  // or the correct text
    "explanation": "Why this is the correct answer",
    "points": 1.0,
    "metadata": {{
      "topic": "{topic}",
      "difficulty": "{difficulty}",
      "estimated_time": "2 minutes"
    }}
  }}
]

Make sure questions are realistic, relevant, and properly assess English proficiency.
"""
        return prompt

    def _build_writing_grading_prompt(
        self,
        question: str,
        answer: str,
        exam_type: str,
        criteria: Optional[Dict[str, Any]],
    ) -> str:
        """Build prompt for writing grading"""
        
        if exam_type == "IELTS":
            criteria_text = """
IELTS Writing Band Descriptors:
- Task Achievement (25%): How well the task requirements are fulfilled
- Coherence and Cohesion (25%): Organization and linking of ideas
- Lexical Resource (25%): Vocabulary range and accuracy
- Grammatical Range and Accuracy (25%): Grammar structures and accuracy

Provide a band score (0-9) and detailed feedback for each criterion.
"""
        else:
            criteria_text = criteria.get("description", "Standard writing assessment criteria") if criteria else ""

        prompt = f"""
Grade the following {exam_type} Writing task:

Question/Task:
{question}

Student's Answer:
{answer}

{criteria_text}

Provide your grading in the following JSON format:
{{
  "overall_score": 7.0,
  "criteria_scores": {{
    "task_achievement": 7.0,
    "coherence_cohesion": 7.5,
    "lexical_resource": 6.5,
    "grammatical_accuracy": 7.0
  }},
  "strengths": ["List of strengths"],
  "weaknesses": ["List of areas for improvement"],
  "detailed_feedback": "Comprehensive feedback paragraph",
  "suggestions": ["Specific suggestions for improvement"]
}}

Be fair, constructive, and follow {exam_type} grading standards precisely.
"""
        return prompt

    def _build_speaking_grading_prompt(
        self,
        question: str,
        transcript: str,
        exam_type: str,
        criteria: Optional[Dict[str, Any]],
    ) -> str:
        """Build prompt for speaking grading"""
        
        if exam_type == "IELTS":
            criteria_text = """
IELTS Speaking Band Descriptors:
- Fluency and Coherence (25%)
- Lexical Resource (25%)
- Grammatical Range and Accuracy (25%)
- Pronunciation (25%)

Provide a band score (0-9) and detailed feedback for each criterion.
"""
        else:
            criteria_text = criteria.get("description", "Standard speaking assessment criteria") if criteria else ""

        prompt = f"""
Grade the following {exam_type} Speaking response (from transcript):

Question:
{question}

Student's Response (Transcript):
{transcript}

{criteria_text}

Provide your grading in the following JSON format:
{{
  "overall_score": 7.0,
  "criteria_scores": {{
    "fluency_coherence": 7.0,
    "lexical_resource": 7.5,
    "grammatical_accuracy": 6.5,
    "pronunciation": 7.0
  }},
  "strengths": ["List of strengths"],
  "weaknesses": ["List of areas for improvement"],
  "detailed_feedback": "Comprehensive feedback paragraph",
  "suggestions": ["Specific suggestions for improvement"]
}}

Note: Pronunciation is assessed based on grammatical structure and word choice in the transcript.
Be fair and constructive.
"""
        return prompt

    def _parse_generated_questions(
        self, response: str, skill: str
    ) -> List[Dict[str, Any]]:
        """Parse ChatGPT response into structured questions"""
        import json
        
        try:
            # Try to extract JSON from response
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


# Singleton instance
chatgpt_service = ChatGPTService()
