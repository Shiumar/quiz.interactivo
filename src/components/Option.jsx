import styles from './Option.module.css';

export default function Option({ text }) {
  return (
    <button className={styles.optionButton}>
      {text}
    </button>
  );
}