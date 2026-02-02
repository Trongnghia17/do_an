"""
IELTS Reading Question Generation Prompts
"""

def get_reading_system_prompt():
    """System prompt for IELTS Reading generation"""
    return "You are an expert English teacher and exam creator specializing in creating high-quality exam questions for IELTS, TOEIC, and other English proficiency tests."


def get_reading_generation_prompt(topic: str, difficulty: str, num_questions: int, question_types: list = None):
    """
    Generate IELTS Reading prompt with passage and questions
    
    Args:
        topic: Topic for the reading passage
        difficulty: easy, medium, hard
        num_questions: Number of questions to generate
        question_types: List of question types to use
    """
    
    # Build question types instruction
    question_types_instruction = ""
    if question_types and len(question_types) > 0:
        question_types_instruction = f"\n- Required question types: {', '.join(question_types)}"
        question_types_instruction += "\n- Distribute questions across these types appropriately"
    else:
        question_types_instruction = "\n- Use common IELTS Reading question types: True/False/Not Given, Short Answer, Multiple Choice, Matching, etc."
    
    return f"""
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
