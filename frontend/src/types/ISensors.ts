export interface ISensors {
  ionizador: {
    ph: number,
    output: boolean | undefined,
    autoStart: { on: boolean, minValue: number, maxValue: number },
  },
  placaSolar: { tensaoEntrada: number, tensaoRebaixada: number },
  client: 'server' | 'sensor' | 'frontend',
}