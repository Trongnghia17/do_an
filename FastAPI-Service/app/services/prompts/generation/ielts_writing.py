"""
IELTS Writing Question Generation Prompts
"""

def get_writing_system_prompt():
    """System prompt for IELTS Writing generation"""
    return "You are an expert IELTS examiner and exam creator specializing in creating authentic IELTS Writing tasks."


def get_writing_generation_prompt(topic: str, difficulty: str):
    """
    Generate IELTS Writing prompt with Task 1 and Task 2
    
    Args:
        topic: Topic for writing tasks
        difficulty: easy, medium, hard
    """
    
    return f"""
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
