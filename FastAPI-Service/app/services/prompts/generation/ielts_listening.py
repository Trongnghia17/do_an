"""
IELTS Listening Question Generation Prompts
"""

def get_listening_system_prompt():
    """System prompt for IELTS Listening generation"""
    return "You are an expert English teacher and exam creator specializing in creating high-quality IELTS Listening tests."


def get_listening_part_contexts():
    """Get context descriptions for each IELTS Listening part"""
    return {
        1: "Social/everyday context - A conversation between two people (e.g., booking, shopping, registration, making arrangements)",
        2: "Monologue in social context - One person speaking (e.g., tour guide, facility information, describing a place or event)",
        3: "Academic discussion - A conversation between 2-4 people in educational setting (e.g., student-tutor, group project discussion)",
        4: "Academic lecture/talk - One person presenting (e.g., university lecture, academic presentation, conference talk)"
    }


def get_listening_question_type_instructions():
    """Get detailed instructions for each question type"""
    return {
        "multiple_choice": """**Multiple Choice**
   - question_type: "multiple_choice"
   - instruction: "Choose the correct letter, A, B or C."
   - content: Full question with A, B, C options
   - answers: Array of 3-4 answer objects with answer_content, is_correct, feedback
   - correct_answer: The correct option text
   - explanation: Detailed explanation (50-100 words) why this answer is correct and why other options are wrong
   - locate: Reference to the specific part of audio script where the answer is mentioned (e.g., "Speaker 1: 'The meeting is at 3pm'", "Line 15-17 of transcript")
   - Example: "What is the main reason for the delay?\\nA. Bad weather\\nB. Technical problems\\nC. Staff shortage\"""",
        
        "short_text": """**Short Text (Short Answer)**
   - question_type: "short_text"
   - instruction: "Answer the questions below.\\nWrite NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer."
   - content: Direct question
   - correct_answer: Brief answer from audio (1-3 words or number)
   - explanation: Detailed explanation (30-50 words) of why this answer is correct and how it's mentioned in the audio
   - locate: Reference to the specific part of audio script (e.g., "Receptionist says: 'The tour starts at 10 a.m.'")
   - Example: "What time does the tour start?" → Answer: "10 a.m." or "10:00\"""",
        
        "yes_no_not_given": """**Yes/No/Not Given**
   - question_type: "yes_no_not_given"
   - instruction: "Do the following statements agree with the views/claims of the speaker?\\n\\nWrite:\\nYES if the statement agrees with the speaker's views\\nNO if the statement contradicts the speaker's views\\nNOT GIVEN if it is impossible to say what the speaker thinks about this"
   - content: Statement to evaluate
   - correct_answer: Must be exactly "YES", "NO", or "NOT GIVEN"
   - explanation: Detailed explanation (50-80 words) explaining why this is YES/NO/NOT GIVEN based on speaker's views
   - locate: Reference to audio script where speaker expresses their view (or explain why it's NOT GIVEN)
   - Example: "The speaker believes technology improves education." → Answer: "YES\"""",
        
        "true_false_not_given": """**True/False/Not Given**
   - question_type: "true_false_not_given"
   - instruction: "Do the following statements agree with the information in the audio?\\n\\nWrite:\\nTRUE if the statement agrees with the information\\nFALSE if it contradicts the information\\nNOT GIVEN if there is no information on this"
   - content: Statement to evaluate
   - correct_answer: Must be exactly "TRUE", "FALSE", or "NOT GIVEN"
   - explanation: Detailed explanation (50-80 words) explaining why this is TRUE/FALSE/NOT GIVEN based on audio information
   - locate: Reference to audio script that proves the answer (or explain why it's NOT GIVEN)
   - Example: "The conference will last for two days." → Answer: "TRUE\""""
    }


def get_listening_generation_prompt(
    topic: str, 
    difficulty: str, 
    num_questions: int, 
    question_types: list = None,
    part_number: int = None
):
    """
    Generate IELTS Listening prompt
    
    Args:
        topic: Topic for listening test
        difficulty: easy, medium, hard
        num_questions: Number of questions
        question_types: List of question types
        part_number: Specific part to generate (1-4), None for all parts
    """
    
    # Default question types if not provided
    selected_types = question_types if question_types else [
        "multiple_choice", "short_text", "yes_no_not_given", "true_false_not_given"
    ]
    
    # Get instructions for selected types
    type_instructions = get_listening_question_type_instructions()
    types_text = "\n\n".join([
        f"{i+1}. {type_instructions[t]}" 
        for i, t in enumerate(selected_types) 
        if t in type_instructions
    ])
    
    # Calculate distribution
    num_types = len(selected_types)
    if num_types == 1:
        distribution_text = f"- Create ALL {num_questions} questions using: **{selected_types[0]}**"
    elif num_types == 2:
        q1 = num_questions // 2
        q2 = num_questions - q1
        distribution_text = f"- Distribute {num_questions} questions approximately:\n  * {q1} questions: **{selected_types[0]}**\n  * {q2} questions: **{selected_types[1]}**"
    elif num_types == 3:
        q1 = num_questions // 3
        q2 = num_questions // 3
        q3 = num_questions - q1 - q2
        distribution_text = f"- Distribute {num_questions} questions approximately:\n  * {q1} questions: **{selected_types[0]}**\n  * {q2} questions: **{selected_types[1]}**\n  * {q3} questions: **{selected_types[2]}**"
    else:
        per_type = num_questions // num_types
        distribution_text = f"- Distribute {num_questions} questions approximately evenly across {num_types} types (~{per_type} questions each)"
    
    # Build main prompt
    if part_number:
        # Single part generation
        part_contexts = get_listening_part_contexts()
        part_context = part_contexts.get(part_number, "General listening context")
        
        prompt = f"""
You are creating an authentic IELTS Listening test. Generate PART {part_number} ONLY with {num_questions} questions about: {topic}

**PART {part_number} CONTEXT:**
{part_context}

**Requirements for Part {part_number}:**
- Create exactly {num_questions} questions for this part only
- Question numbers: {(part_number-1)*10 + 1} to {(part_number-1)*10 + num_questions}
- Use authentic IELTS question types
- Create realistic audio script/transcript (300-500 words)
- Difficulty: {difficulty}
"""
    else:
        # All 4 parts generation
        prompt = f"""
You are creating an authentic IELTS Listening test. Generate a complete test with {num_questions} questions about: {topic}

**IMPORTANT: IELTS Listening Structure**
- Total: 40 questions across 4 parts
- Part 1: Social/everyday context (10 questions) - e.g., conversation about booking, shopping, registration
- Part 2: Monologue in social context (10 questions) - e.g., tour guide, facility information
- Part 3: Academic discussion (10 questions) - e.g., student-tutor, group project discussion
- Part 4: Academic lecture/talk (10 questions) - e.g., university lecture, presentation

**For this test with {num_questions} questions:**
- Distribute questions evenly across 4 parts (roughly {num_questions // 4} questions per part)
- Use authentic IELTS question types
- Create realistic audio scripts/transcripts
- Difficulty: {difficulty}
"""
    
    # Add common sections
    prompt += f"""

**QUESTION TYPES TO USE:**

IMPORTANT: You MUST use ONLY the following question types (do NOT use any other types):
{', '.join([f'**{t}**' for t in selected_types])}

{distribution_text}

**QUESTION TYPE SPECIFICATIONS:**

{types_text}

**AUDIO SCRIPT REQUIREMENTS:**
- Each part needs a realistic audio_script (transcript)
- Length: 300-500 words per part
- Include natural conversation/speech patterns
- Make sure script contains ALL answers to questions
- Use realistic names, places, numbers, dates

**OUTPUT FORMAT (JSON):**
Return ONLY a valid JSON object with this structure:

{{
  "test_title": "TEST [X] - LISTENING",
  "parts": [
    {{
      "part_number": 1,
      "title": "PART 1",
      "subtitle": "Questions 1-10",
      "context": "Brief description of the situation",
      "audio_script": "[Full transcript, 300-500 words with speaker labels]",
      "question_groups": [
        {{
          "group_instruction": "Choose the correct letter, A, B or C.",
          "section_title": "Section Title",
          "questions": [
            {{
              "question_number": 1,
              "question_type": "multiple_choice",
              "content": "Question text with options",
              "answers": [
                {{
                  "answer_content": "Option text",
                  "is_correct": true/false,
                  "feedback": "Brief explanation"
                }}
              ],
              "correct_answer": "The correct answer",
              "explanation": "Detailed explanation (50-100 words for multiple choice, 30-50 words for others) explaining why this answer is correct, referencing the audio script",
              "locate": "Reference to audio script location (e.g., 'Speaker 1: specific quote', 'Lines 10-12 of transcript')",
              "points": 1.0
            }}
          ]
        }}
      ]
    }}
  ]
}}

**CRITICAL REQUIREMENTS:**
1. Generate EXACTLY {num_questions} questions total {"for this part" if part_number else "(split across 4 parts)"}
2. Question numbering: {"sequential starting from " + str((part_number-1)*10 + 1) if part_number else "sequential 1, 2, 3... up to " + str(num_questions)}
3. **USE ONLY THE SPECIFIED QUESTION TYPES**: {', '.join(selected_types)}
4. **FOLLOW THE DISTRIBUTION GUIDE** for question types
5. Each part must have complete audio_script with all answers embedded
6. Make audio scripts natural and conversational
7. All answers must be directly from the audio script
8. For multiple choice: provide "answers" array with 3-4 options
9. **INCLUDE "explanation" AND "locate" FOR EVERY QUESTION**:
   - explanation: Comprehensive (50-100 words for multiple choice, 30-50 words for others), teaching why the answer is correct
   - locate: Specific reference to audio script showing where the answer is mentioned
10. For NOT GIVEN answers: Explain what information is missing from the audio
11. Return ONLY valid JSON, no markdown formatting

**EXPLANATION AND LOCATE GUIDELINES:**
- **explanation**: Must be educational and comprehensive
  * Explain WHY the answer is correct
  * Reference what was said in the audio
  * For TRUE/FALSE/NOT GIVEN: Teach how to distinguish between FALSE and NOT GIVEN
  
- **locate**: Must pinpoint the exact location in audio script
  * Format: "Speaker name: 'exact quote'" or "Lines X-Y of transcript"
  * For NOT GIVEN: Explain what information is absent
  * Make it easy to verify by listening to that specific part

Generate realistic, test-worthy content with comprehensive explanations now!
"""
    
    return prompt
