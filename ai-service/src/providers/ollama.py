"""
Ollama LLM Provider - Local AI inference.

Ollama runs models locally for privacy-focused processing.
No API key required, just need Ollama running locally.
"""

import os
import httpx
from typing import Optional
from .types import LLMProvider, LLMCompletionParams


class OllamaProvider(LLMProvider):
    """
    Ollama provider for local LLM inference.

    Requires Ollama to be installed and running.
    Install: https://ollama.ai
    """

    def __init__(self, model: Optional[str] = None):
        self._base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self._model = model or os.getenv("OLLAMA_MODEL", "llama3.2")
        self._timeout = 120.0  # LLM inference can be slow

    @property
    def name(self) -> str:
        return "Ollama"

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, params: LLMCompletionParams) -> str:
        """Generate completion using Ollama API."""
        # Convert messages to Ollama format
        messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in params.messages
        ]

        payload = {
            "model": self._model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": params.temperature,
                "num_predict": params.max_tokens,
            }
        }

        # Add JSON format if requested
        if params.json_mode:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}/api/chat",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")

    async def is_available(self) -> bool:
        """Check if Ollama is running and the model is available."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Check if Ollama is running
                response = await client.get(f"{self._base_url}/api/tags")
                if response.status_code != 200:
                    return False

                # Check if our model is available
                data = response.json()
                models = [m.get("name", "").split(":")[0] for m in data.get("models", [])]
                model_base = self._model.split(":")[0]

                if model_base not in models:
                    print(f"Model '{self._model}' not found. Available: {models}")
                    print(f"Pull it with: ollama pull {self._model}")
                    return False

                return True
        except Exception as e:
            print(f"Ollama not available: {e}")
            return False
