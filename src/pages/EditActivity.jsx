import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FormActivity from './FormActivity'; 

function EditActivity() {
    const { id } = useParams(); 
    const [activity, setActivity] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:4000/activities/${id}`)
            .then((resp) => resp.json())
            .then((data) => setActivity(data))
            .catch((err) => console.error('Erro ao carregar a atividade:', err));
    }, [id]);

    return (
        <>
            {activity ? (
                <FormActivity activity={activity} />
            ) : (
                <p>Carregando atividade...</p>
            )}
        </>
    );
}

export default EditActivity;
