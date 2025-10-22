// src/pages/ProyectoTimeline.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from 'react-vertical-timeline-component';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  STACKS_NETWORK,
} from '../config';

// Importamos un ícono (puedes cambiarlo)
import { FaMoneyBillWave } from 'react-icons/fa'; 

// Definimos los tipos de dato
interface Project {
  nombre: string;
  descripcion: string;
  'ong-owner': string;
}

interface Expense {
  id: number;
  'project-id': number;
  concepto: string;
  monto: number;
  proveedor: string;
  timestamp: number;
  'document-url': string;
  'document-hash': string;
  'ong-owner': string;
}

export const ProyectoTimeline = () => {
  const { id } = useParams(); // Obtiene el "id" de la URL
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchProjectData = async () => {
      setLoading(true);
      setError('');
      try {
        const projectId = parseInt(id);

        // --- 1. Obtener datos del Proyecto ---
        const projectResult = await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-project-by-id',
          functionArgs: [uintCV(projectId)],
          network: STACKS_NETWORK,
          senderAddress: CONTRACT_ADDRESS,
        });

        const projectData = cvToJSON(projectResult).value.value;
        if (!projectData) {
          throw new Error('Proyecto no encontrado.');
        }
        setProject({
          nombre: projectData.nombre.value,
          descripcion: projectData.descripcion.value,
          'ong-owner': projectData['ong-owner'].value,
        });

        // --- 2. Obtener TODOS los gastos ---
        const expenseCountResult = await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-expense-count',
          functionArgs: [],
          network: STACKS_NETWORK,
          senderAddress: CONTRACT_ADDRESS,
        });

        const expenseCount = Number(cvToJSON(expenseCountResult).value.value);
        if (expenseCount === 0) {
          setLoading(false);
          return;
        }

        const expensePromises = [];
        for (let i = 1; i <= expenseCount; i++) {
          expensePromises.push(
            fetchCallReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-expense-by-id',
              functionArgs: [uintCV(i)],
              network: STACKS_NETWORK,
              senderAddress: CONTRACT_ADDRESS,
            })
          );
        }

        const results = await Promise.all(expensePromises);
        
        const allExpenses = results.map((res, index) => {
          const data = cvToJSON(res).value.value;
          if (data) {
            return {
              id: index + 1,
              'project-id': Number(data['project-id'].value),
              concepto: data.concepto.value,
              monto: Number(data.monto.value),
              proveedor: data.proveedor.value,
              timestamp: Number(data.timestamp.value),
              'document-url': data['document-url'].value,
              'document-hash': data['document-hash'].value,
              'ong-owner': data['ong-owner'].value,
            };
          }
          return null;
        }).filter(p => p !== null) as Expense[];

        // --- 3. Filtrar y Ordenar ---
        const projectExpenses = allExpenses
          .filter(g => g['project-id'] === projectId)
          .sort((a, b) => a.timestamp - b.timestamp); // Ordenar por fecha, del más antiguo al más nuevo
        setExpenses(projectExpenses);

      } catch (e: any) {
        console.error('Error al cargar datos:', e.message);
        setError(e.message || 'Error al cargar los datos del proyecto.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  return (
    <Container className="mt-5">
      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && project && (
        <>
          {/* Encabezado del Proyecto */}
          <Card className="mb-5 text-center">
            <Card.Body>
              <Card.Title as="h1">{project.nombre}</Card.Title>
              <Card.Text>{project.descripcion}</Card.Text>
              <Card.Subtitle className="text-muted">
                Gestionado por: {project['ong-owner']}
              </Card.Subtitle>
            </Card.Body>
          </Card>

          {/* Línea de Tiempo de Gastos */}
          {expenses.length === 0 ? (
            <Alert variant="info">Este proyecto aún no tiene gastos registrados.</Alert>
          ) : (
            <VerticalTimeline lineColor="#e9ecef">
              {expenses.map((gasto) => (
                <VerticalTimelineElement
                  key={gasto.id}
                  className="vertical-timeline-element--work"
                  contentStyle={{ background: '#fff', color: '#333', border: '1px solid #ddd' }}
                  contentArrowStyle={{ borderRight: '7px solid #ddd' }}
                  date={new Date(gasto.timestamp).toLocaleString()}
                  iconStyle={{ background: '#0d6efd', color: '#fff' }}
                  icon={<FaMoneyBillWave />}
                >
                  <h3 className="vertical-timeline-element-title">{gasto.concepto}</h3>
                  <h4 className="vertical-timeline-element-subtitle">
                    <Badge bg="success">Monto: {gasto.monto}</Badge>
                  </h4>
                  <p>
                    <strong>Proveedor:</strong> {gasto.proveedor}
                    <br />
                    <strong>Factura:</strong>{' '}
                    <a href={gasto['document-url']} target="_blank" rel="noopener noreferrer">
                      Ver Documento
                    </a>
                    <br />
                    <strong title="Hash SHA-256 de la factura, registrado en la blockchain para verificación.">
                      Hash de Verificación:
                    </strong>
                    <span style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block' }}>
                      {gasto['document-hash']}
                    </span>
                  </p>
                </VerticalTimelineElement>
              ))}
            </VerticalTimeline>
          )}
        </>
      )}
    </Container>
  );
};