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
export const showDisappearingSpinner = async <T>(func: () => Promise<T>, text?: string): Promise<T> => {
  const spinner = ora(text && `${text}\n`).start();

  try {
    const result = await func();

    spinner.stop();

    return result;
  } catch (error: Error | any) {
    spinner.fail();
    throw error;
  }
};

/**
 * Shows the spinner with an optional text. Wrapper around ora.promise() to reduce the number of lines needed to display correctly.
 *
 * @param func - Function to be executed
 * @param options - Optional - Either a string with the text to be displayed, or an instance of {@link ora.Options}
 * @returns Promise containing the output of the function passed in the first parameter
 */
export const showSpinner = async <T>(func: () => Promise<T>, options?: string | ora.Options): Promise<T> => {
  const auxPromise = func()

  ora.promise(auxPromise, options)

  return auxPromise
};
