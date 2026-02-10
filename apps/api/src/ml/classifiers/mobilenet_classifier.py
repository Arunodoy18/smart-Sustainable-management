"""
MobileNetV2-Based Waste Classifier
===================================

Lightweight waste classifier using MobileNetV2 for resource-constrained environments.
Optimized for Render free tier (512MB RAM).

Model: MobileNetV2 pretrained on ImageNet
Memory: ~50-100MB total (model + inference)
Speed: 50-150ms per image on CPU
"""

import asyncio
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

from src.core.logging import get_logger
from src.ml.base import BaseClassifier, ClassificationPrediction
from src.models.waste import WasteCategory, WasteSubCategory

logger = get_logger(__name__)


class MobileNetWasteClassifier(BaseClassifier):
    """
    Lightweight MobileNetV2-based classifier for waste categorization.

    Uses transfer learning with MobileNetV2 pretrained features and
    manual feature mapping for waste classification.

    Architecture:
    - MobileNetV2 backbone (14MB model)
    - ImageNet feature extraction -> waste category mapping
    - Rule-based subcategory assignment

    Performance:
    - Model size: ~14MB
    - Inference time: ~50-150ms (CPU)
    - Memory: ~50-100MB RAM total
    """

    MODEL_ID = "mobilenet_v2"
    MODEL_VERSION = "1.0.0"
    MIN_CONFIDENCE_THRESHOLD = 0.4

    def __init__(self, device: str | None = None):
        """Initialize MobileNet classifier."""
        if device is None:
            self.device = torch.device("cpu")
        else:
            self.device = torch.device(device)

        self.model = None
        self.transform = None
        self._loaded = False

        # ImageNet class indices that map to waste categories
        self.imagenet_to_waste: dict[int, WasteCategory] = {
            # Organic/Food waste (ImageNet food classes 924-969)
            **{i: WasteCategory.ORGANIC for i in range(924, 970)},

            # Recyclable materials
            **{i: WasteCategory.RECYCLABLE for i in [
                440,  # beer bottle
                509,  # water bottle
                648,  # steel drum
                728,  # plastic bag
                737,  # pop bottle / soda bottle
                760,  # jar / can
                898,  # water jug
                899,  # wine bottle
                907,  # bucket
                910,  # wooden spoon (wood)
            ]},

            # Electronic waste
            **{i: WasteCategory.ELECTRONIC for i in [
                487,  # cell phone
                491,  # CRT screen
                527,  # desktop computer
                528,  # dial telephone
                590,  # hand-held computer
                620,  # laptop
                621,  # LCD screen
                664,  # monitor
                681,  # notebook
                722,  # photocopier
                770,  # remote control
                776,  # mouse
                782,  # screen
                851,  # television
            ]},

            # Hazardous
            **{i: WasteCategory.HAZARDOUS for i in [
                470,  # candle (wax chemicals)
            ]},

            # Medical
            **{804: WasteCategory.MEDICAL},  # syringe
        }

    # -------------------------------------------------------------------
    # Required abstract method implementations
    # -------------------------------------------------------------------

    @property
    def model_name(self) -> str:
        return self.MODEL_ID

    @property
    def model_version(self) -> str:
        return self.MODEL_VERSION

    async def load(self) -> None:
        """Load MobileNetV2 model weights (called once at startup)."""
        if self._loaded:
            return

        logger.info("Loading MobileNetV2 classifier", device=str(self.device))

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._load_model_sync)

        self._loaded = True
        logger.info(
            "MobileNetV2 classifier loaded",
            device=str(self.device),
            model_size="~14MB",
        )

    def _load_model_sync(self) -> None:
        """Synchronous model loading (runs in thread pool)."""
        self.model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        self.model.eval()
        self.model.to(self.device)

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    async def predict(self, image: Image.Image) -> ClassificationPrediction:
        """Classify a single waste image using MobileNetV2."""
        if not self._loaded:
            await self.load()

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._predict_sync, image)

    def _predict_sync(self, image: Image.Image) -> ClassificationPrediction:
        """Synchronous prediction (runs in thread pool)."""
        if not self.model or not self.transform:
            raise RuntimeError("Model not loaded")

        # Ensure RGB
        if image.mode != "RGB":
            image = image.convert("RGB")

        img_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

            # Top-10 ImageNet predictions
            top_probs, top_indices = torch.topk(probabilities, k=10)
            top_probs = top_probs.cpu().numpy()
            top_indices = top_indices.cpu().numpy()

        # Map ImageNet classes to waste categories
        category_scores: dict[WasteCategory, float] = {cat: 0.0 for cat in WasteCategory}

        for prob, idx in zip(top_probs, top_indices):
            idx_int = int(idx)
            if idx_int in self.imagenet_to_waste:
                waste_cat = self.imagenet_to_waste[idx_int]
                category_scores[waste_cat] += float(prob)

        # Best category
        best_cat = max(category_scores, key=lambda c: category_scores[c])
        confidence = category_scores[best_cat]

        # Low confidence -> fall back to GENERAL
        if confidence < self.MIN_CONFIDENCE_THRESHOLD:
            best_cat = WasteCategory.GENERAL
            confidence = max(0.45, confidence)

        # Subcategory heuristic
        subcategory = self._determine_subcategory(best_cat, image)

        raw_scores = {cat.value: round(score, 4) for cat, score in category_scores.items()}

        return ClassificationPrediction(
            category=best_cat,
            confidence=confidence,
            subcategory=subcategory,
            raw_scores=raw_scores,
        )

    async def predict_batch(self, images: list[Image.Image]) -> list[ClassificationPrediction]:
        """Classify multiple images."""
        return [await self.predict(img) for img in images]

    # -------------------------------------------------------------------
    # Subcategory heuristic
    # -------------------------------------------------------------------

    def _determine_subcategory(
        self,
        category: WasteCategory,
        image: Image.Image,
    ) -> WasteSubCategory | None:
        """Determine subcategory using color-based heuristics."""
        img_array = np.array(image.resize((64, 64)))
        avg_color = img_array.mean(axis=(0, 1))

        if len(avg_color) < 3:
            return None
        r, g, b = avg_color[:3]
        brightness = (r + g + b) / 3

        if category == WasteCategory.ORGANIC:
            return WasteSubCategory.GARDEN_WASTE if (g > r and g > b) else WasteSubCategory.FOOD_WASTE
        elif category == WasteCategory.RECYCLABLE:
            if brightness > 200:
                return WasteSubCategory.PAPER
            elif b > r and b > g:
                return WasteSubCategory.PLASTIC
            elif brightness < 100:
                return WasteSubCategory.METAL
            elif r > 150:
                return WasteSubCategory.CARDBOARD
            return WasteSubCategory.GLASS
        elif category == WasteCategory.HAZARDOUS:
            return WasteSubCategory.BATTERIES
        elif category == WasteCategory.ELECTRONIC:
            return WasteSubCategory.SMALL_ELECTRONICS
        elif category == WasteCategory.MEDICAL:
            return WasteSubCategory.SHARPS

        return WasteSubCategory.MIXED

    async def cleanup(self) -> None:
        """Release model memory."""
        if self.model is not None:
            del self.model
            self.model = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        self._loaded = False
        logger.info("MobileNet classifier cleaned up")
