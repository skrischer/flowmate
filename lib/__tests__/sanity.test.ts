/// <reference types="jest" />
// Smoke test: confirms the Jest + jest-expo + TypeScript pipeline runs.
// The first real suite (the prediction engine) lands with its own issue.
describe('test pipeline', () => {
  it('runs a TypeScript test through jest-expo', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(2, 3)).toBe(5);
  });
});
