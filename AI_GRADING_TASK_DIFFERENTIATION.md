# AI Grading Task Differentiation - IELTS Writing Task 1 vs Task 2

## 🎯 Mục Tiêu
Phân biệt và chấm điểm chính xác IELTS Writing Task 1 và Task 2 theo đúng tiêu chí IELTS chính thức:
- **Task 1**: Task Achievement (TA)
- **Task 2**: Task Response (TR)

## 🔍 Vấn Đề Ban Đầu
Trước đây hệ thống dùng chung tiêu chí "TASK ACHIEVEMENT / TASK RESPONSE" cho cả 2 tasks, không phân biệt:
- Task 1 (mô tả biểu đồ/bảng) cần **Task Achievement** - đánh giá việc mô tả dữ liệu
- Task 2 (viết luận) cần **Task Response** - đánh giá việc trả lời câu hỏi

## ✅ Giải Pháp Đã Triển Khai

### 1. Backend - Automatic Task Detection
**File**: `/FastAPI-Service/app/services/chatgpt_service.py`

#### Logic Phát Hiện Task Type:
```python
# Detect Task 1 vs Task 2 based on question content
is_task_1 = any(keyword in question.lower() for keyword in [
    'task 1', 'graph', 'chart', 'table', 'diagram', 'process', 'map',
    'biểu đồ', 'bảng', 'sơ đồ', 'quy trình', 'the chart', 'the graph',
    'the table', 'the diagram', 'shows', 'illustrates', 'summarize', 'summarise'
])
```

**Keywords cho Task 1** (tiếng Anh + tiếng Việt):
- `task 1`, `graph`, `chart`, `table`, `diagram`, `process`, `map`
- `biểu đồ`, `bảng`, `sơ đồ`, `quy trình`
- `the chart`, `the graph`, `the table`, `the diagram`
- `shows`, `illustrates`, `summarize`, `summarise`

**Task 2**: Tất cả các câu hỏi không match Task 1 keywords

#### Task-Specific Criteria:

**Task 1 - Task Achievement (TA)**:
```
Band 9.0: Hoàn thành toàn bộ yêu cầu đề bài. Có tổng quan (overview) rõ ràng, 
          thông tin quan trọng được mô tả chi tiết và chính xác

Band 8.0: Đáp ứng đầy đủ các yêu cầu. Tổng quan rõ ràng, các chi tiết quan trọng 
          được làm rõ và trình bày tốt. Dữ liệu được chọn lọc và so sánh hiệu quả

Band 7.0: Nhận xét tổng quan rõ ràng (overview), có làm rõ các chi tiết quan trọng. 
          Thông tin chính xác dù có thể triển khai tốt hơn

Band 6.0: Có phần nhận xét tổng quan, đề cập đầy đủ chi tiết quan trọng. 
          Có chọn lọc thông tin dù chưa hoàn toàn chính xác

Band 5.0: Nhận xét tổng quan chưa rõ ràng. Bài viết chưa đề cập đầy đủ chi tiết 
          hoặc bị chi tiết quá mức (mechanical description)

Band 4.0-: Không có overview, diễn đạt sai lệch dữ liệu, ý tưởng hạn chế 
           và không liên quan

Lưu ý: Phải có Overview (nhận xét tổng quan), chọn lọc và so sánh dữ liệu quan trọng, 
       không copy nguyên đề bài.
```

**Task 2 - Task Response (TR)**:
```
Band 9.0: Trả lời đầy đủ tất cả các phần của câu hỏi. Lập luận rõ ràng, 
          được phát triển đầy đủ với ý tưởng sâu sắc và có liên quan

Band 8.0: Trả lời đầy đủ các phần của câu hỏi với lập luận rõ ràng và ý tưởng 
          được phát triển tốt. Ví dụ cụ thể và phù hợp

Band 7.0: Trả lời tất cả các phần của câu hỏi. Có quan điểm rõ ràng và ý tưởng 
          được phát triển khá tốt

Band 6.0: Trả lời được các phần chính của câu hỏi. Quan điểm được nêu, 
          ý tưởng liên quan nhưng phát triển chưa sâu

Band 5.0: Quan điểm chưa rõ ràng. Phần lớn nội dung off-topic hoặc lặp lại. 
          Phát triển ý tưởng hạn chế

Band 4.0-: Trả lời lạc đề, quan điểm không rõ, ý tưởng không liên quan 
           hoặc lặp đi lặp lại

Lưu ý: Phải trả lời TOÀN BỘ câu hỏi (discuss both views, advantages/disadvantages, 
       agree/disagree...), có quan điểm rõ ràng, ví dụ cụ thể.
```

#### Dynamic JSON Response Format:
```python
if is_task_1:
    json_key = "task_achievement"
    task_criterion_name = "TASK ACHIEVEMENT (TA)"
else:
    json_key = "task_response"
    task_criterion_name = "TASK RESPONSE (TR)"

# Prompt sẽ dùng biến này để tạo JSON format động
{{
  "criteria_scores": {{
    "{json_key}": 7.0,  # task_achievement hoặc task_response
    "coherence_cohesion": 7.5,
    "lexical_resource": 6.5,
    "grammatical_accuracy": 7.0
  }},
  "criteria_feedback": {{
    "{json_key}": "Chi tiết đánh giá {task_criterion_name}...",
    ...
  }}
}}
```

### 2. Frontend - Flexible Display
**File**: `/React/src/features/user/exams/components/WritingResultUI.jsx`

#### Criterion Name Mapping:
```jsx
const criterionNames = {
  'task_achievement': 'Task Achievement',
  'task_response': 'Task Response',
  'coherence_cohesion': 'Coherence & Cohesion',
  'lexical_resource': 'Lexical Resource',
  'grammatical_range': 'Grammatical Range & Accuracy',
  'grammatical_accuracy': 'Grammatical Range & Accuracy'
};
```

Frontend tự động nhận diện key từ backend response và hiển thị đúng tên tiêu chí.

## 🔄 Luồng Hoạt Động

```
1. User làm bài Writing Task 1 hoặc Task 2
   ↓
2. Click "Chấm Điểm Bằng AI"
   ↓
3. Frontend gọi API /grading/grade-writing với question_text và answer_text
   ↓
4. Backend:
   - Phân tích question_text để detect task type
   - Chọn criteria phù hợp (TA hoặc TR)
   - Gọi GPT-4 với prompt đúng cho task đó
   - Trả về JSON với key động (task_achievement hoặc task_response)
   ↓
5. Frontend:
   - Nhận response với key động
   - Map key sang tên hiển thị tiếng Việt
   - Render criteria cards với tên đúng
   ↓
6. User thấy kết quả chính xác:
   - Task 1: "Task Achievement" + 3 tiêu chí khác
   - Task 2: "Task Response" + 3 tiêu chí khác
```

## 📊 Ví Dụ Response

### Task 1 Response:
```json
{
  "overall_score": 7.0,
  "criteria_scores": {
    "task_achievement": 7.0,
    "coherence_cohesion": 7.5,
    "lexical_resource": 6.5,
    "grammatical_accuracy": 7.0
  },
  "criteria_feedback": {
    "task_achievement": "Bài viết có overview rõ ràng về xu hướng chính...",
    "coherence_cohesion": "Bố cục logic với các đoạn văn được chia rõ ràng...",
    ...
  }
}
```

### Task 2 Response:
```json
{
  "overall_score": 7.0,
  "criteria_scores": {
    "task_response": 7.0,
    "coherence_cohesion": 7.5,
    "lexical_resource": 6.5,
    "grammatical_accuracy": 7.0
  },
  "criteria_feedback": {
    "task_response": "Bài viết trả lời đầy đủ cả hai khía cạnh của câu hỏi...",
    "coherence_cohesion": "Lập luận mạch lạc với các ví dụ cụ thể...",
    ...
  }
}
```

## 🧪 Test Cases

### Task 1 Detection:
✅ "The chart shows the percentage of..."
✅ "The graph illustrates the changes in..."
✅ "Biểu đồ sau mô tả tỷ lệ..."
✅ "Summarize the information shown in the table..."
✅ "Task 1: The diagram below shows..."

### Task 2 Detection:
✅ "Some people think that... Discuss both views"
✅ "To what extent do you agree or disagree?"
✅ "Do the advantages outweigh the disadvantages?"
✅ "What are the causes and solutions?"
✅ "Task 2: Essay on climate change"

## 🔧 Customization

### Thêm Keywords Mới:
Nếu cần thêm từ khóa phát hiện Task 1, sửa trong `chatgpt_service.py`:

```python
is_task_1 = any(keyword in question.lower() for keyword in [
    # Existing keywords...
    'new_keyword_1',
    'new_keyword_2'
])
```

### Thay Đổi Tên Hiển Thị:
Sửa mapping trong `WritingResultUI.jsx`:

```jsx
const criterionNames = {
  'task_achievement': 'Tên Mới Cho Task Achievement',
  'task_response': 'Tên Mới Cho Task Response',
  ...
};
```

## 📝 Lưu Ý Quan Trọng

1. **Keywords Case-Insensitive**: Hệ thống dùng `.lower()` nên không phân biệt hoa thường

2. **Default Behavior**: Nếu không match Task 1 keywords → Tự động coi là Task 2

3. **Multi-Task Grading**: Nếu bài thi có cả Task 1 và Task 2, mỗi task sẽ được chấm riêng với criteria phù hợp

4. **Database Compatibility**: JSON response lưu trong `ai_feedback` field với key động, frontend parse linh hoạt

5. **GPT-4 Consistency**: Prompt rõ ràng đảm bảo GPT-4 hiểu và trả về đúng format với key đúng

## 🔗 Related Documentation
- [AI_GRADING_IELTS_GUIDE.md](./AI_GRADING_IELTS_GUIDE.md) - Chi tiết band descriptors
- [AI_GRADING_PERSISTENCE.md](./AI_GRADING_PERSISTENCE.md) - Lưu trữ kết quả
- [WRITING_SPEAKING_UI_README.md](./WRITING_SPEAKING_UI_README.md) - UI components

## ✨ Tính Năng Nổi Bật
✅ Automatic task detection không cần user input
✅ Accurate criteria áp dụng đúng theo IELTS standards
✅ Dynamic JSON response với key linh hoạt
✅ Frontend adaptable display tự động
✅ Multi-language support (tiếng Anh + tiếng Việt)
✅ Backward compatible với code cũ
