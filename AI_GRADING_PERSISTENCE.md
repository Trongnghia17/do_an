# 🔧 AI Grading Persistence & Multi-Task Support

## 📋 Tổng Quan Các Thay Đổi

Đã sửa 2 vấn đề quan trọng trong hệ thống AI Grading:

### ✅ **Vấn Đề 1: AI Grading Result không được lưu**
- **Trước**: Kết quả AI chỉ lưu trong state, refresh page sẽ mất
- **Sau**: Lưu vào database `user_exam_answers.ai_feedback` và load lại khi refresh

### ✅ **Vấn Đề 2: Chỉ chấm 1 Task thay vì cả 2 Tasks**
- **Trước**: Chỉ chấm `firstAnswer` (Task 1)
- **Sau**: Chấm TẤT CẢ answers có trong bài thi (Task 1 + Task 2 cho Writing)

---

## 🔨 Backend Changes

### 1. `/FastAPI-Service/app/api/v1/endpoints/grading.py`

#### ✨ Thêm imports:
```python
import json
from app.models.exam_models import UserExamAnswer
```

#### ✨ Thêm SaveAIGradingRequest model:
```python
class SaveAIGradingRequest(BaseModel):
    """Request to save AI grading result to database"""
    submission_id: int
    question_id: int
    ai_grading_result: Dict[str, Any]
```

#### ✨ Thêm endpoint mới `/save-ai-grading`:
```python
@router.post("/save-ai-grading")
async def save_ai_grading(
    request: SaveAIGradingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save AI grading result to user_exam_answers.ai_feedback"""
    # Find answer record
    # Save as JSON
    # Return success
```

**Chức năng:**
- Tìm record trong `user_exam_answers` theo `question_id` + `submission_id`
- Lưu AI grading result vào field `ai_feedback` dạng JSON
- Update `updated_at` timestamp

---

### 2. `/FastAPI-Service/app/api/v1/endpoints/submissions.py`

#### ✨ Thêm field `has_ai_grading` vào response:
```python
answers_list.append({
    "question_id": question.id,
    "question_number": overall_question_number,
    "part": part_name,
    "question_content": question.question_text or question.content or "",
    "user_answer": user_answer.answer_text if user_answer and user_answer.answer_text else "",
    "correct_answer": correct_answer,
    "is_correct": is_correct,
    "score": user_answer.score if user_answer else None,
    "ai_feedback": json.loads(user_answer.ai_feedback) if (user_answer and user_answer.ai_feedback) else None,
    "has_ai_grading": bool(user_answer and user_answer.ai_feedback)  # ✨ NEW
})
```

**Mục đích:**
- Frontend có thể check nhanh đã có AI grading chưa
- Load lại kết quả AI khi refresh page

---

## 🎨 Frontend Changes

### 1. `/React/src/lib/fastapi-client.js`

#### ✨ Thêm function `saveAIGrading`:
```javascript
export const aiGradingAPI = {
  // ... existing functions
  
  // Lưu AI grading result vào database
  saveAIGrading: async (data) => {
    const response = await apiClient.post('/grading/save-ai-grading', data);
    return response.data;
  },
};
```

---

### 2. `/React/src/features/user/exams/pages/TestResult.jsx`

#### ✨ Import aiGradingAPI:
```javascript
import { aiGradingAPI } from '@/lib/fastapi-client';
```

#### ✨ Load AI grading khi fetch result:
```javascript
useEffect(() => {
  const fetchResult = async () => {
    // ...
    if (response.data.success) {
      setResult(response.data.data);
      
      // ✨ Check if already has AI grading result
      const hasAIGrading = response.data.data.answers?.some(ans => ans.has_ai_grading && ans.ai_feedback);
      if (hasAIGrading) {
        const firstAIGraded = response.data.data.answers.find(ans => ans.has_ai_grading && ans.ai_feedback);
        if (firstAIGraded) {
          setAiGradingResult(firstAIGraded.ai_feedback);
        }
      }
    }
  };
}, [resultId]);
```

#### ✨ Chấm TẤT CẢ answers (Multi-task support):
```javascript
const handleAIGrading = async () => {
  // Lấy tất cả câu trả lời có answer_text
  const answersToGrade = result.answers.filter(ans => {
    const answer = ans.answer_text || ans.user_answer || ans.answer_audio || '';
    return answer.trim() !== '';
  });

  // Chấm từng câu trả lời
  for (const answer of answersToGrade) {
    const gradingResult = await gradeWriting(...);
    
    // ✨ Lưu vào database
    await aiGradingAPI.saveAIGrading({
      submission_id: result.id,
      question_id: answer.question_id,
      ai_grading_result: gradingResult
    });
  }

  // ✨ Tính điểm trung bình nếu có nhiều tasks
  if (gradingResults.length > 1) {
    const avgScore = gradingResults.reduce((sum, r) => sum + r.result.overall_band, 0) / gradingResults.length;
    // Merge results...
  }
};
```

**Cải tiến:**
1. ✅ Filter để lấy **TẤT CẢ** answers có nội dung
2. ✅ Loop qua từng answer và chấm riêng
3. ✅ **Lưu từng kết quả** vào database
4. ✅ Tính **điểm trung bình** cho nhiều tasks
5. ✅ Merge strengths/weaknesses/suggestions từ tất cả tasks

---

## 🗄️ Database Schema

### Table: `user_exam_answers`

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Primary key |
| `submission_id` | INT | FK to exam_submissions |
| `question_id` | INT | FK to exam_questions |
| `answer_text` | TEXT | User's answer |
| `ai_feedback` | TEXT | **JSON string** chứa AI grading result |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

### AI Feedback JSON Structure:
```json
{
  "status": "success",
  "question_id": 34,
  "overall_band": 7.0,
  "criteria_scores": {
    "task_achievement": 7.0,
    "coherence_cohesion": 7.0,
    "lexical_resource": 7.5,
    "grammatical_range": 7.0
  },
  "criteria_feedback": {
    "task_achievement": "Detailed feedback..."
  },
  "strengths": ["Point 1", "Point 2"],
  "weaknesses": ["Point 1", "Point 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "detailed_feedback": "Overall feedback...",
  "band_justification": "Explanation..."
}
```

---

## 🔄 Data Flow

### Chấm Điểm AI (First Time):
```
User clicks "Chấm Điểm AI Ngay"
    ↓
handleAIGrading() called
    ↓
Filter answers có content
    ↓
Loop: Grade each answer
    ↓
POST /grading/grade-writing (AI chấm)
    ↓
POST /grading/save-ai-grading (Lưu DB)
    ↓
Calculate average if multiple tasks
    ↓
setAiGradingResult(mergedResult)
    ↓
UI updates with AI feedback
```

### Load Lại Page:
```
User refreshes page
    ↓
GET /submissions/{id}
    ↓
Backend returns answers with has_ai_grading=true
    ↓
Frontend checks hasAIGrading flag
    ↓
Load ai_feedback from first graded answer
    ↓
setAiGradingResult(existingFeedback)
    ↓
UI shows saved AI feedback immediately
```

---

## 🎯 Features

### ✅ Persistence:
- ✅ AI grading được lưu vào database
- ✅ Refresh page vẫn giữ nguyên kết quả
- ✅ Không mất data khi đóng/mở tab

### ✅ Multi-Task Support:
- ✅ Chấm TẤT CẢ tasks trong bài thi
- ✅ Task 1 + Task 2 cho Writing
- ✅ Multiple questions cho Speaking
- ✅ Tính điểm trung bình tự động
- ✅ Merge feedback từ tất cả tasks

### ✅ User Experience:
- ✅ Không cần chấm lại khi refresh
- ✅ Progress indication khi chấm nhiều tasks
- ✅ Error handling cho từng task
- ✅ Detailed logging cho debugging

---

## 🧪 Testing

### Test Case 1: Writing 2 Tasks
```
1. Làm bài Writing (Task 1 + Task 2)
2. Nộp bài
3. Click "Chấm Điểm AI Ngay"
4. ✅ Xác nhận cả 2 tasks được chấm
5. ✅ Xem điểm trung bình
6. Refresh page
7. ✅ Xác nhận kết quả vẫn hiển thị
```

### Test Case 2: Persistence
```
1. Chấm AI một bài Writing
2. Đóng tab browser
3. Mở lại link TestResult
4. ✅ Xác nhận AI result vẫn hiển thị
5. ✅ Không cần chấm lại
```

### Test Case 3: Multiple Users
```
1. User A chấm bài của mình
2. User B chấm bài của mình
3. ✅ Xác nhận mỗi user chỉ thấy kết quả của mình
4. ✅ Không bị conflict giữa các users
```

---

## 📊 Performance

### Before:
- ❌ Chỉ chấm 1 task
- ❌ Mất data khi refresh
- ❌ Phải chấm lại mỗi lần vào

### After:
- ✅ Chấm tất cả tasks
- ✅ Persistent storage
- ✅ Load instant từ DB
- ✅ 1 lần chấm, dùng mãi mãi

---

## 🚀 Future Enhancements

### Có thể thêm:
- [ ] Chấm lại nếu user muốn (Re-grade button)
- [ ] Compare multiple AI gradings
- [ ] Cache AI results in Redis
- [ ] Batch grading for multiple submissions
- [ ] Export AI feedback as PDF
- [ ] AI grading history/versions

---

## 🐛 Known Limitations

1. **Speaking Pronunciation**: Chỉ chấm qua transcript, không có audio analysis
2. **API Rate Limit**: OpenAI có rate limit, cần handle gracefully
3. **Storage**: JSON trong TEXT field có limit, cân nhắc dùng JSON column type

---

## 📝 Notes

- AI feedback được lưu dạng JSON string (ensure_ascii=False để giữ Vietnamese)
- Frontend tự động load existing AI grading khi có
- Multi-task grading merge results intelligently
- Error handling cho từng task riêng biệt

---

Created by: GitHub Copilot
Date: February 2, 2026
