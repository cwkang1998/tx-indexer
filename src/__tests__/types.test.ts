import { describe, expect, it } from "@jest/globals";
import { validateHex, validateTxTypeEnum } from "../types";

describe("test validation", () => {
  describe("validateHex", () => {
    it("should return value if given valid hex", async () => {
      const validateResult = await validateHex().safeParseAsync(
        "0x0123456789abcdef"
      );

      expect(validateResult.success).toStrictEqual(true);
      if (!validateResult.success) {
        throw validateResult.error;
      }

      expect(validateResult.data).toStrictEqual("0x0123456789abcdef");
    });

    it("should return value if given shortest valid hex", async () => {
      const validateResult = await validateHex().safeParseAsync("0x0");

      expect(validateResult.success).toStrictEqual(true);
      if (!validateResult.success) {
        throw validateResult.error;
      }

      expect(validateResult.data).toStrictEqual("0x0");
    });

    it.each`
      val
      ${"0x0123456789abcdefg"}
      ${"0123456789abcdef"}
      ${"Hello World!"}
    `(
      "should return error if given invalid hex value - $val",
      async ({ val }) => {
        const validateResult = await validateHex().safeParseAsync(val);

        expect(validateResult.success).toStrictEqual(false);
        if (validateResult.success) {
          throw new Error("Should fail");
        }

        expect(validateResult.error.message).toContain("Invalid hex value");
      }
    );
  });

  describe("validateTxTypeEnum", () => {
    it.each`
      val
      ${"INVOKE"}
      ${"L1_HANDLER"}
    `("should return value if given valid txType - $val", async ({ val }) => {
      const validateResult = await validateTxTypeEnum().safeParseAsync(val);

      expect(validateResult.success).toStrictEqual(true);
      if (!validateResult.success) {
        throw new Error("Should fail");
      }

      expect(validateResult.data).toStrictEqual(val);
    });

    it.each`
      val
      ${"LOL"}
      ${"invoke"}
      ${"l1-handler"}
      ${"L1_handler"}
      ${"InvOke"}
      ${"randomValue"}
    `("should return error if given invalid txType - $val", async ({ val }) => {
      const validateResult = await validateTxTypeEnum().safeParseAsync(val);

      expect(validateResult.success).toStrictEqual(false);
      if (validateResult.success) {
        throw new Error("Should fail");
      }

      expect(validateResult.error).toBeDefined();
    });
  });
});
