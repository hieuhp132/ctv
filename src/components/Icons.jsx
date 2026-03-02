import teleIcon from "../assets/tele.png";
import fbIcon from "../assets/fb.jpg";

import "./Icons.css";

export default function Icons() {
  return (
    <>
      {/* Floating Icons at Bottom Right */}
      <div className="floating-icons">
        <a
          href="https://m.me/anttechasia"
          className="floating-icon"
          title="Facebook Messenger"
        >
          <img src={fbIcon} alt="" className="logo-img" />
        </a>
        <a
          href=" https://t.me/anttechasia"
          className="floating-icon"
          title="Telegram group"
        >
          <img src={teleIcon} alt="" className="logo-img" />
        </a>
      </div>
    </>
  );
}
