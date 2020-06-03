function isArray(text: string | string[]): text is string[] {
  return Array.isArray(text);
}

function insertNewlineAtPosition(
  position: number,
  arrayOfStrings: string[]
): string[] {
  const { indexToInsertInto, localPosition } = arrayOfStrings.reduce(
    (
      {
        indexToInsertInto,
        localPosition,
        lengthOfPreceding
      }: {
        indexToInsertInto: number;
        localPosition: number;
        lengthOfPreceding: number;
      },
      string,
      i
    ) => {
      const totalLength = string.length + lengthOfPreceding;
      if (!indexToInsertInto && !localPosition && position < totalLength) {
        return {
          indexToInsertInto: i,
          localPosition: position - lengthOfPreceding,
          lengthOfPreceding: totalLength
        };
      }
      return {
        indexToInsertInto,
        localPosition,
        lengthOfPreceding: totalLength
      };
    },
    { indexToInsertInto: 0, localPosition: 0, lengthOfPreceding: 0 }
  );

  return (
    arrayOfStrings
      .map((string, i) => {
        if (i === indexToInsertInto) {
          return (
            string.slice(0, localPosition) + "\n" + string.slice(localPosition)
          );
        }
        return string;
      })
      // This is to remove whitespace adjacent to newlines, but to preserve starting or trailing whitespace
      .map(string =>
        string
          .split("\n")
          .map((str, i, strs) => {
            if (i < strs.length - 2 && i > 0) {
              return str.trim();
            }
            if (i < strs.length - 2) {
              return str.trimRight();
            } else if (i > 0) {
              return str.trimLeft();
            }
            return str;
          })
          .join("\n")
      )
  );
}

function breakLines<T extends string>(text: T, width: number, font: string): T {
  const supportsOffscreenCanvas = "OffscreenCanvas" in window;

  const canvasEl = document.createElement("canvas");

  const canvas = supportsOffscreenCanvas
    ? canvasEl.transferControlToOffscreen()
    : canvasEl;

  canvas.width = width;
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (ctx) {
    ctx.font = font;

    const brokenWords = text.split(" ").reduce(
      (accumulator: string[][], word: string) => {
        // get the last element of the accumulator
        const [lastLine] = accumulator.slice(-1);

        // add the word to it
        const maybeNextLine = [...lastLine, word].join(" ");

        // see if it fits within the width
        let { width: textWidth } = ctx.measureText(maybeNextLine);

        // if it does, append to the last element
        if (textWidth <= width) {
          return [...accumulator.slice(0, -1), [...lastLine, word]];
        }

        if (lastLine.length === 0) {
          return [...accumulator.slice(0, -1), [word]];
        }

        // if not, create a new array containing the word as the last element
        return [...accumulator, [word]];
      },
      [[]]
    );

    return brokenWords.map(line => line.join(" ")).join("\n") as T;
  }

  console.warn("No canvas context was found, so the string was left as is!");
  return text;
}

function breakLinesEntry(text: string, width: number, font: string): string;
function breakLinesEntry(text: string[], width: number, font: string): string[];
/**
 * Breaks a string into lines given a width and style for the text.
 *
 * @param string - The text to be broken into lines
 * @param width - The width in pixels for the text to fit into
 * @param font - The style of the text expressed as a value of the CSS font property, e.g. '12pt bold serif'
 * @returns The given string with newlines inserted
 */
function breakLinesEntry(
  text: string | string[],
  width: number,
  font: string
): string | string[] {
  if (isArray(text)) {
    /*
      ['hello there ', 'my good friend, ', 'how are you today?']
    + ['hello there my good\n friend, how are you\n today?']
    = ['hello there ', 'my good\n friend, ', 'how are you\n today?']
    */
    const withNewLines = breakLines(text.join(""), width, font);
    const newLinePositions = withNewLines
      .split("")
      .reduce((positions: number[], char, i) => {
        if (char === "\n") {
          return [...positions, i];
        }
        return positions;
      }, []);

    return newLinePositions.reduce((result, position) => {
      return insertNewlineAtPosition(position, result) as string[];
    }, text);
  }

  return breakLines(text, width, font);
}

export default breakLinesEntry;
