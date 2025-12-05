import React from 'react';
import useAuth from '@/features/auth/store/auth.store';
import avatar_default from '@/assets/images/avatar_default.svg';
import icon_edit_avatar from '@/assets/images/icon_edit_avatar.svg';
import next_right from '@/assets/images/next-right.svg';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();

  const onEdit = (field) => {
    // placeholder: điều hướng hoặc mở modal chỉnh sửa
    console.log('edit', field);
  };

  const onChangePassword = () => console.log('change password');
  const onDeleteAccount = () => console.log('delete account');

  return (
    <div className="profile-page">
      <h3 className="profile-title">THÔNG TIN TÀI KHOẢN</h3>

      <div className="profile-card">
        <div className="profile-section">
          <div className="section-title">Thông tin cá nhân</div>

          <button className="profile-row active-hover" onClick={() => onEdit('avatar')}>
            <div className="row-label">Ảnh đại diện</div>
            <div className="row-value avatar-cell">
              <img src={user?.avatar || avatar_default} alt="avatar" className="avatar-image" />
              <div class="avatar-overlay"></div>
              <div className='avatar-cell-edit-icon'>
                <img src={icon_edit_avatar} alt="" />
              </div>
            </div>
          </button>

          <button className="profile-row" onClick={() => onEdit('name')}>
            <div className="row-label">Họ tên</div>
            <div className="row-value">{user?.name || 'Chưa cập nhật'}
              <img src={next_right} alt="" />
            </div>
          </button>

          <button className="profile-row" onClick={() => onEdit('birthday')}>
            <div className="row-label">Ngày sinh</div>
            <div className="row-value">{user?.birthday || '—'}
              <img src={next_right} alt="" />
            </div>
          </button>

          <button className="profile-row" onClick={() => onEdit('email')}>
            <div className="row-label">Địa chỉ Email</div>
            <div className="row-value txt-ellipsis">{user?.email || '—'}
              <img src={next_right} alt="" />
            </div>
          </button>

          <button className="profile-row" onClick={() => onEdit('phone')}>
            <div className="row-label">Số điện thoại</div>
            <div className="row-value">{user?.phone || '—'}
             <img src={next_right} alt="" />
            </div>
          </button>
        </div>

        <div className="profile-section">
          <div className="section-title">Mật khẩu</div>

          <button className="profile-row" onClick={onChangePassword}>
            <div className="row-label">Mật khẩu</div>
            <div className="row-value">********
              <img src={next_right} alt="" />
            </div>
          </button>
        </div>

        <div className="profile-section profile-section-end">
          <div className="section-title">Nâng cao</div>

          <button className="profile-row danger" onClick={onDeleteAccount}>
            <div className="row-label">Xoá tài khoản</div>
            <div className="row-value">
              <img src={next_right} alt="" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}