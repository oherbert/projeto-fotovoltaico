export interface ISensors {
  ionizador: {
    ph: number,
    output: boolean | undefined,
    autoStart: { on: boolean, minValue: number, maxValue: number }
  }
}