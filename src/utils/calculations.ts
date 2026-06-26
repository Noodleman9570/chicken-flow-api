// src/utils/calculations.ts
// Lógica de cálculo de indicadores avícolas (FCR, mortalidad, rentabilidad, etc.)

/**
 * Calcula el Factor de Conversión Alimenticia (FCR)
 * FCR = alimento consumido (kg) / ganancia de peso total (kg)
 */
export function calcularFCR(alimentoKg: number, pollosVivos: number, pesoPromedioKg: number): number {
  const gananciaPeso = pollosVivos * pesoPromedioKg;
  if (gananciaPeso === 0) return 0;
  return parseFloat((alimentoKg / gananciaPeso).toFixed(2));
}

/**
 * Calcula la tasa de mortalidad acumulada
 */
export function calcularMortalidad(pollosIniciales: number, pollosMuertos: number): number {
  if (pollosIniciales === 0) return 0;
  return parseFloat(((pollosMuertos / pollosIniciales) * 100).toFixed(2));
}

/**
 * Calcula el peso promedio de muestras
 */
export function calcularPesoPromedio(pesos: number[]): number {
  const validos = pesos.filter((p) => p > 0);
  if (validos.length === 0) return 0;
  return parseFloat((validos.reduce((a, b) => a + b, 0) / validos.length).toFixed(1));
}

/**
 * Calcula los costos totales de un lote a partir de sus precios configurados
 */
export function calcularCostosLote(params: {
  cantidadPollitos: number;
  precioPollito: number;
  precioIniciador: number;     // Precio por bulto 40kg
  precioFinalizador: number;   // Precio por bulto 40kg
  precioViruta: number;
  precioVacunas: number;
  costoCalefaccion: number;
  costoTransporte: number;
  costosProcesamiento: number;
  costoEntrega: number;
}): { costoAlimento: number; costosDirectos: number; costoTotal: number } {
  // Consumo estimado: 1kg iniciador + 3.3kg finalizador por pollo
  const alimentoIniciadorKg = params.cantidadPollitos * 1;
  const alimentoFinalizadorKg = params.cantidadPollitos * 3.3;
  const costoAlimentoIniciador = (alimentoIniciadorKg / 40) * params.precioIniciador;
  const costoAlimentoFinalizador = (alimentoFinalizadorKg / 40) * params.precioFinalizador;
  const costoAlimento = costoAlimentoIniciador + costoAlimentoFinalizador;

  const costosPollitos = params.cantidadPollitos * params.precioPollito;
  const costosDirectos =
    costosPollitos +
    params.precioViruta +
    params.precioVacunas +
    params.costoCalefaccion +
    params.costoTransporte +
    params.costosProcesamiento +
    params.costoEntrega;

  return {
    costoAlimento,
    costosDirectos,
    costoTotal: costoAlimento + costosDirectos,
  };
}

/**
 * Calcula los ingresos estimados y rentabilidad del lote
 */
export function calcularRentabilidad(params: {
  pollosVivos: number;
  pesoPromedioKg: number;
  pesoCanal: number;       // Factor conversión a canal (ej: 0.76)
  precioVentaLb: number;
  costoTotal: number;
}): { ingresosEstimados: number; gananciaNeta: number; rentabilidad: number } {
  const KG_POR_LIBRA = 2.20462;
  const pesoTotalLb = params.pollosVivos * params.pesoPromedioKg * params.pesoCanal * KG_POR_LIBRA;
  const ingresosEstimados = pesoTotalLb * params.precioVentaLb;
  const gananciaNeta = ingresosEstimados - params.costoTotal;
  const rentabilidad =
    params.costoTotal > 0
      ? parseFloat(((gananciaNeta / params.costoTotal) * 100).toFixed(2))
      : 0;

  return {
    ingresosEstimados: Math.round(ingresosEstimados),
    gananciaNeta: Math.round(gananciaNeta),
    rentabilidad,
  };
}

/**
 * Calcula alimento necesario para una cantidad de pollitos (ciclo de 42 días)
 */
export function calcularAlimentoNecesario(cantidadPollitos: number): {
  iniciadorNecesarioKg: number;
  finalizadorNecesarioKg: number;
  iniciadorBultosSugeridos: number;
  finalizadorBultosSugeridos: number;
} {
  const iniciadorKg = cantidadPollitos * 1.0;       // 1 kg/pollo primeras 3 semanas
  const finalizadorKg = cantidadPollitos * 3.3;     // 3.3 kg/pollo últimas 3 semanas
  return {
    iniciadorNecesarioKg: iniciadorKg,
    finalizadorNecesarioKg: finalizadorKg,
    iniciadorBultosSugeridos: Math.ceil(iniciadorKg / 40),
    finalizadorBultosSugeridos: Math.ceil(finalizadorKg / 40),
  };
}

/**
 * Evalúa los indicadores de un lote (estado: optimo, bueno, advertencia, critico)
 */
export function evaluarIndicador(
  campo: 'mortalidad' | 'fcr' | 'peso' | 'rentabilidad',
  valor: number
): 'optimo' | 'bueno' | 'advertencia' | 'critico' {
  switch (campo) {
    case 'mortalidad':
      if (valor <= 3) return 'optimo';
      if (valor <= 5) return 'bueno';
      if (valor <= 10) return 'advertencia';
      return 'critico';
    case 'fcr':
      if (valor <= 1.6) return 'optimo';
      if (valor <= 1.85) return 'bueno';
      if (valor <= 2.1) return 'advertencia';
      return 'critico';
    case 'peso':
      if (valor >= 2400) return 'optimo';
      if (valor >= 2000) return 'bueno';
      if (valor >= 1500) return 'advertencia';
      return 'critico';
    case 'rentabilidad':
      if (valor >= 15) return 'optimo';
      if (valor >= 8) return 'bueno';
      if (valor >= 0) return 'advertencia';
      return 'critico';
  }
}
