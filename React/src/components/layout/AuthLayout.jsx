import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{ height: '100vh' }}>
      <Outlet />
    </div>
  );
}
