import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/images/logo.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="inner">
        <div className="brand">
          <img src={logo} alt="OWL English" className="logo" />
          <div className="tagline">Learn Happily Succeed Easily</div>
        </div>

        <div className="col">
          <h4 className="colTitle">Liên hệ</h4>
          <ul className="list">
            <li><a href="https://zalo.me/0909017399" target='_blank' className="link">Zalo: https://zalo.me/</a></li>
            <li><a href="tel:0909017399" className="link">Hotline: 090 901 73 99</a></li>
            <li><a href="#" className="link">Instagram</a></li>
            <li><a href="#" className="link">Tiktok</a></li>
          </ul>
        </div>

        <div className="col">
          <h4 className="colTitle">Địa chỉ</h4>
          <address className="address">
            824 Sư Vạn Hạnh, P. Hòa Hưng<br />
            Tp. Hồ Chí Minh
          </address>
        </div>
      </div>
    </footer>
  );
}