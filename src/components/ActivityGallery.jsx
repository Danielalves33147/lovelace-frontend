import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ActivityGallery.module.css';

function ActivityGallery() {
    const [activities, setActivities] = useState([]);
    const [, setUser] = useState(null); 

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser); 
        }
        const userId = storedUser ? storedUser.id : null;
        if (userId) {
            fetch(`http://localhost:4000/activities?userId=${userId}`)
                .then(resp => resp.json())
                .then(data => setActivities(data))
                .catch(err => console.log(err));
        }
    }, []);

    return (
        <section className={styles.gallery}>
            <div className={styles.galleryContainer}>
                {activities.length > 0 ? (
                    activities.map(activity => (
                        <div key={activity.id} className={styles.activityCard}>
                            <h2>{activity.name}</h2>                           
                            <div className={styles.links}>
                                <p>{new Date(activity.date).toLocaleDateString('pt-BR')}</p>
                                <div>
                                    <Link to={`/eA/${activity.id}`} className={styles.linkButton}>Acompanhar</Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Você ainda não criou nenhuma atividade.</p>
                )}
            </div>
        </section>
    );
}

export default ActivityGallery;
