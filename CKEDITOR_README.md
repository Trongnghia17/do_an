# Rich Text Editor Integration - React-Quill

Dự án đã được nâng cấp từ RichTextEditor (TipTap) sang **React-Quill** - một trình soạn thảo văn bản mạnh mẽ, ổn định và dễ sử dụng dựa trên Quill.js.

## Cài đặt

Package đã được cài đặt:
- `react-quill`: React wrapper cho Quill.js editor

## Component: CKEditorWrapper

Component wrapper: `/src/components/common/CKEditorWrapper.jsx` (tên giữ nguyên để tương thích)

### Cách sử dụng

```jsx
import CKEditorWrapper from '../../../components/common/CKEditorWrapper';

// Sử dụng trong component
<CKEditorWrapper
  value={content}
  onChange={(value) => setContent(value)}
  placeholder="Start typing..."
  disabled={false}
/>
```

### Props

- **value** (string): Nội dung HTML của editor
- **onChange** (function): Callback khi nội dung thay đổi, nhận 1 tham số là HTML string
- **placeholder** (string, optional): Text hiển thị khi editor trống
- **disabled** (boolean, optional): Vô hiệu hóa editor

## Tính năng React-Quill

### Toolbar đầy đủ

- **Headings**: H1, H2, H3, H4, H5, H6 và Paragraph
- **Font**: Font family và font size (Small, Normal, Large, Huge)
- **Formatting**: Bold, Italic, Underline, Strikethrough
- **Color**: Text color và Background color với color picker
- **Script**: Subscript và Superscript
- **Lists**: Ordered list, Bullet list, Checklist (Todo list)
- **Indent**: Increase/Decrease indentation
- **Alignment**: Left, Center, Right, Justify
- **Blockquote**: Quote blocks
- **Code Block**: Code với syntax highlighting
- **Links**: Hyperlinks
- **Media**: Images, Videos
- **Clean**: Remove formatting

### Upload hình ảnh & Video

React-Quill hỗ trợ:
1. **Base64 Images**: Tự động chuyển đổi ảnh thành base64 (mặc định)
2. **Image URL**: Chèn ảnh qua URL
3. **Video Embed**: Embed video từ YouTube, Vimeo, etc.

### Checklist (Todo List)

- Interactive todo lists với checkbox
- Click để đánh dấu hoàn thành
- Perfect cho task lists, requirements, etc.

## Customization

### Thay đổi toolbar

Chỉnh sửa `modules` trong `/src/components/common/CKEditorWrapper.jsx`:

```jsx
const modules = useMemo(() => ({
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    // ... thêm hoặc bỏ items
  ]
}), []);
```

### Thay đổi chiều cao

Chỉnh sửa trong `/src/components/common/CKEditorWrapper.css`:

```css
.ck-editor__editable {
  min-height: 200px; /* Thay đổi giá trị này */
  max-height: 500px; /* Thay đổi giá trị này */
}
```

### Thay đổi màu sắc

File CSS đã được tùy chỉnh để match với Ant Design theme. Chỉnh sửa các class trong `CKEditorWrapper.css`.

## Files đã thay đổi

1. **New**: `/src/components/common/CKEditorWrapper.jsx` - Component CKEditor mới
2. **New**: `/src/components/common/CKEditorWrapper.css` - Styles cho CKEditor
3. **Updated**: `/src/features/admin/pages/SkillDetail.jsx` - Thay RichTextEditor bằng CKEditorWrapper

## Migration từ RichTextEditor

Nếu có component khác đang dùng RichTextEditor, thay thế như sau:

```jsx
// Trước
import RichTextEditor from '../../../components/common/RichTextEditor';
<RichTextEditor value={content} onChange={setContent} />

// Sau
import CKEditorWrapper from '../../../components/common/CKEditorWrapper';
<CKEditorWrapper value={content} onChange={setContent} />
```

## Lưu ý

1. **Performance**: CKEditor tải nhiều plugin, có thể chậm hơn TipTap một chút khi khởi tạo
2. **Bundle size**: CKEditor lớn hơn (~500KB minified), cân nhắc code splitting nếu cần
3. **HTML Output**: CKEditor output HTML chuẩn hơn và có nhiều semantic tags
4. **Browser Support**: Hỗ trợ tốt trên các browser hiện đại (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### Editor không hiển thị

Kiểm tra console xem có lỗi gì. Thường do:
- Thiếu CSS import
- Conflict với CSS khác
- Version mismatch giữa các package CKEditor

### Ảnh không upload được

Hiện tại dùng Base64 adapter. Nếu muốn upload lên server:
1. Implement custom upload adapter
2. Thay `Base64UploadAdapter` trong plugins

### Muốn thêm plugin khác

1. Import plugin từ `ckeditor5`
2. Thêm vào `editorConfig.plugins`
3. Thêm button vào `toolbar.items` nếu cần

## Resources

- [CKEditor 5 Documentation](https://ckeditor.com/docs/ckeditor5/latest/)
- [CKEditor 5 API Reference](https://ckeditor.com/docs/ckeditor5/latest/api/)
- [CKEditor 5 Builder](https://ckeditor.com/ckeditor-5/builder/)
