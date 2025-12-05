# Luồng Thi Ngay - Hướng Dẫn Làm Bài

## 📋 Tổng quan

Luồng hoạt động khi người dùng bấm "Thi ngay" từ modal chọn chế độ thi đến trang hướng dẫn.

## 🔄 Luồng hoạt động

### 1. Màn hình chọn chế độ thi (`SelectExamModeModal`)
- Hiển thị 2 chế độ:
  - **Mô phỏng thi thật**: Làm toàn bộ bài thi
  - **Luyện tập**: Chọn từng section để luyện

### 2. Bấm "Thi ngay"
- Khi người dùng bấm nút "Thi ngay", hệ thống sẽ:
  - Tạo dữ liệu exam data (tên, số câu, thời gian...)
  - Navigate đến trang hướng dẫn với route:
    - Full test: `/exam/instructions/{skill_id}`
    - Section: `/exam/instructions/{skill_id}/{section_id}`
  - Truyền examData qua state

### 3. Trang hướng dẫn (`ExamInstructions`)
**Đây là một trang riêng (page), không phải modal!**

Hiển thị các thông tin:

#### Header:
- Nút "Quay lại" để quay về trang trước
- Icon đề thi
- Tên bài thi
- Thông tin cơ bản:
  - Số câu hỏi
  - Số đoạn văn/sections
  - Thời gian làm bài

#### Nội dung:
- **Hướng dẫn làm bài**:
  - Cách di chuyển giữa câu hỏi và đoạn văn
  - Cách trả lời câu hỏi
  - Quy định về thời gian

- **Thông tin bài test**:
  - Số câu hỏi chi tiết
  - Các dạng câu hỏi có trong bài

- **Lưu ý thiết bị**:
  - Khuyến nghị sử dụng desktop/laptop
  - Hạn chế trên thiết bị di động

#### Footer:
- Nút "Bắt đầu" để chính thức vào làm bài

### 4. Bắt đầu làm bài
- Khi bấm "Bắt đầu", hệ thống sẽ:
  - Chuyển hướng đến trang làm bài tương ứng
  - Nếu là full test: `/exam/full/{skill_id}/test`
  - Nếu là section: `/exam/section/{skill_id}/{section_id}/test`

## 📁 Cấu trúc Files

```
React/src/features/exams/
├── components/
│   ├── SelectExamModeModal.jsx      # Modal chọn chế độ thi
│   └── SelectExamModeModal.css      # Styles cho modal
└── pages/
    ├── ExamInstructions.jsx         # Trang hướng dẫn (MỚI)
    └── ExamInstructions.css         # Styles cho trang hướng dẫn (MỚI)
```

## 🎨 UI/UX

### SelectExamModeModal (Modal)
- Modal overlay với 2 phần chính
- Nút "Thi ngay" màu xanh (#045CCE)
- Hiển thị số câu hỏi cho từng section

### ExamInstructions (Trang riêng)
- Layout full màn hình với background gradient
- Container trắng max-width 900px, căn giữa
- Nút "Quay lại" ở đầu trang
- Thiết kế sạch sẽ, dễ đọc, chia thành 3 sections rõ ràng
- Nút "Bắt đầu" nổi bật ở cuối

## 🔧 Routes

### Đã thêm vào routes.jsx:
```jsx
{ path: '/exam/instructions/:skillId', element: <ExamInstructions /> },
{ path: '/exam/instructions/:skillId/:sectionId', element: <ExamInstructions /> },
```

### Navigation flow:
1. User ở trang danh sách skills
2. Click skill → Modal `SelectExamModeModal` mở
3. Click "Thi ngay" → Navigate đến `/exam/instructions/:skillId` (hoặc với `:sectionId`)
4. Trang `ExamInstructions` hiển thị
5. Click "Bắt đầu" → Navigate đến trang làm bài

## 🎯 Props & State

### SelectExamModeModal
```jsx
const handleFullTestClick = () => {
  const examData = {
    name: `${skill.name} - Full Test`,
    duration: getTotalQuestions(),
    questionCount: sections.length,
    timeLimit: skill.time_limit || 60,
    questionTypes: '...'
  };
  
  navigate(`/exam/instructions/${skill.id}`, {
    state: { examData }
  });
};
```

### ExamInstructions
```jsx
const { skillId, sectionId } = useParams();
const location = useLocation();
const examData = location.state?.examData;
```

## 📱 Responsive

### Desktop (> 768px):
- Container max-width 900px
- Padding đầy đủ
- Info items hiển thị ngang

### Mobile/Tablet (≤ 768px):
- Container full width
- Border radius = 0
- Giảm padding
- Font size nhỏ hơn
- Info items xếp dọc
- Nút "Bắt đầu" full width

## 🎯 Next Steps

Để hoàn thiện luồng, cần:
1. ✅ Tạo trang hướng dẫn (`ExamInstructions`)
2. ✅ Thêm routes cho trang hướng dẫn
3. ✅ Cập nhật SelectExamModeModal để navigate
4. ⏳ Tạo trang làm bài chính (`/exam/full/:skillId/test` và `/exam/section/:skillId/:sectionId/test`)
5. ⏳ Implement timer cho bài thi
6. ⏳ Implement chức năng highlight & note

## 💡 Cách test

1. Chạy React app: `cd React && npm run dev`
2. Vào trang danh sách skills (OnlineExamLibrary hoặc PagesTest)
3. Click vào một skill card
4. Modal chọn chế độ sẽ hiển thị
5. Click "Thi ngay" ở bất kỳ chế độ nào
6. **Trang hướng dẫn sẽ mở** (không phải modal!)
7. Click "Quay lại" để quay về
8. Click "Bắt đầu" để vào trang làm bài (cần tạo sau)

## 🐛 Known Issues

- Cần tạo trang làm bài thực tế
- Icon skill hiện tại dùng cứng `speakingIcon`, cần dynamic theo skill type
- Thời gian làm bài section được tính tự động, có thể cần điều chỉnh
- Cần thêm loading state khi navigate
