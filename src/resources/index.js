export function configure(config) {
  config.globalResources([
    './value-converters/price',
    './value-converters/date'
  ]);
}
