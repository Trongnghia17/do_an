# React Integration với FastAPI AI Service

## Setup

1. **Cài đặt dependencies** (nếu cần):
```bash
cd React
npm install axios
# hoặc yarn add axios
```

2. **Cấu hình environment variable**:

Thêm vào file `.env` hoặc `.env.local`:
```bash
VITE_FASTAPI_URL=http://localhost:8000
```

## Files đã tạo

### 1. API Client (`src/lib/fastapi-client.js`)
- Axios client để gọi FastAPI endpoints
- Các functions cho AI Generation, AI Grading, Exam Management
- Sử dụng environment variable cho URL

### 2. Hooks

#### `src/hooks/useAIGeneration.js`
Hook cho AI generation features:
- `generateQuestions()` - Sinh câu hỏi
- `generateContent()` - Sinh passages/dialogues
- `generateExam()` - Sinh toàn bộ đề thi

#### `src/hooks/useAIGrading.js`
Hook cho AI grading features:
- `gradeWriting()` - Chấm Writing
- `gradeSpeaking()` - Chấm Speaking
- `getFeedback()` - Lấy feedback chi tiết
- `gradeBatch()` - Chấm hàng loạt

### 3. Components

#### `src/components/ai/AIWritingGrading.jsx`
Component để chấm Writing với AI:
- Textarea để nhập answer
- Word counter
- Display grading results với scores, feedback, suggestions
- Reusable trong exam flow

#### `src/components/ai/AIQuestionGenerator.jsx`
Component để sinh câu hỏi (Admin/Teacher tool):
- Form để config (exam type, skill, topic, difficulty)
- Generate questions button
- Display generated questions
- Export để add vào database

## Cách sử dụng trong project

### 1. Tích hợp AIWritingGrading vào exam flow

```jsx
// Trong component WritingQuestion.jsx hoặc tương tự
import { AIWritingGrading } from '@/components/ai/AIWritingGrading';

function WritingExamPage() {
  const handleGraded = (result) => {
    // Save result to database
    // Update UI with score
    console.log('Grading result:', result);
  };

  return (
    <div>
      <AIWritingGrading
        question={currentQuestion}
        questionId={currentQuestion.id}
        examType="IELTS"
        onGraded={handleGraded}
      />
    </div>
  );
}
```

### 2. Sử dụng Question Generator cho Admin

```jsx
// Trong Admin Dashboard hoặc Question Management page
import { AIQuestionGenerator } from '@/components/ai/AIQuestionGenerator';
import { questionAPI } from '@/lib/fastapi-client';

function QuestionManagement() {
  const handleQuestionsGenerated = async (questions) => {
    // Save questions to database
    for (const question of questions) {
      await questionAPI.createQuestion({
        content: question.content,
        answer_content: question.correct_answer,
        metadata: {
          question_type: question.question_type,
          options: question.options,
          explanation: question.explanation,
        },
        // other fields...
      });
    }
    
    toast.success('Questions saved successfully!');
  };

  return (
    <div>
      <h1>AI Question Generator</h1>
      <AIQuestionGenerator onQuestionsGenerated={handleQuestionsGenerated} />
    </div>
  );
}
```

### 3. Direct API calls với hooks

```jsx
import { useAIGrading } from '@/hooks/useAIGrading';

function CustomGradingComponent() {
  const { gradeWriting, loading, result, error } = useAIGrading();

  const handleSubmit = async () => {
    const gradingResult = await gradeWriting(
      questionId,
      questionText,
      userAnswer,
      'IELTS',
      userId
    );
    
    // Use result
    console.log(gradingResult.overall_score);
    console.log(gradingResult.detailed_feedback);
  };

  return (
    <div>
      {/* Your UI */}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Grading...' : 'Submit'}
      </button>
      
      {result && (
        <div>Score: {result.overall_score}</div>
      )}
    </div>
  );
}
```

## Components hiện có có thể tái sử dụng

Từ codebase React hiện tại, các components sau có thể được tái sử dụng:

1. **UI Components** (từ `src/components/ui/`):
   - Button, Card, Input, Textarea, Select, Alert
   - Badge, Label, Dialog, etc.

2. **Layout Components**:
   - Có thể tạo Admin pages cho Question Generator
   - Tích hợp vào existing exam pages

3. **State Management**:
   - Có thể dùng existing Redux/Context nếu có
   - Hooks có thể integrate với global state

## Best Practices

1. **Error Handling**:
```jsx
try {
  const result = await gradeWriting(...);
  // Success
} catch (error) {
  // Show error toast/notification
  toast.error('Failed to grade. Please try again.');
}
```

2. **Loading States**:
```jsx
{loading && <Loader2 className="animate-spin" />}
<Button disabled={loading}>
  {loading ? 'Processing...' : 'Submit'}
</Button>
```

3. **Caching Results** (optional):
```jsx
// Store grading results to avoid re-grading
const [cachedResults, setCachedResults] = useState({});

const gradingResult = cachedResults[questionId] 
  || await gradeWriting(...);
```

## Testing

```bash
# Make sure FastAPI service is running
cd ../FastAPI-Service
poetry run python run.py

# In React
npm run dev
```

Access: http://localhost:5173

## Notes

- Components sử dụng shadcn/ui patterns (adjust nếu dùng UI library khác)
- Có thể customize styling theo design system hiện tại
- API calls có thể add authentication headers nếu cần
- Consider adding retry logic cho failed requests
