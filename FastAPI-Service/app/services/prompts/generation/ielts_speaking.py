"""
IELTS Speaking Question Generation Prompts
"""

def get_speaking_system_prompt():
    """System prompt for IELTS Speaking generation"""
    return "You are an expert IELTS examiner specializing in creating authentic IELTS Speaking tests."


def get_speaking_generation_prompt(topic: str, difficulty: str):
    """
    Generate IELTS Speaking prompt with 3 parts
    
    Args:
        topic: Topic for speaking test
        difficulty: easy, medium, hard
    """
    
    return f"""
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
