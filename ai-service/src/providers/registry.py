"""
LLM Provider Registry and Factory.

Central configuration for all available LLM providers.
Provider selection via LLM_PROVIDER environment variable.
"""

import os
from typing import Dict, Any, Optional
from .types import LLMProvider
from .ollama import OllamaProvider
from .openai_provider import OpenAIProvider
from .mock import MockLLMProvider


# Provider configuration registry
PROVIDER_CONFIG: Dict[str, Dict[str, Any]] = {
    "ollama": {
        "name": "Ollama (Local)",
        "description": "Run AI locally on your machine - free, private",
        "env_keys": [],  # No API key needed
        "default_model": "llama3.2",
        "setup_url": "https://ollama.ai",
        "setup_steps": [
            "Install Ollama from https://ollama.ai",
            "Run: ollama pull llama3.2",
            "Ollama runs automatically after install"
        ]
    },
    "openai": {
        "name": "OpenAI",
        "description": "Cloud-based AI with high accuracy",
        "env_keys": ["OPENAI_API_KEY"],
        "default_model": "gpt-4o-mini",
        "setup_url": "https://platform.openai.com/api-keys",
        "setup_steps": [
            "Create account at https://platform.openai.com",
            "Generate API key",
            "Add OPENAI_API_KEY to .env"
        ]
    },
    "mock": {
        "name": "Mock Provider",
        "description": "Fake responses for testing - always available",
        "env_keys": [],
        "default_model": "mock-v1",
        "setup_url": None,
        "setup_steps": ["No setup required"]
    }
}


def get_available_providers() -> Dict[str, Dict[str, Any]]:
    """Get information about all available providers."""
    return PROVIDER_CONFIG.copy()


def create_llm_provider(provider_name: Optional[str] = None) -> LLMProvider:
    """
    Create an LLM provider instance.

    Args:
        provider_name: Provider to use. If None, reads from LLM_PROVIDER env var.
                      Falls back to 'ollama', then 'mock' if not available.

    Returns:
        LLMProvider instance
    """
    # Determine provider
    if provider_name is None:
        provider_name = os.getenv("LLM_PROVIDER", "ollama")

    provider_name = provider_name.lower()

    # Create provider instance
    if provider_name == "ollama":
        return OllamaProvider()
    elif provider_name == "openai":
        return OpenAIProvider()
    elif provider_name == "mock":
        return MockLLMProvider()
    else:
        print(f"Unknown provider '{provider_name}', falling back to mock")
        return MockLLMProvider()


async def get_best_available_provider() -> LLMProvider:
    """
    Get the best available LLM provider.

    Checks providers in order of preference:
    1. Configured provider (LLM_PROVIDER env var)
    2. Ollama (if running)
    3. OpenAI (if key configured)
    4. Mock (always available)

    Returns:
        The best available LLMProvider
    """
    # First try the configured provider
    configured = os.getenv("LLM_PROVIDER", "").lower()
    if configured:
        provider = create_llm_provider(configured)
        if await provider.is_available():
            return provider
        print(f"Configured provider '{configured}' not available")

    # Try Ollama
    ollama = OllamaProvider()
    if await ollama.is_available():
        print("Using Ollama for LLM inference")
        return ollama

    # Try OpenAI
    openai = OpenAIProvider()
    if await openai.is_available():
        print("Using OpenAI for LLM inference")
        return openai

    # Fall back to mock
    print("No LLM provider available, using mock")
    return MockLLMProvider()
