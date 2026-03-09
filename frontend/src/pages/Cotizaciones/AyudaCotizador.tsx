/**
 * AyudaCotizador - Pantalla de Ayuda del Modulo de Cotizaciones
 * Guia de uso del cotizador para usuarios
 * FASE 6.35
 */

import styled from 'styled-components';
import { theme } from '../../theme';

// =============================================
// STYLED COMPONENTS
// =============================================

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${theme.colors.textSecondary};
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.nav`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: sticky;
  top: 1rem;
  height: fit-content;
`;

const SidebarTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  margin: 0 0 0.75rem 0;
  padding: 0 0.5rem;
`;

const NavItem = styled.a<{ $active?: boolean }>`
  display: block;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.textPrimary};
  background: ${({ $active }) => $active ? `${theme.colors.primary}10` : 'transparent'};
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  margin-bottom: 0.25rem;

  &:hover {
    background: ${theme.colors.bgLight};
    color: ${theme.colors.primary};
  }
`;

const Content = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const Section = styled.section`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${theme.colors.primary}20;
`;

const Paragraph = styled.p`
  font-size: 0.9375rem;
  color: ${theme.colors.textPrimary};
  line-height: 1.7;
  margin: 0 0 1rem 0;
`;

const List = styled.ul`
  margin: 0 0 1rem 0;
  padding-left: 1.5rem;
`;

const ListItem = styled.li`
  font-size: 0.9375rem;
  color: ${theme.colors.textPrimary};
  line-height: 1.7;
  margin-bottom: 0.5rem;
`;

const StepCard = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: ${theme.colors.bgLight};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  background: ${theme.colors.primary};
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 0.25rem 0;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const InfoCard = styled.div<{ $type?: 'info' | 'warning' | 'success' }>`
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;

  ${({ $type = 'info' }) => {
    switch ($type) {
      case 'warning':
        return `
          background: ${theme.colors.warning}15;
          border-left: 4px solid ${theme.colors.warning};
        `;
      case 'success':
        return `
          background: ${theme.colors.success}15;
          border-left: 4px solid ${theme.colors.success};
        `;
      default:
        return `
          background: ${theme.colors.primary}10;
          border-left: 4px solid ${theme.colors.primary};
        `;
    }
  }}
`;

const InfoTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem;
  background: ${theme.colors.bgLight};
  border-bottom: 2px solid ${theme.colors.border};
  font-weight: 600;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${theme.colors.border};
`;

const Code = styled.code`
  background: ${theme.colors.bgLight};
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 0.85em;
`;

// =============================================
// COMPONENT
// =============================================

interface AyudaCotizadorProps {
  onNavigate?: (page: string) => void;
}

export default function AyudaCotizador({ onNavigate }: AyudaCotizadorProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => onNavigate?.('cotizaciones')}>
          ← Volver a Cotizaciones
        </BackButton>
        <Title>Ayuda del Cotizador</Title>
        <Subtitle>
          Guia completa para utilizar el modulo de cotizaciones de CMPC Envases
        </Subtitle>
      </Header>

      <Grid>
        <Sidebar>
          <SidebarTitle>Contenido</SidebarTitle>
          <NavItem onClick={() => scrollToSection('introduccion')}>Introduccion</NavItem>
          <NavItem onClick={() => scrollToSection('crear-cotizacion')}>Crear Cotizacion</NavItem>
          <NavItem onClick={() => scrollToSection('detalles')}>Agregar Detalles</NavItem>
          <NavItem onClick={() => scrollToSection('calculo')}>Calculo de Precios</NavItem>
          <NavItem onClick={() => scrollToSection('estados')}>Estados y Flujo</NavItem>
          <NavItem onClick={() => scrollToSection('aprobacion')}>Aprobacion</NavItem>
          <NavItem onClick={() => scrollToSection('crear-ot')}>Crear OT</NavItem>
          <NavItem onClick={() => scrollToSection('carga-masiva')}>Carga Masiva</NavItem>
          <NavItem onClick={() => scrollToSection('faq')}>Preguntas Frecuentes</NavItem>
        </Sidebar>

        <Content>
          <Section id="introduccion">
            <SectionTitle>Introduccion</SectionTitle>
            <Paragraph>
              El Cotizador de CMPC Envases es una herramienta para generar cotizaciones
              de productos de carton corrugado. Permite calcular precios basados en
              especificaciones tecnicas, costos de materiales, procesos y margenes.
            </Paragraph>
            <Paragraph>
              Una cotizacion puede contener multiples detalles (lineas), cada uno
              representando un producto diferente o variantes del mismo.
            </Paragraph>
          </Section>

          <Section id="crear-cotizacion">
            <SectionTitle>Crear una Cotizacion</SectionTitle>
            <Paragraph>
              Para crear una nueva cotizacion, siga estos pasos:
            </Paragraph>

            <StepCard>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Acceder al modulo</StepTitle>
                <StepDescription>
                  Navegue a Cotizaciones → Nueva Cotizacion desde el menu principal.
                </StepDescription>
              </StepContent>
            </StepCard>

            <StepCard>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Seleccionar cliente</StepTitle>
                <StepDescription>
                  Seleccione el cliente de la lista desplegable. Si es un cliente nuevo,
                  primero debe registrarlo en Mantenedores → Clientes.
                </StepDescription>
              </StepContent>
            </StepCard>

            <StepCard>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Completar datos generales</StepTitle>
                <StepDescription>
                  Ingrese fecha de validez, condiciones comerciales, y observaciones.
                  Estos datos aplican a toda la cotizacion.
                </StepDescription>
              </StepContent>
            </StepCard>

            <StepCard>
              <StepNumber>4</StepNumber>
              <StepContent>
                <StepTitle>Guardar cotizacion</StepTitle>
                <StepDescription>
                  Haga clic en "Guardar" para crear la cotizacion. Luego podra agregar
                  los detalles (productos).
                </StepDescription>
              </StepContent>
            </StepCard>
          </Section>

          <Section id="detalles">
            <SectionTitle>Agregar Detalles</SectionTitle>
            <Paragraph>
              Cada detalle representa un producto cotizado. Los campos principales son:
            </Paragraph>

            <Table>
              <thead>
                <tr>
                  <Th>Campo</Th>
                  <Th>Descripcion</Th>
                  <Th>Obligatorio</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td><Code>Area HC</Code></Td>
                  <Td>Area en metros cuadrados de la hoja de carton</Td>
                  <Td>Si</Td>
                </tr>
                <tr>
                  <Td><Code>Golpes Largo</Code></Td>
                  <Td>Numero de golpes en sentido largo</Td>
                  <Td>Si</Td>
                </tr>
                <tr>
                  <Td><Code>Golpes Ancho</Code></Td>
                  <Td>Numero de golpes en sentido ancho</Td>
                  <Td>Si</Td>
                </tr>
                <tr>
                  <Td><Code>Tipo Onda</Code></Td>
                  <Td>Tipo de onda del carton (B, C, BC, etc.)</Td>
                  <Td>Si</Td>
                </tr>
                <tr>
                  <Td><Code>Cantidad</Code></Td>
                  <Td>Unidades a cotizar</Td>
                  <Td>Si</Td>
                </tr>
                <tr>
                  <Td><Code>Proceso</Code></Td>
                  <Td>Proceso de impresion (Flexo, Offset, etc.)</Td>
                  <Td>Si</Td>
                </tr>
              </tbody>
            </Table>

            <InfoCard $type="info">
              <InfoTitle>Tip</InfoTitle>
              <InfoText>
                Complete todos los campos tecnicos para obtener un calculo preciso.
                Los campos faltantes pueden afectar el precio final.
              </InfoText>
            </InfoCard>
          </Section>

          <Section id="calculo">
            <SectionTitle>Calculo de Precios</SectionTitle>
            <Paragraph>
              El sistema calcula automaticamente los precios basandose en:
            </Paragraph>
            <List>
              <ListItem><strong>Costo de materiales:</strong> Papel, carton, adhesivos segun tipo de onda</ListItem>
              <ListItem><strong>Costos de conversion:</strong> Corrugadora, convertidora, troquelado</ListItem>
              <ListItem><strong>Costos de impresion:</strong> Segun proceso y numero de colores</ListItem>
              <ListItem><strong>Fletes:</strong> Basado en ciudad destino y peso</ListItem>
              <ListItem><strong>Margenes:</strong> Segun tarifario configurado</ListItem>
            </List>

            <InfoCard $type="warning">
              <InfoTitle>Importante</InfoTitle>
              <InfoText>
                Los precios mostrados son estimados. El precio final puede variar
                segun condiciones especiales del cliente o cambios en costos de insumos.
              </InfoText>
            </InfoCard>
          </Section>

          <Section id="estados">
            <SectionTitle>Estados y Flujo de Aprobacion</SectionTitle>
            <Paragraph>
              Las cotizaciones pasan por los siguientes estados:
            </Paragraph>

            <Table>
              <thead>
                <tr>
                  <Th>Estado</Th>
                  <Th>Descripcion</Th>
                  <Th>Siguiente Paso</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td><Code>Borrador</Code></Td>
                  <Td>Cotizacion en edicion, no enviada</Td>
                  <Td>Enviar a aprobacion</Td>
                </tr>
                <tr>
                  <Td><Code>Pendiente</Code></Td>
                  <Td>Esperando aprobacion de jefatura</Td>
                  <Td>Aprobar o Rechazar</Td>
                </tr>
                <tr>
                  <Td><Code>Aprobada</Code></Td>
                  <Td>Cotizacion aprobada por jefatura</Td>
                  <Td>Crear OT o Enviar al cliente</Td>
                </tr>
                <tr>
                  <Td><Code>Rechazada</Code></Td>
                  <Td>Cotizacion rechazada, requiere ajustes</Td>
                  <Td>Editar y reenviar</Td>
                </tr>
                <tr>
                  <Td><Code>Con OT</Code></Td>
                  <Td>Se ha generado orden de trabajo</Td>
                  <Td>Seguimiento en modulo OT</Td>
                </tr>
              </tbody>
            </Table>
          </Section>

          <Section id="aprobacion">
            <SectionTitle>Proceso de Aprobacion</SectionTitle>
            <Paragraph>
              Dependiendo del margen y monto, las cotizaciones requieren diferentes
              niveles de aprobacion:
            </Paragraph>
            <List>
              <ListItem><strong>Jefe de Ventas:</strong> Cotizaciones hasta cierto monto</ListItem>
              <ListItem><strong>Gerente Comercial:</strong> Cotizaciones de montos mayores</ListItem>
              <ListItem><strong>Gerente General:</strong> Cotizaciones con margen negativo</ListItem>
            </List>

            <InfoCard $type="success">
              <InfoTitle>Aprobacion Externa</InfoTitle>
              <InfoText>
                Los aprobadores pueden acceder al sistema de aprobacion externa
                mediante un enlace especial, sin necesidad de ingresar al sistema completo.
              </InfoText>
            </InfoCard>
          </Section>

          <Section id="crear-ot">
            <SectionTitle>Crear OT desde Cotizacion</SectionTitle>
            <Paragraph>
              Una vez aprobada la cotizacion, puede generar una Orden de Trabajo:
            </Paragraph>

            <StepCard>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Seleccionar detalle</StepTitle>
                <StepDescription>
                  En la lista de cotizaciones, haga clic en "Crear OT" junto al
                  detalle que desea convertir.
                </StepDescription>
              </StepContent>
            </StepCard>

            <StepCard>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Completar datos OT</StepTitle>
                <StepDescription>
                  Los datos tecnicos se precargan desde la cotizacion. Complete
                  campos adicionales como responsable y observaciones.
                </StepDescription>
              </StepContent>
            </StepCard>

            <StepCard>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Confirmar creacion</StepTitle>
                <StepDescription>
                  Revise los datos y confirme. La OT quedara disponible en el
                  modulo de Ordenes de Trabajo.
                </StepDescription>
              </StepContent>
            </StepCard>
          </Section>

          <Section id="carga-masiva">
            <SectionTitle>Carga Masiva de Tablas</SectionTitle>
            <Paragraph>
              El sistema permite cargar datos masivos para las tablas del cotizador
              mediante archivos Excel. Las tablas disponibles incluyen:
            </Paragraph>
            <List>
              <ListItem>Cartones y Papeles</ListItem>
              <ListItem>Tarifario y Margenes</ListItem>
              <ListItem>Fletes por Ciudad</ListItem>
              <ListItem>Factores de Onda y Desarrollo</ListItem>
              <ListItem>Mermas de Corrugadora y Convertidora</ListItem>
              <ListItem>Consumo de Adhesivos y Energia</ListItem>
            </List>

            <Paragraph>
              Para cargar datos, vaya a Mantenedores → Carga Masiva, seleccione
              la tabla, descargue la plantilla, complete los datos y suba el archivo.
            </Paragraph>
          </Section>

          <Section id="faq">
            <SectionTitle>Preguntas Frecuentes</SectionTitle>

            <InfoCard>
              <InfoTitle>¿Por que el precio es 0?</InfoTitle>
              <InfoText>
                Verifique que todos los campos obligatorios esten completos,
                especialmente Area HC, Golpes y Tipo de Onda. Tambien asegurese
                de que existan datos en las tablas de tarifario.
              </InfoText>
            </InfoCard>

            <InfoCard>
              <InfoTitle>¿Puedo editar una cotizacion aprobada?</InfoTitle>
              <InfoText>
                No directamente. Debe crear una nueva version o duplicar la
                cotizacion para hacer modificaciones.
              </InfoText>
            </InfoCard>

            <InfoCard>
              <InfoTitle>¿Como duplico una cotizacion?</InfoTitle>
              <InfoText>
                En la lista de cotizaciones, use el boton "Duplicar" en el
                menu de acciones. Se creara una copia en estado Borrador.
              </InfoText>
            </InfoCard>

            <InfoCard>
              <InfoTitle>¿Quien puede ver mis cotizaciones?</InfoTitle>
              <InfoText>
                Los vendedores ven solo sus cotizaciones. Los jefes y gerentes
                pueden ver todas las cotizaciones de su area.
              </InfoText>
            </InfoCard>
          </Section>
        </Content>
      </Grid>
    </Container>
  );
}
