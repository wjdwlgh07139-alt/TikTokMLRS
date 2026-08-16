import React from "react";
import logoSvg from "../assets/tictoc_stacked_logo_clean.svg";

export default function TopHeader() {
  return (
    <header className="onboarding-top-bar">
      <div className="top-bar-logo-wrap">
        <img
          src={logoSvg}
          alt="째깍악어 로고"
          className="onboarding-logo-img"
        />
      </div>
      <span className="onboarding-title">째깍악어 첫걸음 패키지</span>
    </header>
  );
}
