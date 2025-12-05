import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import QueryProvider from './app/providers/QueryProvider';
import AuthProvider from './app/providers/AuthProvider';
import AntdProvider from './app/providers/AntdProvider';
import { router } from './app/routes';
import './styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AntdProvider>
      <QueryProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </QueryProvider>
    </AntdProvider>
  </React.StrictMode>
);
