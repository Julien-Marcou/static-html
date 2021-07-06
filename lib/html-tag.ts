export function html(strings: TemplateStringsArray, ...values: Array<unknown>): string {
  let result = '';
  for (let i = 0; i < values.length; i++) {
    result += strings[i];
    const value = values[i];
    if (value instanceof Array) {
      result += value.join('');
    }
    else {
      result += value;
    }
  }
  result += strings[values.length];
  return result;
}
