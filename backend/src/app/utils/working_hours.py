"""
Cálculo de horas laborales - Replica exacta de Laravel get_working_hours()

Este módulo implementa la lógica de cálculo de horas trabajadas del sistema
Laravel original, considerando:
- Horarios laborales Lu-Ju y Viernes
- Feriados configurados en system_variables
- Excepciones de horario por fecha
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
import pymysql
from functools import lru_cache


class WorkingHoursCalculator:
    """
    Calcula horas laborales entre dos fechas, excluyendo:
    - Fines de semana (Sábado y Domingo)
    - Feriados (desde system_variables.Feriados)
    - Horas fuera del horario laboral
    """

    def __init__(self, connection):
        """
        Inicializa el calculador cargando configuración desde BD.

        Args:
            connection: Conexión MySQL activa
        """
        self.connection = connection
        self._load_config()

    def _load_config(self):
        """Carga configuración de horarios desde system_variables."""
        with self.connection.cursor() as cursor:
            # Horario Lu-Jue
            cursor.execute(
                "SELECT contents FROM system_variables WHERE name = 'Horario' AND deleted = 0 LIMIT 1"
            )
            row = cursor.fetchone()
            horario = row['contents'] if row else '08:15,17:45'
            parts = [p.strip() for p in horario.split(',')]
            self.ini_lj = parts[0] if len(parts) > 0 else '08:15'
            self.fin_lj = parts[1] if len(parts) > 1 else '17:45'

            # Horario Viernes
            cursor.execute(
                "SELECT contents FROM system_variables WHERE name = 'HorarioViernes' AND deleted = 0 LIMIT 1"
            )
            row = cursor.fetchone()
            horario_vie = row['contents'] if row else '08:15,15:00'
            parts_v = [p.strip() for p in horario_vie.split(',')]
            self.ini_v = parts_v[0] if len(parts_v) > 0 else '08:15'
            self.fin_v = parts_v[1] if len(parts_v) > 1 else '15:00'

            # Feriados
            cursor.execute(
                "SELECT contents FROM system_variables WHERE name = 'Feriados' AND deleted = 0 LIMIT 1"
            )
            row = cursor.fetchone()
            feriados_csv = row['contents'] if row else ''
            self.feriados = set(
                f.strip() for f in feriados_csv.split(',') if f.strip()
            )

            # Excepciones de horario
            cursor.execute(
                "SELECT contents FROM system_variables WHERE name = 'FechaExcepcion' AND deleted = 0 LIMIT 1"
            )
            row = cursor.fetchone()
            fecha_exc_csv = row['contents'] if row else ''

            cursor.execute(
                "SELECT contents FROM system_variables WHERE name = 'HoraExcepcion' AND deleted = 0 LIMIT 1"
            )
            row = cursor.fetchone()
            hora_exc_csv = row['contents'] if row else ''

            fecha_exc_arr = [f.strip() for f in fecha_exc_csv.split(',') if f.strip()]
            hora_exc_arr = [h.strip() for h in hora_exc_csv.split(',') if h.strip()]

            self.excepciones = {}
            for i, fecha in enumerate(fecha_exc_arr):
                if i < len(hora_exc_arr) and hora_exc_arr[i]:
                    self.excepciones[fecha] = hora_exc_arr[i]

    def _parse_time(self, time_str: str) -> Tuple[int, int]:
        """Parsea string HH:MM a tuple (hora, minuto)."""
        parts = time_str.split(':')
        return int(parts[0]), int(parts[1]) if len(parts) > 1 else 0

    def _create_datetime(self, date_str: str, time_str: str) -> datetime:
        """Crea datetime combinando fecha y hora."""
        hour, minute = self._parse_time(time_str)
        base = datetime.strptime(date_str, '%Y-%m-%d')
        return base.replace(hour=hour, minute=minute)

    def get_working_hours(self, start: datetime, end: datetime) -> float:
        """
        Calcula horas laborales entre start y end.

        Args:
            start: Fecha/hora de inicio
            end: Fecha/hora de fin

        Returns:
            float: Horas laborales transcurridas
        """
        if end <= start:
            return 0.0

        total_seconds = 0
        day = datetime(start.year, start.month, start.day)  # 00:00 del día de inicio
        end_day = datetime(end.year, end.month, end.day)    # 00:00 del día fin

        while day <= end_day:
            date_str = day.strftime('%Y-%m-%d')
            weekday = day.weekday()  # 0=Lunes ... 6=Domingo

            # Excluir fines de semana (5=Sábado, 6=Domingo) y feriados
            if weekday in [5, 6] or date_str in self.feriados:
                day += timedelta(days=1)
                continue

            # Elegir ventana laboral del día
            if weekday == 4:  # Viernes
                ini_h, fin_h = self.ini_v, self.fin_v
            else:
                ini_h, fin_h = self.ini_lj, self.fin_lj

            # Excepción de fin de jornada para este día
            if date_str in self.excepciones:
                fin_h = self.excepciones[date_str]

            # Crear ventana del día
            try:
                win_start = self._create_datetime(date_str, ini_h)
                win_end = self._create_datetime(date_str, fin_h)
            except ValueError:
                day += timedelta(days=1)
                continue

            # Ventana inválida -> saltar
            if win_end <= win_start:
                day += timedelta(days=1)
                continue

            # Intersección [start, end) con [win_start, win_end)
            from_ts = max(win_start.timestamp(), start.timestamp())
            to_ts = min(win_end.timestamp(), end.timestamp())

            if to_ts > from_ts:
                total_seconds += (to_ts - from_ts)

            day += timedelta(days=1)

        # Retornar HORAS (float)
        return total_seconds / 3600


def get_working_hours(connection, start: datetime, end: datetime) -> float:
    """
    Función de conveniencia para calcular horas laborales.

    Args:
        connection: Conexión MySQL activa
        start: Fecha/hora de inicio
        end: Fecha/hora de fin

    Returns:
        float: Horas laborales transcurridas
    """
    calculator = WorkingHoursCalculator(connection)
    return calculator.get_working_hours(start, end)


def get_working_days(start: datetime, end: datetime, hours_per_day: float = 9.5) -> float:
    """
    Convierte horas laborales a días laborales.

    Args:
        start: Fecha/hora de inicio
        end: Fecha/hora de fin (se usará NOW si es None)
        hours_per_day: Horas por día laboral (default: 9.5 como Laravel)

    Returns:
        float: Días laborales (redondeado a 1 decimal)
    """
    # Esta función se usa cuando ya tenemos las horas calculadas
    pass
