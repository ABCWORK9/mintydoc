function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

export function formatDate(input: Date | string | number | null | undefined) {
  if (input === null || input === undefined || input === "") return "";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  return `${year}-${month}-${day}`;
}
