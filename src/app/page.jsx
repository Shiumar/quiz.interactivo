import Header from '../components/Header';
import Question from '../components/Question';
import Option from '../components/Option';
import Button from '../components/Button';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.quizContainer}>
      <Header />
      <div className={styles.quizContent}>
        <Question />
        <div className={styles.optionsGrid}>
          <Option text="1989" />
          <Option text="1991" />
          <Option text="1993" />
          <Option text="1987" />
        </div>
        <Button text="Siguiente Pregunta" /> 
      </div>
    </main>
  );
}