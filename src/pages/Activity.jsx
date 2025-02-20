import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import styles from './Activity.module.css';

function Activity() {
    const { id } = useParams();
    const [activity, setActivity] = useState();
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [iconChanged, setIconChanged] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:4000/activities/${id}`)
            .then((response) => response.json())
            .then((data) => setActivity(data))
            .catch((err) => console.log(err));
    }, [id]);

    const copiarCodigo = () => {
        const codigoElement = document.getElementById('codigo');
        const codigoTexto = codigoElement.innerText;

        navigator.clipboard.writeText(codigoTexto)
            .then(() => {
                setTooltipVisible(true);
                setIconChanged(true);

                setTimeout(() => {
                    setTooltipVisible(false);
                    setIconChanged(false);
                }, 2000);
            })
            .catch((err) => console.error('Erro ao copiar código:', err));
    };

    if (!activity) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1><a href="/">Lovelace</a></h1>
            </header>
            <div className={styles.card}>
                <h1>{activity.name}</h1>
                <h2>{activity.description}</h2>
                <div className={styles.code_box}>
                    <div className={styles.code_text}>
                    <h3>Código de Acesso: <span id='codigo'>{activity.accessCode}</span></h3>
                    <h3>Id: <span id='id' >{activity.accessCode}</span></h3>
                    </div>
                    <button onClick={copiarCodigo} className={styles.copyButton}>
                    <FontAwesomeIcon 
                        className={styles.copy} 
                        icon={iconChanged ? faCheck : faCopy} 
                    />
                    {tooltipVisible && (
                        <span className={`${styles.tooltip} ${styles.tooltipVisible}`}>
                            Código copiado!
                        </span>
                    )}
                </button>
                </div>
                <ul>
                    {activity.questions.map((question) => (
                        <li key={question.id}>
                            <pre>{question.text}</pre>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Activity;
