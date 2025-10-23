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

type UserRole = 'public' | 'admin' | 'ong';

export const Header = () => {
  const [userData, setUserData] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('public');
  const navigate = useNavigate();
  const network = STACKS_NETWORK; // Usamos testnet

  const checkUserRole = async (userPrincipal: string) => {
    if (userPrincipal === ADMIN_WALLET) {
      setUserRole('admin');
      return 'admin';
    }

    // Check 2: ONG (lectura de contrato)
    try {
      const isOng = await checkIsOng(userPrincipal);
      if (isOng) {
        setUserRole('ong');
        return 'ong';
      }
    } catch (e) {
      console.error('Error en checkIsOng:', e);
    }

    setUserRole('public');
    return 'public';
  };

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const loadedUserData = userSession.loadUserData();
      setUserData(loadedUserData);
      // Comprueba el rol del usuario que ya está logueado
      checkUserRole(loadedUserData.profile.stxAddress.testnet);
    } else {
      setUserData(null);
      setUserRole('public'); // Si no hay sesión, es público
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
        const role = await checkUserRole(user);
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'ong') {
          navigate('/portal');
        } else {
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
    setUserRole('public');
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
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="/logo-icon.png"
            width="40"
            height="50"
            className="d-inline-block align-top me-2"
            alt="TrustChain Logo"
          />
          <span style={{ fontWeight: 600, color: '#FFFFFF' }}>TrustChain</span> {/* Texto blanco */}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/proyectos">
              Ver Gastos (Proyectos)
            </Nav.Link>
            {userRole === 'admin' && (
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className="fw-bold" 
                style={{ color: '#F4A261' }} // Naranja de tu paleta
              >
                Panel de Admin
              </Nav.Link>
            )}

            {userRole === 'ong' && (
              <Nav.Link 
                as={Link} 
                to="/portal" 
                className="fw-bold" 
                style={{ color: '#2A9D8F' }} // Turquesa de tu paleta
              >
                Portal ONG
              </Nav.Link>
            )}
          </Nav>
          <Nav className='d-flex gap-3'>
            {userData ? (
              <>
                <div className='border rounded border-warning d-flex justify-content-center align-items-center'>
                  <Navbar.Text className='p-2'>
                    {getShortAddress()}
                  </Navbar.Text>
                </div>
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