// src/pages/Admin.tsx
import { useState } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  STACKS_NETWORK,
} from '../config';
import { userSession } from '../services/userSessionService';
import { showContractCall } from '@stacks/connect';
import { principalCV } from '@stacks/transactions';

export const Admin = () => {
  const [ongPrincipal, setOngPrincipal] = useState('');
  const [status, setStatus] = useState({ loading: false, success: '', error: '' });

  const handleRegisterOng = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: '', error: '' });

    try {
      // Validar que es una dirección de Stacks (simple)
      if (!ongPrincipal.startsWith('ST')) {
        throw new Error('Dirección de Stacks inválida. Debe empezar con ST.');
      }

      await showContractCall({
        network: STACKS_NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'registrar-ong',
        functionArgs: [
          principalCV(ongPrincipal), // Pasa la dirección como un principal
        ],
        appDetails: {
          name: 'dApp Trazabilidad',
          icon: window.location.origin + '/logo.svg',
        },
        onFinish: (data) => {
          console.log('ONG Registrada! TXID:', data.txId);
          setStatus({
            loading: false,
            success: `¡Éxito! ONG registrada. TXID: ${data.txId}`,
            error: '',
          });
          setOngPrincipal(''); // Limpia el formulario
        },
        onCancel: () => {
          setStatus({ loading: false, success: '', error: 'Registro cancelado.' });
        },
      });
    } catch (e: any) {
      console.error(e);
      setStatus({ loading: false, success: '', error: e.message || 'Error al registrar.' });
    }
  };

  // Solo para asegurarnos que el admin vea esto (aunque el router ya lo hace)
  if (!userSession.isUserSignedIn()) {
     return <Alert variant="warning">Debes iniciar sesión como Admin.</Alert>
  }

  return (
    <Container className="mt-5">
      <h1>Panel de Administrador</h1>
      <p>Aquí puedes autorizar nuevas direcciones de ONGs.</p>

      <Form onSubmit={handleRegisterOng}>
        <Form.Group className="mb-3" controlId="ongPrincipal">
          <Form.Label>Dirección STX de la ONG</Form.Label>
          <Form.Control
            type="text"
            placeholder="ST..."
            value={ongPrincipal}
            onChange={(e) => setOngPrincipal(e.target.value)}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={status.loading}>
          {status.loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Registrar ONG'
          )}
        </Button>
      </Form>

      {status.success && <Alert variant="success" className="mt-3">{status.success}</Alert>}
      {status.error && <Alert variant="danger" className="mt-3">{status.error}</Alert>}
    </Container>
  );
};