export const sleep = (time: number = 1000): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time ?? 1000);
  });
};
export const checkIfObject = (v: string): boolean => {
  if (String(v).trim().slice(0, 1) === '{') {
    return true;
  }
  return false;
};
