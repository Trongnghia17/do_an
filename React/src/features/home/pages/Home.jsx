import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import heroImg from '@/assets/images/img-hero.png';
import cu1 from '@/assets/images/cu1.png';
import cu2 from '@/assets/images/cu2.png';
import cu3 from '@/assets/images/cu3.png';
import sach1 from '@/assets/images/sach1.svg';
import sach2 from '@/assets/images/sach2.svg';
import sach3 from '@/assets/images/sach3.svg';
import sachfull1 from '@/assets/images/sachfull1.png';
import sachfull2 from '@/assets/images/sachfull2.png';
import sachfull3 from '@/assets/images/sachfull3.png';
import luado from '@/assets/images/luado.svg';
import luaxanh from '@/assets/images/luaxanh.svg';
import tainghe_icon from '@/assets/images/tainghe-icon.png';
import tainghe_icon2 from '@/assets/images/tainghe-icon2.png';
import tainghe_icon3 from '@/assets/images/tainghe-icon3.png';
import tainghe_icon4 from '@/assets/images/tainghe-icon4.png';
import next_icon from '@/assets/images/next-icon.svg';
import full_test from '@/assets/images/full-test.png';
import tong_quan from '@/assets/images/tong-quan.png';
import hicon1 from '@/assets/images/hicon1.svg';
import hicon2 from '@/assets/images/hicon2.svg';
import hicon3 from '@/assets/images/hicon3.svg';
import hicon4 from '@/assets/images/hicon4.svg';
export default function Home() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              Nền tảng công nghệ
              <br />
              <span className="hero-highlight">OWL LeadX-LMS</span>
            </h1>

            <p className="hero-desc">
              OWL LeadXLMS nằm trong hệ sinh thái học thuật OWL 3C giúp bạn trải nghiệm học tập toàn diện,
              nhanh gọn và đơn giản.
            </p>

            <div className="hp-btn-cta">
              <Link to="/learn" className="">Bắt đầu luyện tập</Link>
            </div>
          </div>

          <img src={hicon1} alt="" className="hicon1" />
          <img src={hicon2} alt="" className="hicon2" />
          <img src={hicon3} alt="" className="hicon3" />
          <img src={hicon4} alt="" className="hicon4" />
        </div>
      </section>
      <section>
        <div className='tongquan-img'>
          <img src={tong_quan} alt="" />
        </div>
      </section>
      <section className="hp-hero">
        <div className="hp-hero__inner">
          <div className="hp-hero__text">
            <div className="hp-pretitle">VỀ CHÚNG TÔI</div>
            <h1 className="hp-title">Đôi lời về OWL LeadX - LMS</h1>
            <div className="hp-card">
              <p>
                OWL IELTS là nơi tụi mình đồng hành cùng những Cú Con kiên trí, mang đến hành trình học IELTS nhanh gọn,
                chính xác và cá nhân hóa theo hệ sinh thái học thuật 3C. Môi trường học tại OWL được thiết kế từ sự thấu hiểu,
                giúp mỗi học viên dễ dàng chạm đến band điểm mơ ước.
              </p>
            </div>

            <div className="hp-quote">
              <div className="hp-quote__bar" />
              <p>
                OWL IELTS là nơi tụi mình đồng hành cùng những Cú Con kiên trì, mang đến hành trình học IELTS nhanh gọn,
                chính xác và cá nhân hóa theo hệ sinh thái học thuật 3C.
              </p>
            </div>
          </div>

          <div className="hp-hero__media">
            <img src={heroImg} alt="OWL students" className="hp-hero-img" />
          </div>
        </div>
      </section>

      <section className="hp-why">
        <div className="hp-why__inner">
          <div className="hp-why-header">
            <div className="hp-pretitle">VÌ SAO CHỌN CHÚNG TÔI</div>
            <h2 className="hp-why-title">Vì sao OWL lại xây dựng nền tảng này</h2>
            <p className="hp-why-desc">
              Vì học IELTS, TOEIC hay tiếng Anh không chỉ đơn giản là ôn luyện - mà phải Nhanh gọn, Chuẩn xác, và Cá nhân hóa.
            </p>
          </div>

          <div className="hp-features">
            <div className="hp-feature">
              <div className="hp-feature__icon">
                <img src={cu1} alt="" />
                <h4>Học nhanh gọn – Theo sát tiến độ từng ngày</h4>
              </div>
              <p>Mọi nội dung học tập được tối ưu hóa rõ ràng, nhờ đó bạn luôn biết mình cần học gì và không bao giờ bị bỏ lại phía sau trong quá trình luyện thi IELTS, TOEIC.</p>
            </div>

            <div className="hp-feature">
              <div className="hp-feature__icon">
                <div className="hp-feature__icon">
                  <img src={cu2} alt="" />
                  <h4>Học chuẩn xác – Phản hồi chi tiết</h4>
                </div>
              </div>

              <p>Các bài Writing & Speaking được chấm kỹ lưỡng với phản hồi từ giáo viên, giúp bạn hiểu rõ từng lỗi sai, học đúng và cải thiện nhanh kỹ năng tiếng Anh.</p>
            </div>

            <div className="hp-feature">
              <div className="hp-feature__icon">
                <img src={cu3} alt="" />
                <h4>Học cá nhân hóa – Kho luyện IELTS, TOEIC không giới hạn</h4>
              </div>
              <p>Bài tập cập nhật sát đề thi thật, hướng dẫn chi tiết và giải thích rõ ràng. Bạn luyện tập mọi lúc mọi nơi, như luôn có giáo viên hỗ trợ 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hp-cards">
        <div className="hp-cards__inner">
          <article className="hp-card-large">
            <div className='hp-card-large__content'>
              <img src={sach1} alt="" className="hp-card-large__thumb" />
              <h3>Kho đề và bài tập được biên soạn và bổ sung thường xuyên</h3>
              <p>Giúp cho việc học được cải thiện nhanh chóng - hiệu quả. Lộ trình học được rút gọn tối đa từ việc luyện tập trên LeadX LMS của OWL.</p>
            </div>
            <img src={sachfull1} alt="" className="hp-card-large__thumb_full" />
          </article>

          <article className="hp-card-large">
            <div className='hp-card-large__content'>
              <img src={sach2} alt="" className="hp-card-large__thumb" />
              <h3>Áp dụng AI vào các bài tập Writing và Speaking</h3>
              <p>Giúp học viên được chấm và sửa lỗi thêm một số bài tập khác bên cạnh các bài tập được chấm sửa chi tiết bởi các giáo viên hơn 10.000 giảng dạy.</p>
            </div>
            <img src={sachfull2} alt="" className="hp-card-large__thumb_full" />
          </article>

          <article className="hp-card-large">
            <div className='hp-card-large__content'>
              <img src={sach3} alt="" className="hp-card-large__thumb" />
              <h3>Đầy đủ các bài tập cho IELTS</h3>
              <p>Một trải nghiệm All-in-one cho gần như tất cả các tính năng, dạng bài tập cần thiết để học tiếng Anh. Giúp học viên tiết kiệm thời gian và tăng điểm nhanh chóng.</p>
            </div>
            <img src={sachfull3} alt="" className="hp-card-large__thumb_full" />
          </article>
        </div>
      </section>

      {/* Exam quick access */}
      <section className="hp-exams">
        <div className="hp-exams__inner">
          <div className="hp-exams-tabs">
            <button className="hp-tab active">
              <div className='hp-tab-lua'>
                <img src={luado} alt="" />
              </div>
              Làm đề thi IELTS</button>
            <button className="hp-tab">
              <div className='hp-tab-lua-xanh'>
                <img src={luaxanh} alt="" />
              </div>
              Làm đề thi TOEIC</button>
          </div>

          <div className="hp-exams-grid">
            <div className="hp-exam-highlight">
              <div className='hp-exam-highlight__left'>
                <img className='tainghe' src={tainghe_icon} alt="" />
                <h4>IELTS Full Test</h4>
                <p>Chinh phục IELTS dễ dàng với bài thi thử hoàn chỉnh, tích hợp công nghệ AI giúp đánh giá và cải thiện kỹ năng toàn diện.</p>
                <Link to="/exams/ielts" className="hp-exam-cta">
                  Luyện đề ngay <img src={next_icon} alt="" />
                </Link>
              </div>

              <div className='hp-exam-highlight__right'>
                <img src={full_test} alt="" />
              </div>
            </div>

            <div className="hp-exam-list">
              <div className="hp-exam-card small">
                <img className='tainghe' src={tainghe_icon2} alt="" />
                <h4>Luyện đề Reading</h4>
                <p>
                  Thành thạo kỹ năng Reading với các bài luyện tập sát thực tế. Cải thiện khả năng đọc hiểu, mở rộng vốn từ vựng, và quản lý thời gian hiệu quả
                </p>
                <Link to="/exams/ielts" className="hp-exam-cta">
                  Luyện đề ngay <img src={next_icon} alt="" />
                </Link>
              </div>
            </div>
          </div>
          <div className='hp-exam-list-bottom'>
            <div className="hp-exam-card hp-exam-card1 small">
              <img className='tainghe' src={tainghe_icon} alt="" />
              <h4>Luyện đề Listening</h4>
              <p>
                Rèn luyện khả năng nghe hiểu với các bài nghe thực tế, đa dạng giọng đọc và tình huống. Làm quen với các accent tiếng Anh phổ biến.
              </p>
              <Link to="/exams/ielts" className="hp-exam-cta">
                Luyện đề ngay <img src={next_icon} alt="" />
              </Link>
            </div>

            <div className="hp-exam-card hp-exam-card2 small">
              <img className='tainghe' src={tainghe_icon3} alt="" />
              <h4>Luyện đề Speaking</h4>
              <p>Luyện nói 24/7 với trợ lý AI thông minh - nhận phản hồi chi tiết về phát âm, ngữ điệu và từ vựng. Được chấm điểm và góp ý ngay lập tức sau mỗi bài tập.</p>
              <Link to="/exams/ielts" className="hp-exam-cta">
                Luyện đề ngay <img src={next_icon} alt="" />
              </Link>
            </div>

            <div className="hp-exam-card hp-exam-card3 small">
              <img className='tainghe' src={tainghe_icon4} alt="" />
              <h4>Luyện đề Writing</h4>
              <p>Nâng cao điểm Writing với công nghệ AI phân tích bài viết chuyên sâu - nhận xét về cấu trúc, từ vựng, ngữ pháp và gợi ý cải thiện. Chấm điểm và sửa lỗi tức thì.</p>
              <Link to="/exams/ielts" className="hp-exam-cta">
                Luyện đề ngay <img src={next_icon} alt="" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
