// src/pages/ProyectoGaleria.tsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  STACKS_NETWORK,
} from '../config';
import { FaExternalLinkAlt } from 'react-icons/fa';
// Colores de tu paleta
const COLOR_PALETTE = {
  primary: '#2A9D8F',   // Turquesa
  accent: '#F4A261',    // Naranja
  darkText: '#264653',  // Azul oscuro
  lightBg: '#F8F9FA',
};

// Definimos el tipo de dato para el Proyecto
interface Project {
  id: number;
  nombre: string;
  descripcion: string;
  'ong-owner': string;
}

export const ProyectoGaleria = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Obtener el contador total de proyectos
        const projectCountResult = await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-project-count',
          functionArgs: [],
          network: STACKS_NETWORK,
          senderAddress: CONTRACT_ADDRESS, // Puede ser cualquiera
        });

        const projectCount = Number(cvToJSON(projectCountResult).value.value); 
        
        if (projectCount === 0) {
           setLoading(false);
           return;
        }

        // 2. Crear un array de promesas para traer cada proyecto
        const projectPromises = [];
        for (let i = 1; i <= projectCount; i++) {
          projectPromises.push(
            fetchCallReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-project-by-id',
              functionArgs: [uintCV(i)],
              network: STACKS_NETWORK,
              senderAddress: CONTRACT_ADDRESS,
            })
          );
        }

        // 3. Ejecutar todas las promesas
        const results = await Promise.all(projectPromises);
        const allProjects = results.map((res, index) => {
          let projectData = cvToJSON(res).value.value;
          projectData = Object.fromEntries(
            Object.entries(projectData).map(([key, value]) => [key,(value as any).value])
          )
          if (projectData) {
            return {
              id: index + 1,
              nombre: projectData.nombre,
              descripcion: projectData.descripcion,
              'ong-owner': projectData['ong-owner'],
            };
          }
          return null;
        }).filter(p => p !== null) as Project[]; // Quitar nulos

        setProjects(allProjects);

      } catch (e: any) {
        console.error('Error al cargar proyectos:', e.message);
        setError('Error al cargar los proyectos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []); // Se ejecuta solo una vez al cargar

  return (
    <Container className="mt-5">
      <Row className="mb-4 text-center">
        <Col>
          <h1 style={{ color: COLOR_PALETTE.darkText, fontWeight: 700 }}>
            Proyectos de Impacto
          </h1>
          <p className="lead" style={{ color: COLOR_PALETTE.darkText, opacity: 0.8 }}>
            Explora todas las iniciativas y sigue el rastro de cada gasto.
            La transparencia es nuestra misión.
          </p>
        </Col>
      </Row>
      
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" style={{ color: COLOR_PALETTE.primary }} />
          <p className="mt-2" style={{ color: COLOR_PALETTE.darkText }}>Cargando proyectos...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Row xs={1} md={2} lg={3} className="g-4">
          {projects.length === 0 ? (
            <Col xs={12}>
              <Alert variant="info" className="text-center">
                Aún no se han creado proyectos. ¡Invita a una ONG a unirse!
              </Alert>
            </Col>
          ) : (
            projects.map((project) => (
              <Col key={project.id}>
                {/* Tarjeta personalizada */}
                <Card 
                  className="h-100" 
                  style={{ 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
                >
                  <Card.Header 
                    style={{ 
                      backgroundColor: COLOR_PALETTE.darkText, 
                      color: 'white',
                      fontWeight: 600,
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px',
                    }}
                  >
                    {project.nombre}
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <Card.Text style={{ flexGrow: 1, color: '#555' }}>
                      {project.descripcion.substring(0, 120)}...
                    </Card.Text>
                    
                    <div className="mt-3">
                      <Button 
                        as={Link as any} 
                        to={`/proyecto/${project.id}`} 
                        variant="primary" // Usamos el 'variant' pero lo sobrescribimos
                        className="w-100"
                        style={{
                          backgroundColor: COLOR_PALETTE.primary,
                          borderColor: COLOR_PALETTE.primary,
                          fontWeight: 500
                        }}
                      >
                        Ver Trazabilidad <FaExternalLinkAlt size="0.8em" className="ms-1" />
                      </Button>
                    </div>
                  </Card.Body>
                  <Card.Footer 
                    className="text-muted" 
                    style={{
                      fontSize: '0.8rem', 
                      backgroundColor: '#fff',
                      borderBottomLeftRadius: '12px',
                      borderBottomRightRadius: '12px',
                    }}
                  >
                    Gestionado por: {project['ong-owner'].substring(0, 5)}...{project['ong-owner'].substring(project['ong-owner'].length - 5)}
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
    </Container>
  );
};