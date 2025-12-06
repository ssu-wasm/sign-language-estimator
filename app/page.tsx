"use client";

import styles from './page.module.css';

export default function Home() {
  const signLanguageWords = [
    { word: '안녕 / 안녕하세요', image: '/images/hello.png' },
    { word: '사랑해 / 사랑해요', image: '/images/loveyou.jpg' },
    { word: '고마워 / 감사해요', image: '/images/thanks.png' },
    { word: '반가워 / 반가워요', image: '/images/goodtoseeyou.png' },
  ];

  const scrollToLearn = () => {
    document.getElementById('learn-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
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
            <button className={styles.btnPrimary}>
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
              당신의 손짓이<br />
              소리가 되는 순간,
              <span className={styles.highlight}> 소리손</span>
            </h1>
            <p className={styles.heroDescription}>
              소리손은 웹캠을 통해 당신의 수어 동작을 인식하고,<br />
              실시간으로 한국어로 번역해주는 AI 통역 서비스입니다.<br />
              지금 바로 당신의 손으로 이야기를 시작해 보세요.
            </p>
            <div className={styles.heroButtons}>
              <button className={styles.btnLarge}>
                시작하기
              </button>
              <button className={styles.btnSecondary} onClick={scrollToLearn}>
                수어 배우기
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.heroImagePlaceholder}>
              <span className={styles.heroEmoji}>🤟</span>
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
              웹캠을 통해 손동작을<br />실시간으로 인식합니다
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔤</div>
            <h3 className={styles.featureTitle}>정확한 번역</h3>
            <p className={styles.featureDescription}>
              인식한 수어를 바로<br />한국어로 번역합니다
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💚</div>
            <h3 className={styles.featureTitle}>무료 서비스</h3>
            <p className={styles.featureDescription}>
              회원가입 없이<br />누구나 무료로 사용
            </p>
          </div>
        </div>
      </section>

      {/* Learn Sign Language Section */}
      <section id="learn-section" className={styles.learnSection}>
        <div className={styles.learnContent}>
          <h2 className={styles.sectionTitle}>
            수어를 배워보세요
          </h2>
          <p className={styles.sectionSubtitle}>
            자주 사용하는 수어 표현들을 익혀보세요
          </p>
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
          <h2 className={styles.ctaTitle}>
            지금 바로 시작해보세요
          </h2>
          <p className={styles.ctaDescription}>
            복잡한 설치나 회원가입 없이 바로 사용 가능합니다
          </p>
          <button className={styles.btnLarge}>
            시작하기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <img src="/images/Combination_Mark.svg" className={styles.footerLogo} />
          </div>
          <p className={styles.footerText}>
            숭실대학교 IT대학 미디어경영학과 | 김경훈, 윤이찬미, 정은지<br />
            © 2025 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}