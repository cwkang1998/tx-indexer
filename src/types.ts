import { z } from "zod";

export enum TxType {
  INVOKE = 0,
  L1_HANDLER = 1,
}

export type TxTypeString = "INVOKE" | "L1_HANDLER";

export const validateHex = () =>
  z.string().regex(/^0x[0-9a-f]+$/i, "Invalid hex value");

export const validateTxTypeEnum = () => z.enum(["INVOKE", "L1_HANDLER"]);
