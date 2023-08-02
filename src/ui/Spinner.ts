import ora from 'ora';

/**
 * Shows the spinner with an optional text. This is an alternative to the existing
 * ora.promise() function which on success keeps in the terminal a success icon and the text.
 * This function instead makes all of the spinner disappear on success.
 *
 * @param func - Function to be executed
 * @param text - Optional - Text to be displayed next to the spinner
 * @returns Promise containing the output of the function passed in the first parameter
 */
export const showSpinner = async <T>(func: () => Promise<T>, text?: string): Promise<T> => {
  const spinner = ora(text && `${text}\n`).start();
  let result: T;

  try {
    result = await func();
  } catch (error: Error | any) {
    spinner.fail();
    throw error;
  }

  spinner.stop();
  return result;
};
