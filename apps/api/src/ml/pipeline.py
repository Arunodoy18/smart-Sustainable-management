"""
ML Classification Pipeline
===========================

Orchestrates the multi-stage classification process.
"""

import time
from typing import Any

from PIL import Image

from src.core.config import settings
from src.core.logging import get_logger
from src.ml.base import (
    BaseClassifier,
    BaseSafetyValidator,
    ConfidenceEngine,
    PipelineResult,
    SegregationEngine,
)
from src.ml.classifiers.mock_classifier import MockSafetyValidator, MockWasteClassifier
from src.models.waste import ClassificationConfidence

logger = get_logger(__name__)


def _create_default_classifier() -> BaseClassifier:
    """Create default classifier based on configuration."""
    if settings.use_clip_classifier:
        try:
            from src.ml.classifiers.clip_classifier import CLIPWasteClassifier
            
            logger.info(
                "Initializing CLIP classifier",
                model_id=settings.clip_model_id,
                device=settings.clip_device or "auto",
            )
            return CLIPWasteClassifier(device=settings.clip_device)
        except ImportError as e:
            logger.error(
                "Failed to import CLIP classifier - missing dependencies (transformers/torch)",
                error=str(e),
            )
            logger.warning("Install with: pip install transformers torch pillow")
            logger.info("Falling back to mock classifier")
            return MockWasteClassifier()
        except Exception as e:
            logger.error(
                "Failed to initialize CLIP classifier",
                error=str(e),
                exc_info=True,
            )
            logger.info("Falling back to mock classifier")
            return MockWasteClassifier()
    else:
        logger.info("Using mock classifier (USE_CLIP_CLASSIFIER=false)")
        return MockWasteClassifier()


class ClassificationPipeline:
    """
    Multi-stage waste classification pipeline.
    
    Pipeline stages:
    1. Image preprocessing
    2. Primary classification
    3. Secondary safety validation
    4. Confidence evaluation
    5. Bin type assignment
    
    The pipeline is designed to be modular - classifiers can be swapped
    without changing the orchestration logic.
    """
    
    _instance: "ClassificationPipeline | None" = None
    
    @classmethod
    def get_instance(cls) -> "ClassificationPipeline":
        """Get singleton pipeline instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(
        self,
        classifier: BaseClassifier | None = None,
        safety_validator: BaseSafetyValidator | None = None,
        confidence_engine: ConfidenceEngine | None = None,
        segregation_engine: SegregationEngine | None = None,
    ):
        """
        Initialize the pipeline with components.
        
        Args:
            classifier: Primary waste classifier (defaults to auto-selected based on config)
            safety_validator: Safety validation model (defaults to mock)
            confidence_engine: Confidence tier calculator
            segregation_engine: Bin type mapper
        """
        self.classifier = classifier or _create_default_classifier()
        self.safety_validator = safety_validator or MockSafetyValidator()
        
        self.confidence_engine = confidence_engine or ConfidenceEngine(
            high_threshold=settings.ml_confidence_high_threshold,
            medium_threshold=settings.ml_confidence_medium_threshold,
        )
        
        self.segregation_engine = segregation_engine or SegregationEngine()
        
        self._initialized = False
    
    async def initialize(self) -> None:
        """Load models and prepare pipeline."""
        if self._initialized:
            return
        
        logger.info("Initializing classification pipeline...")
        
        await self.classifier.load()
        await self.safety_validator.load()
        
        self._initialized = True
        logger.info(
            "Pipeline initialized",
            classifier=self.classifier.model_name,
            safety_validator=self.safety_validator.model_name,
        )
    
    async def classify(self, image_data: bytes | Image.Image | None = None) -> PipelineResult:
        """
        Run full classification pipeline on an image.
        
        Args:
            image_data: Image as bytes, PIL Image, or None (uses mock data)
            
        Returns:
            Complete pipeline result
        """
        from io import BytesIO
        
        if not self._initialized:
            await self.initialize()
        
        start_time = time.perf_counter()
        
        # Convert bytes to PIL Image if needed
        if image_data is None:
            # Use a mock/placeholder image for testing
            image = Image.new('RGB', (224, 224), color='gray')
        elif isinstance(image_data, bytes):
            image = Image.open(BytesIO(image_data))
        else:
            image = image_data
        
        # Stage 1: Preprocess image
        processed_image = self._preprocess_image(image)
        
        # Stage 2: Primary classification
        prediction = await self.classifier.predict(processed_image)
        
        # Stage 3: Safety validation
        safety_result = await self.safety_validator.validate(processed_image)
        
        # Stage 4: Evaluate confidence
        confidence_tier = self.confidence_engine.get_tier(prediction.confidence)
        requires_verification = self.confidence_engine.requires_verification(
            prediction.confidence
        )
        requires_manual_review = self.confidence_engine.requires_manual_review(
            prediction.confidence
        )
        
        # Stage 5: Determine bin type
        bin_type = self.segregation_engine.get_bin_type(
            prediction.category,
            prediction.subcategory,
        )
        
        # Calculate processing time
        processing_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        # Build all predictions dict
        all_predictions = prediction.raw_scores or {prediction.category.value: prediction.confidence}
        
        result = PipelineResult(
            category=prediction.category,
            subcategory=prediction.subcategory,
            confidence=prediction.confidence,
            confidence_tier=confidence_tier,
            bin_type=bin_type,
            all_predictions=all_predictions,
            safety_passed=safety_result.passed,
            safety_flags=safety_result.flags,
            requires_verification=requires_verification,
            requires_manual_review=requires_manual_review or not safety_result.passed,
            processing_time_ms=processing_time_ms,
            primary_model=self.classifier.model_name,
            primary_model_version=self.classifier.model_version,
            safety_model=self.safety_validator.model_name,
            safety_model_version=self.safety_validator.model_version,
        )
        
        logger.info(
            "Classification complete",
            category=prediction.category.value,
            confidence=round(prediction.confidence, 3),
            tier=confidence_tier.value,
            bin_type=bin_type.value,
            processing_time_ms=processing_time_ms,
        )
        
        return result
    
    async def classify_batch(
        self,
        images: list[Image.Image],
    ) -> list[PipelineResult]:
        """
        Classify multiple images efficiently.
        
        Args:
            images: List of PIL Images
            
        Returns:
            List of pipeline results
        """
        if not self._initialized:
            await self.initialize()
        
        results = []
        for image in images:
            result = await self.classify(image)
            results.append(result)
        
        return results
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for classification.
        
        - Resize to model input size
        - Convert color mode if needed
        - Normalize
        
        Args:
            image: Raw PIL Image
            
        Returns:
            Preprocessed image
        """
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Resize to standard size (224x224 is common for classification)
        target_size = (224, 224)
        if image.size != target_size:
            image = image.resize(target_size, Image.Resampling.LANCZOS)
        
        return image
    
    def get_model_info(self) -> dict[str, Any]:
        """Get information about loaded models."""
        return {
            "primary_classifier": {
                "name": self.classifier.model_name,
                "version": self.classifier.model_version,
            },
            "safety_validator": {
                "name": self.safety_validator.model_name,
                "version": self.safety_validator.model_version,
            },
            "confidence_thresholds": {
                "high": self.confidence_engine.high_threshold,
                "medium": self.confidence_engine.medium_threshold,
            },
        }


# Global pipeline instance (lazily initialized)
_pipeline: ClassificationPipeline | None = None


async def get_pipeline() -> ClassificationPipeline:
    """Get or create the global classification pipeline."""
    global _pipeline
    
    if _pipeline is None:
        _pipeline = ClassificationPipeline()
        await _pipeline.initialize()
    
    return _pipeline


async def classify_image(image: Image.Image) -> PipelineResult:
    """
    Convenience function to classify an image.
    
    Args:
        image: PIL Image to classify
        
    Returns:
        Classification result
    """
    pipeline = await get_pipeline()
    return await pipeline.classify(image)
