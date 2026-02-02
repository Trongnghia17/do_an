"""
Prompt Loader - Central manager for all AI prompts
Organizes prompts by type (generation, grading) and skill (reading, listening, writing, speaking)
"""

from typing import Optional, List, Dict, Any
from .generation import ielts_reading, ielts_listening, ielts_writing, ielts_speaking
from .grading import ielts_writing_grading, ielts_speaking_grading


class PromptLoader:
    """
    Central manager for loading and managing AI prompts
    
    Usage:
        loader = PromptLoader()
        
        # Get system prompt
        system_prompt = loader.get_system_prompt("generation", "IELTS", "reading")
        
        # Get generation prompt
        prompt = loader.get_generation_prompt(
            exam_type="IELTS",
            skill="reading",
            topic="Climate Change",
            difficulty="medium",
            num_questions=40
        )
        
        # Get grading prompt
        grading_prompt = loader.get_grading_prompt(
            exam_type="IELTS",
            skill="writing",
            question="...",
            answer="..."
        )
    """
    
    def __init__(self):
        """Initialize prompt loader"""
        self._generation_modules = {
            "IELTS": {
                "reading": ielts_reading,
                "listening": ielts_listening,
                "writing": ielts_writing,
                "speaking": ielts_speaking
            }
        }
        
        self._grading_modules = {
            "IELTS": {
                "writing": ielts_writing_grading,
                "speaking": ielts_speaking_grading
            }
        }
    
    def get_system_prompt(self, prompt_type: str, exam_type: str, skill: str) -> str:
        """
        Get system prompt for AI
        
        Args:
            prompt_type: "generation" or "grading"
            exam_type: "IELTS", "TOEIC", etc.
            skill: "reading", "listening", "writing", "speaking"
        
        Returns:
            System prompt string
        """
        exam_type = exam_type.upper()
        skill = skill.lower()
        
        if prompt_type == "generation":
            modules = self._generation_modules.get(exam_type, {})
            module = modules.get(skill)
            
            if module and hasattr(module, f"get_{skill}_system_prompt"):
                return getattr(module, f"get_{skill}_system_prompt")()
        
        elif prompt_type == "grading":
            modules = self._grading_modules.get(exam_type, {})
            module = modules.get(skill)
            
            if module and hasattr(module, f"get_{skill}_grading_system_prompt"):
                return getattr(module, f"get_{skill}_grading_system_prompt")(exam_type)
        
        # Default system prompt
        return f"You are an expert English teacher and exam creator specializing in {exam_type} {skill} tests."
    
    def get_generation_prompt(
        self,
        exam_type: str,
        skill: str,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_types: Optional[List[str]] = None,
        part_number: Optional[int] = None
    ) -> str:
        """
        Get question generation prompt
        
        Args:
            exam_type: Type of exam (IELTS, TOEIC, etc.)
            skill: Skill to test (reading, listening, writing, speaking)
            topic: Topic for questions
            difficulty: Difficulty level (easy, medium, hard)
            num_questions: Number of questions to generate
            question_types: Optional list of specific question types
            part_number: Optional part number (for listening)
        
        Returns:
            Generation prompt string
        """
        exam_type = exam_type.upper()
        skill = skill.lower()
        
        modules = self._generation_modules.get(exam_type, {})
        module = modules.get(skill)
        
        if not module:
            return self._get_default_generation_prompt(
                exam_type, skill, topic, difficulty, num_questions, question_types
            )
        
        # Get prompt based on skill
        if skill == "reading":
            return module.get_reading_generation_prompt(
                topic, difficulty, num_questions, question_types
            )
        
        elif skill == "listening":
            return module.get_listening_generation_prompt(
                topic, difficulty, num_questions, question_types, part_number
            )
        
        elif skill == "writing":
            return module.get_writing_generation_prompt(topic, difficulty)
        
        elif skill == "speaking":
            return module.get_speaking_generation_prompt(topic, difficulty)
        
        else:
            return self._get_default_generation_prompt(
                exam_type, skill, topic, difficulty, num_questions, question_types
            )
    
    def get_grading_prompt(
        self,
        exam_type: str,
        skill: str,
        question: str,
        answer: str,
        criteria: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Get grading prompt
        
        Args:
            exam_type: Type of exam
            skill: Skill being graded
            question: The question/task
            answer: Student's answer
            criteria: Optional grading criteria
        
        Returns:
            Grading prompt string
        """
        exam_type = exam_type.upper()
        skill = skill.lower()
        
        modules = self._grading_modules.get(exam_type, {})
        module = modules.get(skill)
        
        if not module:
            return self._get_default_grading_prompt(
                exam_type, skill, question, answer, criteria
            )
        
        # Get grading prompt based on skill
        if skill == "writing":
            return module.get_writing_grading_prompt(question, answer, exam_type)
        
        elif skill == "speaking":
            return module.get_speaking_grading_prompt(question, answer, exam_type)
        
        else:
            return self._get_default_grading_prompt(
                exam_type, skill, question, answer, criteria
            )
    
    def _get_default_generation_prompt(
        self,
        exam_type: str,
        skill: str,
        topic: str,
        difficulty: str,
        num_questions: int,
        question_types: Optional[List[str]]
    ) -> str:
        """Default generation prompt for unsupported exam types"""
        types_str = ", ".join(question_types) if question_types else "appropriate types"
        
        return f"""
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
    
    def _get_default_grading_prompt(
        self,
        exam_type: str,
        skill: str,
        question: str,
        answer: str,
        criteria: Optional[Dict[str, Any]]
    ) -> str:
        """Default grading prompt for unsupported exam types"""
        criteria_text = criteria.get("description", "Standard assessment criteria") if criteria else ""
        
        return f"""
Grade the following {exam_type} {skill} response.

Question:
{question}

Student's Answer:
{answer}

Assessment Criteria:
{criteria_text}

Provide your grading in JSON format:
{{
  "overall_score": 7.0,
  "detailed_feedback": "Detailed feedback here...",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}}

Be objective, fair, and constructive in your feedback.
"""
    
    def get_feedback_prompt(
        self,
        question: str,
        user_answer: str,
        correct_answer: str,
        skill: str
    ) -> str:
        """
        Get prompt for providing detailed feedback on answers
        
        Args:
            question: The question
            user_answer: Student's answer
            correct_answer: Correct answer
            skill: Skill being tested
        
        Returns:
            Feedback prompt string
        """
        return f"""
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


# Singleton instance
prompt_loader = PromptLoader()
