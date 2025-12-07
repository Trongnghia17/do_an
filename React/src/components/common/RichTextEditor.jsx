import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Space } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import './RichTextEditor.css';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor-toolbar">
      <Space size="small">
        <Button
          size="small"
          type={editor.isActive('bold') ? 'primary' : 'default'}
          icon={<BoldOutlined />}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Button
          size="small"
          type={editor.isActive('italic') ? 'primary' : 'default'}
          icon={<ItalicOutlined />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Button
          size="small"
          type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          size="small"
          type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          size="small"
          type={editor.isActive('bulletList') ? 'primary' : 'default'}
          icon={<UnorderedListOutlined />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Button
          size="small"
          type={editor.isActive('orderedList') ? 'primary' : 'default'}
          icon={<OrderedListOutlined />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Button
          size="small"
          icon={<UndoOutlined />}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <Button
          size="small"
          icon={<RedoOutlined />}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </Space>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder, readOnly = false }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
  });

  // Update content when value changes from outside
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="rich-text-editor-container">
      {!readOnly && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="rich-text-editor-content" />
    </div>
  );
};

export default RichTextEditor;
