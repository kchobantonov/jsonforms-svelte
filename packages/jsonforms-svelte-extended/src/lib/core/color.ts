export const COLOR_PATTERN =
  "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$";
export const COLOR_REGEX = new RegExp(COLOR_PATTERN);
export const COLOR_MASKS = ["!#HHH", "!#HHHHHH", "!#HHHHHHHH"];
export const COLOR_MASK_TOKENS = { H: { pattern: /[0-9a-fA-F]/ } };

export const isColor = (value: unknown): value is string =>
  typeof value === "string" && COLOR_REGEX.test(value);

export const toColorInputValue = (
  value: unknown,
  fallback = "#000000",
): string => {
  if (!isColor(value)) {
    return fallback;
  }

  if (value.length === 4) {
    const [red, green, blue] = value.slice(1);
    return `#${red}${red}${green}${green}${blue}${blue}`;
  }

  // Native color inputs support six-digit colors. Preserve the editable
  // eight-digit value in the text input while showing its RGB portion here.
  return value.slice(0, 7);
};

export const isTransparentColor = (value: unknown): boolean =>
  isColor(value) && value.length === 9 && value.slice(7).toLowerCase() !== "ff";

/** Nearest #RGB color: RGB channels quantized independently to multiples of 17. */
export const toHex3 = (value: unknown): string | undefined => {
  if (!isColor(value) || isTransparentColor(value)) return undefined;
  const rgb = toColorInputValue(value);
  return (
    "#" +
    [1, 3, 5]
      .map((index) =>
        Math.round(parseInt(rgb.slice(index, index + 2), 16) / 17).toString(16),
      )
      .join("")
  );
};
