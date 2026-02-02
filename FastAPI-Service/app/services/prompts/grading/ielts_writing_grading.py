"""
IELTS Writing Grading Prompts with Official Band Descriptors
"""

def get_writing_grading_system_prompt(exam_type: str = "IELTS"):
    """System prompt for Writing grading"""
    return f"You are an experienced {exam_type} examiner specializing in grading Writing tasks. Provide detailed, constructive feedback."


def get_ielts_writing_band_descriptors():
    """Get official IELTS Writing Band Descriptors"""
    
    return {
        "task_achievement_task1": """1. TASK ACHIEVEMENT (TA) - Dành cho Task 1 (25%):
   - Band 9.0: Hoàn thành toàn bộ yêu cầu đề bài. Có tổng quan (overview) rõ ràng, thông tin quan trọng được mô tả chi tiết và chính xác
   - Band 8.0: Đáp ứng đầy đủ các yêu cầu. Tổng quan rõ ràng, các chi tiết quan trọng được làm rõ và trình bày tốt. Dữ liệu được chọn lọc và so sánh hiệu quả
   - Band 7.0: Nhận xét tổng quan rõ ràng (overview), có làm rõ các chi tiết quan trọng. Thông tin chính xác dù có thể triển khai tốt hơn
   - Band 6.0: Có phần nhận xét tổng quan, đề cập đầy đủ chi tiết quan trọng. Có chọn lọc thông tin dù chưa hoàn toàn chính xác
   - Band 5.0: Nhận xét tổng quan chưa rõ ràng. Bài viết chưa đề cập đầy đủ chi tiết hoặc bị chi tiết quá mức (mechanical description)
   - Band 4.0 trở xuống: Không có overview, diễn đạt sai lệch dữ liệu, ý tưởng hạn chế và không liên quan
   
   Lưu ý cho Task 1: Phải có Overview (nhận xét tổng quan), chọn lọc và so sánh dữ liệu quan trọng, không copy nguyên đề bài.""",
        
        "task_response_task2": """1. TASK RESPONSE (TR) - Dành cho Task 2 (25%):
   - Band 9.0: Trả lời đầy đủ tất cả các phần của câu hỏi. Lập luận rõ ràng, được phát triển đầy đủ với ý tưởng sâu sắc và có liên quan
   - Band 8.0: Trả lời đầy đủ các phần của câu hỏi với lập luận rõ ràng và ý tưởng được phát triển tốt. Ví dụ cụ thể và phù hợp
   - Band 7.0: Trả lời tất cả các phần của câu hỏi. Có quan điểm rõ ràng và ý tưởng được phát triển khá tốt
   - Band 6.0: Trả lời được các phần chính của câu hỏi. Quan điểm được nêu, ý tưởng liên quan nhưng phát triển chưa sâu
   - Band 5.0: Quan điểm chưa rõ ràng. Phần lớn nội dung off-topic hoặc lặp lại. Phát triển ý tưởng hạn chế
   - Band 4.0 trở xuống: Trả lời lạc đề, quan điểm không rõ, ý tưởng không liên quan hoặc lặp đi lặp lại
   
   Lưu ý cho Task 2: Phải trả lời TOÀN BỘ câu hỏi (discuss both views, advantages/disadvantages, agree/disagree...), có quan điểm rõ ràng, ví dụ cụ thể.""",
        
        "coherence_cohesion": """2. COHERENCE AND COHESION (25%):
   - Band 9.0: Bố cục thông tin và luận điểm hoàn hảo, đoạn văn mạch lạc, không có lỗi sai
   - Band 8.0: Bố cục thông tin và lập luận hợp lý, chia đoạn hiệu quả. Sử dụng thuần thục các phương tiện liên kết
   - Band 7.0: Bố cục thông tin logic, chia đoạn tốt. Phương tiện liên kết đa dạng, một số có thể bị lạm dụng hoặc dùng chưa chuẩn
   - Band 6.0: Bố cục rõ ràng, chia đoạn hợp lý. Sử dụng phương tiện liên kết hiệu quả. Còn vài lỗi trong việc nối câu
   - Band 5.0: Bài viết có bố cục nhưng còn hạn chế. Sử dụng từ nối cơ bản, có lỗi gây khó đọc
   - Band 4.0 trở xuống: Không biết triển khai ý tưởng, sử dụng sai các từ nối""",
        
        "lexical_resource": """3. LEXICAL RESOURCE (25%):
   - Band 9.0: Vốn từ vựng phong phú và phù hợp ngữ cảnh. Lỗi sai rất hiếm và không đáng kể
   - Band 8.0: Vốn từ vựng đa dạng và chính xác. Sử dụng từ học thuật nhuần nhuyễn với rất ít lỗi sai
   - Band 7.0: Vốn từ vựng đa dạng và khá chính xác. Áp dụng từ học thuật và collocations thành thạo. Thỉnh thoảng mắc lỗi
   - Band 6.0: Vốn từ tương đối đa dạng. Sử dụng chưa chính xác một số từ học thuật. Có lỗi chính tả và dạng từ nhưng diễn đạt rõ
   - Band 5.0: Vốn từ hạn chế, mắc lỗi chính tả hoặc dạng từ khá nhiều, gây khó đọc
   - Band 4.0 trở xuống: Vốn từ vựng cực kỳ hạn chế, nhiều lỗi sai dạng từ và chính tả""",
        
        "grammatical_accuracy": """4. GRAMMATICAL RANGE AND ACCURACY (25%):
   - Band 9.0: Sử dụng đa dạng và thuần thục các cấu trúc ngữ pháp. Lỗi sai rất hiếm và không đáng kể
   - Band 8.0: Sử dụng đa dạng và thuần thục các cấu trúc ngữ pháp. Lỗi sai rất hiếm
   - Band 7.0: Sử dụng nhiều cấu trúc câu phức tạp. Phần lớn các câu không bị lỗi sai
   - Band 6.0: Sử dụng các cấu trúc câu đơn giản và phức tạp. Thỉnh thoảng còn mắc lỗi ngữ pháp và lỗi ngắt câu
   - Band 5.0: Vốn cấu trúc câu hạn chế. Có sử dụng nhưng không thành công một số cấu trúc phức tạp. Nhiều lỗi ngữ pháp
   - Band 4.0 trở xuống: Chỉ có thể dùng một vài câu đơn hoặc không viết được câu hoàn chỉnh"""
    }


def get_writing_grading_prompt(question: str, answer: str, exam_type: str = "IELTS"):
    """
    Generate prompt for grading writing based on IELTS Band Descriptors
    
    Args:
        question: Writing task question
        answer: Student's answer
        exam_type: Type of exam (IELTS, TOEIC, etc.)
    """
    
    if exam_type == "IELTS":
        # Detect Task 1 vs Task 2
        is_task_1 = any(keyword in question.lower() for keyword in [
            'task 1', 'graph', 'chart', 'table', 'diagram', 'process', 'map',
            'biểu đồ', 'bảng', 'sơ đồ', 'quy trình', 'the chart', 'the graph',
            'the table', 'the diagram', 'shows', 'illustrates', 'summarize', 'summarise'
        ])
        
        band_descriptors = get_ielts_writing_band_descriptors()
        
        if is_task_1:
            task_criterion_name = "TASK ACHIEVEMENT (TA)"
            task_criterion_desc = band_descriptors["task_achievement_task1"]
            json_key = "task_achievement"
        else:
            task_criterion_name = "TASK RESPONSE (TR)"
            task_criterion_desc = band_descriptors["task_response_task2"]
            json_key = "task_response"
        
        criteria_text = f"""
IELTS Writing Band Descriptors - Tiêu chí chấm điểm chi tiết:

{task_criterion_desc}

{band_descriptors["coherence_cohesion"]}

{band_descriptors["lexical_resource"]}

{band_descriptors["grammatical_accuracy"]}

Yêu cầu chấm điểm:
- Đánh giá từng tiêu chí theo band descriptors từ 1.0 đến 9.0 (có thể dùng 0.5 như 6.5, 7.5)
- Điểm tổng = trung bình cộng 4 tiêu chí (làm tròn đến 0.5)
- Cung cấp feedback chi tiết cho TỪNG tiêu chí
- Chỉ ra điểm mạnh, điểm yếu cụ thể
- Đưa ra gợi ý cải thiện thiết thực
"""
    else:
        criteria_text = "Standard writing assessment criteria"
        json_key = "task_achievement"
        task_criterion_name = "Task Achievement"

    prompt = f"""
You are an experienced IELTS examiner. Grade the following {exam_type} Writing task using the official IELTS Band Descriptors.

Question/Task:
{question}

Student's Answer:
{answer}

Word count: {len(answer.split())} words

{criteria_text}

Provide your grading in the following JSON format:
{{
  "overall_score": 7.0,
  "criteria_scores": {{
    "{json_key}": 7.0,
    "coherence_cohesion": 7.5,
    "lexical_resource": 6.5,
    "grammatical_accuracy": 7.0
  }},
  "criteria_feedback": {{
    "{json_key}": "Chi tiết đánh giá {task_criterion_name} theo band descriptors...",
    "coherence_cohesion": "Chi tiết đánh giá Coherence & Cohesion theo band descriptors...",
    "lexical_resource": "Chi tiết đánh giá Lexical Resource theo band descriptors...",
    "grammatical_accuracy": "Chi tiết đánh giá Grammatical Range & Accuracy theo band descriptors..."
  }},
  "strengths": [
    "Điểm mạnh cụ thể 1",
    "Điểm mạnh cụ thể 2",
    "Điểm mạnh cụ thể 3"
  ],
  "weaknesses": [
    "Điểm yếu cụ thể 1",
    "Điểm yếu cụ thể 2",
    "Điểm yếu cụ thể 3"
  ],
  "detailed_feedback": "Tổng hợp đánh giá chung về bài viết, highlight những điểm quan trọng...",
  "suggestions": [
    "Gợi ý cải thiện cụ thể 1",
    "Gợi ý cải thiện cụ thể 2",
    "Gợi ý cải thiện cụ thể 3"
  ],
  "band_justification": "Giải thích tại sao bài viết đạt band này dựa trên 4 tiêu chí..."
}}

IMPORTANT:
- Be objective and fair following official IELTS standards
- Scores must be from 1.0 to 9.0 (can use 0.5 increments like 6.5, 7.5)
- Overall score = average of 4 criteria scores, rounded to nearest 0.5
- Provide specific examples from the student's writing
- Give constructive, actionable feedback in Vietnamese
"""
    return prompt
