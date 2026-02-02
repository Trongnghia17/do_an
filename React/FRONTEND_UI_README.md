# 🎨 Frontend UI - AI Grading System

## ✅ Đã Có Components

### 1. AIWritingGrading.jsx ✅ (Đã cập nhật)
Component để chấm điểm Writing với đầy đủ tính năng mới:
- ✅ Hiển thị 4 tiêu chí với điểm số
- ✅ Feedback chi tiết cho từng tiêu chí
- ✅ Band justification
- ✅ Strengths, weaknesses, suggestions
- ✅ UI đẹp với Tailwind + shadcn/ui

**Location:** `src/components/ai/AIWritingGrading.jsx`

### 2. AISpeakingGrading.jsx ✅ (MỚI TẠO)
Component để chấm điểm Speaking:
- ✅ Input transcript
- ✅ Hiển thị 4 tiêu chí Speaking
- ✅ Feedback chi tiết cho từng tiêu chí
- ✅ Pronunciation note (lưu ý đặc biệt)
- ✅ Band justification
- ✅ Strengths, weaknesses, suggestions

**Location:** `src/components/ai/AISpeakingGrading.jsx`

### 3. useAIGrading Hook ✅ (Đã có sẵn)
Custom hook để gọi API:
- ✅ `gradeWriting()`
- ✅ `gradeSpeaking()`
- ✅ `getFeedback()`
- ✅ `gradeBatch()`

**Location:** `src/hooks/useAIGrading.js`

### 4. Demo Page ✅ (MỚI TẠO)
Trang demo để test các components:
- ✅ Tabs cho Writing và Speaking
- ✅ Sample questions
- ✅ Info về band descriptors

**Location:** `src/pages/demo/AIGradingDemo.jsx`

---

## 🎯 Sử Dụng Components

### Writing Grading

```jsx
import { AIWritingGrading } from '@/components/ai';

function ExamPage() {
  const question = {
    id: 1,
    title: 'IELTS Writing Task 2',
    content: 'Some people think that...',
  };

  const handleGraded = (result) => {
    console.log('Grading result:', result);
    // Save to database, show notification, etc.
  };

  return (
    <AIWritingGrading
      question={question}
      questionId={question.id}
      examType="IELTS"
      onGraded={handleGraded}
    />
  );
}
```

### Speaking Grading

```jsx
import { AISpeakingGrading } from '@/components/ai';

function SpeakingExamPage() {
  const question = {
    id: 2,
    title: 'IELTS Speaking Part 2',
    content: 'Describe a book you have recently read...',
  };

  return (
    <AISpeakingGrading
      question={question}
      questionId={question.id}
      examType="IELTS"
      onGraded={(result) => console.log(result)}
    />
  );
}
```

---

## 📦 Dependencies

Đã có trong project:
- ✅ React
- ✅ Tailwind CSS
- ✅ shadcn/ui components
- ✅ lucide-react icons
- ✅ axios (trong fastapi-client)

---

## 🎨 UI Features

### Writing Grading UI
- Input textarea với word count
- Loading state khi đang chấm
- Overall score hiển thị to và đẹp
- 4 criteria scores với feedback chi tiết
- Strengths (màu xanh)
- Weaknesses (màu cam)
- Suggestions (numbered list)
- Band justification (màu xanh nhạt)

### Speaking Grading UI
- Textarea cho transcript với word count
- Note về việc nhập transcript
- Loading state
- Overall score
- 4 criteria scores với feedback
- **Pronunciation note** (màu vàng) - UNIQUE
- Strengths, weaknesses, suggestions
- Band justification
- Reset button để chấm câu khác

---

## 🚀 Test UI

### 1. Chạy Demo Page

Thêm route vào router:

```jsx
// src/app/routes.jsx hoặc router config
import AIGradingDemo from '@/pages/demo/AIGradingDemo';

{
  path: '/demo/ai-grading',
  element: <AIGradingDemo />,
}
```

### 2. Truy cập

```
http://localhost:5173/demo/ai-grading
```

### 3. Test

- **Tab Writing:** Viết bài essay và click "Submit for AI Grading"
- **Tab Speaking:** Paste transcript và click "Chấm Điểm Speaking"
- Xem kết quả với đầy đủ feedback

---

## 📱 Responsive Design

Components đã responsive:
- ✅ Mobile: 1 column
- ✅ Tablet: 2 columns cho criteria scores
- ✅ Desktop: Full width với layout đẹp

---

## 🎨 Customization

### Màu sắc band scores

Có thể thêm logic màu theo band:

```jsx
const getBandColor = (score) => {
  if (score >= 8.0) return 'text-green-600';
  if (score >= 7.0) return 'text-blue-600';
  if (score >= 6.0) return 'text-yellow-600';
  if (score >= 5.0) return 'text-orange-600';
  return 'text-red-600';
};
```

### Icons

Có thể thêm icons cho các tiêu chí:

```jsx
const criteriaIcons = {
  task_achievement: '🎯',
  coherence_cohesion: '🔗',
  lexical_resource: '📚',
  grammatical_accuracy: '✍️',
  fluency_coherence: '💬',
  pronunciation: '🔊',
};
```

---

## 🔧 Integration với Exam Flow

### Trong Exam Taking Page

```jsx
import { AIWritingGrading, AISpeakingGrading } from '@/components/ai';

function ExamTakingPage() {
  const [showGrading, setShowGrading] = useState(false);
  const currentQuestion = {...};

  if (currentQuestion.type === 'essay') {
    return (
      <>
        {/* Existing exam UI */}
        
        <Button onClick={() => setShowGrading(true)}>
          Chấm Điểm AI
        </Button>

        {showGrading && (
          <Modal>
            <AIWritingGrading
              question={currentQuestion}
              questionId={currentQuestion.id}
              onGraded={(result) => {
                // Save result to submission
                setShowGrading(false);
              }}
            />
          </Modal>
        )}
      </>
    );
  }

  if (currentQuestion.type === 'speaking') {
    return (
      <AISpeakingGrading
        question={currentQuestion}
        questionId={currentQuestion.id}
        onGraded={(result) => {
          // Save result
        }}
      />
    );
  }
}
```

---

## 📊 Response Format

Components expect API response:

```typescript
interface GradingResult {
  status: string;
  question_id: number;
  overall_score: number;
  criteria_scores: {
    [key: string]: number;
  };
  criteria_feedback?: {
    [key: string]: string;
  };
  strengths: string[];
  weaknesses: string[];
  detailed_feedback: string;
  suggestions: string[];
  band_justification?: string;
  pronunciation_note?: string; // Speaking only
}
```

---

## ⚡ Performance

- Loading state hiển thị ngay lập tức
- Disable input khi đang chấm
- Result được cache trong state
- Có thể reset để chấm lại

---

## 🐛 Error Handling

Components có built-in error handling:
- Alert hiển thị error message
- Có thể retry
- Error không crash UI

---

## 📝 TODO (Tương lai)

- [ ] Export kết quả ra PDF
- [ ] Compare với lần chấm trước
- [ ] Highlight text với feedback
- [ ] Speech-to-text integration cho Speaking
- [ ] Progress bar cho từng tiêu chí
- [ ] Animation khi hiển thị kết quả
- [ ] Dark mode support

---

## 🎓 Screenshots

### Writing Grading
```
┌─────────────────────────────────────┐
│ IELTS Writing Task 2                │
├─────────────────────────────────────┤
│ Question text...                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Your Answer              250 w  │ │
│ │ [Textarea]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [ Submit for AI Grading ]           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✓ Grading Results                   │
├─────────────────────────────────────┤
│            7.0                       │
│      Band Score (out of 9)          │
├─────────────────────────────────────┤
│ 📊 Criteria Scores                  │
│ ┌───────────┬───────────┐          │
│ │ Task Ach. │ Coherence │          │
│ │   7.0/9   │   7.5/9   │          │
│ └───────────┴───────────┘          │
│ ┌───────────┬───────────┐          │
│ │ Lexical   │ Grammar   │          │
│ │   6.5/9   │   7.0/9   │          │
│ └───────────┴───────────┘          │
├─────────────────────────────────────┤
│ ✅ Strengths                        │
│ • Clear structure                   │
│ • Good linking words                │
├─────────────────────────────────────┤
│ ⚠️ Areas for Improvement            │
│ • Grammar tenses                    │
├─────────────────────────────────────┤
│ 💡 Suggestions                      │
│ 1. Practice complex sentences       │
│ 2. Use more academic words          │
└─────────────────────────────────────┘
```

---

## 📞 Support

- Check `useAIGrading` hook for API calls
- See `AI_GRADING_IELTS_GUIDE.md` for backend details
- Demo page: `/demo/ai-grading`

---

**Created:** 2026-02-01  
**Status:** ✅ Ready to use  
**Components:** 2 (Writing + Speaking)
