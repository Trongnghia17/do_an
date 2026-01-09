// Debug component để kiểm tra user info
import React, { useEffect, useState } from 'react';
import { Card, Descriptions } from 'antd';
import api from '@/lib/axios';

export default function DebugUserInfo() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get from localStorage
    const localUser = {
      userName: localStorage.getItem('userName'),
      userEmail: localStorage.getItem('userEmail'),
      roleId: localStorage.getItem('roleId'),
      userId: localStorage.getItem('userId'),
    };
    
    console.log('LocalStorage User Info:', localUser);
    
    // Try to fetch from API
    api.get('/users/me')
      .then(res => {
        console.log('API User Info:', res.data);
        setUserInfo(res.data);
      })
      .catch(err => {
        console.error('Error fetching user:', err);
      });
  }, []);

  return (
    <Card title="Debug: User Information">
      <Descriptions column={1}>
        <Descriptions.Item label="User Name (localStorage)">
          {localStorage.getItem('userName')}
        </Descriptions.Item>
        <Descriptions.Item label="User Email (localStorage)">
          {localStorage.getItem('userEmail')}
        </Descriptions.Item>
        <Descriptions.Item label="Role ID (localStorage)">
          {localStorage.getItem('roleId')}
        </Descriptions.Item>
        <Descriptions.Item label="User ID (localStorage)">
          {localStorage.getItem('userId')}
        </Descriptions.Item>
      </Descriptions>
      
      {userInfo && (
        <>
          <h3>From API:</h3>
          <pre>{JSON.stringify(userInfo, null, 2)}</pre>
        </>
      )}
    </Card>
  );
}
