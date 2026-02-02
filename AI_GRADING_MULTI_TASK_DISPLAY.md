# AI Grading Multi-Task Display

## 🎯 Mục Tiêu
Hiển thị kết quả chấm điểm AI riêng biệt cho từng Task trong IELTS Writing (Task 1 và Task 2) với UI tabs chuyên nghiệp.

**IELTS Writing Weighted Scoring:**
- **Task 1** = 33.3% (1/3) tổng điểm
- **Task 2** = 66.7% (2/3) tổng điểm
- **Overall Band** = (Task 1 × 1/3) + (Task 2 × 2/3), làm tròn đến 0.5

**Ví dụ:**
- Task 1: Band 7.0, Task 2: Band 6.0
- Overall = (7.0 × 1/3) + (6.0 × 2/3) = 2.33 + 4.00 = 6.33 ≈ **6.5**

## 🚀 Tính Năng

### 1. Single Task Display
Khi bài thi chỉ có **1 task** (Task 1 hoặc Task 2):
- Hiển thị trực tiếp kết quả AI grading
- Không có tabs, UI gọn gàng
- Criteria scores phù hợp với task type

### 2. Multi-Task Display
Khi bài thi có **2+ tasks** (Task 1 + Task 2):
- **Overall Score Card**: Hiển thị điểm trung bình tổng thể với gradient purple
- **Task Tabs**: Tab cho từng task với label và score riêng
- **Task Content**: Click tab để xem chi tiết từng task
- **Separate Criteria**: Mỗi task có criteria đúng (TA hoặc TR)

## 📊 Cấu Trúc Dữ Liệu

### Single Task Response:
```javascript
{
  overall_band: 7.0,
  criteria_scores: {
    task_achievement: 7.0,  // hoặc task_response
    coherence_cohesion: 7.5,
    lexical_resource: 6.5,
    grammatical_accuracy: 7.0
  },
  criteria_feedback: { ... },
  strengths: [...],
  weaknesses: [...],
  suggestions: [...],
  detailed_feedback: "..."
}
```

### Multi-Task Response:
```javascript
{
  isMultiTask: true,
  overall_band: 6.5,  // Weighted average: (7.0 × 1/3) + (6.0 × 2/3) = 6.33 ≈ 6.5
  tasks: [
    {
      taskNumber: 1,
      result: {
        overall_band: 7.0,
        criteria_scores: {
          task_achievement: 7.0,  // Task 1 dùng TA
          coherence_cohesion: 7.5,
          lexical_resource: 6.5,
          grammatical_accuracy: 7.0
        },
        criteria_feedback: { ... },
        strengths: [...],
        weaknesses: [...],
        suggestions: [...],
        detailed_feedback: "..."
      }
    },
    {
      taskNumber: 2,
      result: {
        overall_band: 6.0,
        criteria_scores: {
          task_response: 6.0,  // Task 2 dùng TR
          coherence_cohesion: 6.5,
          lexical_resource: 6.0,
          grammatical_accuracy: 6.0
        },
        criteria_feedback: { ... },
        strengths: [...],
        weaknesses: [...],
        suggestions: [...],
        detailed_feedback: "..."
      }
    }
  ]
}
```

## 🔧 Implementation

### Backend Logic (TestResult.jsx)

```javascript
// Chấm từng task riêng biệt
const gradingResults = [];
for (const answer of answersToGrade) {
  const gradingResult = await gradeWriting(...);
  if (gradingResult) {
    gradingResults.push({
      question_id: answer.question_id,
      result: gradingResult
    });
  }
}

// Xử lý kết quả
if (gradingResults.length === 1) {
  // Single task
  setAiGradingResult(gradingResults[0].result);
} else {
  // Multi-task with IELTS weighted scoring
  let weightedScore;
  
  if (gradingResults.length === 2) {
    const task1Score = parseFloat(gradingResults[0].result.overall_band) || 0;
    const task2Score = parseFloat(gradingResults[1].result.overall_band) || 0;
    
    // IELTS Writing: Task 1 = 1/3, Task 2 = 2/3
    weightedScore = (task1Score * (1/3)) + (task2Score * (2/3));
    weightedScore = Math.round(weightedScore * 2) / 2; // Round to nearest 0.5
  } else {
    // Fallback for other cases
    const sum = gradingResults.reduce((acc, r) => {
      const score = parseFloat(r.result.overall_band) || 0;
      return acc + score;
    }, 0);
    weightedScore = sum / gradingResults.length;
    weightedScore = Math.round(weightedScore * 2) / 2;
  }
  
  setAiGradingResult({
    isMultiTask: true,
    overall_band: parseFloat(weightedScore.toFixed(1)),
    tasks: gradingResults.map((r, idx) => ({
      taskNumber: idx + 1,
      result: r.result
    }))
  });
}
```

### Frontend Components

#### TaskAIGradingSection Component
Helper component để render AI grading cho 1 task:
- Reusable cho cả single và multi-task
- Props: `taskResult`, `taskNumber`
- Hiển thị: Criteria scores, feedback, strengths, weaknesses, suggestions

#### WritingResultUI Component
Main component với state management:
```javascript
const [activeTab, setActiveTab] = useState(0);

// Conditional rendering
{aiGradingResult.isMultiTask ? (
  // Multi-task UI with tabs
  <>
    <div className="multi-task-overview">
      <span>Điểm Trung Bình: {overall_band}</span>
    </div>
    
    <div className="task-tabs">
      <div className="task-tabs__header">
        {tasks.map((task, idx) => (
          <button 
            className={activeTab === idx ? 'active' : ''}
            onClick={() => setActiveTab(idx)}
          >
            Task {task.taskNumber}: Band {task.result.overall_band}
          </button>
        ))}
      </div>
      
      <div className="task-tabs__content">
        <TaskAIGradingSection 
          taskResult={tasks[activeTab].result}
        />
      </div>
    </div>
  </>
) : (
  // Single task UI
  <TaskAIGradingSection taskResult={aiGradingResult} />
)}
```

## 🎨 UI Design

### Multi-Task Overview Card
- **Background**: Purple gradient (`#667eea` → `#764ba2`)
- **Layout**: Centered with large score display
- **Content**: 
  - Label: "Writing Overall Band"
  - Value: Large bold score (e.g., `6.5`)
  - Note: "Task 1 (1/3) + Task 2 (2/3)" for 2 tasks

### Task Tabs Header
- **Background**: Light gray (`#f9fafb`)
- **Tabs**: Flex layout, equal width
- **Tab Label**: "Task 1 (33%)" / "Task 2 (67%)" - shows weight percentage
- **Active State**: 
  - White background
  - Bottom border: 3px solid purple (`#667eea`)
  - Label color: Purple
- **Hover State**: Light purple background (`rgba(102, 126, 234, 0.05)`)

### Tab Button Content
- **Label**: "Task 1" / "Task 2" (font-weight: 600)
- **Score**: Large score display (font-size: 1.5rem, color: purple)
- **Layout**: Column flex with gap

### Tab Content Area
- **Background**: White
- **Padding**: 2rem
- **Animation**: Fade in effect when switching tabs
- **Content**: Full AI grading details for selected task

## 📱 Responsive Design

### Desktop (> 768px)
- Tabs display horizontally in a row
- Full 2-column layout for criteria grid
- Spacious padding

### Tablet/Mobile (≤ 768px)
- Tabs stack vertically
- Active tab has left border (4px purple) instead of bottom
- Score font-size reduced
- Single column criteria grid

## 🔄 User Flow

```
1. User completes Writing exam with 2 tasks
   ↓
2. Click "Chấm Điểm AI Ngay"
   ↓
3. Backend grades both tasks separately:
   - Task 1 → API call with question_text + answer_text
   - Task 2 → API call with question_text + answer_text
   ↓
4. Backend detects:
   - Task 1: Keywords → task_achievement
   - Task 2: No keywords → task_response
   ↓
5. Frontend receives multi-task response:
   - isMultiTask: true
   - overall_band: 7.0
   - tasks: [task1_result, task2_result]
   ↓
6. UI displays:
   - Purple overview card with average score
   - 2 tabs: "Task 1: Band 7.0" | "Task 2: Band 7.0"
   - Default: Task 1 selected
   ↓
7. User clicks "Task 2" tab
   ↓
8. Content fades in showing Task 2 details:
   - Task Response criterion (not Task Achievement)
   - Task 2 specific feedback
   - Task 2 strengths/weaknesses/suggestions
```

## 🧪 Test Cases

### Case 1: Single Task (Task 1 only)
- Input: 1 answer with Task 1 keywords
- Expected: Direct display without tabs
- Criteria: `task_achievement`

### Case 2: Single Task (Task 2 only)
- Input: 1 answer without Task 1 keywords
- Expected: Direct display without tabs
- Criteria: `task_response`

### Case 3: Multi-Task (Task 1 + Task 2)
- Input: 2 answers (1 with keywords, 1 without)
- Expected: 
  - Overview card with average: `(7.0 + 7.0) / 2 = 7.0`
  - Tab 1: Task Achievement
  - Tab 2: Task Response
  - Click tabs to switch content

### Case 4: Weighted Score Calculation (IELTS Standard)
- Input: 
  - Task 1 = Band 7.0
  - Task 2 = Band 6.0
- Calculation: 
  - (7.0 × 1/3) + (6.0 × 2/3)
  - = 2.333 + 4.000
  - = 6.333
- Expected Overall: **6.5** (rounded to nearest 0.5)

### Case 5: Another Weighted Example
- Input:
  - Task 1 = Band 6.5
  - Task 2 = Band 7.5
- Calculation:
  - (6.5 × 1/3) + (7.5 × 2/3)
  - = 2.167 + 5.000
  - = 7.167
- Expected Overall: **7.0** (rounded to nearest 0.5)

## 💡 Key Benefits

✅ **Clear Separation**: Each task has distinct feedback with appropriate criteria
✅ **User-Friendly**: Intuitive tab interface for easy navigation
✅ **Professional Design**: Purple gradient theme matching AI branding
✅ **Accurate Assessment**: Task 1 uses TA, Task 2 uses TR as per IELTS standards
✅ **Responsive**: Works perfectly on desktop, tablet, and mobile
✅ **Reusable Components**: TaskAIGradingSection can be used anywhere
✅ **Smooth UX**: Fade-in animations when switching tabs

## 🔗 Related Files

### Frontend
- `/React/src/features/user/exams/pages/TestResult.jsx` - Main logic
- `/React/src/features/user/exams/components/WritingResultUI.jsx` - UI component
- `/React/src/features/user/exams/components/WritingResultUI.css` - Styling

### Backend
- `/FastAPI-Service/app/services/chatgpt_service.py` - Task detection & grading
- `/FastAPI-Service/app/api/v1/endpoints/grading.py` - API endpoints

### Documentation
- [AI_GRADING_TASK_DIFFERENTIATION.md](./AI_GRADING_TASK_DIFFERENTIATION.md) - Task 1 vs Task 2 criteria
- [AI_GRADING_PERSISTENCE.md](./AI_GRADING_PERSISTENCE.md) - Database storage
- [WRITING_SPEAKING_UI_README.md](./WRITING_SPEAKING_UI_README.md) - UI components overview

## 🎯 Future Enhancements

- [ ] Add "Compare Tasks" view to see both side-by-side
- [ ] Export individual task reports as PDF
- [ ] Add task-level comments from teachers
- [ ] Support 3+ tasks for other exam types
- [ ] Add visual indicators for which criterion differs between tasks
- [ ] Implement drag-to-reorder tabs
