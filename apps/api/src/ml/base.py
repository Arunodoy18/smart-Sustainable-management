"""
ML Pipeline - Base Classes
==========================

Abstract interfaces for the ML classification pipeline.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any

import numpy as np
from PIL import Image

from src.models.waste import (
    BinType,
    ClassificationConfidence,
    WasteCategory,
    WasteSubCategory,
)


@dataclass
class ClassificationPrediction:
    """Single classification prediction."""
    
    category: WasteCategory
    confidence: float
    subcategory: WasteSubCategory | None = None
    raw_scores: dict[str, float] | None = None


@dataclass
class SafetyCheckResult:
    """Result from safety validation model."""
    
    passed: bool
    flags: list[str]
    confidence: float


@dataclass
class PipelineResult:
    """Complete pipeline classification result."""
    
    # Primary classification
    category: WasteCategory
    subcategory: WasteSubCategory | None
    confidence: float
    confidence_tier: ClassificationConfidence
    bin_type: BinType
    
    # All predictions for transparency
    all_predictions: dict[str, float]
    
    # Safety validation
    safety_passed: bool
    safety_flags: list[str]
    
    # Processing info
    requires_verification: bool
    requires_manual_review: bool
    processing_time_ms: int
    
    # Model info
    primary_model: str
    primary_model_version: str
    safety_model: str | None = None
    safety_model_version: str | None = None


class BaseClassifier(ABC):
    """Abstract base class for waste classifiers."""
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return model name."""
        pass
    
    @property
    @abstractmethod
    def model_version(self) -> str:
        """Return model version."""
        pass
    
    @abstractmethod
    async def load(self) -> None:
        """Load model weights."""
        pass
    
    @abstractmethod
    async def predict(self, image: Image.Image) -> ClassificationPrediction:
        """
        Classify waste image.
        
        Args:
            image: PIL Image to classify
            
        Returns:
            Classification prediction
        """
        pass
    
    @abstractmethod
    async def predict_batch(
        self,
        images: list[Image.Image],
    ) -> list[ClassificationPrediction]:
        """
        Classify multiple images.
        
        Args:
            images: List of PIL Images
            
        Returns:
            List of predictions
        """
        pass


class BaseSafetyValidator(ABC):
    """Abstract base class for safety validation."""
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return model name."""
        pass
    
    @property
    @abstractmethod
    def model_version(self) -> str:
        """Return model version."""
        pass
    
    @abstractmethod
    async def load(self) -> None:
        """Load model weights."""
        pass
    
    @abstractmethod
    async def validate(self, image: Image.Image) -> SafetyCheckResult:
        """
        Validate image for safety concerns.
        
        Checks for:
        - Inappropriate content
        - Non-waste images
        - Image quality issues
        
        Args:
            image: PIL Image to validate
            
        Returns:
            Safety check result
        """
        pass


class SegregationEngine:
    """
    Maps waste categories to bin types.
    
    Uses configurable rules for bin assignment.
    """
    
    # Default mapping
    CATEGORY_BIN_MAP: dict[WasteCategory, BinType] = {
        WasteCategory.ORGANIC: BinType.GREEN,
        WasteCategory.RECYCLABLE: BinType.BLUE,
        WasteCategory.HAZARDOUS: BinType.RED,
        WasteCategory.ELECTRONIC: BinType.SPECIAL,
        WasteCategory.GENERAL: BinType.BLACK,
        WasteCategory.MEDICAL: BinType.YELLOW,
    }
    
    # Subcategory overrides
    SUBCATEGORY_BIN_MAP: dict[WasteSubCategory, BinType] = {
        WasteSubCategory.BATTERIES: BinType.RED,
        WasteSubCategory.SMALL_ELECTRONICS: BinType.SPECIAL,
        WasteSubCategory.LARGE_APPLIANCES: BinType.SPECIAL,
        WasteSubCategory.SHARPS: BinType.YELLOW,
        WasteSubCategory.PHARMACEUTICALS: BinType.YELLOW,
    }
    
    @classmethod
    def get_bin_type(
        cls,
        category: WasteCategory,
        subcategory: WasteSubCategory | None = None,
    ) -> BinType:
        """
        Get appropriate bin type for waste.
        
        Args:
            category: Primary waste category
            subcategory: Optional subcategory for more specific mapping
            
        Returns:
            Appropriate bin type
        """
        # Check subcategory first for specific overrides
        if subcategory and subcategory in cls.SUBCATEGORY_BIN_MAP:
            return cls.SUBCATEGORY_BIN_MAP[subcategory]
        
        # Fall back to category mapping
        return cls.CATEGORY_BIN_MAP.get(category, BinType.BLACK)


class ConfidenceEngine:
    """
    Determines confidence tier based on threshold.
    
    Tiers:
    - HIGH (≥85%): Auto actionable
    - MEDIUM (60-84%): Verify category UI prompt
    - LOW (<60%): Manual handling only
    """
    
    def __init__(
        self,
        high_threshold: float = 0.85,
        medium_threshold: float = 0.60,
    ):
        self.high_threshold = high_threshold
        self.medium_threshold = medium_threshold
    
    def get_tier(self, confidence: float) -> ClassificationConfidence:
        """
        Get confidence tier.
        
        Args:
            confidence: Confidence score (0-1)
            
        Returns:
            Confidence tier
        """
        if confidence >= self.high_threshold:
            return ClassificationConfidence.HIGH
        elif confidence >= self.medium_threshold:
            return ClassificationConfidence.MEDIUM
        else:
            return ClassificationConfidence.LOW
    
    def requires_verification(self, confidence: float) -> bool:
        """Check if classification requires user verification."""
        tier = self.get_tier(confidence)
        return tier == ClassificationConfidence.MEDIUM
    
    def requires_manual_review(self, confidence: float) -> bool:
        """Check if classification requires manual review."""
        tier = self.get_tier(confidence)
        return tier == ClassificationConfidence.LOW
