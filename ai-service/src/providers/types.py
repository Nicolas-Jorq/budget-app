"""
Type definitions for LLM providers.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass
from enum import Enum


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class LLMMessage:
    """A message in an LLM conversation."""
    role: MessageRole
    content: str


@dataclass
class LLMCompletionParams:
    """Parameters for LLM completion."""
    messages: List[LLMMessage]
    temperature: float = 0.1  # Low temp for structured extraction
    max_tokens: int = 4096
    json_mode: bool = False  # Request JSON output if supported


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass

    @property
    @abstractmethod
    def model(self) -> str:
        """Model being used."""
        pass

    @abstractmethod
    async def complete(self, params: LLMCompletionParams) -> str:
        """
        Generate a completion from the LLM.

        Args:
            params: Completion parameters including messages

        Returns:
            The generated text response
        """
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the provider is available and configured."""
        pass
