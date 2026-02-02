"""
IELTS Speaking Grading Prompts with Official Band Descriptors
"""

def get_speaking_grading_system_prompt(exam_type: str = "IELTS"):
    """System prompt for Speaking grading"""
    return f"You are an experienced {exam_type} examiner specializing in grading Speaking tasks. Evaluate fluency, vocabulary, grammar, and pronunciation."


def get_ielts_speaking_band_descriptors():
    """Get official IELTS Speaking Band Descriptors"""
    
    return {
        "fluency_coherence": """1. FLUENCY AND COHERENCE - Độ trôi chảy và mạch lạc (25%):

Band 9: 
- Nói trôi chảy và hiếm khi lặp lại hay tự điều chỉnh, sửa lỗi
- Mọi sự do dự, ngập ngừng trong lúc nói đều liên quan đến nội dung, không phải là tìm từ hoặc ngữ pháp
- Nói mạch lạc, phù hợp với ngữ cảnh, sử dụng các đặc trưng liên kết một cách hoàn toàn thích hợp
- Phát triển các chủ đề một cách mạch lạc, đầy đủ và hợp lý

Band 8:
- Nói một cách trôi chảy, hiếm khi lặp lại hoặc tự sửa lỗi
- Ngập ngừng chủ yếu do tìm nội dung, ý diễn đạt, ít khi phải dừng để tìm từ ngữ hay ngữ pháp
- Phát triển các chủ đề một cách mạch lạc và phù hợp

Band 7:
- Có thể kéo dài câu nói mà không cần nỗ lực nhiều
- Đôi khi có thể thể hiện sự ngập ngừng, một số sự lặp lại và/hoặc tự điều chỉnh, sửa lỗi ở giữa câu nói
- Sử dụng nhiều, đa dạng và linh hoạt các phép nối cũng như discourse markers

Band 6:
- Có khả năng và mong muốn kéo dài câu nói
- Đôi khi có thể mất độ mạch lạc do thỉnh thoảng lặp lại, tự sửa lỗi hoặc do ngập ngừng
- Sử dụng nhiều các phép nối và discourse markers nhưng không phải lúc nào cũng thích hợp

Band 5:
- Thường có thể duy trì được độ trôi chảy của lời nói nhưng phải lặp lại, tự sửa lỗi và/hoặc nói chậm
- Thường ngập ngừng để tìm kiếm những từ vựng và ngữ pháp khá căn bản
- Có thể lạm dụng (sử dụng quá mức) một số từ nối, phép nối và discourse markers

Band 4:
- Trong lúc trả lời vẫn có những khoảng dừng đáng chú ý và có thể nói chậm, thường xuyên bị lặp và tự sửa lỗi
- Liên kết được các câu cơ bản nhưng sử dụng lặp đi lặp lại các phép liên kết đơn giản""",

        "lexical_resource": """2. LEXICAL RESOURCE - Vốn từ vựng (25%):

Band 9:
- Sử dụng từ vựng một cách linh hoạt và chính xác trong tất cả các chủ đề
- Sử dụng các thành ngữ một cách tự nhiên và chính xác

Band 8:
- Sử dụng nguồn từ vựng phong phú và linh hoạt để truyền đạt ý nghĩa một cách chính xác đối với mọi chủ đề
- Sử dụng các từ vựng ít phổ biến và thành ngữ một cách khéo léo, chỉ đôi khi không chính xác trong cách dùng từ và collocation

Band 7:
- Sử dụng nguồn từ vựng một cách linh hoạt để thảo luận về nhiều chủ đề khác nhau
- Sử dụng được một số thành ngữ và các từ vựng ít phổ biến hơn, đồng thời cho thấy một số kiến thức về văn phong và cụm từ

Band 6:
- Có vốn từ vựng đủ rộng để có những cuộc thảo luận dài về nhiều chủ đề
- Sử dụng từ vựng có thể không phù hợp nhưng vẫn thể hiện ý nghĩa rõ ràng
- Nhìn chung diễn đạt ý được bằng nhiều cách chính xác

Band 5:
- Có vốn từ vựng đủ rộng để nói được về cả các chủ đề quen thuộc và không quen thuộc nhưng sử dụng từ vựng còn ít linh hoạt
- Có cố gắng sử dụng nhiều cách để diễn đạt nhưng thường không thành công

Band 4:
- Có vốn từ vựng đủ rộng về các chủ đề quen thuộc
- Tuy nhiên chỉ có thể truyền đạt ý nghĩa cơ bản về các chủ đề không quen thuộc và thường xuyên mắc lỗi trong việc lựa chọn từ ngữ""",

        "grammatical_accuracy": """3. GRAMMATICAL RANGE AND ACCURACY - Độ đa dạng và chính xác của ngữ pháp (25%):

Band 9:
- Cấu trúc các câu chính xác và nhất quán, loại trừ các "lỗi nhỏ" trong đặc điểm cách nói của người bản ngữ

Band 8:
- Sử dụng nhiều và đa dạng các loại cấu trúc một cách linh hoạt
- Phần lớn các câu không có lỗi, chỉ thỉnh thoảng không phù hợp hoặc mắc các lỗi cơ bản/lỗi ngẫu nhiên

Band 7:
- Sử dụng nhiều cấu trúc phức tạp một cách khá linh hoạt
- Các câu được tạo ra thường là không có lỗi
- Sử dụng hiệu quả cả câu đơn và câu phức

Band 6:
- Sử dụng kết hợp các câu ngắn và phức tạp và đa dạng các cấu trúc nhưng ít linh hoạt
- Có thể vẫn mắc lỗi thường xuyên với các cấu trúc phức tạp nhưng những lỗi này hiếm khi cản trở quá trình giao tiếp

Band 5:
- Sử dụng các dạng câu cơ bản một cách hợp lý và chính xác
- Có sử dụng một số ít các cấu trúc phức tạp hơn, nhưng những cấu trúc này thường có lỗi

Band 4:
- Hình thành được các dạng câu cơ bản và một số câu đơn giản đúng
- Hiếm khi sử dụng các mệnh đề phụ thuộc, các cấu trúc lặp lại nhiều lần và thường mắc lỗi""",

        "pronunciation": """4. PRONUNCIATION - Phát âm (25%):

Band 9:
- Sử dụng đầy đủ các thành tố phát âm với độ chính xác và sự tinh tế
- Duy trì việc sử dụng linh hoạt các thành tố này xuyên suốt bài nói
- Có thể dễ dàng hiểu mà không cần nỗ lực
- Accent không ảnh hưởng đến tính dễ hiểu của bài nói

Band 8:
- Sử dụng nhiều và đa dạng các thành tố phát âm với độ chính xác và sự tinh tế
- Duy trì nhịp điệu phù hợp, sử dụng linh hoạt trọng âm và ngữ điệu trong các câu nói dài

Band 7:
- Thể hiện tất cả các đặc điểm tích cực của Band 6 và một số, nhưng không phải tất cả các đặc điểm tích cực của Band 8

Band 6:
- Sử dụng được một số các thành tố phát âm nhưng chưa kiểm soát tốt
- Liên kết các cụm từ một cách phù hợp, nhưng nhịp điệu nói có thể bị ảnh hưởng bởi cách đặt trọng âm
- Sử dụng hiệu quả một số ngữ điệu và trọng âm nhưng điều này không được duy trì xuyên suốt bài nói

Band 5:
- Thể hiện được tất cả các đặc điểm tích cực của Band 4 và một số, nhưng không phải tất cả các đặc điểm tích cực của Band 6

Band 4:
- Sử dụng được một số ngữ điệu và trọng âm nhưng khả năng kiểm soát còn hạn chế
- Phát âm sai các từ đơn và âm thường xuyên, khiến bài nói thiếu tính rõ ràng

LƯU Ý QUAN TRỌNG:
- Vì đánh giá dựa trên transcript (văn bản), pronunciation được đánh giá GIÁN TIẾP qua:
  * Individual sounds: Đánh giá qua độ chính xác từ vựng và spelling trong transcript
  * Word/sentence stress: Nhận biết qua cấu trúc câu và discourse markers
  * Connected speech: Thể hiện qua độ trôi chảy của câu văn
  * Intonation: Suy luận từ việc sử dụng dấu câu và transition words"""
    }


def get_speaking_grading_prompt(question: str, transcript: str, exam_type: str = "IELTS"):
    """
    Generate prompt for grading speaking based on IELTS Band Descriptors
    
    Args:
        question: Speaking question
        transcript: Transcript of student's response
        exam_type: Type of exam
    """
    
    if exam_type == "IELTS":
        band_descriptors = get_ielts_speaking_band_descriptors()
        
        criteria_text = f"""
IELTS Speaking Band Descriptors - Tiêu chí chấm điểm CHÍNH THỨC:

Nguồn: www.ielts.org & British Council IELTS Speaking Band Descriptors

{band_descriptors["fluency_coherence"]}

{band_descriptors["lexical_resource"]}

{band_descriptors["grammatical_accuracy"]}

{band_descriptors["pronunciation"]}

Yêu cầu chấm điểm:
- Đánh giá từng tiêu chí theo Official Band Descriptors từ 1.0 đến 9.0 (có thể dùng 0.5 như 6.5, 7.5)
- Điểm tổng = trung bình cộng 4 tiêu chí (làm tròn đến 0.5 gần nhất)
- Cung cấp feedback chi tiết cho TỪNG tiêu chí theo đúng descriptors
- Chỉ ra điểm mạnh, điểm yếu cụ thể với VÍ DỤ từ bài nói
- Đưa ra gợi ý cải thiện thiết thực và khả thi
"""
    else:
        criteria_text = "Standard speaking assessment criteria"

    prompt = f"""
You are an experienced IELTS examiner. Grade the following {exam_type} Speaking response using the official IELTS Band Descriptors.

Question:
{question}

Student's Response (Transcript):
{transcript}

Word count: {len(transcript.split())} words

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
  "criteria_feedback": {{
    "fluency_coherence": "Chi tiết đánh giá Fluency & Coherence theo band descriptors...",
    "lexical_resource": "Chi tiết đánh giá Lexical Resource theo band descriptors...",
    "grammatical_accuracy": "Chi tiết đánh giá Grammatical Range & Accuracy theo band descriptors...",
    "pronunciation": "Chi tiết đánh giá Pronunciation (gián tiếp qua transcript) theo band descriptors..."
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
  "detailed_feedback": "Tổng hợp đánh giá chung về câu trả lời, highlight những điểm quan trọng...",
  "suggestions": [
    "Gợi ý cải thiện cụ thể 1",
    "Gợi ý cải thiện cụ thể 2",
    "Gợi ý cải thiện cụ thể 3"
  ],
  "band_justification": "Giải thích tại sao câu trả lời đạt band này dựa trên 4 tiêu chí...",
  "pronunciation_note": "Lưu ý về việc đánh giá pronunciation qua transcript..."
}}

IMPORTANT:
- Be objective and fair following official IELTS standards
- Scores must be from 1.0 to 9.0 (can use 0.5 increments like 6.5, 7.5)
- Overall score = average of 4 criteria scores, rounded to nearest 0.5
- For pronunciation, assess based on grammar structure and word choice in transcript
- Provide specific examples from the student's response
- Give constructive, actionable feedback in Vietnamese
"""
    return prompt
