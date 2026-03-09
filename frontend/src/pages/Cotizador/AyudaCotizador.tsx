/**
 * AyudaCotizador - Sección de Ayuda del Cotizador
 * Videos tutoriales para uso del cotizador
 */

import styled from 'styled-components';

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const VideoLink = styled.a`
  display: block;
  cursor: pointer;
`;

const VideoThumbnail = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
`;

const CardBody = styled.div`
  padding: 1rem;
`;

const CardText = styled.p`
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
`;

const BackButton = styled.button`
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 1rem;

  &:hover {
    background: #e0e0e0;
  }
`;

interface AyudaCotizadorProps {
  onNavigate: (page: string) => void;
}

const TUTORIAL_VIDEOS = [
  {
    title: '¿Cómo pasar de un detalle de una Cotización a una OT?',
    video: 'cotizacion a OT.mp4'
  },
  {
    title: '¿Cómo pasar de una OT a una Cotización?',
    video: 'OT a Cotizacion.mp4'
  },
  {
    title: '¿Cómo crear una nueva Cotización rapidamente?',
    video: 'crear Cotizacion.mp4'
  },
  {
    title: '¿Cómo agregar detalle corrugado?',
    video: 'Corrugado.mp4'
  },
  {
    title: '¿Cómo agregar detalle esquinero?',
    video: 'Esquinero.mp4'
  },
  {
    title: '¿Cómo calcular un area HC?',
    video: 'AreaHC.mp4'
  },
  {
    title: '¿Cómo estimar un cartón?',
    video: 'CartonHC.mp4'
  },
  {
    title: '¿Cómo versionar una cotización? (Editar Cotización activa)',
    video: 'Versionar.mp4'
  },
  {
    title: '¿Cómo Agregar un Multidestino?',
    video: 'Multidestino.mp4'
  },
  {
    title: '¿Cómo cargar una cotización masiva? (Carga de Archivo)',
    video: 'cargaMasiva.mp4'
  },
  {
    title: '¿Cómo duplicar cotización? (Cotización independiente)',
    video: 'Duplicar.mp4'
  },
  {
    title: '¿Cómo imprimir cotización? (Carta Tipo)',
    video: 'DescargarPDF.mp4'
  }
];

const THUMBNAIL_URL = 'https://techrev.me/wp-content/uploads/2019/09/cropped-how-to-make-tutorial-videos-1600x768.jpg';
const LARAVEL_BASE_URL = 'http://localhost:8080';

export function AyudaCotizador({ onNavigate }: AyudaCotizadorProps) {
  const handleVideoClick = (videoFile: string) => {
    // Abrir video en nueva ventana desde el servidor Laravel
    window.open(`${LARAVEL_BASE_URL}/videos/${videoFile}`, '_blank');
  };

  return (
    <Container>
      <BackButton onClick={() => onNavigate('cotizaciones')}>
        ← Volver a Cotizaciones
      </BackButton>

      <Title>Sección de Ayuda</Title>

      <CardGrid>
        {TUTORIAL_VIDEOS.map((tutorial, index) => (
          <Card key={index}>
            <VideoLink onClick={() => handleVideoClick(tutorial.video)}>
              <VideoThumbnail
                src={THUMBNAIL_URL}
                alt={tutorial.title}
              />
            </VideoLink>
            <CardBody>
              <CardText>{tutorial.title}</CardText>
            </CardBody>
          </Card>
        ))}
      </CardGrid>
    </Container>
  );
}
