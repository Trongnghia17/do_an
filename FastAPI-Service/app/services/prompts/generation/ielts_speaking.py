"""
IELTS Speaking Question Generation Prompts
"""

def get_speaking_system_prompt():
    """System prompt for IELTS Speaking generation"""
    return "You are an expert IELTS examiner specializing in creating authentic IELTS Speaking tests."


def get_speaking_generation_prompt(topic: str, difficulty: str, num_questions: int = None):
    """
    Generate IELTS Speaking prompt with 3 parts
    
    Args:
        topic: Topic for speaking test
        difficulty: easy, medium, hard
        num_questions: Total number of questions (if None, use default 10-12 questions)
    """
    
    # Default distribution if num_questions not provided
    if num_questions is None:
        num_questions = 11  # 4 (Part 1) + 1 (Part 2) + 6 (Part 3) = 11
    
    # Calculate distribution across 3 parts
    # Part 2 always has 1 cue card
    # Split remaining between Part 1 and Part 3
    remaining = num_questions - 1
    part1_questions = max(4, remaining // 2)  # At least 4 for Part 1
    part3_questions = remaining - part1_questions  # Rest for Part 3
    
    return f"""
Generate IELTS Speaking test on topic: {topic}

**CRITICAL Requirements:**
- Generate EXACTLY {num_questions} questions total across all 3 parts
- Part 1: Introduction and Interview - EXACTLY {part1_questions} personal questions (4-5 minutes)
- Part 2: Long Turn with cue card - EXACTLY 1 cue card topic (3-4 minutes)
- Part 3: Discussion - EXACTLY {part3_questions} abstract questions (4-5 minutes)
- Total: {part1_questions} + 1 + {part3_questions} = {num_questions} questions
- Use authentic IELTS language and relate to topic '{topic}'
- Difficulty: {difficulty}

Format your response as a JSON object with this EXACT structure:
{{
  "question_groups": [
    {{
      "group_name": "PART 1",
      "question_type": "spoken_question",
      "instruction": "The examiner asks you about yourself, your home, work or studies and other familiar topics.",
      "questions": [
        // MUST HAVE EXACTLY {part1_questions} QUESTIONS HERE (question_number 1 to {part1_questions})
        {{
          "question_number": 1,
          "content": "How much [activity] do you do in your daily life?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "Part 1 questions are personal and about familiar topics. Keep answers short (20-30 seconds).",
          "points": 1,
          "metadata": {{"part": 1, "duration": "4-5 minutes"}}
        }},
        {{
          "question_number": 2,
          "content": "Did you [activity] more when you were younger?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "Personal question about past experiences.",
          "points": 1,
          "metadata": {{"part": 1}}
        }}
        // ... continue until question_number {part1_questions}
      ]
    }},
    {{
      "group_name": "PART 2",
      "question_type": "cue_card",
      "instruction": "You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.",
      "questions": [
        // MUST HAVE EXACTLY 1 CUE CARD (question_number {part1_questions + 1})
        {{
          "question_number": {part1_questions + 1},
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
        // MUST HAVE EXACTLY {part3_questions} QUESTIONS HERE (question_number {part1_questions + 2} to {num_questions})
        {{
          "question_number": {part1_questions + 2},
          "content": "What are the most popular [topic-related] in your country?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "Part 3 questions are more abstract and require longer, more developed answers with opinions and examples.",
          "points": 1,
          "metadata": {{"part": 3, "duration": "4-5 minutes"}}
        }},
        {{
          "question_number": {part1_questions + 3},
          "content": "How [topic-related comparison question]?",
          "question_type": "spoken_question",
          "correct_answer": "",
          "explanation": "Comparison question requiring analytical thinking.",
          "points": 1,
          "metadata": {{"part": 3}}
        }}
        // ... continue until question_number {num_questions}
      ]
    }}
  ]
}}

**CRITICAL VERIFICATION REQUIREMENTS:**
1. **🚨 MOST IMPORTANT: Generate EXACTLY {num_questions} questions total 🚨**
   - Part 1: EXACTLY {part1_questions} questions (question_number 1 to {part1_questions})
   - Part 2: EXACTLY 1 cue card (question_number {part1_questions + 1})
   - Part 3: EXACTLY {part3_questions} questions (question_number {part1_questions + 2} to {num_questions})
   - Total: {part1_questions} + 1 + {part3_questions} = {num_questions}

2. **Question numbering must be sequential from 1 to {num_questions}**
   - No gaps, no duplicates
   - Each question_number must appear exactly once

3. **Part 1 questions:**
   - Must be personal, about daily life, habits, preferences
   - Related to {topic} but in everyday context
   - Keep answers short (20-30 seconds)

4. **Part 2 cue card:**
   - Must have 4 bullet points (You should say...)
   - Must be descriptive (Describe a person/place/event/object...)
   - Must relate to {topic}
   - Should encourage 1-2 minutes of speaking

5. **Part 3 questions:**
   - Must be abstract, analytical, opinion-based
   - Should ask about society, trends, comparisons, future predictions
   - Related to Part 2 topic but more general/philosophical
   - Require longer, more developed answers

6. **Return ONLY valid JSON, no markdown formatting**

**FINAL VERIFICATION CHECKLIST:**
Before submitting, verify:
- [ ] Total questions = {num_questions}
- [ ] Part 1 has {part1_questions} questions
- [ ] Part 2 has 1 cue card
- [ ] Part 3 has {part3_questions} questions
- [ ] Question numbers: 1, 2, 3, ... {num_questions} (sequential, no gaps)
- [ ] All questions relate to topic '{topic}'
- [ ] All questions have "explanation" field

EXAMPLE for topic "Theatre and Entertainment":
Part 1: Personal questions about entertainment habits
Part 2: "Describe a play or film you saw that you'd like to see again with friends"
Part 3: Abstract questions about theatre industry, actors, audience trends

Make the questions realistic, relevant to {topic}, natural, and following official IELTS Speaking standards.

**NOW GENERATE ALL {num_questions} QUESTIONS - COUNT CAREFULLY!**
"""
