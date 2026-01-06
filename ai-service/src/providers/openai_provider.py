"""
OpenAI LLM Provider.

Uses OpenAI's API for high-quality inference.
Requires OPENAI_API_KEY environment variable.
"""

import os
import httpx
from typing import Optional
from .types import LLMProvider, LLMCompletionParams


class OpenAIProvider(LLMProvider):
    """
    OpenAI provider for cloud LLM inference.

    Requires OPENAI_API_KEY environment variable.
    Get a key at: https://platform.openai.com/api-keys
    """

    def __init__(self, model: Optional[str] = None):
        self._api_key = os.getenv("OPENAI_API_KEY")
        self._base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self._model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self._timeout = 60.0

    @property
    def name(self) -> str:
        return "OpenAI"

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, params: LLMCompletionParams) -> str:
        """Generate completion using OpenAI API."""
        if not self._api_key:
            raise ValueError("OPENAI_API_KEY not set")

        # Convert messages to OpenAI format
        messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in params.messages
        ]

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": params.temperature,
            "max_tokens": params.max_tokens,
        }

        # Add JSON mode if requested
        if params.json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}/chat/completions",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def is_available(self) -> bool:
        """Check if OpenAI API key is configured."""
        if not self._api_key:
            print("OpenAI API key not configured (OPENAI_API_KEY)")
            return False

        # Optionally verify the key works
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self._base_url}/models",
                    headers={"Authorization": f"Bearer {self._api_key}"}
                )
                return response.status_code == 200
        except Exception as e:
            print(f"OpenAI API check failed: {e}")
            return False
