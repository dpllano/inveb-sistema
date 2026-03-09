"""
Servicio de Generacion de PDF para Cotizaciones - INVEB
Genera PDF multi-pagina con 3 secciones:
1. Carta Cotizacion (productos y precios)
2. Acuerdo Comercial (terminos y condiciones)
3. Ficha Tecnica (especificaciones HACCP)

Fuente: Laravel CotizacionController.php + Blade templates
"""
from io import BytesIO
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
import pymysql

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas


# Colores corporativos CMPC
COLOR_VERDE_CMPC = colors.HexColor('#00b82e')
COLOR_GRIS = colors.HexColor('#8c8c8c')
COLOR_TEXTO = colors.HexColor('#3c3c3c')


def get_db_connection():
    """Conexion a MySQL."""
    return pymysql.connect(
        host=os.getenv("LARAVEL_MYSQL_HOST", os.getenv("MYSQL_HOST", "127.0.0.1")),
        port=int(os.getenv("LARAVEL_MYSQL_PORT", os.getenv("MYSQL_PORT", "3306"))),
        user=os.getenv("LARAVEL_MYSQL_USER", os.getenv("MYSQL_USER", "envases")),
        password=os.getenv("LARAVEL_MYSQL_PASSWORD", os.getenv("MYSQL_PASSWORD", "secret")),
        database=os.getenv("MYSQL_DATABASE", "envases_ot"),
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )


def get_cotizacion_completa(cotizacion_id: int) -> Dict[str, Any]:
    """
    Obtiene datos completos de cotizacion con detalles y relaciones.
    Equivalente a Cotizacion::withAll()->find($id) de Laravel.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Cotizacion principal
            cursor.execute("""
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.rut as cliente_rut,
                    cl.direccion as cliente_direccion,
                    CONCAT(u.nombre, ' ', u.apellido) as vendedor_nombre,
                    u.email as vendedor_email,
                    u.telefono as vendedor_telefono,
                    r.nombre as vendedor_rol,
                    ce.nombre as estado_nombre
                FROM cotizacions c
                LEFT JOIN clients cl ON c.client_id = cl.id
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN cotizacion_estados ce ON c.estado_id = ce.id
                WHERE c.id = %s
            """, (cotizacion_id,))
            cotizacion = cursor.fetchone()

            if not cotizacion:
                return None

            # Detalles de la cotizacion
            cursor.execute("""
                SELECT
                    dc.*,
                    pt.descripcion as product_type_nombre,
                    ct.codigo as carton_codigo,
                    ct.onda_1 as carton_onda_1,
                    ct.onda_2 as carton_onda_2,
                    ct.color_tapa_exterior as carton_color_exterior,
                    ct.ect_min as carton_ect_min,
                    ce.resistencia as esquinero_resistencia,
                    f.ciudad as flete_ciudad
                FROM detalle_cotizacions dc
                LEFT JOIN product_types pt ON dc.product_type_id = pt.id
                LEFT JOIN cartons ct ON dc.carton_id = ct.id
                LEFT JOIN carton_esquineros ce ON dc.carton_esquinero_id = ce.id
                LEFT JOIN fletes f ON dc.flete_id = f.id
                WHERE dc.cotizacion_id = %s
                ORDER BY dc.id
            """, (cotizacion_id,))
            detalles = cursor.fetchall()

            cotizacion['detalles'] = detalles
            cotizacion['detalles_corrugados'] = [d for d in detalles if d.get('tipo_detalle_id') == 1]
            cotizacion['detalles_esquineros'] = [d for d in detalles if d.get('tipo_detalle_id') == 2]

            return cotizacion
    finally:
        conn.close()


def format_precio(precio: Any, moneda_id: int, decimales: int = 3) -> str:
    """Formatea precio segun moneda."""
    if precio is None:
        return "-"
    try:
        valor = float(str(precio).replace(',', '.'))
        if moneda_id == 1:  # USD
            return f"{valor:,.{decimales}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        else:  # CLP
            return f"{valor:,.0f}".replace(',', '.')
    except:
        return str(precio)


def generar_pdf_cotizacion_completo(cotizacion_id: int, incluir_ficha_tecnica: bool = True) -> bytes:
    """
    Genera PDF completo de cotizacion con 3 secciones.
    Equivalente a CotizacionController@generar_pdf de Laravel.

    Args:
        cotizacion_id: ID de la cotizacion
        incluir_ficha_tecnica: Si True, incluye la ficha tecnica HACCP

    Returns:
        bytes del PDF generado
    """
    cotizacion = get_cotizacion_completa(cotizacion_id)
    if not cotizacion:
        raise ValueError(f"Cotizacion {cotizacion_id} no encontrada")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=25*mm,
        bottomMargin=20*mm,
        leftMargin=15*mm,
        rightMargin=15*mm
    )

    elements = []
    styles = getSampleStyleSheet()

    # Estilos personalizados
    estilo_titulo = ParagraphStyle(
        'TituloCMPC',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.black,
        alignment=TA_CENTER,
        spaceAfter=6
    )
    estilo_subtitulo = ParagraphStyle(
        'SubtituloCMPC',
        parent=styles['Normal'],
        fontSize=12,
        textColor=COLOR_TEXTO,
        alignment=TA_CENTER,
        spaceAfter=12
    )
    estilo_seccion = ParagraphStyle(
        'SeccionCMPC',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.black,
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    estilo_normal = ParagraphStyle(
        'NormalCMPC',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLOR_TEXTO,
        spaceBefore=3,
        spaceAfter=3
    )
    estilo_pequeno = ParagraphStyle(
        'PequenoCMPC',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLOR_TEXTO
    )

    # ============================================================
    # SECCION 1: CARTA COTIZACION
    # ============================================================
    elements.extend(_generar_carta_cotizacion(cotizacion, styles, estilo_titulo, estilo_subtitulo, estilo_seccion, estilo_normal, estilo_pequeno))

    # Salto de pagina
    elements.append(PageBreak())

    # ============================================================
    # SECCION 2: ACUERDO COMERCIAL
    # ============================================================
    elements.extend(_generar_acuerdo_comercial(cotizacion, styles, estilo_titulo, estilo_subtitulo, estilo_seccion, estilo_normal, estilo_pequeno))

    # Ficha tecnica (opcional)
    if incluir_ficha_tecnica:
        elements.append(PageBreak())
        elements.extend(_generar_ficha_tecnica(styles, estilo_seccion, estilo_normal, estilo_pequeno))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def _generar_header_cotizacion(cotizacion: dict) -> List:
    """Genera header comun para cotizacion."""
    fecha = cotizacion.get('created_at')
    if hasattr(fecha, 'strftime'):
        fecha_str = fecha.strftime('%d/%m/%Y')
    else:
        fecha_str = str(fecha)[:10] if fecha else datetime.now().strftime('%d/%m/%Y')

    version = cotizacion.get('version_number', 1)

    header_data = [
        [
            Paragraph("<b>CMPC</b><br/>Biopackaging", ParagraphStyle('Logo', fontSize=10, alignment=TA_LEFT)),
            Paragraph(f"<b>COTIZACION</b><br/>CMPC Biopackaging Corrugados",
                     ParagraphStyle('Centro', fontSize=14, alignment=TA_CENTER)),
            Paragraph(f"Cotizacion No <b>{cotizacion['id']}V{version}</b><br/>Fecha: <b>{fecha_str}</b>",
                     ParagraphStyle('Derecha', fontSize=10, alignment=TA_LEFT))
        ]
    ]

    t = Table(header_data, colWidths=[60*mm, 80*mm, 50*mm])
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (2, 0), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))

    return [t, Spacer(1, 10*mm)]


def _generar_carta_cotizacion(cotizacion: dict, styles, estilo_titulo, estilo_subtitulo,
                               estilo_seccion, estilo_normal, estilo_pequeno) -> List:
    """Genera seccion Carta Cotizacion."""
    elements = []

    # Header
    elements.extend(_generar_header_cotizacion(cotizacion))

    # Saludo cliente
    check_nombre = cotizacion.get('check_nombre_contacto', 0)
    if check_nombre:
        saludo = f"Estimado/a {cotizacion.get('nombre_contacto', '')}<br/>{cotizacion.get('cliente_nombre', '')}"
    else:
        saludo = f"Estimado/a {cotizacion.get('cliente_nombre', '')}"

    elements.append(Paragraph(f"<b>{saludo}</b>", estilo_normal))
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph(
        "Por intermedio de la presente y segun lo solicitado, tenemos el agrado de presentar nuestra cotizacion para el abastecimiento de los siguientes materiales:",
        estilo_pequeno
    ))
    elements.append(Spacer(1, 5*mm))

    # Moneda para precios
    moneda_id = cotizacion.get('moneda_id', 1)
    moneda_str = "USD" if moneda_id == 1 else "CLP"

    # Determinar tipo de medida (interno/externo)
    tipo_medida_desc = "Medidas Internas"
    for det in cotizacion.get('detalles', []):
        if det.get('tipo_medida') == 2:
            tipo_medida_desc = "Medidas Externas"
            break

    # Tabla CAJAS DE CARTON CORRUGADO
    detalles_corrugados = cotizacion.get('detalles_corrugados', [])
    if detalles_corrugados:
        elements.append(Paragraph("<b>CAJAS DE CARTON CORRUGADO:</b>", estilo_seccion))

        # Headers de tabla
        header_row1 = ['', '', '', f'{tipo_medida_desc} (mm)', '', '', '', '', '', '', '', '', '', '', '', 'Servicios']
        header_row2 = [
            'Descripcion', 'Cod.Int.Cliente', 'Tipo Item',
            'Lar.', 'Anc.', 'Alt.',
            'Tipo Onda', 'Color Liner', 'Num.Col', 'Tipo Imp.',
            'CAD', 'OT', 'ECT', 'BCT MIN',
            'Volumen', f'Precio ({moneda_str})',
            'Barniz', 'Destino'
        ]

        data = [header_row2]

        for det in detalles_corrugados:
            # Tipo de impresion
            print_type = det.get('print_type_id')
            if print_type in [1, 2, 4]:
                tipo_imp = 'Normal'
            elif print_type in [3, 5]:
                tipo_imp = 'Alta Grafica'
            else:
                tipo_imp = ''

            # Onda
            onda1 = det.get('carton_onda_1', '')
            onda2 = det.get('carton_onda_2', '')
            onda = str(onda1)
            if onda2 and onda2 != '0' and onda2 != onda1:
                onda += str(onda2)

            # Precio
            precio_final = det.get('precio_final_usd') if moneda_id == 1 else det.get('precio_final_clp')
            if not precio_final:
                precio_final = det.get('precio_total_usd') if moneda_id == 1 else det.get('precio_total_clp')

            # Barniz
            tiene_barniz = 'SI' if (
                (det.get('porcentaje_cera_interno', 0) or 0) + (det.get('porcentaje_cera_externo', 0) or 0) > 0
                or det.get('barniz_type_id')
            ) else 'NO'

            row = [
                str(det.get('descripcion_material_detalle', ''))[:25],
                str(det.get('codigo_cliente', '') or ''),
                str(det.get('product_type_nombre', '') or '')[:15],
                str(det.get('largo', '') or ''),
                str(det.get('ancho', '') or ''),
                str(det.get('alto', '') or ''),
                onda,
                str(det.get('carton_color_exterior', '') or '')[:10],
                str(det.get('numero_colores', '') or ''),
                tipo_imp,
                str(det.get('cad_material_detalle', '') or ''),
                str(det.get('work_order_id', '') or ''),
                str(det.get('carton_ect_min', '') or ''),
                str(det.get('bct_min_lb', '') or 'SI'),
                str(det.get('cantidad', '') or ''),
                format_precio(precio_final, moneda_id),
                tiene_barniz,
                str(det.get('flete_ciudad', '') or '')[:12]
            ]
            data.append(row)

        # Anchos de columna ajustados
        col_widths = [40*mm, 22*mm, 20*mm, 12*mm, 12*mm, 12*mm, 15*mm, 18*mm, 12*mm, 18*mm,
                      15*mm, 12*mm, 12*mm, 15*mm, 18*mm, 22*mm, 12*mm, 20*mm]

        # Ajustar si hay muchas columnas
        col_widths = [25*mm, 18*mm, 16*mm, 10*mm, 10*mm, 10*mm, 12*mm, 14*mm, 8*mm, 14*mm,
                      12*mm, 10*mm, 10*mm, 14*mm, 14*mm, 18*mm, 10*mm, 16*mm]

        t = Table(data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_VERDE_CMPC),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, COLOR_GRIS),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 5*mm))

    # Tabla ESQUINEROS
    detalles_esquineros = cotizacion.get('detalles_esquineros', [])
    if detalles_esquineros:
        elements.append(Paragraph("<b>ESQUINEROS:</b>", estilo_seccion))

        header = ['Descripcion', 'Resistencia', 'Impresion', f'Precio ({moneda_str})', 'Flete']
        data = [header]

        for det in detalles_esquineros:
            precio_final = det.get('precio_final_usd') if moneda_id == 1 else det.get('precio_final_clp')
            if not precio_final:
                precio_final = det.get('precio_total_usd') if moneda_id == 1 else det.get('precio_total_clp')

            tiene_impresion = 'SI' if (det.get('numero_colores', 0) or 0) >= 1 else 'NO'

            row = [
                str(det.get('descripcion_material_detalle', ''))[:40],
                str(det.get('esquinero_resistencia', '') or ''),
                tiene_impresion,
                format_precio(precio_final, moneda_id),
                str(det.get('flete_ciudad', '') or '')
            ]
            data.append(row)

        col_widths = [70*mm, 30*mm, 25*mm, 35*mm, 30*mm]
        t = Table(data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_VERDE_CMPC),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, COLOR_GRIS),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 5*mm))

    # Observaciones
    elements.append(Paragraph("<b>Observaciones:</b>", estilo_seccion))
    observacion = cotizacion.get('observacion_cliente', '') or ''
    elements.append(Paragraph(observacion if observacion else "_" * 80, estilo_normal))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph("_" * 80, estilo_normal))
    elements.append(Paragraph("_" * 80, estilo_normal))

    return elements


def _generar_acuerdo_comercial(cotizacion: dict, styles, estilo_titulo, estilo_subtitulo,
                                estilo_seccion, estilo_normal, estilo_pequeno) -> List:
    """Genera seccion Acuerdo Comercial."""
    elements = []

    # Header
    elements.extend(_generar_header_cotizacion(cotizacion))

    # Datos vendedor
    vendedor_data = [
        [
            Paragraph(f"""
                <b>{cotizacion.get('vendedor_nombre', '')}</b><br/>
                {cotizacion.get('vendedor_rol', '')}<br/>
                {cotizacion.get('vendedor_telefono', '') or ''}<br/>
                {cotizacion.get('vendedor_email', '')}
            """, estilo_normal),
            Paragraph("""
                <b>Emitir orden de compra a:</b><br/>
                - Envases Impresos Cordillera SpA<br/>
                - Rut: 89.201.400-0<br/>
                - Direccion: Casa Matriz: Avda. Eyzaguirre 01098, Puente Alto<br/>
                - Telefono: (+562) 2444 24 00
            """, estilo_pequeno)
        ]
    ]

    t = Table(vendedor_data, colWidths=[80*mm, 110*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10*mm))

    # Acuerdos Comerciales
    elements.append(Paragraph("<u><b>Acuerdos comerciales</b></u>", estilo_seccion))
    elements.append(Spacer(1, 3*mm))

    dias_pago = cotizacion.get('dias_pago', 30)

    # Verificar condiciones especiales
    tiene_ajuste_precios = any(d.get('ajuste_precios') == 1 for d in cotizacion.get('detalles', []))
    tiene_devolucion_pallets = any(d.get('devolucion_pallets') == 1 for d in cotizacion.get('detalles', []))

    acuerdos = [
        "La validez de la presente cotizacion es de 10 dias habiles.",
        "Los valores no incluyen IVA.",
        f"Plazo de pago: <b>{dias_pago} dias.</b>",
    ]

    if tiene_ajuste_precios:
        acuerdos.append("Plazo de pago del IVA: Dia 12 del mes siguiente a la emision factura.")

    acuerdos.extend([
        "En caso de que corresponda, el credito debe ser aprobado por la Gerencia de Finanzas de CMPC.",
        "Plazo de entrega: A convenir. En caso de que se trate de un material nuevo, sera informada una vez que el material se encuentre aprobado e ingresado al sistema.",
        "La orden de compra se entendera cumplida con un 10% de mas o de menos respecto a las cantidades solicitadas. Dentro de esta tolerancia se incluye el despacho de saldos, incluso cuando ello implique el envio de pallets incompletos.",
        "La fecha de entrega de la orden de compra se considerara cumplida con una tolerancia de 48 horas previas o posteriores a la fecha estipulada, a menos que se acuerden otras condiciones.",
        "La presentacion de los productos se realizara con el paletizado que permita la maxima eficiencia logistica y estabilidad propuesta por CMPC, a menos que se acuerde algo diferente.",
        "Mediante Ord. N 971, de 16/3/2006, Art. 15 N 1, del D.L. N 825, de 1974, de producirse un alza en el cambio de la moneda extranjera, en el lapso que medie entre la fecha de la facturacion y la fecha del pago, esta se afectara o no con Impuesto al Valor Agregado.",
    ])

    if tiene_devolucion_pallets:
        acuerdos.append("Las tarimas utilizadas para la entrega de los productos son de propiedad de CMPC Biopackaging Corrugados y deben ser devueltas.")

    if tiene_ajuste_precios:
        acuerdos.append("Los precios indicados en la presente cotizacion podran ser modificados previo al despacho, en el caso que el indicador de precios de papeles de referencia publicado por Fastmarkets RISI indique una variacion superior al 5%.")

    acuerdos.append("Cualquier diferencia tecnica o condiciones comerciales no especificadas en este documento, deberan ser detalladas en un contrato acordado entre las partes.")

    for acuerdo in acuerdos:
        elements.append(Paragraph(f"- {acuerdo}", estilo_pequeno))
        elements.append(Spacer(1, 2*mm))

    return elements


def _generar_ficha_tecnica(styles, estilo_seccion, estilo_normal, estilo_pequeno) -> List:
    """
    Genera seccion Ficha Tecnica y Uso Previsto.
    Contenido estatico segun HACCP-REGISTRO N71.
    """
    elements = []

    # Header Ficha Tecnica
    header_data = [
        [
            Paragraph("<b>CMPC</b>", ParagraphStyle('Logo', fontSize=10)),
            Paragraph("<b>FICHA TECNICA Y USO PREVISTO</b>", ParagraphStyle('Centro', fontSize=12, alignment=TA_CENTER)),
            Paragraph("HACCP-REGISTRO N71<br/>Rev. 04 15-06-2022", ParagraphStyle('Derecha', fontSize=9))
        ]
    ]
    t = Table(header_data, colWidths=[50*mm, 90*mm, 50*mm])
    t.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # 1. NOMBRES DE LOS PRODUCTOS
    elements.append(Paragraph("<b>1. NOMBRES DE LOS PRODUCTOS</b>", estilo_seccion))
    productos = [
        "Cajas de carton corrugado con y sin impresion en cara externa y/o interna, cajas ceresinada.",
        "Piezas interiores en base a carton corrugado.",
        "Placas de carton corrugado sin impresion.",
        "Esquineros."
    ]
    for p in productos:
        elements.append(Paragraph(f"- {p}", estilo_pequeno))
    elements.append(Spacer(1, 5*mm))

    # 2. DESCRIPCION GENERAL Y COMPOSICION
    elements.append(Paragraph("<b>2. DESCRIPCION GENERAL Y COMPOSICION</b>", estilo_seccion))
    elements.append(Paragraph(
        "El producto corresponde a una configuracion de papeles liners y ondas pegadas entre si. "
        "Para cajas emplacadas se adiciona cartulina impresa pegada.",
        estilo_pequeno
    ))
    elements.append(Paragraph("<u>Composicion:</u>", estilo_pequeno))
    composicion = [
        "Papel: En base a fibra reciclada, fibra virgen o mezcla de ambas.",
        "Adhesivo Corrugado: En bases a almidon de maiz, agua, borax, soda caustica y resinas.",
        "Adhesivo Conversion: PVA para convertidoras.",
        "Tintas: Bases pigmentarias en base de agua, barnices y aditivos."
    ]
    for c in composicion:
        elements.append(Paragraph(f"- {c}", estilo_pequeno))
    elements.append(Spacer(1, 5*mm))

    # 3. USO PREVISTO
    elements.append(Paragraph("<b>3. USO PREVISTO / GRUPOS DE USUARIOS</b>", estilo_seccion))
    usos = [
        "Producto para usar como envase de productos industriales.",
        "El producto no es para consumo humano.",
        "El producto no es para consumo animal.",
        "El producto es LIBRE de derivados de origen animal.",
        "La composicion del producto es libre de alcohol.",
        "El producto no es apto para utilizar en hornos microondas ni hornos convencionales.",
        "Se utiliza en mercados industriales: Agroindustrial - Acuicola - Vitivinicola - Industrial masivo."
    ]
    for u in usos:
        elements.append(Paragraph(f"- {u}", estilo_pequeno))
    elements.append(Spacer(1, 5*mm))

    # 4. PROCESOS DE FABRICACION
    elements.append(Paragraph("<b>4. PROCESOS DE FABRICACION</b>", estilo_seccion))
    procesos = [
        "Corrugado (con fabricacion de adhesivo)",
        "El carton corrugado se fabrica a partir de la union de papeles pegados con adhesivo (almidon) y humedad.",
        "Conversion (con Impresion, Troquelado, Rayado y Pegado).",
        "Emplacado y/o ceresinado."
    ]
    for p in procesos:
        elements.append(Paragraph(f"- {p}", estilo_pequeno))
    elements.append(Spacer(1, 5*mm))

    # 5. PROPIEDADES FISICAS
    elements.append(Paragraph("<b>5. PROPIEDADES FISICAS</b>", estilo_seccion))
    props_data = [
        ['Caracteristicas'],
        ['BCT Resistencia a la compresion vertical en cajas'],
        ['ECT (Test compresion de columna)'],
        ['Dimensiones'],
        ['Espesor'],
        ['Humedad']
    ]
    t = Table(props_data, colWidths=[150*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_GRIS),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 5*mm))

    # 6. DEFECTOS DE CALIDAD
    elements.append(Paragraph("<b>6. DEFECTOS DE CALIDAD</b>", estilo_seccion))
    elements.append(Paragraph("AQL por Categoria de defecto - Limite de calidad aceptable:", estilo_pequeno))
    aql_data = [
        ['Categoria de defecto', 'AQL'],
        ['Defecto Critico', '1,5%'],
        ['Defecto Mayor', '4,0%'],
        ['Defecto Menor', '6,5%']
    ]
    t = Table(aql_data, colWidths=[60*mm, 30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_GRIS),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 5*mm))

    # 11. ALMACENAMIENTO
    elements.append(Paragraph("<b>11. ALMACENAMIENTO Y CONDICIONES DE TRANSPORTE</b>", estilo_seccion))
    elements.append(Paragraph(
        "Mantener en lugares secos, techados, cerradas, y ventiladas, evitando humedad, "
        "exposicion directa al sol y excesivo calor. Almacenar sobre pallets, no directo a piso.",
        estilo_pequeno
    ))
    elements.append(Spacer(1, 5*mm))

    # 12. VIDA UTIL
    elements.append(Paragraph("<b>12. VIDA UTIL</b>", estilo_seccion))
    elements.append(Paragraph(
        "Dos anos sin uso a partir de la fecha de fabricacion y manteniendo las condiciones de almacenamiento y distribucion.",
        estilo_pequeno
    ))
    elements.append(Spacer(1, 5*mm))

    # Footer
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph(
        "CMPC Biopackaging Corrugados - Av. Eyzaguirre 01098, Puente Alto, Santiago",
        ParagraphStyle('Footer', fontSize=8, alignment=TA_CENTER, textColor=COLOR_GRIS)
    ))

    return elements
