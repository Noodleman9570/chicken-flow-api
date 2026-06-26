# 10 - Finanzas y utilidades

## Objetivo
Calcular utilidad neta, sueldos, servicios, reinversión, fondo de emergencia y dividendos.

## Vista frontend
- `/dashboard/finance`
- `/dashboard/balance`

## Entidad principal
```ts
interface FinancialDistribution {
  id: string
  period: string
  grossIncome: number
  operatingCosts: number
  salariesAndServices: number
  netProfit: number
  reinvestment: number
  emergencyFund: number
  dividends: number
  founderShare: number
  operatorShare: number
  margin: number
}
```

## GET /api/v1/finance/distributions
Lista cierres financieros.

## POST /api/v1/finance/close-period
Genera cierre financiero del periodo.

### Body
```json
{
  "period": "2026-06",
  "includeLots": ["lot-004"],
  "distributionRule": {
    "reinvestment": 60,
    "emergencyFund": 25,
    "dividends": 15,
    "founderShare": 80,
    "operatorShare": 20
  }
}
```

## GET /api/v1/finance/summary
Resumen financiero mensual.

## GET /api/v1/finance/projections
Proyección de crecimiento por etapas.
