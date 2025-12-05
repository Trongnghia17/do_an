import { ConfigProvider } from 'antd';
export default function AntdProvider({ children }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}
