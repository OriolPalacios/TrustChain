// src/pages/Landing.tsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa'; // Importamos un ícono de confianza

// Estilos en línea para el Hero Section (más rápido que un CSS)
const heroContainerStyle: React.CSSProperties = {
  padding: '100px 0',
  textAlign: 'center',
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // No overflow: hidden si no hay olas
};

const trustBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '20px',
  color: '#264653', // Azul oscuro para el texto del badge
  fontWeight: 500,
  marginBottom: '24px',
};

export const Landing = () => {
  return (
    <div style={heroContainerStyle}>
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div style={trustBadgeStyle}>
              <FaLock style={{ marginRight: '8px', color: '#2A9D8F' }} /> {/* Candado color turquesa */}
              <span>+3 ONGs confían en TrustChain</span>  
            </div>

            <h1 className="display-3" style={{ fontWeight: 700, color: '#0d191eff' }}> {/* Título azul oscuro */}
              Trazabilidad Radical para ONGs
            </h1>

            <p className="lead mt-3" style={{ fontSize: '1.25rem', color: '#6c757d' }}>
              Sigue cada sol gastado. Construyendo confianza pública con el poder
              de la blockchain de Stacks.
            </p>

            <Button
              as={Link as any}
              to="/proyectos"
              variant="primary" // Usaremos Bootstrap para esto, pero podemos personalizarlo
              size="lg"
              className="mt-4"
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: '#2A9D8F', // Botón principal con el color turquesa
                borderColor: '#2A9D8F',
                color: '#FFFFFF'
              }}
            >
              Ver Gastos Ahora
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};