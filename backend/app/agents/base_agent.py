from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
from loguru import logger

T_IN = TypeVar("T_IN", bound=BaseModel)
T_OUT = TypeVar("T_OUT", bound=BaseModel)


class AgentResponse(BaseModel, Generic[T_OUT]):
    success: bool
    data: Optional[T_OUT] = None
    error: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reasoning: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseAgent(ABC, Generic[T_IN, T_OUT]):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def process(self, input_data: T_IN) -> AgentResponse[T_OUT]:
        """
        Main processing logic for the agent.
        """
        pass

    def log_activity(self, message: str, level: str = "INFO"):
        logger.log(level, f"[{self.name}] {message}")
