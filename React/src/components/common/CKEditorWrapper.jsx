import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './CKEditorWrapper.css';
import api from '../../lib/axios';

const CKEditorWrapper = ({ value = '', onChange, placeholder = 'Start typing...', disabled = false }) => {
  const quillRef = useRef(null);

  // Image upload handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          // Use api instance which automatically includes auth token
          const response = await api.post('/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // Get image URL from response
          let imageUrl = response.data.url;
          
          // If URL is relative, convert to absolute
          const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
          if (imageUrl.startsWith('/')) {
            imageUrl = `${FASTAPI_URL}${imageUrl}`;
          }
          
          // Insert image into editor
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image: ' + (error.response?.data?.detail || error.message));
        }
      }
    };
  };

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  // Quill formats
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list',
    'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  const handleChange = (content) => {
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className="ckeditor-wrapper">
      <div className="main-container">
        <div className="editor-container editor-container_classic-editor">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value || ''}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default CKEditorWrapper;
