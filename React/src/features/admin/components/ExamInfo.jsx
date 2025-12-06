import { useState } from 'react';
import { Form, Input, Select, Switch, Button, message, Upload } from 'antd';
import { SaveOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import adminService from '../services/adminService';

const { TextArea } = Input;
const { Option } = Select;

const ExamInfo = ({ exam, onUpdate }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(exam?.image || '');

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const response = await adminService.uploadImage(file);
      const uploadedImageUrl = response.url;
      setImageUrl(uploadedImageUrl);
      form.setFieldsValue({ image: uploadedImageUrl });
      message.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Không thể tải ảnh lên');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    form.setFieldsValue({ image: '' });
    message.success('Đã xóa hình ảnh');
  };

  const handleSubmit = async (values) => {
    try {
      // Transform data to FastAPI format
      const updateData = {
        name: values.name,
        type: values.type,
        description: values.description || null,
        image: imageUrl || null,
        is_active: values.isActive,
      };
      
      await adminService.updateExam(exam.id, updateData);
      message.success('Cập nhật bộ đề thành công');
      onUpdate();
    } catch (error) {
      console.error('Error updating exam:', error);
      message.error(error.response?.data?.detail || 'Không thể cập nhật bộ đề');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={exam}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="Tên bộ đề"
        rules={[{ required: true, message: 'Vui lòng nhập tên bộ đề!' }]}
      >
        <Input placeholder="Nhập tên bộ đề" />
      </Form.Item>

      <Form.Item
        name="type"
        label="Loại đề thi"
        rules={[{ required: true, message: 'Vui lòng chọn loại đề thi!' }]}
      >
        <Select placeholder="Chọn loại đề thi">
          <Option value="online">Online</Option>
          <Option value="ielts">IELTS</Option>
          <Option value="toeic">TOEIC</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả"
      >
        <TextArea rows={4} placeholder="Nhập mô tả bộ đề" />
      </Form.Item>

      <Form.Item label="Hình ảnh">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div>
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
              </Button>
            </Upload>
            {imageUrl && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemoveImage}
                style={{ marginLeft: 8 }}
              >
                Xóa ảnh
              </Button>
            )}
          </div>
          {imageUrl && (
            <div>
              <img
                src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
                alt="Preview"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9'
                }}
              />
            </div>
          )}
        </div>
        <Form.Item name="image" hidden>
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item
        name="isActive"
        label="Trạng thái hiển thị"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
          Lưu thay đổi
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ExamInfo;
