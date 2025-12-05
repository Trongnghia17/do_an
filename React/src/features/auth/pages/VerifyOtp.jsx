import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import logo_otp from "../../../assets/images/logo-otp.png";
import imgleftlogin from "../../../assets/images/imgleftlogin.png";
import icon_otp from "../../../assets/images/icon-otp.png";
import './Login.css';

export default function VerifyOtp() {
    const location = useLocation();
    const nav = useNavigate();
    const { channel, destination, password, email } = location.state || {};

    const [otp, setOtp] = useState("");
    console.log("222", location.state);
    const handleVerify = async () => {
        try {
            const res = await api.post("api/otp/verify", {
                email,
                channel,
                destination,
                otp: otp,
                purpose: "register",
                password,
            });

            toast.success("Xác thực thành công! Tài khoản đã được tạo.");
            nav("/login");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Xác thực OTP thất bại");
        }
    };

    return (
        <div className="login-wrapper register-wrapper">
            <div className="login-imgleftmain">
            
            </div>
            <div className="login-cardmain">
                <div className='login-card'>
                    <div className="logo-div">
                        <img className='logo_otp' src={logo_otp} alt="logo-phi-dang" />
                    </div>
                    <h2 className='title-login'>Nhập mã OTP</h2>
                    <p>
                        Nhập mã OTP được gửi qua {channel === "email" ? "Email" : "Zalo OA"}:{" "}
                        <b>{destination}</b>
                    </p>
                    <div className='login-input-container'>
                        <input
                            className="login-input"
                            type="text"
                            placeholder="Mã OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <img className='key-logo-input' src={icon_otp} alt="email-img" />
                    </div>
                   <div className="otp-action-group">
                     <button className="otp-submit login-primaryBtn" onClick={handleVerify}>Xác thực</button>
                   </div>
                </div>
            </div>
        </div>
    );
}
