"""
CLIP-Based Waste Classifier
============================

Production-ready waste classifier using OpenAI's CLIP model
(openai/clip-vit-large-patch14) for zero-shot image classification.

Model: https://huggingface.co/openai/clip-vit-large-patch14
"""

import asyncio
from typing import Any

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from src.core.logging import get_logger
from src.ml.base import BaseClassifier, ClassificationPrediction
from src.models.waste import WasteCategory, WasteSubCategory

logger = get_logger(__name__)


class CLIPWasteClassifier(BaseClassifier):
    """
    CLIP-based waste classifier using zero-shot classification.
    
    Uses vision-language model to classify waste by comparing image
    embeddings with text descriptions of waste categories.
    
    Architecture:
    - Vision Transformer (ViT-L/14) for image encoding
    - Text encoder for category descriptions
    - Cosine similarity for classification
    
    Performance:
    - Model size: ~600MB
    - Inference time: ~200-500ms (CPU) / ~50-100ms (GPU)
    - Memory: ~2-3GB RAM
    """
    
    MODEL_ID = "openai/clip-vit-large-patch14"
    MODEL_VERSION = "1.0.0"
    
    # Category descriptions optimized for CLIP
    # Using descriptive prompts improves zero-shot performance
    CATEGORY_PROMPTS = {
        WasteCategory.ORGANIC: [
            "a photo of organic waste food scraps",
            "a photo of biodegradable food waste",
            "a photo of compostable organic material",
            "a photo of fruit and vegetable waste",
        ],
        WasteCategory.RECYCLABLE: [
            "a photo of recyclable plastic bottles",
            "a photo of recyclable paper and cardboard",
            "a photo of recyclable glass containers",
            "a photo of recyclable metal cans",
            "a photo of clean recyclable materials",
        ],
        WasteCategory.HAZARDOUS: [
            "a photo of hazardous waste materials",
            "a photo of toxic chemical containers",
            "a photo of dangerous waste requiring special disposal",
            "a photo of batteries or corrosive materials",
        ],
        WasteCategory.ELECTRONIC: [
            "a photo of electronic waste devices",
            "a photo of old electronics and appliances",
            "a photo of e-waste computers and phones",
            "a photo of electronic equipment for recycling",
        ],
        WasteCategory.MEDICAL: [
            "a photo of medical waste",
            "a photo of pharmaceutical waste",
            "a photo of clinical waste materials",
            "a photo of biohazard medical items",
        ],
        WasteCategory.GENERAL: [
            "a photo of general household waste",
            "a photo of non-recyclable garbage",
            "a photo of mixed waste materials",
            "a photo of landfill waste items",
        ],
    }
    
    # Subcategory prompts for more specific classification
    SUBCATEGORY_PROMPTS = {
        # Organic subcategories
        WasteSubCategory.FOOD_WASTE: [
            "a photo of leftover food waste",
            "a photo of kitchen food scraps",
        ],
        WasteSubCategory.GARDEN_WASTE: [
            "a photo of garden waste leaves and grass",
            "a photo of yard waste and plant trimmings",
        ],
        
        # Recyclable subcategories
        WasteSubCategory.PLASTIC: [
            "a photo of plastic bottles and containers",
            "a photo of recyclable plastic packaging",
        ],
        WasteSubCategory.PAPER: [
            "a photo of waste paper and documents",
            "a photo of recyclable paper products",
        ],
        WasteSubCategory.GLASS: [
            "a photo of glass bottles and jars",
            "a photo of recyclable glass containers",
        ],
        WasteSubCategory.METAL: [
            "a photo of metal cans and containers",
            "a photo of recyclable aluminum and steel",
        ],
        WasteSubCategory.CARDBOARD: [
            "a photo of cardboard boxes",
            "a photo of corrugated cardboard packaging",
        ],
        
        # Hazardous subcategories
        WasteSubCategory.BATTERIES: [
            "a photo of used batteries",
            "a photo of rechargeable and disposable batteries",
        ],
        WasteSubCategory.CHEMICALS: [
            "a photo of chemical containers",
            "a photo of hazardous chemical waste",
        ],
        WasteSubCategory.PAINT: [
            "a photo of paint cans",
            "a photo of leftover paint containers",
        ],
        WasteSubCategory.OIL: [
            "a photo of used motor oil",
            "a photo of oil containers",
        ],
        
        # Electronic subcategories
        WasteSubCategory.SMALL_ELECTRONICS: [
            "a photo of small electronic devices",
            "a photo of phones tablets and small gadgets",
        ],
        WasteSubCategory.LARGE_APPLIANCES: [
            "a photo of large appliances",
            "a photo of refrigerators washing machines",
        ],
        WasteSubCategory.CABLES: [
            "a photo of electronic cables and wires",
            "a photo of charging cables and connectors",
        ],
        
        # Medical subcategories
        WasteSubCategory.SHARPS: [
            "a photo of medical sharps needles",
            "a photo of syringes and sharp medical instruments",
        ],
        WasteSubCategory.PHARMACEUTICALS: [
            "a photo of pharmaceutical waste",
            "a photo of expired medications and pills",
        ],
        
        # General subcategories
        WasteSubCategory.MIXED: [
            "a photo of mixed waste",
            "a photo of various garbage items",
        ],
        WasteSubCategory.TEXTILES: [
            "a photo of textile waste clothing",
            "a photo of fabric and clothing waste",
        ],
        WasteSubCategory.FURNITURE: [
            "a photo of old furniture",
            "a photo of broken furniture waste",
        ],
    }
    
    def __init__(self, device: str | None = None):
        """
        Initialize CLIP classifier.
        
        Args:
            device: Device to run inference on ('cuda', 'cpu', or None for auto)
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model: CLIPModel | None = None
        self.processor: CLIPProcessor | None = None
        self._loaded = False
        
        # Pre-compute text embeddings for efficiency
        self._category_embeddings: dict[WasteCategory, torch.Tensor] | None = None
        self._subcategory_embeddings: dict[WasteSubCategory, torch.Tensor] | None = None
        
        logger.info(
            "CLIP classifier initialized",
            model_id=self.MODEL_ID,
            device=self.device,
        )
    
    @property
    def model_name(self) -> str:
        return self.MODEL_ID
    
    @property
    def model_version(self) -> str:
        return self.MODEL_VERSION
    
    async def load(self) -> None:
        """Load CLIP model and processor."""
        if self._loaded:
            logger.debug("CLIP model already loaded")
            return
        
        logger.info("Loading CLIP model...", model_id=self.MODEL_ID)
        
        try:
            # Run model loading in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_model_sync)
            
            # Pre-compute text embeddings
            await self._precompute_embeddings()
            
            self._loaded = True
            logger.info(
                "CLIP model loaded successfully",
                device=self.device,
                model_size_mb=self._get_model_size_mb(),
            )
            
        except Exception as e:
            logger.error("Failed to load CLIP model", error=str(e), exc_info=True)
            raise RuntimeError(f"Failed to load CLIP model: {e}") from e
    
    def _load_model_sync(self) -> None:
        """Synchronous model loading (runs in thread pool)."""
        # Load processor
        self.processor = CLIPProcessor.from_pretrained(self.MODEL_ID)
        
        # Load model
        self.model = CLIPModel.from_pretrained(self.MODEL_ID)
        self.model.to(self.device)
        self.model.eval()  # Set to evaluation mode
    
    async def _precompute_embeddings(self) -> None:
        """Pre-compute text embeddings for all categories and subcategories."""
        logger.info("Pre-computing text embeddings...")
        
        loop = asyncio.get_event_loop()
        
        # Compute category embeddings
        self._category_embeddings = {}
        for category, prompts in self.CATEGORY_PROMPTS.items():
            embedding = await loop.run_in_executor(
                None,
                self._encode_text_sync,
                prompts,
            )
            self._category_embeddings[category] = embedding
        
        # Compute subcategory embeddings
        self._subcategory_embeddings = {}
        for subcategory, prompts in self.SUBCATEGORY_PROMPTS.items():
            embedding = await loop.run_in_executor(
                None,
                self._encode_text_sync,
                prompts,
            )
            self._subcategory_embeddings[subcategory] = embedding
        
        logger.info(
            "Text embeddings computed",
            categories=len(self._category_embeddings),
            subcategories=len(self._subcategory_embeddings),
        )
    
    def _encode_text_sync(self, prompts: list[str]) -> torch.Tensor:
        """Encode text prompts and return averaged embedding."""
        if not self.model or not self.processor:
            raise RuntimeError("Model not loaded")
        
        # Process text
        inputs = self.processor(
            text=prompts,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Get text embeddings
        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)
            
            # Normalize
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
            # Average multiple prompts
            text_embedding = text_features.mean(dim=0)
            text_embedding = text_embedding / text_embedding.norm()
        
        return text_embedding
    
    async def predict(self, image: Image.Image) -> ClassificationPrediction:
        """
        Classify waste image using CLIP.
        
        Args:
            image: PIL Image to classify
            
        Returns:
            Classification prediction with category, confidence, and subcategory
        """
        if not self._loaded:
            await self.load()
        
        logger.debug("Running CLIP inference", image_size=image.size)
        
        try:
            # Run inference in thread pool
            loop = asyncio.get_event_loop()
            prediction = await loop.run_in_executor(
                None,
                self._predict_sync,
                image,
            )
            
            logger.debug(
                "CLIP inference complete",
                category=prediction.category.value,
                confidence=prediction.confidence,
            )
            
            return prediction
            
        except Exception as e:
            logger.error("CLIP inference failed", error=str(e), exc_info=True)
            raise RuntimeError(f"CLIP inference failed: {e}") from e
    
    def _predict_sync(self, image: Image.Image) -> ClassificationPrediction:
        """Synchronous prediction (runs in thread pool)."""
        if not self.model or not self.processor:
            raise RuntimeError("Model not loaded")
        
        # Process image
        inputs = self.processor(
            images=image,
            return_tensors="pt",
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Get image embedding
        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            image_features = image_features.squeeze(0)
        
        # Compute similarities with categories
        category_scores = {}
        for category, text_embedding in self._category_embeddings.items():
            similarity = torch.cosine_similarity(
                image_features.unsqueeze(0),
                text_embedding.unsqueeze(0),
            )
            # Convert from [-1, 1] to [0, 1] and boost confidence
            score = (similarity.item() + 1) / 2
            category_scores[category] = score
        
        # Apply softmax for better probability distribution
        category_logits = torch.tensor(list(category_scores.values()))
        category_probs = torch.softmax(category_logits * 2, dim=0)  # Temperature scaling
        
        # Update scores with softmax probabilities
        for i, category in enumerate(category_scores.keys()):
            category_scores[category] = category_probs[i].item()
        
        # Get primary category
        primary_category = max(category_scores, key=category_scores.get)
        primary_confidence = category_scores[primary_category]
        
        # Predict subcategory within primary category
        subcategory = self._predict_subcategory_sync(image_features, primary_category)
        
        # Format raw scores
        raw_scores = {cat.value: score for cat, score in category_scores.items()}
        
        return ClassificationPrediction(
            category=primary_category,
            confidence=primary_confidence,
            subcategory=subcategory,
            raw_scores=raw_scores,
        )
    
    def _predict_subcategory_sync(
        self,
        image_features: torch.Tensor,
        category: WasteCategory,
    ) -> WasteSubCategory | None:
        """Predict subcategory for given category."""
        # Get relevant subcategories for this category
        category_subcategories = self._get_subcategories_for_category(category)
        
        if not category_subcategories:
            return None
        
        # Compute similarities
        subcategory_scores = {}
        for subcategory in category_subcategories:
            if subcategory in self._subcategory_embeddings:
                text_embedding = self._subcategory_embeddings[subcategory]
                similarity = torch.cosine_similarity(
                    image_features.unsqueeze(0),
                    text_embedding.unsqueeze(0),
                )
                score = (similarity.item() + 1) / 2
                subcategory_scores[subcategory] = score
        
        if not subcategory_scores:
            return None
        
        # Return highest scoring subcategory
        return max(subcategory_scores, key=subcategory_scores.get)
    
    @staticmethod
    def _get_subcategories_for_category(
        category: WasteCategory,
    ) -> list[WasteSubCategory]:
        """Get valid subcategories for a given category."""
        category_map = {
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
        return category_map.get(category, [])
    
    async def predict_batch(
        self,
        images: list[Image.Image],
    ) -> list[ClassificationPrediction]:
        """
        Classify multiple images (can be optimized for batch processing).
        
        Args:
            images: List of PIL Images
            
        Returns:
            List of predictions
        """
        # For now, process sequentially
        # TODO: Implement true batch processing for efficiency
        predictions = []
        for image in images:
            prediction = await self.predict(image)
            predictions.append(prediction)
        
        return predictions
    
    def _get_model_size_mb(self) -> float:
        """Estimate model size in MB."""
        if not self.model:
            return 0.0
        
        total_params = sum(p.numel() for p in self.model.parameters())
        # Assume float32 (4 bytes per parameter)
        size_mb = (total_params * 4) / (1024 ** 2)
        return round(size_mb, 2)
