"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  const signLanguageWords = [
    { word: "안녕 / 안녕하세요", image: "/images/hello.png" },
    { word: "사랑해 / 사랑해요", image: "/images/loveyou.jpg" },
    { word: "고마워 / 감사해요", image: "/images/thanks.png" },
    { word: "반가워 / 반가워요", image: "/images/goodtoseeyou.png" },
  ];

  const scrollToLearn = () => {
    document.getElementById("learn-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleStart = () => {
    router.push("/camera");
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <img src="/images/symbol_logo.svg" className={styles.logoIcon} />
            <span className={styles.logoText}>Sorison</span>
          </div>
          <nav className={styles.nav}>
            <button className={styles.btnSecondary} onClick={scrollToLearn}>
              수어 배우러 가기
            </button>
            <button className={styles.btnPrimary} onClick={handleStart}>
              시작하기
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              당신의 손짓이
              <br />
              소리가 되는 순간,
              <span className={styles.highlight}> 소리손</span>
            </h1>
            <p className={styles.heroDescription}>
              소리손은 웹캠을 통해 당신의 수어 동작을 인식하고,
              <br />
              실시간으로 한국어로 번역해주는 AI 통역 서비스입니다.
              <br />
              지금 바로 당신의 손으로 이야기를 시작해 보세요.
            </p>
            <div className={styles.heroButtons}>
              <button className={styles.btnLarge} onClick={handleStart}>
                시작하기
              </button>
              <button className={styles.btnSecondary} onClick={scrollToLearn}>
                수어 배우러 가기
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.heroImagePlaceholder}>
              <video
                className={styles.heroVideo}
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/videos/hero_video1.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContent}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📹</div>
            <h3 className={styles.featureTitle}>실시간 인식</h3>
            <p className={styles.featureDescription}>
              웹캠을 통해 손동작을
              <br />
              실시간으로 인식합니다!
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔤</div>
            <h3 className={styles.featureTitle}>정확한 번역</h3>
            <p className={styles.featureDescription}>
              인식한 수어를 바로
              <br />
              한국어로 번역합니다!
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💚</div>
            <h3 className={styles.featureTitle}>무료 서비스</h3>
            <p className={styles.featureDescription}>
              회원가입 없이
              <br />
              누구나 무료로 사용 가능합니다!
            </p>
          </div>
        </div>
      </section>

      {/* Learn Sign Language Section */}
      <section id="learn-section" className={styles.learnSection}>
        <div className={styles.learnContent}>
          <h2 className={styles.sectionTitle}>수어를 배워보아요!</h2>
          <p className={styles.sectionSubtitle}>
            자주 사용하는 수어 표현들을 익혀보세요 ☺️
          </p>
          {/* Quick Tips Section */}
          <div className={styles.quickTipsWrapper}>
            <h3 className={styles.quickTipsTitle}>💡 핵심만 콕!</h3>
            <div className={styles.quickTips}>
              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>🤟</div>
                <h3 className={styles.tipTitle}>수어란?</h3>
                <p className={styles.tipText}>
                  손, 얼굴 표정, 몸짓을 사용하는 시각적 언어로,
                  <br />
                  한국 수어는 한국어와 문법 체계가 다른 독립적인 언어입니다.
                  <br />
                  조사(~은/는/이/가)가 없고,
                  <br />
                  상황에 따라 어순이 바뀌기도 해요.
                </p>
                <p className={styles.tipSubtext}>
                  🌍 국가마다 수어가 달라요 (미국수어, 일본수어 등 모두 다름)
                </p>
              </div>

              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>😊</div>
                <h3 className={styles.tipTitle}>
                  표정도 &apos;말&apos;의 일부예요
                </h3>
                <p className={styles.tipText}>
                  손짓뿐만 아니라 눈썹의 움직임, 입 모양, 고개 끄덕임이
                  <br />
                  질문, 긍정, 의문 등을 결정하는 중요한 문법 요소입니다.
                </p>
                <p className={styles.tipSubtext}>
                  비수지 기호: 손을 사용하지 않고 얼굴 표정이나 몸짓으로 의미를
                  전달하는 것
                </p>
              </div>

              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>🙏</div>
                <h3 className={styles.tipTitle}>
                  존댓말은 &apos;표정&apos;으로 해요
                </h3>
                <p className={styles.tipText}>
                  수어 단어 자체에는 존댓말/반말 구분이 없지만,
                  <br />
                  공손한 표정과 동작의 속도, 크기를 조절하여
                  <br />
                  정중함을 표현합니다.
                </p>
              </div>
            </div>
          </div>
          <h3 className={styles.quickTipsTitle}>💡 수어 표현</h3>
          <div className={styles.signGrid}>
            {signLanguageWords.map((item, index) => (
              <div key={index} className={styles.signCard}>
                <div className={styles.signImageWrapper}>
                  <div className={styles.signImagePlaceholder}>
                    <img src={item.image} className={styles.signImage} />
                  </div>
                </div>
                <p className={styles.signWord}>{item.word}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>지금 바로 시작해보세요!</h2>
          <p className={styles.ctaDescription}>
            복잡한 설치나 회원가입 없이 바로 사용 가능합니다.
          </p>
          <button className={styles.btnLarge} onClick={handleStart}>
            시작하기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <img
              src="/images/Combination_Mark.svg"
              className={styles.footerLogo}
            />
          </div>
          <p className={styles.footerText}>
            숭실대학교 IT대학 미디어경영학과 | 김경훈, 윤이찬미, 정은지
            <br />© 2025 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
