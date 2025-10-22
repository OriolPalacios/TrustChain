// src/pages/Landing.tsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa'; // Importamos un ícono de confianza

// Estilos en línea para el Hero Section (más rápido que un CSS)
const heroStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa', // Un fondo gris claro
  padding: '100px 0',
  textAlign: 'center',
  minHeight: '80vh', // Hacemos que ocupe buena parte de la pantalla
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const trustBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '20px',
  backgroundColor: '#e9ecef',
  color: '#495057',
  fontWeight: 500,
  marginBottom: '24px',
};

export const Landing = () => {
  return (
    <div style={heroStyle}>
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            {/* 1. Indicador de Confianza (Hardcoded como dijimos) */}
            <div style={trustBadgeStyle}>
              <FaLock style={{ marginRight: '8px' }} />
              <span>+3 ONGs confían en Trazabilidad dApp</span>
            </div>

            {/* 2. Título Principal */}
            <h1 className="display-3" style={{ fontWeight: 700 }}>
              Trazabilidad Radical para ONGs
            </h1>

            {/* 3. Subtítulo */}
            <p className="lead mt-3" style={{ fontSize: '1.25rem', color: '#6c757d' }}>
              Sigue cada sol gastado. Construyendo confianza pública con el poder
              de la blockchain de Stacks.
            </p>

            {/* 4. Botón de Acción */}
            <Button
              as={Link}
              to="/proyectos" // Enlace a la galería
              variant="primary"
              size="lg"
              className="mt-4"
              style={{ padding: '12px 24px', fontSize: '1.1rem' }}
            >
              Ver Gastos Ahora
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};