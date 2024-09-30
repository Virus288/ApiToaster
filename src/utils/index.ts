// eslint-disable-next-line import/prefer-default-export
export const sleep = (time: number = 1000): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time ?? 1000);
  });
};
