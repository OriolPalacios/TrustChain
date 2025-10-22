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
      <Row className="mb-4">
        <Col>
          <h1>Proyectos de Trazabilidad</h1>
          <p>Explora todos los proyectos y sigue el rastro de cada gasto.</p>
        </Col>
      </Row>
      
      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Row xs={1} md={2} lg={3} className="g-4">
          {projects.length === 0 ? (
            <Col>
              <Alert variant="info">Aún no se han creado proyectos.</Alert>
            </Col>
          ) : (
            projects.map((project) => (
              <Col key={project.id}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{project.nombre}</Card.Title>
                    <Card.Text>
                      {project.descripcion.substring(0, 100)}...
                    </Card.Text>
                    <Card.Subtitle className="mb-2 text-muted" style={{fontSize: '0.8rem'}}>
                      ONG: {project['ong-owner'].substring(0, 5)}...{project['ong-owner'].substring(project['ong-owner'].length - 5)}
                    </Card.Subtitle>
                    <Button 
                      as={Link as any} 
                      to={`/proyecto/${project.id}`} 
                      variant="primary"
                    >
                      Ver Gastos
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
    </Container>
  );
};