// Server-side embedding state tracker
// No @huggingface/transformers - all embedding happens client-side
// This module only tracks whether embeddings have been stored

let embeddingsStored = false;

export function setEmbeddingsReady(ready: boolean): void {
  embeddingsStored = ready;
}

export function isModelLoaded(): boolean {
  return embeddingsStored;
}
