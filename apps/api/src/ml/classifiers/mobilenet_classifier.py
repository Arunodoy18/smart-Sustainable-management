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
        # Expanded mapping for better real-world coverage
        self.imagenet_to_waste: dict[int, WasteCategory] = {
            # ── Organic / Food waste ──
            # ImageNet food classes (924–969) + additional food/plant items
            **{i: WasteCategory.ORGANIC for i in range(924, 970)},
            **{i: WasteCategory.ORGANIC for i in [
                281, 282, 283,  # cats eating food (domestic scenes)
                948, 949, 950, 951, 952, 953, 954, 955, 956, 957,
                958, 959, 960, 961, 962, 963, 964, 965, 966, 967,
                968, 969,  # various fruits + food
                987, 988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998,  # food items
                984, 985, 986  # mushroom, ear of corn, acorn
            ]},

            # ── Recyclable materials ──
            **{i: WasteCategory.RECYCLABLE for i in [
                # Bottles & containers
                440,  # beer bottle
                504,  # bottle cap
                509,  # water bottle
                550,  # espresso maker (metal)
                647, 648,  # steel drum, barrel
                728,  # plastic bag
                737,  # pop bottle / soda bottle
                760,  # jar / can
                898,  # water jug
                899,  # wine bottle
                907,  # bucket
                910,  # wooden spoon (wood)
                # Paper, cardboard, packaging
                446,  # binder
                525,  # cardboard box (combination)
                547,  # envelope
                548,  # book
                549,  # book jacket
                551,  # paper towel
                600,  # folding chair (metal scrap)
                621,  # letter opener
                623,  # library
                630,  # lotion bottle
                653,  # mailbag
                658,  # mailing envelope
                692,  # newspaper
                # Cans, tins, aluminium
                759,  # tin can / pop can
                761,  # packet
                813,  # shopping cart (metal)
                819,  # soup bowl
                849,  # teapot (ceramic)
                # Glass
                504,  # coffee mug
                968,  # cup
                # General recyclable containers
                671,  # measuring cup
                720,  # pill bottle
                725,  # pitcher
                731,  # plunger
                755,  # rain barrel
                805,  # swimming trunks (textile recycling)
                834,  # suit/clothing (textile)
            ]},

            # ── Electronic waste ──
            **{i: WasteCategory.ELECTRONIC for i in [
                487,  # cell phone
                491,  # CRT screen
                508,  # computer keyboard
                527,  # desktop computer
                528,  # dial telephone
                530,  # digital clock
                531,  # digital watch
                548,  # disk brake
                558,  # electric fan
                571,  # electric guitar
                590,  # hand-held computer / PDA
                606,  # iPod
                609,  # joystick
                620,  # laptop
                621,  # LCD screen
                638,  # magnetic compass
                639,  # disk
                640,  # hard drive
                664,  # monitor
                667,  # modem
                671,  # mouse (computer)
                681,  # notebook (laptop)
                707,  # power drill
                710,  # printer
                720,  # projector
                722,  # photocopier
                730,  # earphone (plug)
                748,  # radio / boom-box
                753,  # remote control
                770,  # rotary phone
                776,  # computer mouse
                782,  # screen / monitor
                790,  # speaker
                851,  # television
                846,  # tape player
                860,  # toaster
                862,  # torch / flashlight
                896,  # washing machine
                900,  # vacuum
            ]},

            # ── Hazardous ──
            **{i: WasteCategory.HAZARDOUS for i in [
                470,  # candle (wax chemicals)
                475,  # car wheel / tire
                517,  # crash helmet (composite)
                553,  # fire engine (indicates hazard)
                626,  # lighter
                629,  # loupe / magnifying glass with chemicals
                653,  # matchstick
                # Paint & chemicals
                813,  # safety pin
                867,  # tractor (diesel/oil)
            ]},

            # ── Medical ──
            **{i: WasteCategory.MEDICAL for i in [
                700,  # oxygen mask
                804,  # syringe
                543,  # stethoscope
            ]},
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

        matched_any = False
        for prob, idx in zip(top_probs, top_indices):
            idx_int = int(idx)
            if idx_int in self.imagenet_to_waste:
                waste_cat = self.imagenet_to_waste[idx_int]
                category_scores[waste_cat] += float(prob)
                matched_any = True

        # Texture/scene heuristics: if top ImageNet class wasn't in our map,
        # use color and brightness analysis for a secondary signal.
        if not matched_any or max(category_scores.values()) < 0.15:
            img_array = np.array(image.resize((64, 64)))
            avg = img_array.mean(axis=(0, 1))
            if len(avg) >= 3:
                r, g, b = avg[:3]
                brightness = (r + g + b) / 3
                # Green-dominant → likely organic/garden
                if g > r * 1.15 and g > b * 1.15:
                    category_scores[WasteCategory.ORGANIC] += 0.25
                # Blue-dominant → plastic/recyclable
                elif b > r * 1.1 and b > g:
                    category_scores[WasteCategory.RECYCLABLE] += 0.20
                # Shiny/bright → glass/metal/recyclable
                elif brightness > 180:
                    category_scores[WasteCategory.RECYCLABLE] += 0.18
                # Dark → general
                elif brightness < 80:
                    category_scores[WasteCategory.GENERAL] += 0.15
                # Brown-ish → organic or cardboard
                elif r > 120 and g > 80 and b < 100:
                    category_scores[WasteCategory.ORGANIC] += 0.15
                    category_scores[WasteCategory.RECYCLABLE] += 0.10

        # Best category
        best_cat = max(category_scores, key=lambda c: category_scores[c])
        confidence = category_scores[best_cat]

        # Boost confidence when there's a clear winner
        second_best = sorted(category_scores.values(), reverse=True)[1] if len(category_scores) > 1 else 0
        margin = confidence - second_best
        if margin > 0.1 and confidence < 0.7:
            confidence = min(confidence + margin * 0.3, 0.85)

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
