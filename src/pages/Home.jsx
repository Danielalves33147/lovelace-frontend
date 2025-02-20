import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import React from "react";

import { useUser } from "../../services/UserContext";  // Importando o contexto do usuário
import { auth, db } from "../../services/firebaseConfig.js";  
import { doc, setDoc, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

import { sendPasswordResetEmail } from "firebase/auth";

import { load, success_cad, success, fail, ainda_nao} from "../../services/alert.js"; //Sweet Alert 2

//import { toast_load, toast_success_cad, toast_success, toast_fail} from "../../services/alert_toastfy.js"; // REACT TOASTFY

import { sonner_load, sonner_success_cad, sonner_success, sonner_fail, sonner_ainda_nao} from "../../services/alert_toast.js"; // Sonner

import { useSignInWithEmailAndPassword, useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";


export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [, setError] = useState("");
  const navigate = useNavigate();
  const loginRef = useRef(null)
  const firstSec = useRef(null)
  const ColabRef = useRef(null)

  const [message, setMessage] = useState('');

  const scrollToLogin = () => loginRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToSM = () => firstSec.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToColab = () => ColabRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const { setUserName } = useUser();  // Obtendo o setUserName (renomeado para clareza)
  
  const [signInWithEmailAndPassword, userLogin, loadingLogin, errorLogin] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword, userRegister, loadingRegister, errorRegister] = useCreateUserWithEmailAndPassword(auth);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser  = JSON.parse(sessionStorage.getItem('user'));
    console.log(storedUser);
    
    if (storedUser ) {
        navigate("/ua"); // Navega para /ua se um usuário estiver armazenado
    }
}, [navigate]);


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  function clearFields() {
    setEmail("");
    setPassword("");
    setName("");
  }

  const handleRegisterClick = () => {
    setIsActive(true);
  };

  const handleLoginClick = () => {
    setIsActive(false);
  };


  // Configurações do Toast para mensagens de successo e erro
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    heightAuto: false,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
      popup: "toast-custom",
    },
  });

  const showToastSuccess = (message) => {
    Toast.fire({
      icon: "success",
      title: message,
    });
  };

  const showToastError = (message) => {
    Toast.fire({
      icon: "error",
      title: message,
    });
  };
  // Função para cadastro FUNCIONAAAAAAAAA OS 2 JUNTOS
  async function handleSignUp(e) {
  e.preventDefault();

  sonner_load(); // Carregando algo visual

  try {
    // Criação do usuário no Firebase com email e senha
    const userCredential = await createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Verificação no banco de dados local se o email já está em uso
    const response = await fetch('http://localhost:4000/users');
    const users = await response.json();

    const userExists = users.some(u => u.email === email);
    if (userExists) {
      setError("Este email já está sendo utilizado. Por favor, escolha outro.");
      return;
    }

    // Se o email não está cadastrado localmente, cadastrar no Firebase e banco local
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email
    });

    // Cadastrando no banco de dados local
    const newUser = {
      name: name,
      email: email,
      password: password,
      profileImage: "/defaultProfile.png", // Imagem padrão
      uid: user.uid // Associando o UID gerado pelo Firebase
    };

    const localResponse = await fetch('http://localhost:4000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser)
    });

    const savedUser = await localResponse.json(); // Salva o usuário com ID local

    // Salvando o usuário no sessionStorage com o id (local) e o uid (Firebase)
    const sessionUser = {
      id: savedUser.id,  // ID gerado pelo banco de dados local
      name: savedUser.name,
      email: savedUser.email,
      uid: user.uid      // UID do Firebase
    };
    sessionStorage.setItem('user', JSON.stringify(sessionUser));

    // Exibindo successo e redirecionando
    sonner_success_cad(); 
    clearFields();
    setIsActive(false);
    // Redirecionando após successo
    setTimeout(() => {

      navigate('/ua');
    }, 5000);

  } catch (error) {
    console.error("Erro ao registrar ou salvar no Firestore ou banco local:", error);
    sonner_fail(); // Exibe erro visual
  }
  }

  async function getLocalUserId(uid) {
    const response = await fetch(`http://localhost:4000/users?uid=${uid}`); // Modifique conforme necessário
    const users = await response.json();
    return users.length > 0 ? users[0].id : null; // Retorna o ID se encontrado
  }

// Handle user login FUNCIONAAAAAAAAA OS 2 JUNTOS
  async function handleSignIn(e) {
  e.preventDefault();

  if (loadingLogin) {
    return; // Evita que o usuário envie a solicitação múltiplas vezes
  }
  setLoading(true); // Mostrando a indicação de loading
  try {
    sonner_load(); // Inicia a animação de loading

    // Faz o login com Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(email, password);

    // Se o login for bem-sucedido, este código será alcançado
    const user = userCredential.user;

    // Busca o nome e o ID do usuário no Firestore
    const userName = await getUserNameFromFirestore(user.uid);
    const localUserId = await getLocalUserId(user.uid); // Função para obter o ID do banco local

    if (userName) {
      const userData = {
        id: localUserId, // ID do banco de dados local
        email: user.email,
        name: userName,
        uid: user.uid // UID do Firebase
      };
      sessionStorage.setItem('user', JSON.stringify(userData));
      navigate('/ua'); // Redireciona para a próxima página
      sonner_success(); // Exibe mensagem de successo
      // console.log("NOME: ", userName);
      // console.log("ID (local): ", localUserId);
      // console.log("UID (Firebase): ", user.uid);
    } else {
      setError("Erro ao obter dados do usuário. Tente novamente.");
      sonner_fail(); // Chama a função fail em caso de erro
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error.message); // Adiciona log para depuração
    
    // Adiciona mensagem de erro com base no código de erro
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError("Email inválido. Verifique o formato.");
          break;
        case 'auth/user-disabled':
          setError("Usuário desativado. Entre em contato com o suporte.");
          break;
        case 'auth/user-not-found':
          setError("Usuário não encontrado. Verifique suas credenciais.");
          break;
        case 'auth/wrong-password':
          setError("Senha incorreta. Tente novamente.");
          break;
        default:
          setError("Erro ao fazer login. Tente novamente.");
      }
    } else {
      setError("Erro desconhecido. Tente novamente.");
    }

    sonner_fail(); // Chama a função fail em caso de erro
  } finally {
    setLoading(false); // Desativa o loading
  }
  }

  async function handleForgotPassword() {
    Swal.fire({
      title: "Esqueceu sua senha?",
      text: "Digite seu e-mail para redefinir a senha:",
      input: "email",
      inputPlaceholder: "lovelace@gmail.com",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      confirmButtonColor: "#F21B3F",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: 'swal-button-confirm',
        cancelButton: 'swal-button-cancel'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const email = result.value;
        sonner_load();
  
        try {
          // Verificar se o e-mail existe no Firestore
          const userExists = await checkIfEmailExists(email);
  
          if (userExists) {
            // Enviar e-mail de redefinição de senha
            await sendPasswordResetEmail(auth, email);
            toast.success("Um e-mail de redefinição de senha foi enviado para " + email);
          } else {
            // Se o e-mail não existir, exibe uma mensagem de erro
            showToastError("O e-mail informado não está cadastrado.");
          }
        } catch (error) {
          console.error(error);
          showToastError("Ocorreu um erro ao processar a solicitação. Tente novamente mais tarde.");
        }
      }
    });
  }
  
  // Função para verificar se o e-mail existe no Firestore
  async function checkIfEmailExists(email) {
    const usersRef = collection(db, "users"); // Referência para a coleção de usuários no Firestore
    const q = query(usersRef, where("email", "==", email)); // Consulta pelo e-mail
    const querySnapshot = await getDocs(q); // Executar a consulta
    return !querySnapshot.empty; // Retorna verdadeiro se houver um usuário com o e-mail fornecido
  }

  async function getUserByEmail(email) {
    const usersRef = collection(db, "users"); // Obtenha a referência à coleção "users"
    const q = query(usersRef, where("email", "==", email)); // Crie a consulta
    const querySnapshot = await getDocs(q); // Busque os documentos que correspondem à consulta
    return !querySnapshot.empty; // Retorna verdadeiro se o e-mail existir
  }

  async function getUserNameFromFirestore(uid) {
    const userDoc = doc(db, "users", uid);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      return docSnap.data().name;
    } else {
      console.log("Nenhum documento encontrado!");
      return null;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Lovelace</h1>
        <nav>
          <ul>
            <li><button onClick={scrollToColab} id={styles.sobreNos}>Sobre nós</button></li>
            <li><button onClick={scrollToLogin}>Fazer Login</button></li>
            <li><button onClick={scrollToLogin}>Criar Conta</button></li>
          </ul>
        </nav>
      </header>
      <section className={styles.mainContent}>
        <img src="../../src/img/image 1.svg" alt="AdaLovelace" />
        <div>
          <h1>Lovelace</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean eget
            tortor ac turpis viverra luctus. In ornare tempus lacinia. Maecenas
            interdum felis quis arcu congue vulputate. Donec vitae posuere
            ligula, quis tristique dui. Mauris a sapien vitae dolor tincidunt
            rhoncus. Integer massa elit, lacinia non luctus at, condimentum at
            erat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            fringilla pretium commodo. Duis viverra, mauris non malesuada
            malesuada, turpis turpis consectetur ante, id lacinia lorem lacus
            eget diam. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Praesent in est eu felis ornare luctus auctor ut elit. Nam placerat
            urna eu nisi blandit ornare.
          </p>
          <button onClick={scrollToSM}>Achou legal? Saiba mais!</button>
        </div>
      </section>
      <section ref={firstSec} className={styles.secVideo}>
        <strong>Para você estudante!</strong>
        <div>
          <p>
            Você poderá escolher entre duas formas de praticar seu conhecimento
            em inglês.
            <br />
            <br />
            Podendo ser uma prática simples com um texto de leitura, onde basta
            você retirar as palavras chaves do texto! Isso tudo com direito a um
            resultado no final e para você poder medir o quão fluente você é,
            também poderá saber se corresponde a um dos três níveis de
            conhecimentos:
            <br />
            <br />
            <span>Beginner</span>, <span>Intermediary</span> e <span>Advanced</span>.
          </p>
          <video src=""></video>
        </div>
      </section>
      <div className={styles.paraProf}>
        <h1>
          <strong >Para professores</strong>
        </h1>
      </div>
      <section className={styles.secVideo}>
        <strong>Você poderá usar a nossa ferramenta de questionário!</strong>
        <div>
          <p>
            Basta adicionar sua questão, seu texto e explicar para seus alunos
            qual é o propósito daquela atividade! Ah! Lembre-se, essa ferramenta
            foi projetada para ser utilizada em sala de aula!
            <br />
            <br />
            Você terá acesso em tempo real das respostas dos alunos, um código
            de acesso para a atividade, edição pós-criação caso queira alterar o
            questionário.
          </p>
          <video src=""></video>
        </div>
      </section>
      <section ref={ColabRef} className={styles.collaborators}>
        <span>Esse é um projeto de iniciação científica!</span>
        <div className={styles.midlle}>
          <p>
            Idealizado e desenvolvido por três alunos do IFBA Campus Camaçari
            <br />
            <br />
            Nos dividimos em uma pequena equipe de estudantes do curso de
            ciência da computação.
            <br />
            <br />
            Esse projeto só foi possível graças a orientação da orientadora.
          </p>
          <h1>Lovelace</h1>
        </div>
        <div className={styles.cards}>
          <div>
            <img src="/src/img/pexels-moh-adbelghaffar-771742.jpg" alt="" />
            <p>Marcos Emanuel</p>
            <p>Ux/UI Designer</p>
          </div>
          <div>
            <img src="/src/img/pexels-andrewperformance1-697509.jpg" alt="" />
            <p>Melkysedeke Costa</p>
            <p>Desenvolvedor Fullstack</p>
          </div>
          <div>
            <img src="/src/img/pexels-olly-3785079.jpg" alt="" />
            <p>Daniel de Santana Alves</p>
            <p>Desenvolvedor Fullstack</p>
          </div>
          <div>
            <img src="/src/img/pexels-olly-774909.jpg" alt="" />
            <p>Lenade Barreto Santos Gil</p>
            <p>Orientadora</p>
          </div>
        </div>
      </section>
      <section ref={loginRef} className={`${styles.login} ${isActive ? styles.active : ""}`}>
        <div className={`${styles.form_container} ${styles.sign_up}`}> 
          <form onSubmit={handleSignUp}>
            <h1>Criar Conta</h1>
            <div className={styles.social_icons}>
                <a
                  className={styles.icon}
                  onClick={(e) => {
                    e.preventDefault(); // Previne o comportamento padrão do link
                    ainda_nao(); // Chama a função ainda_não
                  }}
                >
                  <FontAwesomeIcon icon={faGoogle} style={{ color: "#DB4437" }} />
                </a>
              {/* <a href="#" className={styles.icon}><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className={styles.icon}><i className="fa-brands fa-github"></i></a>
              <a href="#" className={styles.icon}><i className="fa-brands fa-linkedin-in"></i></a> */}
            </div>
            <span>ou use seu e-mail para registro</span>
            <input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className={styles.showpassword}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEye} />
                ) : (
                  <FontAwesomeIcon icon={faEyeSlash} />
                )}
              </button>
            </div>
            <button type="submit">Cadastrar</button>
          </form>
        </div>

        <div className={`${styles.form_container} ${styles.sign_in}`}>
          <form onSubmit={handleSignIn}>
            <h1>Entrar</h1>
            <div className={styles.social_icons}>
            <a
                  className={styles.icon}
                  onClick={(e) => {
                    e.preventDefault(); // Previne o comportamento padrão do link
                    sonner_ainda_nao(); // Chama a função ainda_não
                  }}
                >
                  <FontAwesomeIcon icon={faGoogle} style={{ color: "#DB4437" }} />
                </a>
              {/* <a href="#" className={styles.icon}><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className={styles.icon}><i className="fa-brands fa-github"></i></a>
              <a href="#" className={styles.icon}><i className="fa-brands fa-linkedin-in"></i></a> */}
            </div>
            <span>ou use sua senha de e-mail</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className={styles.showpassword}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEye} />
                ) : (
                  <FontAwesomeIcon icon={faEyeSlash} />
                )}
              </button>
            </div>
            <a onClick={handleForgotPassword} className={styles.link}>
              Esqueceu sua senha?
            </a>
            <button type="submit">Entrar</button>
          </form>
        </div>

        <div className={styles.toggle_container}>
          <div className={styles.toggle}>
            <div className={`${styles.toggle_panel} ${styles.toggle_left}`}>
              <h1>Bem-vindo de Volta!</h1>
              <p>
                Digite seus dados pessoais para usar todos os recursos do site
              </p>
              <button className={styles.hidden} onClick={handleLoginClick}>
                Entrar
              </button>
            </div>
            <div className={`${styles.toggle_panel} ${styles.toggle_right}`}>
              <h1>Olá, Amigo!</h1>
              <p>
                Registre-se com seus dados pessoais para usar todos os recursos
                do site
              </p>
              <button className={styles.hidden} onClick={handleRegisterClick}>
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}