export async function performInference({ model, input, max_tokens }) {
  const preview = input.slice(0, 120).replace(/\s+/g, ' ');
  return `Model=${model} | tokens<=${max_tokens} | summary: ${preview} ...`;
}