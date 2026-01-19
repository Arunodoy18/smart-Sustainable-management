"""
Mock Classifier for Development
================================

A mock classifier that simulates ML predictions for development and testing.
In production, replace with actual model implementations.
"""

import random
import time

from PIL import Image

from src.ml.base import (
    BaseClassifier,
    BaseSafetyValidator,
    ClassificationPrediction,
    SafetyCheckResult,
)
from src.models.waste import WasteCategory, WasteSubCategory


class MockWasteClassifier(BaseClassifier):
    """
    Mock waste classifier for development.
    
    Generates realistic-looking predictions without actual ML inference.
    Replace with real model in production.
    """
    
    _loaded: bool = False
    
    @property
    def model_name(self) -> str:
        return "mock-waste-classifier"
    
    @property
    def model_version(self) -> str:
        return "1.0.0-dev"
    
    async def load(self) -> None:
        """Simulate model loading."""
        await self._simulate_delay(0.1)
        self._loaded = True
    
    async def predict(self, image: Image.Image) -> ClassificationPrediction:
        """Generate mock prediction."""
        if not self._loaded:
            await self.load()
        
        # Simulate inference time
        await self._simulate_delay(0.05, 0.15)
        
        # Generate random but realistic predictions
        categories = list(WasteCategory)
        weights = [0.25, 0.35, 0.10, 0.10, 0.15, 0.05]  # Bias toward recyclable/organic
        
        # Pick primary category with weights
        primary_category = random.choices(categories, weights=weights, k=1)[0]
        
        # Generate confidence scores for all categories
        scores = {}
        remaining = 1.0
        
        for i, cat in enumerate(categories):
            if cat == primary_category:
                # Primary category gets high score
                scores[cat.value] = random.uniform(0.5, 0.95)
                remaining -= scores[cat.value]
            elif i == len(categories) - 1:
                # Last category gets remaining
                scores[cat.value] = max(0, remaining)
            else:
                # Other categories get small random scores
                score = random.uniform(0, remaining * 0.5)
                scores[cat.value] = score
                remaining -= score
        
        primary_confidence = scores[primary_category.value]
        
        # Determine subcategory based on primary category
        subcategory = self._get_subcategory(primary_category)
        
        return ClassificationPrediction(
            category=primary_category,
            confidence=primary_confidence,
            subcategory=subcategory,
            raw_scores=scores,
        )
    
    async def predict_batch(
        self,
        images: list[Image.Image],
    ) -> list[ClassificationPrediction]:
        """Process batch of images."""
        return [await self.predict(img) for img in images]
    
    def _get_subcategory(
        self,
        category: WasteCategory,
    ) -> WasteSubCategory | None:
        """Get a random subcategory for the category."""
        subcategory_map = {
            WasteCategory.ORGANIC: [
                WasteSubCategory.FOOD_WASTE,
                WasteSubCategory.GARDEN_WASTE,
            ],
            WasteCategory.RECYCLABLE: [
                WasteSubCategory.PLASTIC,
                WasteSubCategory.PAPER,
                WasteSubCategory.GLASS,
                WasteSubCategory.METAL,
                WasteSubCategory.CARDBOARD,
            ],
            WasteCategory.HAZARDOUS: [
                WasteSubCategory.CHEMICALS,
                WasteSubCategory.BATTERIES,
                WasteSubCategory.PAINT,
                WasteSubCategory.OIL,
            ],
            WasteCategory.ELECTRONIC: [
                WasteSubCategory.SMALL_ELECTRONICS,
                WasteSubCategory.LARGE_APPLIANCES,
                WasteSubCategory.CABLES,
            ],
            WasteCategory.MEDICAL: [
                WasteSubCategory.SHARPS,
                WasteSubCategory.PHARMACEUTICALS,
            ],
            WasteCategory.GENERAL: [
                WasteSubCategory.MIXED,
                WasteSubCategory.TEXTILES,
                WasteSubCategory.FURNITURE,
            ],
        }
        
        options = subcategory_map.get(category, [])
        return random.choice(options) if options else None
    
    @staticmethod
    async def _simulate_delay(min_seconds: float, max_seconds: float = None) -> None:
        """Simulate processing delay."""
        import asyncio
        
        if max_seconds is None:
            max_seconds = min_seconds
        
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)


class MockSafetyValidator(BaseSafetyValidator):
    """
    Mock safety validator for development.
    
    Simulates safety checks without actual model inference.
    """
    
    _loaded: bool = False
    
    @property
    def model_name(self) -> str:
        return "mock-safety-validator"
    
    @property
    def model_version(self) -> str:
        return "1.0.0-dev"
    
    async def load(self) -> None:
        """Simulate model loading."""
        import asyncio
        await asyncio.sleep(0.05)
        self._loaded = True
    
    async def validate(self, image: Image.Image) -> SafetyCheckResult:
        """Generate mock safety check result."""
        import asyncio
        
        if not self._loaded:
            await self.load()
        
        # Simulate processing
        await asyncio.sleep(random.uniform(0.02, 0.05))
        
        # 95% pass rate for mock
        passed = random.random() > 0.05
        
        flags = []
        if not passed:
            possible_flags = [
                "low_image_quality",
                "non_waste_content",
                "blur_detected",
                "multiple_objects",
            ]
            flags = random.sample(possible_flags, k=random.randint(1, 2))
        
        return SafetyCheckResult(
            passed=passed,
            flags=flags,
            confidence=random.uniform(0.85, 0.99) if passed else random.uniform(0.4, 0.7),
        )
