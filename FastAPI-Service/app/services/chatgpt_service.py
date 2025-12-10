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
        
        # Special handling for IELTS Reading - tạo passage hoàn chỉnh
        if exam_type.upper() == "IELTS" and skill.lower() == "reading":
            # Build question types instruction
            question_types_instruction = ""
            if question_types and len(question_types) > 0:
                question_types_instruction = f"\n- Required question types: {', '.join(question_types)}"
                question_types_instruction += "\n- Distribute questions across these types appropriately"
            else:
                question_types_instruction = "\n- Use common IELTS Reading question types: True/False/Not Given, Short Answer, Multiple Choice, Matching, etc."
            
            prompt = f"""
You are creating an IELTS Academic Reading test. Generate a complete reading passage with {num_questions} questions about: {topic}

**PASSAGE REQUIREMENTS:**
- Length: {"500-700 words" if num_questions > 30 else "700-900 words"} (adjust for question volume)
- Difficulty: {difficulty}
- Style: Academic, formal, factual (like scientific articles, historical texts, or research papers)
- Structure: Multiple well-organized paragraphs with clear topic sentences
- Include specific facts, names, dates, and details that can be tested
- Keep passage concise but information-rich to support all questions

**QUESTION REQUIREMENTS:**
- **CRITICAL: You MUST generate EXACTLY {num_questions} questions in total**
- Question numbering: 1, 2, 3, ... up to {num_questions} (sequential, no gaps){question_types_instruction}
- Group questions by type (typically 2-3 groups per passage)
- Each group must contain the actual number of questions matching its range
  * Example: "Questions 1-15" must have 15 actual question objects (question_number 1 to 15)
  * Example: "Questions 16-30" must have 15 actual question objects (question_number 16 to 30)
- Provide appropriate instructions for each question type

**QUESTION TYPE INSTRUCTIONS (use these as templates):**

For MULTIPLE CHOICE:
- group_name: "Questions X-Y" (adjust range based on actual questions)
- question_type: "multiple_choice"
- instruction: "Choose the correct letter, A, B, C or D.\\n\\nWrite the correct letter in boxes X-Y on your answer sheet."
- Each question must have "answers": array of 4 answer objects
- Each answer object structure:
  {{
    "answer_content": "The answer text",
    "is_correct": true,  // only ONE answer should be true
    "feedback": "Brief explanation why this is correct/incorrect"
  }}
- correct_answer: The text of the correct answer (for quick reference)

For SHORT TEXT (Short Answer):
- group_name: "Questions X-Y"
- question_type: "short_text"
- instruction: "Answer the questions below.\\n\\nChoose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.\\n\\nWrite your answers in boxes X-Y on your answer sheet."
- correct_answer: Must be exact words from the passage (max 2-3 words)

For YES/NO/NOT GIVEN:
- group_name: "Questions X-Y"
- question_type: "yes_no_not_given"
- instruction: "Do the following statements agree with the views/claims of the writer?\\n\\nIn boxes X-Y on your answer sheet, write\\n\\nYES if the statement agrees with the views of the writer\\nNO if the statement contradicts the views of the writer\\nNOT GIVEN if it is impossible to say what the writer thinks about this"
- correct_answer: Must be exactly "YES", "NO", or "NOT GIVEN"

For TRUE/FALSE/NOT GIVEN:
- group_name: "Questions X-Y"
- question_type: "true_false_not_given"
- instruction: "Do the following statements agree with the information given in Reading Passage 1?\\n\\nIn boxes X-Y on your answer sheet, write\\n\\nTRUE if the statement agrees with the information\\nFALSE if it contradicts the information\\nNOT GIVEN if there is no information on this"
- correct_answer: Must be exactly "TRUE", "FALSE", or "NOT GIVEN"

**OUTPUT FORMAT (JSON):**
Return ONLY a valid JSON object with this EXACT structure:

{{
  "passage": {{
    "title": "Engaging Title Related to {topic}",
    "introduction": "You should spend about 20 minutes on Questions 1-{num_questions}, which are based on Reading Passage 1 below.\\n\\n[Add subtitle or brief description if needed]",
    "content": "[Full passage text here, 700-900 words, multiple paragraphs...]",
    "topic": "{topic}",
    "word_count": 850
  }},
  "question_groups": [
    {{
      "group_name": "Questions 1-X",
      "question_type": "[one of the types above]",
      "instruction": "[appropriate instruction for this question type - use templates above]",
      "questions": [
        {{
          "question_number": 1,
          "content": "[Question content]",
          "answers": [  // ONLY for multiple_choice
            {{
              "answer_content": "First option text",
              "is_correct": false,
              "feedback": "Why this is incorrect"
            }},
            {{
              "answer_content": "Correct option text",
              "is_correct": true,
              "feedback": "Why this is correct"
            }},
            {{
              "answer_content": "Third option text",
              "is_correct": false,
              "feedback": "Why this is incorrect"
            }},
            {{
              "answer_content": "Fourth option text",
              "is_correct": false,
              "feedback": "Why this is incorrect"
            }}
          ],
          "correct_answer": "Correct option text",
          "explanation": "[Brief explanation]",
          "points": 1.0
        }}
      ]
    }},
    {{
      "group_name": "Questions Y-{num_questions}",
      "question_type": "[another type]",
      "instruction": "[appropriate instruction]",
      "questions": [...]
    }}
  ]
}}

**CRITICAL RULES:**
1. **YOU MUST GENERATE EXACTLY {num_questions} QUESTION OBJECTS** - This is the most important requirement
2. Question numbering must be sequential from 1 to {num_questions} with NO gaps
3. Each group's "questions" array must contain the full number of questions matching the group_name range
   - If group_name is "Questions 1-15", the array must have 15 question objects
   - If group_name is "Questions 16-30", the array must have 15 question objects
   - DO NOT just create 2-3 sample questions per group
4. group_name must reflect actual question range (e.g., if group has questions 1-15, use "Questions 1-15")
5. Instructions must match the question_type and include correct box numbers
6. TRUE/FALSE/NOT GIVEN: Base on passage information only
   - TRUE: Clearly stated in passage
   - FALSE: Contradicts passage information
   - NOT GIVEN: Not mentioned or cannot be determined from passage
7. Short Answer: Must use EXACT words from passage
8. Multiple Choice: Must include "answers" array with 4 answer objects, each with answer_content, is_correct, and feedback
9. Multiple Choice: Exactly ONE answer must have is_correct: true
10. All questions must be answerable from the passage
11. Return ONLY valid JSON, no markdown formatting

**EXAMPLE for {num_questions} questions:**
If user requests 50 questions with 4 types, you might split as:
- Group 1: "Questions 1-15" (multiple_choice) → 15 question objects
- Group 2: "Questions 16-30" (true_false_not_given) → 15 question objects  
- Group 3: "Questions 31-45" (short_text) → 15 question objects
- Group 4: "Questions 46-50" (yes_no_not_given) → 5 question objects
Total: 50 questions

**IMPORTANT NOTES FOR LARGE QUESTION SETS:**
- For large question sets (>30 questions), keep each question concise but clear
- Explanations should be VERY BRIEF (5-10 words maximum) - just key facts
- For multiple_choice: Keep answer_content short (max 5-7 words per option)
- For multiple_choice: feedback can be just 3-5 words (e.g., "Stated in paragraph 2")
- Passage content can be shorter if needed to fit all questions
- PRIORITY: Generate the EXACT number of question objects ({num_questions} total)
- You MUST complete this task - it's critical to have all {num_questions} questions

**GENERATE ALL {num_questions} QUESTIONS NOW - Be concise but complete!**
"""
        elif exam_type.upper() == "IELTS" and skill.lower() == "listening":
            prompt = f"""
Generate a complete IELTS Listening test with {num_questions} questions on the topic: {topic}

Requirements:
- Difficulty level: {difficulty}
- Create 1 or more parts (Part 1, 2, 3, 4) depending on num_questions
- Include audio script/transcript for each part
- Question types: form completion, multiple choice, matching, labeling, etc.
- Follow official IELTS Listening format

Format your response as a JSON object:
{{
  "parts": [
    {{
      "part_number": 1,
      "title": "Part 1",
      "context": "A conversation between...",
      "audio_script": "Full transcript of the audio...",
      "instruction": "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      "questions": [
        {{
          "question_number": 1,
          "question_type": "form_completion",
          "content": "Name: _______",
          "correct_answer": "answer",
          "points": 1.0
        }}
      ]
    }}
  ]
}}

Make it realistic and follow IELTS Listening standards.
"""
        elif exam_type.upper() == "IELTS" and skill.lower() == "writing":
            prompt = f"""
Generate IELTS Writing test on topic: {topic}

CRITICAL Requirements:
- Generate exactly 2 tasks following official IELTS Writing format
- Task 1: Academic Task 1 with DATA TABLE (not image) - 150 words minimum, 20 minutes
- Task 2: Essay on given topic - 250 words minimum, 40 minutes
- Use authentic IELTS language and instructions
- Ensure the topic '{topic}' is incorporated into Task 2

IMPORTANT for Task 1:
- Create REAL DATA TABLES using text format (not images)
- Use realistic statistics and numbers
- Tables should be clear and well-formatted
- Include 1-3 tables with related data

Format your response as a JSON object with this EXACT structure:
{{
  "question_groups": [
    {{
      "group_name": "WRITING TASK 1",
      "question_type": "essay",
      "instruction": "You should spend about 20 minutes on this task.",
      "questions": [
        {{
          "content": "The table(s) below show [description of data].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words.",
          "question_type": "essay",
          "correct_answer": "",
          "explanation": "Task 1 requires describing visual information from tables. Focus on: overview, key features, comparisons, trends. Use formal academic language.",
          "points": 1,
          "chart_data": "\\n\\n[Table Title]\\nYear | Category | Value\\n1990 | Category A | 100\\n2000 | Category A | 150\\n2010 | Category A | 200\\n\\n[Second Table if needed]\\nRegion | Population | Percentage\\nNorth | 5,000,000 | 45%\\nSouth | 6,000,000 | 55%",
          "word_count": 150,
          "time_minutes": 20
        }}
      ]
    }},
    {{
      "group_name": "WRITING TASK 2",
      "question_type": "essay",
      "instruction": "You should spend about 40 minutes on this task.",
      "questions": [
        {{
          "content": "Write about the following topic:\\n\\n[Essay question related to {topic}]\\n\\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\\n\\nWrite at least 250 words.",
          "question_type": "essay",
          "correct_answer": "",
          "explanation": "Task 2 is an essay requiring a clear position, well-developed arguments with examples, and logical structure. Band 7+ requires: clear position, coherent paragraphs, range of vocabulary and grammar, relevant examples.",
          "points": 2,
          "word_count": 250,
          "time_minutes": 40
        }}
      ]
    }}
  ]
}}

EXAMPLE of Task 1 with data tables (Use THIS format):
{{
  "content": "The tables below show changes in population statistics.\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words.",
  "chart_data": "\\n\\nTotal Population\\nYear | Population\\n1990 | 5,000,000\\n2000 | 7,500,000\\n2010 | 10,000,000\\n\\n\\nAge Distribution\\nAge Group | 1990 (%) | 2010 (%)\\n0-18 | 30% | 25%\\n19-64 | 60% | 65%\\n65+ | 10% | 10%"
}}

Example topics for Task 2:
- Opinion essay: "To what extent do you agree or disagree?"
- Discussion: "Discuss both views and give your opinion"
- Problem-solution: "What are the causes and solutions?"
- Two-part question: "Why is this the case? Is this positive or negative?"

REMEMBER:
- Task 1 MUST include "chart_data" field with REAL TABLE DATA (text format)
- Use realistic numbers and statistics
- Make tables clear and easy to read
- Relate to topic '{topic}' where possible

Make the questions realistic, relevant to {topic}, and following official IELTS standards.
"""
        elif exam_type.upper() == "IELTS" and skill.lower() == "speaking":
            prompt = f"""
Generate IELTS Speaking test on topic: {topic}

CRITICAL Requirements:
- Generate exactly 3 parts following official IELTS Speaking format
- Part 1: Introduction and Interview - 4-5 personal questions (4-5 minutes)
- Part 2: Long Turn with cue card - 1 topic with 4 bullet points (3-4 minutes)
- Part 3: Discussion - 4-6 abstract questions (4-5 minutes)
- Use authentic IELTS language and relate to topic '{topic}'

Format your response as a JSON object with this EXACT structure:
{{
  "question_groups": [
    {{
      "group_name": "PART 1",
      "question_type": "spoken_question",
      "instruction": "The examiner asks you about yourself, your home, work or studies and other familiar topics.",
      "questions": [
        {{
          "content": "How much [activity] do you do in your daily life?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "Part 1 questions are personal and about familiar topics. Keep answers short (20-30 seconds).",
          "points": 1,
          "metadata": {{"part": 1, "duration": "4-5 minutes"}}
        }},
        {{
          "content": "Did you [activity] more when you were younger?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 1}}
        }},
        {{
          "content": "What places are there to [activity] near where you live?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 1}}
        }},
        {{
          "content": "Do you think [topic-related question]?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 1}}
        }}
      ]
    }},
    {{
      "group_name": "PART 2",
      "question_type": "cue_card",
      "instruction": "You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.",
      "questions": [
        {{
          "content": "Describe [a person/place/event/experience related to {topic}].\\n\\nYou should say:\\n• what [first point]\\n• who/where/when [second point]\\n• what [third point]\\n• and explain why [fourth point]",
          "question_type": "cue_card",
          "correct_answer": "",
          "explanation": "Part 2 requires a 1-2 minute monologue. Use the 4 bullet points to structure your talk. Include details, examples, and personal experiences.",
          "points": 2,
          "metadata": {{
            "part": 2,
            "duration": "3-4 minutes",
            "prep_time": "1 minute",
            "talk_time": "1-2 minutes"
          }}
        }}
      ]
    }},
    {{
      "group_name": "PART 3",
      "question_type": "spoken_question",
      "instruction": "The examiner asks more abstract questions related to the Part 2 topic.",
      "questions": [
        {{
          "content": "What are the most popular [topic-related] in your country?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "Part 3 questions are more abstract and require longer, more developed answers with opinions and examples.",
          "points": 1,
          "metadata": {{"part": 3, "duration": "4-5 minutes"}}
        }},
        {{
          "content": "How [topic-related comparison question]?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 3}}
        }},
        {{
          "content": "Do you think [future/opinion question about {topic}]?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 3}}
        }},
        {{
          "content": "What [advantages/disadvantages/qualities] related to {topic}?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 3}}
        }},
        {{
          "content": "Can you think of [hypothetical/complex question]?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "",
          "points": 1,
          "metadata": {{"part": 3}}
        }}
      ]
    }}
  ]
}}

EXAMPLE for topic "Theatre and Entertainment":
Part 1: Personal questions about entertainment habits
Part 2: "Describe a play or film you saw that you'd like to see again with friends"
Part 3: Abstract questions about theatre industry, actors, audience trends

Make the questions realistic, relevant to {topic}, natural, and following official IELTS Speaking standards.
"""
        else:
            # Original prompt for other skills/exams
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
                    
                    # IELTS Listening format: parts with audio scripts
                    elif "parts" in data and skill.lower() == "listening":
                        all_questions = []
                        for part in data["parts"]:
                            part_questions = part.get("questions", [])
                            for q in part_questions:
                                if "metadata" not in q:
                                    q["metadata"] = {}
                                q["metadata"]["part"] = {
                                    "part_number": part.get("part_number"),
                                    "title": part.get("title", ""),
                                    "context": part.get("context", ""),
                                    "audio_script": part.get("audio_script", ""),
                                    "instruction": part.get("instruction", "")
                                }
                                all_questions.append(q)
                        return all_questions
                    
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


# Singleton instance
chatgpt_service = ChatGPTService()
