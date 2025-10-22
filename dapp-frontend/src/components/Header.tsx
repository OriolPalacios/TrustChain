// src/components/Header.tsx
import { useState, useEffect } from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { userSession, getAppDetails } from '../services/userSessionService';
import {
  ADMIN_WALLET,
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  STACKS_NETWORK,
} from '../config';

// Importaciones de Stacks para la llamada read-only
import { fetchCallReadOnlyFunction, principalCV, cvToJSON } from '@stacks/transactions';
import { showConnect } from '@stacks/connect';

export const Header = () => {
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  const network = STACKS_NETWORK; // Usamos testnet

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    } else {
      setUserData(null);
    }
  }, []);

  const handleLogin = async () => {
    const appDetails = getAppDetails();
    await showConnect({
      appDetails,
      redirectTo: '/',
      onFinish: async (sessionData) => {
        const user = sessionData.authResponsePayload.profile.stxAddress.testnet;
        setUserData(userSession.loadUserData());

        // --- ¡AQUÍ ESTÁ LA LÓGICA DE RUTAS! ---
        // 1. Check si es Admin
        if (user === ADMIN_WALLET) {
          console.log('Redirigiendo a Admin...');
          navigate('/admin');
          return;
        }

        // 2. Check si es una ONG registrada
        try {
          const isOng = await checkIsOng(user);
          if (isOng) {
            console.log('Redirigiendo a Portal ONG...');
            navigate('/portal');
          } else {
            console.log('Usuario público, redirigiendo a home...');
            navigate('/');
          }
        } catch (error) {
          console.error('Error verificando ONG:', error);
          navigate('/');
        }
      },
      onCancel: () => {
        console.log('Login cancelado');
      },
    });
  };

  // Función helper para llamar al contrato (read-only)
  const checkIsOng = async (userPrincipal: string) => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'is-ong-registered',
        functionArgs: [principalCV(userPrincipal)],
        network: network,
        senderAddress: userPrincipal,
      });

      // cvToJSON convierte la respuesta de Clarity a JSON
      const isOng = cvToJSON(result).value;
      return isOng;
    } catch (e) {
      console.error('Error en checkIsOng:', e);
      return false;
    }
  };

  const handleLogout = () => {
    userSession.signUserOut('/');
    setUserData(null);
    navigate('/'); // Redirige a la landing al salir
  };

  const getShortAddress = () => {
    if (!userData) return '';
    const addr = userData.profile.stxAddress.testnet;
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 5)}`;
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          dApp Trazabilidad
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Estos son los enlaces públicos de tu mockup */}
            <Nav.Link as={Link} to="/proyectos">
              Ver Gastos (Proyectos)
            </Nav.Link>
          </Nav>
          <Nav>
            {userData ? (
              <>
                <Navbar.Text className="me-3">
                  {getShortAddress()}
                </Navbar.Text>
                <Button variant="outline-light" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Button variant="outline-light" onClick={handleLogin}>
                Iniciar Sesión
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};