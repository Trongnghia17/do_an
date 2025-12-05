import { Form, Input, Select, Switch, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const ExamInfo = ({ exam, onUpdate }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.updateExam(exam.id, values);
      
      message.success('Exam updated successfully');
      onUpdate();
    } catch (error) {
      message.error('Failed to update exam');
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
        label="Exam Name"
        rules={[{ required: true, message: 'Please input exam name!' }]}
      >
        <Input placeholder="Enter exam name" />
      </Form.Item>

      <Form.Item
        name="type"
        label="Exam Type"
        rules={[{ required: true, message: 'Please select exam type!' }]}
      >
        <Select placeholder="Select exam type">
          <Option value="online">Online</Option>
          <Option value="ielts">IELTS</Option>
          <Option value="toeic">TOEIC</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={4} placeholder="Enter exam description" />
      </Form.Item>

      <Form.Item
        name="image"
        label="Image URL"
      >
        <Input placeholder="Enter image URL (optional)" />
      </Form.Item>

      <Form.Item
        name="isActive"
        label="Active"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
          Save Changes
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ExamInfo;
