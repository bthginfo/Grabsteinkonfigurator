import { describe, expect, it } from "vitest";
import { modelAssetSchema, modelSelectionValue } from "./model-asset";

const validModel = {
  id: "serie-142",
  label: "Serie 142",
  runtimeUrl: "/models/serie-142.glb",
  nativeSizeCm: { height: 92, width: 54, depth: 16 },
};

describe("modelAssetSchema", () => {
  it("normalizes a minimal supplier model manifest", () => {
    const model = modelAssetSchema.parse(validModel);
    expect(model.format).toBe("glb");
    expect(model.fallbackForm).toBe("stele");
    expect(model.materialMode).toBe("configurable");
    expect(model.transform.rotationDeg).toEqual([0, 0, 0]);
    expect(model.inscriptionSurface.maxWidthRatio).toBe(0.72);
    expect(modelSelectionValue(model)).toBe("model:serie-142");
  });

  it("rejects unsupported or insecure runtime locations", () => {
    expect(modelAssetSchema.safeParse({ ...validModel, runtimeUrl: "http://example.com/model.obj" }).success).toBe(false);
  });
});
