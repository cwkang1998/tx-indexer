/**
 * Json stringify implementation compatible for
 * big integer. Use this in place of normal JSON.stringify.
 * @param payload Payload to be stringified
 * @returns {String} Json stringified value
 */
export const compatJsonStringify = (payload: any): string => {
  return JSON.stringify(
    payload,
    (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
  );
};
